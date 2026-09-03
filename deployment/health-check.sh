#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
HEALTH_URL="${APP_URL%/}/api/health"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-20}"
WAIT_SECONDS="${WAIT_SECONDS:-2}"

echo "[health] Comprobando ${HEALTH_URL}"

for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  response_file="$(mktemp)"
  http_code="$(
    curl \
      --silent \
      --show-error \
      --max-time 10 \
      --output "$response_file" \
      --write-out "%{http_code}" \
      "$HEALTH_URL" 2>/dev/null || true
  )"

  if [[ "$http_code" == "200" ]]; then
    if grep -Eq '"status"[[:space:]]*:[[:space:]]*"(operational|degraded)"' "$response_file"; then
      echo "[health] Orvenix responde correctamente (${http_code})."
      cat "$response_file"
      echo
      rm -f "$response_file"
      exit 0
    fi

    echo "[health] Respuesta 200, pero el estado no es operational/degraded."
    cat "$response_file"
    echo
  else
    echo "[health] Intento ${attempt}/${MAX_ATTEMPTS}: HTTP ${http_code:-sin respuesta}"
  fi

  rm -f "$response_file"

  if [[ "$attempt" -lt "$MAX_ATTEMPTS" ]]; then
    sleep "$WAIT_SECONDS"
  fi
done

echo "[health] ERROR: Orvenix no superó la comprobación de salud." >&2
exit 1
