# Deployment Guide

## Variáveis de Ambiente

Todas as variáveis utilizadas pelo projeto, organizadas por módulo.

### SSH (CI/CD)

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `SSH_HOST` | IP do servidor | `100.48.93.142` |
| `SSH_USER` | Usuário SSH | `ubuntu` |
| `SSH_PRIVATE_KEY` | Chave privada SSH | `-----BEGIN OPENSSH...` |

### PostgreSQL

| Variável | Descrição | Default | Obrigatória |
|----------|-----------|---------|:-----------:|
| `POSTGRES_DB_SERVER_ADDRESS` | Host do banco | `localhost` | Não (docker-compose seta) |
| `POSTGRES_DB_SERVER_PORT` | Porta do banco | `5432` | Não |
| `POSTGRES_DB_NAME` | Nome do banco | `appdb` | Sim |
| `POSTGRES_USER` | Usuário | `postgres` | Sim |
| `POSTGRES_PASSWORD` | Senha | `example` | Sim |

### AWS Cognito (Autenticação)

| Variável | Descrição | Default | Obrigatória |
|----------|-----------|---------|:-----------:|
| `AWS_COGNITO_REGION` | Região do Cognito | `us-east-1` | Sim |
| `AWS_COGNITO_USER_POOL_ID` | ID do User Pool | - | Sim |
| `AWS_COGNITO_CLIENT_ID` | App Client ID | - | Sim |
| `AWS_COGNITO_CLIENT_SECRET` | App Client Secret | - | Sim |
| `AWS_COGNITO_DOMAIN` | Domínio Hosted UI | `your-domain` | Não (não utilizado) |

> `AWS_COGNITO_DOMAIN` existe no config mas nenhum código de produção o utiliza. Pode ser removido futuramente.

### AWS IAM (SDK operations)

| Variável | Descrição | Obrigatória |
|----------|-----------|:-----------:|
| `AWS_ACCESS_KEY_ID` | Access Key IAM | Sim |
| `AWS_SECRET_ACCESS_KEY` | Secret Key IAM | Sim |

Usadas pelo Cognito AdminCreateUser (convites) e pelos SDKs DynamoDB/IoT Core.

### AWS DynamoDB (Leituras de Pressão)

| Variável | Descrição | Default | Obrigatória |
|----------|-----------|---------|:-----------:|
| `AWS_DYNAMODB_REGION` | Região da tabela | `us-east-1` | Sim |
| `AWS_DYNAMODB_TABLE_NAME` | Nome da tabela | `pressure-monitoring-data-prod` | Sim |

### AWS IoT Core (Provisionamento de Dispositivos)

| Variável | Descrição | Default | Obrigatória |
|----------|-----------|---------|:-----------:|
| `AWS_IOT_REGION` | Região do IoT Core | `us-east-1` | Sim |
| `AWS_IOT_POLICY_NAME` | Policy para dispositivos | `gastrack-esp-policy` | Sim |

> O endpoint IoT (`iot:Data-ATS`) é descoberto automaticamente via SDK no momento do provisionamento.

### Device Provisioning (API Key)

| Variável | Descrição | Default | Obrigatória |
|----------|-----------|---------|:-----------:|
| `DEVICE_API_KEY` | Chave de autenticação para dispositivos | `change-me-in-production` | Sim |

Autenticação via header `X-Device-Api-Key` no endpoint `GET /api/v1/devices/{serialNumber}/credentials`.

### CORS

| Variável | Descrição | Default |
|----------|-----------|---------|
| `ALLOWED_ORIGINS` | URLs do frontend (separadas por vírgula) | `http://localhost:3000,http://localhost:4200,http://localhost:8080` |

> No GitHub Secrets, mapeada como `FRONTEND_URL`.

### Outras

| Variável | Descrição | Default |
|----------|-----------|---------|
| `REQUIRE_HTTPS` | Exigir HTTPS | `false` |

---

## GitHub Secrets

Configure em: https://github.com/IFCE/gastrack-backend/settings/secrets/actions

```
# SSH
SSH_HOST
SSH_USER
SSH_PRIVATE_KEY

# Cognito
AWS_COGNITO_REGION
AWS_COGNITO_USER_POOL_ID
AWS_COGNITO_CLIENT_ID
AWS_COGNITO_CLIENT_SECRET

# IAM
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# Database
POSTGRES_DB_NAME
POSTGRES_USER
POSTGRES_PASSWORD

# CORS
FRONTEND_URL

# DynamoDB
AWS_DYNAMODB_REGION
AWS_DYNAMODB_TABLE_NAME

# IoT Core
AWS_IOT_REGION
AWS_IOT_POLICY_NAME

# Device
DEVICE_API_KEY
```

## Workflow de Deploy

O workflow `.github/workflows/deploy.yml`:

1. Conecta no servidor via SSH
2. Faz `git pull` do código mais recente
3. Cria arquivo `.env` com os GitHub Secrets
4. Reinicia os containers Docker

## Deploy Manual

```bash
# 1. SSH no servidor
ssh -i sua-chave.pem ubuntu@IP_DO_SERVIDOR

# 2. Ir para o diretório do backend
cd ~/app/backend

# 3. Atualizar código
git pull origin main

# 4. Criar .env manualmente (copie valores do .env.example)
nano .env

# 5. Reiniciar containers
docker compose down
docker compose up -d --build
```

## Troubleshooting

### CORS Error
1. Verifique se `FRONTEND_URL` inclui a porta (ex: `http://IP:3000`)
2. Confirme no servidor: `cat ~/app/backend/.env | grep ALLOWED`

### Cognito Authentication Error
1. Verifique as variáveis `AWS_COGNITO_*` nos Secrets
2. Logs: `docker logs app`

### Database Connection Error
1. Container rodando: `docker ps`
2. Logs: `docker logs postgres`

### IoT Provisioning Error
1. Verifique `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` com permissões IoT
2. Verifique se a policy `AWS_IOT_POLICY_NAME` existe no IoT Core
3. Logs: `docker logs app | grep IoT`

### Device Credentials 401
1. Verifique se `DEVICE_API_KEY` no `.env` não é o default `change-me-in-production`
2. Teste: `curl -H "X-Device-Api-Key: SUA_KEY" http://IP:8080/api/v1/devices/SERIAL/credentials`
