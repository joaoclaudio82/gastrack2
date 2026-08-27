# GasTrack Backend

Backend API para o sistema GasTrack - monitoramento de cilindros de gás.

## Tecnologias

- Spring Boot 4.0.0
- Spring Data JPA
- Spring Security + AWS Cognito JWT
- PostgreSQL
- Flyway (migrations)
- MapStruct
- Lombok
- Swagger (OpenAPI)

## Como rodar o projeto

### Pre-requisitos

- [Docker](https://www.docker.com/) (ou [OrbStack](https://orbstack.dev/) no macOS)
- [Bun](https://bun.sh/) (para o frontend)

### Passo 1: Variaveis de ambiente (opcional no dev local)

Para **`mvn spring-boot:run` com profile `dev`** e Postgres do `docker-compose.db.yml`, **nao e obrigatorio** ter `.env` com dados de banco: os padroes estao em `application-dev.yml` (`DEV_LOCAL_DB_*` so se precisar mudar host/porta/nome/senha).

Crie `.env` apenas quando precisar de Cognito/AWS em ambiente que nao seja so Basic Auth local, ou copie do exemplo:

```bash
cp .env.example .env
```

Valores reais de **pool, client secret e chaves IAM** devem vir de um cofre ou do time — **nunca** os coloque em comentarios no codigo nem commite o `.env`.

### Passo 2: Docker (instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou OrbStack)

Escolha **um** dos fluxos abaixo.

#### Opcao A — So PostgreSQL (recomendado para desenvolver com `mvn` / IDE)

O banco fica em **localhost:5432** (mesmo padrao do `application-dev.yml`).

```bash
cd gastrack-backend
docker compose -f docker-compose.db.yml up -d
```

No Windows PowerShell (a partir da raiz do repo):

```powershell
.\scripts\docker-postgres-up.ps1
```

Depois suba o backend localmente, por exemplo:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

#### Opcao B — Postgres + API dentro do Docker

Postgres exposto no **host** na porta **5433** (para nao conflitar com um Postgres ja instalado na 5432).

```bash
cd gastrack-backend
docker compose -f docker-compose.dev.yml up -d
```

O ficheiro `docker-compose.dev.yml` pode carregar `.env` para **Cognito/AWS** no container da API. O Postgres no host fica na porta **5433**; se ligar com `mvn` + profile `dev` a esse Postgres, use `DEV_LOCAL_DB_PORT=5433` (ou variavel de ambiente equivalente), nao misture com `POSTGRES_*` salvo que saiba o que esta a fazer.

Para verificar:

```bash
docker ps
```

### Passo 3: Subir o frontend

Em outro terminal:

```bash
cd gastrack-frontend
bun install    # so precisa rodar na primeira vez
bun start      # sobe o frontend em http://localhost:4200
```

O frontend ja vem configurado para se conectar ao backend em `http://localhost:8080/api/v1`.

### Pronto!

| Servico    | URL                                        |
|------------|--------------------------------------------|
| Frontend   | http://localhost:4200                       |
| Backend    | http://localhost:8080                       |
| Swagger    | http://localhost:8080/swagger-ui.html       |
| PostgreSQL | Opcao A: `localhost:5432` / Opcao B: `localhost:5433` (credenciais do compose, nao precisam estar no `.env` para dev local) |

### Credenciais de acesso (dev)

| Usuario               | Senha           | Role        |
|-----------------------|-----------------|-------------|
| admin@gastrack.com.br | `Gastrack@123`  | SUPER_ADMIN |

### Para parar tudo

```bash
cd gastrack-backend
# Se usou Opcao A:
docker compose -f docker-compose.db.yml down
# Se usou Opcao B:
docker compose -f docker-compose.dev.yml down

# Frontend: Ctrl+C no terminal
```

## Desenvolvimento local (resumo)

| Objetivo | Compose | Porta no host |
|----------|---------|----------------|
| Só banco + `mvn`/IDE | `docker-compose.db.yml` | **5432** |
| Banco + app em container | `docker-compose.dev.yml` | Postgres **5433**, API **8080** |
| Producao local (Cognito + app) | `docker-compose.yml` | Postgres **5432**, API **8080** |

### `FATAL: password authentication failed for user "postgres"` (perfil dev)

Causas comuns:

1. **Volume Docker antigo** — o Postgres foi criado antes com outra `POSTGRES_PASSWORD`; o dado em disco prevalece. Recrie o volume (apaga dados locais do container):

   ```bash
   docker compose -f docker-compose.db.yml down -v
   docker compose -f docker-compose.db.yml up -d
   ```

2. **Variavel global** — remova `SPRING_DATASOURCE_PASSWORD` (ou `POSTGRES_PASSWORD`) da configuracao de execucao da IDE se estiver definida sem querer.

3. **Postgres instalado no Windows** na 5432 com outra senha — ou pare o servico e use so o Docker na 5432, ou alinhe a senha do utilizador `postgres` com a do perfil dev (`postgres`, ver `application-dev.yml`).

## Testes

```bash
# Rodar todos os testes
mvn test

# Rodar testes com relatorio de cobertura
mvn test jacoco:report

# Verificar cobertura minima (80%)
mvn jacoco:check
```

O relatorio de cobertura estara em: `target/site/jacoco/index.html`

## CI/CD

### CI - Tests
Roda automaticamente em:
- Push para `main`, `develop` ou `master`
- Pull requests para `main` ou `master`

### Deploy
Deploy automatico para o servidor quando ha push na branch `main`.

## API Documentation

- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Estrutura do Projeto

```
src/main/java/com/gastrack/
├── configuration/    # Spring configs (Security, Swagger, JPA)
├── controller/       # REST endpoints
├── dto/              # Request/Response DTOs
├── exceptions/       # Exception handlers
├── mapper/           # MapStruct mappers
├── model/            # JPA entities
├── repository/       # Spring Data JPA repos
├── security/         # Security filters e Cognito integration
├── service/          # Business logic
└── utils/            # Utilities
```

## License

Apache License 2.0
