# Arquitetura — GasTrack / Inteligás

Este documento descreve **o domínio e suas invariantes**. Convenções de código estão em
[CONVENTIONS.md](CONVENTIONS.md); comandos e estrutura do backend, em
[CLAUDE.md](CLAUDE.md).

Um leitor que entender só este arquivo já consegue revisar uma mudança de domínio.

---

## 1. O que o produto faz

A Inteligás **vende o dispositivo de monitoramento, não o gás**. O cliente é quem tem gás
(padaria, restaurante, hospital, indústria) e compra para **saber quando o gás vai acabar a
tempo de reabastecer**. O gás vem de um distribuidor qualquer; a plataforma só mede e avisa.

Consequência: o valor inteiro é *"avise-me a tempo"*. Autonomia, previsão e alerta são o topo
da hierarquia de importância — tudo mais é apoio.

**Escopo de gás:** apenas **comprimidos** (O₂, N₂, CO₂, ar comprimido), onde a pressão é proxy
válido da carga. **GLP liquefeito está fora**: nele a pressão fica ~constante até quase esvaziar,
e todo o modelo `nível = pressão ÷ capacidade` seria inválido — mede-se por peso.

---

## 2. As entidades e o que cada cardinalidade significa

```
Company ──1:N──> Address ──1:N──> PontoGas ──1:N──> Cylinder ──N:1──> CylinderModel
                                      ▲
                                      │ 1:1
                              Equipment (Sensor) ──N:1──> Equipment (ESP32) ──N:1──> EquipmentKit
```

| Entidade | É, no mundo físico |
|---|---|
| **PontoGas** | A **linha de gás** — a tubulação que alimenta um equipamento (forno, fritadeira). É o que o cliente enxerga. |
| **Cylinder** | Um **casco físico**. Identidade = `serialNumber`. Não tem leitura própria. |
| **CylinderModel** | O **tipo** de casco: gás, volume de água em litros, pressão nominal. Catálogo. |
| **Equipment · Sensor** | Uma **porta do ESP32** (1 a 8) medindo a saída de uma linha. |
| **Equipment · ESP32** | O **gateway**. `serialNumber` = MAC, só conhecido quando o device liga e pinga. |
| **EquipmentKit** | O conjunto instalado num endereço: 1 ESP32 + seus sensores. |

### Invariantes que o banco aplica

| Invariante | Onde é garantida |
|---|---|
| Uma linha tem **no máximo um** sensor | `UNIQUE(gas_point_id)` em `equipment` (V32) + `validateSingleSensor` |
| Um par (ESP32, porta) é único | `UNIQUE(parent_equipment_id, sensor_port)` parcial (V46) |
| `codigo_sensor` (`MAC\|porta`) é único | índice parcial único (V30) |
| Um kit tem **exatamente um** ESP32 ativo | `validateSingleEsp32PerKit`, chamado nos 5 caminhos de atribuição |
| Todo cilindro tem empresa dona | `company_id NOT NULL` (V45) |
| Cilindros da mesma linha têm o **mesmo gás** | `validateGasTypeMatchesPoint` no create e no update |

> **Por que gás único por linha:** um sensor mede a saída **combinada** do manifold. Misturar
> gases torna a leitura fisicamente sem sentido — e perigoso.

---

## 3. Estado e leitura: o que vive onde

Esta é a regra mais importante do domínio, e a mais fácil de violar por engano.

**Nível, pressão e status pertencem à LINHA, nunca ao cilindro.**

Com um único sensor no manifold, mede-se a saída combinada — a carga de cada casco
individual **não é mensurável**. Qualquer tela, DTO ou cálculo que prometa "% do botijão B"
está inventando dado.

| Vive no `PontoGas` | Vive no `Cylinder` |
|---|---|
| `currentPressureBar`, `lastReadingAt`, `status` | `serialNumber` (identidade) |
| nível %, m³ disponível | `connected` (válvula aberta) |
| volume e pressão de 100% (**derivados**) | ponteiro para o `CylinderModel` |

### Os números derivados

Nenhum deles é campo digitado:

| Número | Método | Fórmula |
|---|---|---|
| Volume da linha | `PontoGas.getEffectiveCapacityLiters()` | Σ `waterVolumeLiters` dos cascos **conectados**; `null` sem casco |
| Pressão de 100% | `getEffectiveFullTankPressureBar()` | `min` dos `capacityBar` — o casco mais fraco limita o enchimento; `null` sem casco |
| m³ disponível | `getAvailableCubicMeters()` | litros × bar ÷ 1000 (Boyle, sem fator Z nem temperatura) |
| Nível % | `PontoGasMapper.fillOf()` | pressão atual ÷ pressão de 100% |

**Linha sem casco conectado não tem volume nem pressão de 100%.** Os dois derivados devolvem
`null`, o nível e os m³ ficam indisponíveis e o status cai em `UNKNOWN`. Não existe fallback:
quem tem litragem e pressão nominal é o casco, via `CylinderModel` — linha é tubulação.

> A linha já teve as colunas `internal_volume_liters` e `full_tank_pressure_bar` como fallback,
> com default de 5 L / 140 bar. Elas produziram nível e alarme fabricados numa linha real com
> sensor publicando e zero casco cadastrado: 40 bar sobre 140 bar de ficção viravam "28% / LOW"
> no painel do cliente. Removidas em V49, depois de a V48 dar um casco de verdade a toda linha
> que não tinha nenhum. O cliente também não pode ter esse default — ver `CONVENTIONS.md` §8.

**`connected` ≠ `active`.** `active` = não foi aposentado do inventário. `connected` = válvula
aberta no manifold. Reserva fechada não está na pressão medida, então fica fora da soma.

---

## 4. Como a leitura do sensor chega

```
ESP32 ──publica──> AWS IoT Core ──grava──> DynamoDB
                                              │
                          GasPointReadingSyncJob ──@Scheduled 60s──> consulta
                                              │
                                     applyReading(linha, bar)
                                              │
                            PostgreSQL: gas_points.current_pressure_bar
```

É **poll**, não push: nada notifica o backend, ele pergunta.

Por que copiar do DynamoDB para o Postgres, se o dado já está lá:

| | Analytics (gráfico) | Dashboard, alertas, card da linha |
|---|---|---|
| Lê de | DynamoDB, direto | Postgres, `gas_points` |
| Quando | só com a tela aberta | sempre |

O job existe para o sistema saber o estado do gás **sem depender de alguém olhando a tela**.
É o que torna alerta possível.

**Garantias do job:** só avança (leitura mais velha que a persistida é descartada); uma linha
com problema não interrompe as demais; desligável por `gastrack.reading-sync.enabled`.

**Detalhe do DynamoDB:** o filtro de `sensor_id` é aplicado *depois* do `limit`, então pedir 1
item devolveria vazio sempre que a leitura mais recente do device fosse de outra porta. Daí a
varredura de 64 itens em `findLatest`.

---

## 5. Papéis

Três, sem previsão de novos.

| Papel | Quem é | Escopo |
|---|---|---|
| `SUPER_ADMIN` | A operadora | Global: contratos, catálogo, inventário, instalação em campo |
| `ADMIN` | Gestor da empresa-cliente | Uma empresa: monitora e gere a própria operação |
| `USER` | Funcionário do cliente | Uma empresa: monitora e **registra troca de botijão** |

`Equipment` e os logs de ping são recursos **globais**, não filtrados por tenant — abrir para
`ADMIN` exporia hardware entre empresas.

---

## 6. Multi-tenant

O isolamento tem três camadas, e as três precisam estar certas:

1. **`@PreAuthorize`** no controller define quais papéis alcançam a rota.
2. **`TenantSecurityService.validateCompanyAccess(companyId)`** no service verifica se o usuário
   pode tocar naquela empresa. `SUPER_ADMIN` passa por tudo.
3. **A query** filtra por empresa. Para `Cylinder`, o caminho é `company_id` — direto, sem
   derivar de ponto ou endereço.

**Leituras do DynamoDB são escopadas por posse.** Como `device_id` é o MAC e ESPs são
reaproveitados entre empresas, toda consulta leva um **piso de tempo** = início da posse atual.
A empresa B só vê leitura a partir de quando o ESP virou dela. Nada é apagado.

---

## 7. Ciclo de vida de um kit

```
PENDING ──instala──> INSTALLED ──┬──> MAINTENANCE ──> INSTALLED
                                 ├──> REMOVED ──> estoque ou DECOMMISSIONED
                                 └──> RELOCATED (mesmo cliente, outro endereço)
```

- **Relocar** = desmonitora A + monitora B. O hardware viaja; **o cilindro não** — é o gás do
  cliente, fica onde está.
- **Trocar de empresa não é relocação**: é remover em A e instalar em B sob novo contrato,
  reusando o mesmo ESP.
- **Credencial IoT**: desativa em `REMOVED` (device volta ao estoque, reaproveitável); revoga
  só em `DECOMMISSIONED`.

---

## 8. Troca de botijão

Ação do **cliente**, não gera trabalho de técnico. Duas camadas:

1. **Evento automático** — o job detecta salto de nível > 40 pontos e grava `RefillEvent`
   com `source = AUTO`. Sempre acontece.
2. **Registro do casco** — o cliente informa **qual serial saiu** e qual entrou
   (`source = MANUAL`). Com um sensor no manifold o sistema **não deduz** isso.

`outgoingCylinderId` é obrigatório quando a linha já tem cascos. Aposentar todos derrubaria um
banco de 3 × 50 L para 50 L, e a autonomia junto.

---

## 9. Migrations

- **Nunca editar migration já aplicada.** Sempre uma nova.
- **Migration não apaga dado do usuário.** Quando encontra estado que impede a mudança
  (órfão sem empresa, par duplicado), ela **aborta com `RAISE EXCEPTION`** trazendo a query de
  diagnóstico. Decidir o destino do dado é humano.
- Coluna nova com `DEFAULT` que preserva o comportamento anterior — a migration não deve
  mudar nenhum número já existente.

---

## 10. Onde as decisões estão registradas

| Assunto | Onde |
|---|---|
| Reestruturação da jornada, modelo de cilindro | `docs/superpowers/specs/` |
| Fluxos críticos em Gherkin | `docs/bdd/` |
| Mockups navegáveis da jornada | `docs/jornada-inteligas-v3.html` |

> `docs/jornada-inteligas-v3.html` mostra **percentual por botijão** — está **incorreto** pelo
> que a seção 3 estabelece. Tratar como histórico.
