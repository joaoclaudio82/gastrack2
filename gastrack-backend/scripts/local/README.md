# Fixture de teste

Prepara um cenário reproduzível de linhas de gás, cilindros e leitura de sensor. Tudo que a
fixture cria carrega o prefixo `TESTE-LOCAL-`, e o `cleanup` apaga exatamente esse conjunto.

O padrão é o banco local. Dá para apontar para um servidor remoto — inclusive produção — com
`FIXTURE_SSH`; veja [Apontar para produção](#5-apontar-para-produção).

O pacote tem duas partes:

- `manage-fixture.sh`: aplica, limpa e inspeciona a fixture no Postgres do backend
- `simulate-sensor.sh`: injeta leitura no DynamoDB no mesmo formato do sensor real

## O que a fixture cria

- empresa `TESTE-LOCAL-EMPRESA` (ou uma empresa que já existe — veja `FIXTURE_COMPANY_SLUG`)
- usuário admin `teste-local-admin@gastrack.local` (só quando cria a empresa própria)
- endereço `TESTE-LOCAL-END-01`
- linha `TESTE-LOCAL-LINHA-BASE`
  - 3 cilindros `50 L / 200 bar`
- linha `TESTE-LOCAL-LINHA-MIX`
  - 2 cilindros `50 L / 200 bar`
  - 1 cilindro `50 L / 150 bar`
  - sensor `TESTE-LOCAL-ESP-01|1`
- linha `TESTE-LOCAL-LINHA-EMPTY`
  - sem cilindros

## Pré-requisitos

- Postgres de pé por um dos composes da raiz (`docker compose -f docker-compose.db.yml up -d`)
- migrations aplicadas (a seed depende de cidades e tipos de equipamento)
- `.env` da raiz preenchido — é de lá que os dois scripts leem toda a configuração

Nenhum script tem valor de infraestrutura embutido. Rode a partir de qualquer diretório; os
caminhos são resolvidos a partir da própria localização do script.

## 1. Aplicar a fixture

Duas formas — automática no boot, ou manual.

### Automática: o backend aplica sozinho

`R__local_fixture.sql` tem nome de migration repetível do Flyway. Basta incluir este diretório
nas locations e ela roda logo depois das migrations, a cada boot. No `.env` da raiz:

```bash
# docker-compose.dev.yml (o diretório entra montado em /fixture)
SPRING_FLYWAY_LOCATIONS=classpath:db/migration,filesystem:/fixture

# mvn spring-boot:run, a partir da raiz do projeto
SPRING_FLYWAY_LOCATIONS=classpath:db/migration,filesystem:scripts/local
```

Sem essa variável nada muda: o `docker-compose.dev.yml` monta o diretório em `/fixture`, mas
com `classpath:db/migration` sozinho o Flyway nem olha para lá. `docker-compose.yml` (produção)
não foi tocado.

Duas coisas que valem saber:

- o Flyway só reaplica migration repetível quando o **checksum do arquivo muda**. Depois de um
  `cleanup`, reiniciar o backend **não** traz a fixture de volta — use o `apply` abaixo;
- `cleanup` continua sendo só manual.

### Manual

```bash
./scripts/local/manage-fixture.sh apply
```

Conferir:

```bash
./scripts/local/manage-fixture.sh status
```

Se o Postgres estiver em outro compose:

```bash
COMPOSE_FILE=docker-compose.dev.yml ./scripts/local/manage-fixture.sh apply
```

| Variável | Default | De onde vem |
|---|---|---|
| `COMPOSE_FILE` | `docker-compose.db.yml` | ambiente (lida nativamente pelo `docker compose`) |
| `PG_SERVICE` | `postgres` | ambiente |
| `POSTGRES_DB_NAME` | o do container | `.env` da raiz |
| `POSTGRES_USER` | o do container | `.env` da raiz |

## 2. Simular a leitura do sensor

```bash
./scripts/local/simulate-sensor.sh once     # injeção única
./scripts/local/simulate-sensor.sh start    # loop contínuo
./scripts/local/simulate-sensor.sh status
./scripts/local/simulate-sensor.sh stop
```

Usa o `aws` local quando existe; sem ele, cai no `amazon/aws-cli` via Docker.

Obrigatórias no `.env` da raiz — as mesmas que a aplicação usa, para o simulador escrever na
tabela de onde o job de sincronização lê:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DYNAMODB_REGION`
- `AWS_DYNAMODB_TABLE_NAME`

As duas últimas não vinham no `.env.example` e agora vêm. Sem elas o backend cai no default de
produção do `application.yml`, e o simulador falha em vez de escrever numa tabela que você não
escolheu — confira que o valor bate com o que o backend está lendo.

Sobrescritas opcionais (defaults casam com a fixture):

```bash
SIM_DEVICE_ID=TESTE-LOCAL-ESP-01 \
SIM_SENSOR_ID=1 \
SIM_PRESSURE_BAR=135.2 \
SIM_INTERVAL_SECONDS=10 \
./scripts/local/simulate-sensor.sh start
```

## 3. O que esperar no front

Abra `Pontos de Gás` e expanda `TESTE-LOCAL-LINHA-MIX`.

Com os 3 cilindros abertos e pressão de `118.5 bar`:

- `Pressão 118.5 bar / 150`
- `79%`
- `Volume 150 L`

Fechando o cilindro `TESTE-LOCAL-CIL-103` (`50 L / 150 bar`):

- `Pressão 118.5 bar / 200`
- `59%`
- `Volume 100 L`

## 4. Limpar

```bash
./scripts/local/manage-fixture.sh cleanup
```

## 5. Apontar para produção

Dá para testar direto em produção. São dois lados independentes: o Postgres (as linhas e
cilindros) e o DynamoDB (as leituras).

### Postgres de produção

`FIXTURE_SSH` recebe o comando ssh inteiro, no mesmo formato do skill de deploy. Chave e IP
ficam no seu ambiente — nunca no repositório:

```bash
export FIXTURE_SSH='ssh -i /caminho/da/chave.pem ubuntu@SEU_IP'
export FIXTURE_COMPANY_SLUG=slug-da-sua-empresa

./scripts/local/manage-fixture.sh apply
```

Duas travas, porque escrever em produção não é o caminho feliz:

- `apply` e `cleanup` em alvo remoto **pedem que você digite o nome do banco** para confirmar.
  `FIXTURE_YES=1` pula a pergunta — use só em automação;
- num alvo remoto o `.env` da raiz é **ignorado** de propósito. Apontar um banco remoto com o
  nome do banco da sua máquina é o tipo de engano que só aparece depois do write.

Variáveis do alvo remoto:

| Variável | Default | Para quê |
|---|---|---|
| `FIXTURE_SSH` | vazio (= local) | comando ssh completo |
| `FIXTURE_CONTAINER` | `postgres` | nome do container Postgres do outro lado |
| `FIXTURE_YES` | vazio | `1` pula a confirmação |

### `FIXTURE_COMPANY_SLUG` — por que ele importa em produção

Sem ele, a fixture cria a própria empresa e um usuário `teste-local-admin@gastrack.local`. Esse
usuário **não existe no Cognito**: em produção ninguém consegue logar com ele, e você não veria
a fixture pela interface.

Com `FIXTURE_COMPANY_SLUG=<empresa que já existe>`, a fixture pendura as linhas e os cilindros
nessa empresa e não cria usuário nenhum — você entra com o seu login de sempre e o cenário
aparece junto do resto. A empresa precisa ter ao menos um usuário ativo, que assina os
registros criados.

**A fixture mora numa empresa por vez.** Cilindros e equipamentos têm chave única, então aplicar
numa segunda empresa migraria uns e duplicaria outros, deixando o cenário pela metade nas duas.
A seed recusa com uma mensagem dizendo onde ela já está — rode o `cleanup` antes de mudar de
empresa. O `cleanup` limpa o rastro `TESTE-LOCAL-` onde quer que ele esteja.

O `cleanup` respeita a mesma variável e **nunca apaga uma empresa que não foi ele que criou**:
pendurado numa empresa real, ele remove só as linhas, cilindros, equipamentos, endereços e
contratos com o prefixo `TESTE-LOCAL-`, preservando empresa e usuários. Passe o mesmo
`FIXTURE_COMPANY_SLUG` no `apply` e no `cleanup`, senão cada um age numa empresa diferente.

### DynamoDB de produção

Aqui não há nada a ligar: o simulador escreve na tabela que estiver em `AWS_DYNAMODB_TABLE_NAME`.
Aponte para a tabela que o backend de produção lê e as leituras entram no fluxo real.

```bash
AWS_DYNAMODB_TABLE_NAME=<tabela de producao> ./scripts/local/simulate-sensor.sh once
```

O `device_id` precisa bater com um sensor que exista lá. O da fixture é `TESTE-LOCAL-ESP-01`
porta `1`; para alimentar um ponto que já existe em produção, passe o `SIM_DEVICE_ID` e o
`SIM_SENSOR_ID` daquele sensor e nem precisa aplicar a fixture no Postgres.

## Observação

O auto-apply pelo Flyway é só para o ambiente local: `docker-compose.yml` (produção) não foi
tocado e não monta este diretório. Em produção a fixture só entra por `manage-fixture.sh`, com
a confirmação digitada.
