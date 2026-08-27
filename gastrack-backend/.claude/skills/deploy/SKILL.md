---
name: deploy
description: Deploy manual do GasTrack (backend e/ou frontend) via SSH no servidor Lightsail. Use quando o usuario pedir para fazer deploy, subir para producao, ou atualizar o servidor.
user_invocable: true
---

# Deploy Manual — GasTrack

## Acesso

```
SSH Key: /Users/rafaeljonker/Downloads/LightsailDefaultKey-us-east-1(2).pem
IP:      100.48.93.142
User:    ubuntu
Branch:  homologacao
```

```bash
SSH="ssh -i \"/Users/rafaeljonker/Downloads/LightsailDefaultKey-us-east-1(2).pem\" -o StrictHostKeyChecking=no ubuntu@100.48.93.142"
```

---

## Deploy

Perguntar o que deployar: **backend**, **frontend** ou **ambos**.

**Backend:**
```bash
$SSH "cd /home/ubuntu/app/backend && git pull origin homologacao && docker compose down && docker compose up -d --build"
```

**Frontend:**
```bash
$SSH "cd /home/ubuntu/app/frontend && git pull origin homologacao && docker compose down && docker compose up -d --build"
```

---

## Verificar

```bash
$SSH "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

Containers esperados healthy:
- `postgres` → porta 5432
- `app` → porta 8080
- `gastrack-frontend` → porta 3000

---

## Limpeza (opcional)

```bash
$SSH "docker system prune -f"
```

---

## Contexto

- GitHub Actions depende de billing ativo — quando falhar, usar este deploy manual
- `docker compose down && up --build` reconstrói a imagem com o novo código
- Migrations Flyway rodam automaticamente no startup do backend
