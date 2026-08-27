#!/bin/bash
# =====================================================
# Script: create-super-admin.sh
# Descrição: Cria o primeiro SUPER_ADMIN no Cognito e no banco
# =====================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "=================================================="
echo "       CRIAÇÃO DO PRIMEIRO SUPER_ADMIN"
echo "=================================================="
echo -e "${NC}"

# Verificar se AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}ERRO: AWS CLI não está instalado.${NC}"
    echo "Instale com: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
    exit 1
fi

# Verificar se está configurado
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}ERRO: AWS CLI não está configurado.${NC}"
    echo "Execute: aws configure"
    exit 1
fi

# Solicitar configurações
echo -e "${YELLOW}Configuração:${NC}"
echo ""

# User Pool ID
read -p "User Pool ID (ex: us-east-2_XXXXXXXXX): " USER_POOL_ID
if [ -z "$USER_POOL_ID" ]; then
    echo -e "${RED}ERRO: User Pool ID é obrigatório.${NC}"
    exit 1
fi

# Email
read -p "Email do SUPER_ADMIN [admin@gastrack.com.br]: " EMAIL
EMAIL=${EMAIL:-admin@gastrack.com.br}

# Nome
read -p "Primeiro nome [Super]: " FIRST_NAME
FIRST_NAME=${FIRST_NAME:-Super}

# Sobrenome
read -p "Sobrenome [Admin]: " LAST_NAME
LAST_NAME=${LAST_NAME:-Admin}

echo ""
echo -e "${BLUE}Resumo:${NC}"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Email: $EMAIL"
echo "  Nome: $FIRST_NAME $LAST_NAME"
echo ""

read -p "Confirma? (s/N): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo -e "${YELLOW}Passo 1: Criando usuário no Cognito...${NC}"

# Criar usuário no Cognito
aws cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --user-attributes \
        Name=email,Value="$EMAIL" \
        Name=email_verified,Value=true \
        Name=given_name,Value="$FIRST_NAME" \
        Name=family_name,Value="$LAST_NAME" \
        Name=name,Value="$FIRST_NAME $LAST_NAME" \
    --desired-delivery-mediums EMAIL \
    --output json > /tmp/cognito_user.json

if [ $? -ne 0 ]; then
    echo -e "${RED}ERRO: Falha ao criar usuário no Cognito.${NC}"
    exit 1
fi

echo -e "${GREEN}Usuário criado no Cognito!${NC}"

echo ""
echo -e "${YELLOW}Passo 2: Obtendo Cognito SUB...${NC}"

# Obter o SUB
COGNITO_SUB=$(aws cognito-idp admin-get-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --query 'UserAttributes[?Name==`sub`].Value' \
    --output text)

if [ -z "$COGNITO_SUB" ]; then
    echo -e "${RED}ERRO: Não foi possível obter o Cognito SUB.${NC}"
    exit 1
fi

echo -e "${GREEN}Cognito SUB: $COGNITO_SUB${NC}"

echo ""
echo -e "${YELLOW}Passo 3: Atualizando migration V13...${NC}"

# Caminho do arquivo de migration
MIGRATION_FILE="src/main/resources/db/migration/V13__seed_super_admin.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}ERRO: Arquivo de migration não encontrado: $MIGRATION_FILE${NC}"
    echo "Execute este script a partir da raiz do projeto."
    exit 1
fi

# Fazer backup
cp "$MIGRATION_FILE" "$MIGRATION_FILE.bak"

# Atualizar o arquivo
sed -i "s/v_cognito_sub VARCHAR(36) := 'PLACEHOLDER_COGNITO_SUB';/v_cognito_sub VARCHAR(36) := '$COGNITO_SUB';/" "$MIGRATION_FILE"
sed -i "s/v_email VARCHAR(255) := 'admin@gastrack.com.br';/v_email VARCHAR(255) := '$EMAIL';/" "$MIGRATION_FILE"
sed -i "s/v_first_name VARCHAR(100) := 'Super';/v_first_name VARCHAR(100) := '$FIRST_NAME';/" "$MIGRATION_FILE"
sed -i "s/v_last_name VARCHAR(100) := 'Admin';/v_last_name VARCHAR(100) := '$LAST_NAME';/" "$MIGRATION_FILE"

echo -e "${GREEN}Migration atualizada!${NC}"

echo ""
echo -e "${YELLOW}Passo 4: Executando migration...${NC}"
read -p "Deseja executar a migration agora? (s/N): " RUN_MIGRATION

if [ "$RUN_MIGRATION" = "s" ] || [ "$RUN_MIGRATION" = "S" ]; then
    echo "Executando: mvn flyway:migrate"
    mvn flyway:migrate -q

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Migration executada com sucesso!${NC}"
    else
        echo -e "${RED}ERRO: Falha ao executar migration.${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}Para executar a migration manualmente:${NC}"
    echo "  mvn flyway:migrate"
fi

echo ""
echo -e "${GREEN}=================================================="
echo "           SUPER_ADMIN CRIADO COM SUCESSO!"
echo "==================================================${NC}"
echo ""
echo -e "${BLUE}Resumo:${NC}"
echo "  Email: $EMAIL"
echo "  Cognito SUB: $COGNITO_SUB"
echo "  Role: SUPER_ADMIN"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. O usuário receberá um email com a senha temporária"
echo "  2. Ao fazer login, será solicitada a troca de senha"
echo "  3. O SUPER_ADMIN estará pronto para criar Companies e convidar usuários"
echo ""
