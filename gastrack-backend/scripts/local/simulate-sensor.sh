#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RUNTIME_DIR="${SCRIPT_DIR}/.runtime"
PID_FILE="${RUNTIME_DIR}/simulate-sensor.pid"
LOG_FILE="${RUNTIME_DIR}/simulate-sensor.log"

mkdir -p "$RUNTIME_DIR"

if [[ -f "${BACKEND_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${BACKEND_DIR}/.env"
  set +a
fi

# device/sensor batem com o que a seed cria; sobrescreva se mudou a fixture.
SIM_DEVICE_ID="${SIM_DEVICE_ID:-TESTE-LOCAL-ESP-01}"
SIM_SENSOR_ID="${SIM_SENSOR_ID:-1}"
SIM_PRESSURE_BAR="${SIM_PRESSURE_BAR:-118.5}"
SIM_INTERVAL_SECONDS="${SIM_INTERVAL_SECONDS:-5}"

# Mesmas variáveis que a aplicação usa, para o simulador escrever onde o job lê.
AWS_REGION="${AWS_DYNAMODB_REGION:-${AWS_DEFAULT_REGION:-}}"
AWS_TABLE_NAME="${AWS_DYNAMODB_TABLE_NAME:-}"

require_aws_config() {
  local missing=()

  [[ -n "${AWS_ACCESS_KEY_ID:-}" ]]     || missing+=("AWS_ACCESS_KEY_ID")
  [[ -n "${AWS_SECRET_ACCESS_KEY:-}" ]] || missing+=("AWS_SECRET_ACCESS_KEY")
  [[ -n "$AWS_REGION" ]]                || missing+=("AWS_DYNAMODB_REGION")
  [[ -n "$AWS_TABLE_NAME" ]]            || missing+=("AWS_DYNAMODB_TABLE_NAME")

  if (( ${#missing[@]} > 0 )); then
    echo "Faltando em ${BACKEND_DIR}/.env: ${missing[*]}" >&2
    exit 1
  fi
}

# aws local quando existir; senão o mesmo CLI via docker.
aws_cli() {
  if command -v aws >/dev/null 2>&1; then
    AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
    AWS_DEFAULT_REGION="$AWS_REGION" \
      aws "$@"
  else
    docker run --rm \
      -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
      -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
      -e AWS_DEFAULT_REGION="$AWS_REGION" \
      amazon/aws-cli "$@"
  fi
}

put_once() {
  local timestamp
  timestamp="$(date +%s)"

  # O retorno do aws precisa ser explicito: dentro de "if ! put_once" o set -e
  # fica suspenso na funcao inteira, entao sem este teste a execucao seguia para
  # o printf e a funcao devolvia 0 — registrando "leitura enviada" para um envio
  # que falhou, e escondendo a falha de quem chama.
  if ! aws_cli dynamodb put-item \
    --table-name "${AWS_TABLE_NAME}" \
    --item "{
      \"device_id\": {\"S\":\"${SIM_DEVICE_ID}\"},
      \"sensor_id\": {\"N\":\"${SIM_SENSOR_ID}\"},
      \"timestamp\": {\"N\":\"${timestamp}\"},
      \"Pressao_bar\": {\"N\":\"${SIM_PRESSURE_BAR}\"}
    }" >/dev/null; then
    return 1
  fi

  printf '[%s] leitura enviada: device=%s sensor=%s pressure=%s table=%s\n' \
    "$(date +%FT%T%z)" "${SIM_DEVICE_ID}" "${SIM_SENSOR_ID}" "${SIM_PRESSURE_BAR}" "${AWS_TABLE_NAME}"
}

# Roda em primeiro plano: é o que o processo destacado executa.
run_loop() {
  while true; do
    # Falha de envio é transitória: registra e segue. Sob set -e um put_once que
    # falhava derrubava o loop inteiro — uma queda de conexão de um segundo
    # deixou o simulador morto por quatro dias, sem nada além de uma linha de
    # erro no log. Perder uma leitura é aceitável; perder o simulador não.
    if ! put_once; then
      # stderr: sai sem buffer, entao a falha aparece no log na hora em que
      # acontece, e nao so quando o buffer enche.
      printf '[%s] falha ao enviar; nova tentativa em %ss\n' \
        "$(date +%FT%T%z)" "$SIM_INTERVAL_SECONDS" >&2
    fi
    sleep "$SIM_INTERVAL_SECONDS"
  done
}

start_loop() {
  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Simulador já está rodando com PID $(cat "$PID_FILE")."
    exit 0
  fi

  # nohup + disown, e não um subshell com "&": subshell em background morre com
  # SIGHUP junto da shell que o iniciou. O loop publicava as leituras do primeiro
  # minuto e sumia — o gráfico ficava com dois pontos e nada mais.
  nohup "$0" __loop >>"$LOG_FILE" 2>&1 &
  local pid=$!
  disown "$pid" 2>/dev/null || true
  echo "$pid" >"$PID_FILE"

  # Confirma que sobreviveu ao retorno desta função, senão o "iniciado" mente.
  sleep 1
  if ! kill -0 "$pid" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "Simulador morreu logo após iniciar. Veja $LOG_FILE." >&2
    exit 1
  fi

  echo "Simulador iniciado."
  echo "PID: $pid"
  echo "Log: $LOG_FILE"
  echo "Parar com: ./scripts/local/simulate-sensor.sh stop"
}

stop_loop() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "Simulador não está rodando."
    exit 0
  fi

  local pid
  pid="$(cat "$PID_FILE")"

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "Simulador parado (PID $pid)."
  else
    echo "PID file encontrado, mas o processo não existe mais."
  fi

  rm -f "$PID_FILE"
}

status_loop() {
  echo "Config atual:"
  echo "  device_id: ${SIM_DEVICE_ID}"
  echo "  sensor_id: ${SIM_SENSOR_ID}"
  echo "  pressure:  ${SIM_PRESSURE_BAR}"
  echo "  interval:  ${SIM_INTERVAL_SECONDS}s"
  echo "  region:    ${AWS_REGION}"
  echo "  table:     ${AWS_TABLE_NAME}"

  if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Status: rodando (PID $(cat "$PID_FILE"))"
    echo "Log: $LOG_FILE"
    tail -n 5 "$LOG_FILE" 2>/dev/null || true
    return 0
  fi

  echo "Status: parado"
}

case "${1:-}" in
  __loop)
    # Uso interno: o processo destacado que o start cria.
    require_aws_config
    run_loop
    ;;
  once)
    require_aws_config
    put_once
    ;;
  start)
    require_aws_config
    start_loop
    ;;
  stop)
    stop_loop
    ;;
  status)
    status_loop
    ;;
  *)
    cat >&2 <<'EOF'
Uso:
  ./scripts/local/simulate-sensor.sh once
  ./scripts/local/simulate-sensor.sh start
  ./scripts/local/simulate-sensor.sh stop
  ./scripts/local/simulate-sensor.sh status

Lidas do .env da raiz (obrigatórias):
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_DYNAMODB_REGION
  AWS_DYNAMODB_TABLE_NAME

Sobrescritas opcionais:
  SIM_DEVICE_ID
  SIM_SENSOR_ID
  SIM_PRESSURE_BAR
  SIM_INTERVAL_SECONDS
EOF
    exit 1
    ;;
esac
