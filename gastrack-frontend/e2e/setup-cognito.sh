#!/usr/bin/env bash
#
# Sobe um pool Cognito DESCARTÁVEL + os 3 usuários de teste e escreve e2e/.env.e2e
# com tudo que backend e Playwright precisam para a suíte e2e rodar de verdade.
#
# Pré-requisitos: aws cli autenticado (aws sts get-caller-identity), jq.
# Uso:
#   ./e2e/setup-cognito.sh            # cria pool + usuários + .env.e2e
#   ./e2e/setup-cognito.sh --destroy  # apaga o pool criado (lê o id do .env.e2e)
#
# Depois:
#   1) source e2e/.env.e2e
#   2) suba o backend com essas envs (mvn spring-boot:run, profile default) + Postgres
#   3) semeie os 3 usuários na tabela users local com o sub que este script imprime
#   4) bun start  &&  bunx playwright test
#
set -euo pipefail

ENV_FILE="$(dirname "$0")/.env.e2e"
REGION="${AWS_REGION:-us-east-1}"
PASSWORD="Test@123456"

destroy() {
  [ -f "$ENV_FILE" ] || {
    echo "Sem $ENV_FILE; nada a apagar."
    exit 0
  }
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  echo "Apagando pool $AWS_COGNITO_USER_POOL_ID ..."
  aws cognito-idp delete-user-pool --user-pool-id "$AWS_COGNITO_USER_POOL_ID" --region "$REGION"
  rm -f "$ENV_FILE"
  echo "Feito."
}

[ "${1:-}" = "--destroy" ] && {
  destroy
  exit 0
}

command -v jq > /dev/null || {
  echo "Instale jq."
  exit 1
}
aws sts get-caller-identity > /dev/null || {
  echo "aws cli sem credenciais."
  exit 1
}

echo "1/4 Criando user pool..."
POOL=$(aws cognito-idp create-user-pool --pool-name gastrack-e2e \
  --region "$REGION" --query 'UserPool.Id' --output text)

echo "2/4 Criando app client (com secret, USER_PASSWORD_AUTH)..."
CLIENT=$(aws cognito-idp create-user-pool-client --user-pool-id "$POOL" \
  --client-name e2e --generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --region "$REGION" --query 'UserPoolClient.ClientId' --output text)
SECRET=$(aws cognito-idp describe-user-pool-client --user-pool-id "$POOL" \
  --client-id "$CLIENT" --region "$REGION" \
  --query 'UserPoolClient.ClientSecret' --output text)

echo "3/4 Grupos + usuários (senha permanente, confirmados)..."
declare -A USERS=([USER]=e2e.user [ADMIN]=e2e.admin [SUPER_ADMIN]=e2e.superadmin)
SUBS=""
for GROUP in USER ADMIN SUPER_ADMIN; do
  aws cognito-idp create-group --user-pool-id "$POOL" --group-name "$GROUP" --region "$REGION" > /dev/null
  USER="${USERS[$GROUP]}@gastrack.local"
  aws cognito-idp admin-create-user --user-pool-id "$POOL" --username "$USER" \
    --message-action SUPPRESS --region "$REGION" > /dev/null
  aws cognito-idp admin-set-user-password --user-pool-id "$POOL" --username "$USER" \
    --password "$PASSWORD" --permanent --region "$REGION"
  aws cognito-idp admin-add-user-to-group --user-pool-id "$POOL" --username "$USER" \
    --group-name "$GROUP" --region "$REGION"
  SUB=$(aws cognito-idp admin-get-user --user-pool-id "$POOL" --username "$USER" \
    --region "$REGION" --query 'UserAttributes[?Name==`sub`].Value' --output text)
  SUBS="$SUBS\n  $GROUP  $USER  sub=$SUB"
done

echo "4/4 Escrevendo $ENV_FILE ..."
cat > "$ENV_FILE" << EOF
# Gerado por e2e/setup-cognito.sh — pool DESCARTÁVEL, não commitar.
export AWS_COGNITO_REGION=$REGION
export AWS_COGNITO_USER_POOL_ID=$POOL
export AWS_COGNITO_CLIENT_ID=$CLIENT
export AWS_COGNITO_CLIENT_SECRET=$SECRET

export E2E_USER_EMAIL=e2e.user@gastrack.local
export E2E_USER_PASSWORD=$PASSWORD
export E2E_ADMIN_EMAIL=e2e.admin@gastrack.local
export E2E_ADMIN_PASSWORD=$PASSWORD
export E2E_SUPER_ADMIN_EMAIL=e2e.superadmin@gastrack.local
export E2E_SUPER_ADMIN_PASSWORD=$PASSWORD
EOF

echo
echo "OK. Pool: $POOL"
echo "Semeie estes subs na tabela 'users' local (empresa + role):"
echo -e "$SUBS"
echo
echo "Próximos passos:"
echo "  source $ENV_FILE"
echo "  # backend (profile default) com essas envs + Postgres; seed dos users acima"
echo "  bunx playwright install chromium-headless-shell   # 1x"
echo "  bun start & bunx playwright test"
echo
echo "Ao terminar:  ./e2e/setup-cognito.sh --destroy"
