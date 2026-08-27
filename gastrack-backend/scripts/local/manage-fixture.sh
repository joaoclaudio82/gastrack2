#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SEED_FILE="${SCRIPT_DIR}/R__local_fixture.sql"
CLEANUP_FILE="${SCRIPT_DIR}/cleanup.sql"

cd "$BACKEND_DIR"

# Alvo remoto: comando ssh completo, no mesmo formato do skill de deploy.
#   FIXTURE_SSH='ssh -i /caminho/chave.pem ubuntu@1.2.3.4'
# Vazio = banco local. Chave e IP ficam no ambiente, nunca no repositório.
FIXTURE_SSH="${FIXTURE_SSH:-}"

# .env da raiz manda na config do alvo local. Num alvo remoto ele é ignorado de
# propósito: apontar um banco remoto com o nome do banco da sua máquina é o tipo
# de engano que só aparece depois do write.
if [[ -f .env && -z "$FIXTURE_SSH" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Único ponto onde o docker é chamado; local ou por ssh, mesmo comando.
# printf %q preserva os argumentos ao atravessar a shell do outro lado.
docker_cmd() {
  if [[ -n "$FIXTURE_SSH" ]]; then
    $FIXTURE_SSH "docker $(printf '%q ' "$@")"
  else
    docker "$@"
  fi
}

# COMPOSE_FILE é lido nativamente pelo docker compose; quem usa outro compose
# (docker-compose.dev.yml, docker-compose.yml) só exporta a variável.
export COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.db.yml}"
PG_SERVICE="${PG_SERVICE:-postgres}"

resolve_container() {
  local container

  if [[ -n "$FIXTURE_SSH" ]]; then
    # Do lado de lá não há compose file para consultar: resolve pelo nome.
    container="$(docker_cmd ps -q --filter "name=^${FIXTURE_CONTAINER:-postgres}\$" | tr -d '\r')"
  else
    container="$(docker compose ps -q "$PG_SERVICE" 2>/dev/null || true)"
  fi

  if [[ -z "$container" ]]; then
    if [[ -n "$FIXTURE_SSH" ]]; then
      echo "Container '${FIXTURE_CONTAINER:-postgres}' não encontrado no alvo remoto." >&2
      echo "Nome diferente lá? Exporte FIXTURE_CONTAINER=<nome>." >&2
    else
      echo "Serviço '${PG_SERVICE}' não está de pé em ${COMPOSE_FILE}." >&2
      echo "Suba com: docker compose -f ${COMPOSE_FILE} up -d" >&2
      echo "Usando outro compose? Exporte COMPOSE_FILE=<arquivo>." >&2
    fi
    exit 1
  fi

  echo "$container"
}

# O container é a fonte da verdade; .env só entra quando define o valor.
resolve_db_name() {
  if [[ -n "${POSTGRES_DB_NAME:-}" ]]; then
    echo "$POSTGRES_DB_NAME"
  else
    docker_cmd exec "$1" printenv POSTGRES_DB | tr -d '\r'
  fi
}

resolve_db_user() {
  if [[ -n "${POSTGRES_USER:-}" ]]; then
    echo "$POSTGRES_USER"
  else
    docker_cmd exec "$1" printenv POSTGRES_USER | tr -d '\r'
  fi
}

# SQL sempre por stdin: atravessa o ssh sem passar por aspas de duas shells.
psql_stdin() {
  docker_cmd exec -i "$1" psql -v ON_ERROR_STOP=1 -U "$3" -d "$2"
}

# FIXTURE_COMPANY_SLUG escolhe onde pendurar a fixture. Vazio = a empresa de
# teste da própria fixture, que não existe no Cognito — ou seja, não dá para
# logar com ela em produção.
run_sql_file() {
  {
    if [[ -n "${FIXTURE_COMPANY_SLUG:-}" ]]; then
      printf "SET gastrack.fixture_company_slug = '%s';\n" "$FIXTURE_COMPANY_SLUG"
    fi
    cat "$4"
  } | psql_stdin "$1" "$2" "$3" || {
    echo >&2
    echo "Erro de coluna/tabela acima costuma ser migration atrasada neste banco." >&2
    echo "Suba a aplicação (mvn spring-boot:run) para o Flyway migrar e rode de novo." >&2
    exit 1
  }
}

status_fixture() {
  psql_stdin "$1" "$2" "$3" <<'SQL'
select location, current_pressure_bar, full_tank_pressure_bar, internal_volume_liters
from gas_points
where location like 'TESTE-LOCAL-%'
order by location;
SQL
}

# Escrita em alvo remoto não sai sem alguém digitar o nome do banco.
confirm_remote() {
  [[ -n "$FIXTURE_SSH" ]] || return 0
  [[ "${FIXTURE_YES:-}" == "1" ]] && return 0

  local typed
  echo
  echo "ALVO REMOTO — '$1' vai escrever fora da sua máquina."
  echo "  ssh:     ${FIXTURE_SSH}"
  echo "  banco:   ${3} (container ${2})"
  echo "  empresa: ${FIXTURE_COMPANY_SLUG:-teste-local-empresa (criada pela fixture)}"
  # Sem tty (cron, pipe) o read falha: cai em cancelado, que é o lado certo de errar.
  read -r -p "Digite o nome do banco para confirmar: " typed || typed=""

  if [[ "$typed" != "$3" ]]; then
    echo "Cancelado." >&2
    exit 1
  fi
}

action="${1:-}"

case "$action" in
  apply|cleanup|status) ;;
  *)
    cat >&2 <<EOF
Uso:
  ./scripts/local/manage-fixture.sh apply
  ./scripts/local/manage-fixture.sh cleanup
  ./scripts/local/manage-fixture.sh status

Alvo local (default; lê o .env da raiz):
  COMPOSE_FILE      compose onde o Postgres roda (default: docker-compose.db.yml)
  PG_SERVICE        nome do serviço no compose (default: postgres)
  POSTGRES_DB_NAME  banco (default: o do container)
  POSTGRES_USER     usuário (default: o do container)

Alvo remoto (o .env da raiz passa a ser ignorado):
  FIXTURE_SSH       comando ssh completo, ex:
                    'ssh -i /caminho/chave.pem ubuntu@1.2.3.4'
  FIXTURE_CONTAINER nome do container lá (default: postgres)
  FIXTURE_YES=1     pula a confirmação (para uso não interativo)

Onde pendurar a fixture (vale nos dois alvos):
  FIXTURE_COMPANY_SLUG  slug de uma empresa que já existe. Sem isso a fixture
                        cria a própria empresa de teste, cujo usuário não
                        existe no Cognito e não serve para logar em produção.
EOF
    exit 1
    ;;
esac

container="$(resolve_container)"
db_name="$(resolve_db_name "$container")"
db_user="$(resolve_db_user "$container")"

case "$action" in
  apply|cleanup) confirm_remote "$action" "$container" "$db_name" ;;
esac

case "$action" in
  apply)
    echo "Aplicando fixture em container=$container db=$db_name"
    run_sql_file "$container" "$db_name" "$db_user" "$SEED_FILE"
    echo
    status_fixture "$container" "$db_name" "$db_user"
    ;;
  cleanup)
    echo "Removendo fixture em container=$container db=$db_name"
    run_sql_file "$container" "$db_name" "$db_user" "$CLEANUP_FILE"
    ;;
  status)
    status_fixture "$container" "$db_name" "$db_user"
    ;;
esac
