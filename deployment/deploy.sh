#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/orvenix/apps/orvenix-builder}"
SERVICE_NAME="${SERVICE_NAME:-orvenix-builder}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-/srv/orvenix/backups/application/orvenix-builder}"

cd "$APP_DIR"

echo "[deploy] Iniciando despliegue de Orvenix..."
echo "[deploy] Directorio: $APP_DIR"

echo "[deploy] Validando sintaxis de scripts..."
bash -n "$SCRIPT_DIR/health-check.sh"
bash -n "$SCRIPT_DIR/backup.sh"
bash -n "$SCRIPT_DIR/rollback.sh"

echo "[deploy] Ejecutando lint..."
npm run lint

if npm run | grep -qE '^[[:space:]]+typecheck'; then
  echo "[deploy] Ejecutando typecheck..."
  npm run typecheck
fi

echo "[deploy] Creando respaldo de la versión activa..."
"$SCRIPT_DIR/backup.sh"

LATEST_BACKUP="$(
  find "$BACKUP_ROOT" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    | sort \
    | tail -1
)"

if [[ -z "${LATEST_BACKUP:-}" || ! -f "$LATEST_BACKUP/next-build/BUILD_ID" ]]; then
  echo "[deploy] ERROR: no se creó un respaldo utilizable antes del despliegue." >&2
  exit 1
fi

echo "[deploy] Respaldo de seguridad: $LATEST_BACKUP"

echo "[deploy] Deteniendo $SERVICE_NAME..."
sudo systemctl stop "$SERVICE_NAME"

deploy_failed=0

echo "[deploy] Eliminando build anterior..."
rm -rf "$APP_DIR/.next"

echo "[deploy] Construyendo nueva versión..."
if ! npm run build; then
  deploy_failed=1
fi

if [[ "$deploy_failed" -ne 0 ]]; then
  echo "[deploy] ERROR: la compilación falló." >&2
  echo "[deploy] Restaurando automáticamente la versión anterior..." >&2

  mkdir -p "$APP_DIR/.next"
  rsync -a "$LATEST_BACKUP/next-build/" "$APP_DIR/.next/"

  sudo systemctl start "$SERVICE_NAME" || true

  if "$SCRIPT_DIR/health-check.sh"; then
    echo "[deploy] La versión anterior fue restaurada correctamente."
  else
    echo "[deploy] ERROR CRÍTICO: tampoco respondió la versión restaurada." >&2
    sudo systemctl status "$SERVICE_NAME" --no-pager || true
    sudo journalctl -u "$SERVICE_NAME" -n 120 --no-pager || true
  fi

  exit 1
fi

if [[ ! -f "$APP_DIR/.next/BUILD_ID" ]]; then
  echo "[deploy] ERROR: Next.js no generó .next/BUILD_ID." >&2
  deploy_failed=1
fi

if [[ "$deploy_failed" -eq 0 ]]; then
  echo "[deploy] Iniciando $SERVICE_NAME..."
  if ! sudo systemctl start "$SERVICE_NAME"; then
    deploy_failed=1
  fi
fi

if [[ "$deploy_failed" -eq 0 ]]; then
  echo "[deploy] Verificando systemd..."
  if ! sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    deploy_failed=1
  fi
fi

if [[ "$deploy_failed" -eq 0 ]]; then
  echo "[deploy] Ejecutando health check..."
  if ! "$SCRIPT_DIR/health-check.sh"; then
    deploy_failed=1
  fi
fi

if [[ "$deploy_failed" -ne 0 ]]; then
  echo "[deploy] ERROR: la nueva versión no quedó saludable." >&2
  echo "[deploy] Restaurando automáticamente el build anterior..." >&2

  sudo systemctl stop "$SERVICE_NAME" || true
  rm -rf "$APP_DIR/.next"
  mkdir -p "$APP_DIR/.next"
  rsync -a "$LATEST_BACKUP/next-build/" "$APP_DIR/.next/"
  sudo systemctl start "$SERVICE_NAME"

  if "$SCRIPT_DIR/health-check.sh"; then
    echo "[deploy] Rollback automático completado."
  else
    echo "[deploy] ERROR CRÍTICO: el rollback automático no superó el health check." >&2
    sudo systemctl status "$SERVICE_NAME" --no-pager || true
    sudo journalctl -u "$SERVICE_NAME" -n 120 --no-pager || true
  fi

  exit 1
fi

echo "[deploy] Despliegue completado correctamente."
echo "[deploy] BUILD_ID activo: $(cat "$APP_DIR/.next/BUILD_ID")"
echo "[deploy] Respaldo anterior: $LATEST_BACKUP"
