---
name: debug-prod
description: Use when investigating bugs, errors or unexpected behavior in the GasTrack production environment. Covers reading logs, querying the database directly, and checking container state on the Lightsail server.
user_invocable: true
---

# Debug de Produção — GasTrack

## Acesso ao Servidor

```
SSH Key: /Users/rafaeljonker/Downloads/LightsailDefaultKey-us-east-1(2).pem
IP:      100.48.93.142
User:    ubuntu
DB:      appdb (PostgreSQL, container: postgres)
App:     container: app (Spring Boot, porta 8080)
```

Alias útil para todos os comandos abaixo:
```bash
SSH="ssh -i \"/Users/rafaeljonker/Downloads/LightsailDefaultKey-us-east-1(2).pem\" -o StrictHostKeyChecking=no ubuntu@100.48.93.142"
```

---

## 1. Estado dos Containers

```bash
$SSH "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

Containers esperados: `app` (healthy), `postgres` (healthy), `gastrack-frontend`.

---

## 2. Logs do Backend

**Últimas 2 horas filtrado por padrão:**
```bash
$SSH "docker logs app --since 2h 2>&1 | grep -iE 'ERROR|WARN|<termo>' | tail -50"
```

**Período específico (útil quando usuário relata horário do erro):**
```bash
$SSH "docker logs app --since 2026-04-28T10:00:00 --until 2026-04-28T13:00:00 2>&1 | grep -iE 'ERROR|serial|credential' | head -60"
```

**Seguir logs em tempo real:**
```bash
$SSH "docker logs app -f 2>&1"
```

> ⚠️ Logs sobrevivem apenas enquanto o container não é reiniciado. Se o app reiniciou recentemente, o histórico está perdido — use o banco de dados para rastrear.

---

## 3. Banco de Dados

**Conectar:**
```bash
$SSH "docker exec postgres psql -U postgres -d appdb -c \"<query>\""
```

**Listar tabelas:**
```bash
$SSH "docker exec postgres psql -U postgres -d appdb -c '\dt'"
```

### Queries diagnósticas prontas

**Estado completo dos ESP32 e suas credenciais IoT:**
```sql
SELECT
    e.id, e.serial_number, e.asset_tag, e.active,
    e.created_at, e.updated_at, et.name AS type,
    dc.id AS credential_id, dc.thing_name, dc.active AS cred_active
FROM equipment e
JOIN equipment_types et ON e.equipment_type_id = et.id
LEFT JOIN device_credentials dc ON dc.equipment_id = e.id
WHERE et.name = 'ESP32'
ORDER BY e.created_at;
```

**ESP32 com serial específico (case-insensitive):**
```sql
SELECT e.id, e.serial_number, e.active, et.name AS type,
       dc.thing_name, dc.certificate_id IS NOT NULL AS has_cert
FROM equipment e
JOIN equipment_types et ON e.equipment_type_id = et.id
LEFT JOIN device_credentials dc ON dc.equipment_id = e.id
WHERE LOWER(e.serial_number) = LOWER('<SERIAL>');
```

**DeviceCredentials orphans (linked a equipment que não é mais ESP32 ativo):**
```sql
SELECT dc.id, dc.thing_name, dc.equipment_id,
       e.serial_number, et.name AS type, e.active
FROM device_credentials dc
JOIN equipment e ON e.id = dc.equipment_id
JOIN equipment_types et ON e.equipment_type_id = et.id
WHERE et.name != 'ESP32' OR e.serial_number IS NULL OR e.active = false;
```

**Histórico de um equipment:**
```sql
SELECT operation, operation_at, notes
FROM movement_history
WHERE equipment_id = <ID>
ORDER BY operation_at;
```

**Ping logs de um device (últimas tentativas de conexão):**
```sql
SELECT serial_number, ip_address, created_at
FROM device_ping_logs
WHERE serial_number = '<SERIAL>'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 4. Fix Cirúrgico no Banco

Quando identificar um desalinhamento de dados (ex: DeviceCredential ligada ao equipment errado):

```bash
# Sempre rodar dentro de uma transação explícita para poder confirmar antes de commitar
$SSH "docker exec postgres psql -U postgres -d appdb -c \"
BEGIN;
-- verificar antes
SELECT id, thing_name, equipment_id FROM device_credentials WHERE id = <ID>;
-- aplicar
UPDATE device_credentials SET equipment_id = <EQUIPMENT_ID_CORRETO> WHERE id = <ID>;
-- verificar depois
SELECT id, thing_name, equipment_id FROM device_credentials WHERE id = <ID>;
COMMIT;
\""
```

---

## 5. Fluxo de Diagnóstico Recomendado

```
Usuário relata erro
    │
    ├─ 1. Obter horário exato e serial/ID envolvido
    │
    ├─ 2. Buscar nos logs pelo serial/erro naquele horário
    │       └─ Se container reiniciou → logs perdidos, ir direto para banco
    │
    ├─ 3. Consultar estado atual no banco (equipment + credential)
    │
    ├─ 4. Cruzar created_at / updated_at com movement_history
    │       └─ Reconstrói o que aconteceu mesmo sem logs
    │
    └─ 5. Aplicar fix cirúrgico no banco OU corrigir no código + deploy
```

---

## 6. Contexto do Provisionamento IoT

O fluxo normal de um ESP32:
1. Equipment criado/atualizado como ESP32 com serial → `provisionInIoTCore` chamado
2. DeviceCredential salva no banco com `thing_name = serial`, `equipment_id = id`
3. ESP32 chama `GET /api/v1/devices/{serial}/credentials` → recebe certificado + endpoint
4. ESP32 conecta no AWS IoT Core via MQTT usando o certificado (não o serial)

**Erro 404 em `/credentials`** = Equipment existe mas não tem DeviceCredential → checar se há credential orphan com o mesmo `thing_name` em outro equipment.

**Query de cruzamento:**
```sql
SELECT e.id, e.serial_number, e.active, et.name,
       dc.id AS cred_id, dc.thing_name, dc.equipment_id
FROM equipment e
JOIN equipment_types et ON e.equipment_type_id = et.id
LEFT JOIN device_credentials dc ON dc.thing_name = e.serial_number
WHERE e.serial_number = '<SERIAL>';
```
