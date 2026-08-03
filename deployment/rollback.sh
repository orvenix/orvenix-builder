#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/orvenix/apps/orvenix-builder}"
BACKUP_ROOT="${BACKUP_ROOT:-/srv/orvenix/backups/application/orvenix-builder}"
SERVICE_NAME="${SERVICE_NAME:-orvenix-builder}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

requested_backup="${1:-latest}"

if [[ "$requested_backup" == "latest" ]]; then
  BACKUP_DIR="$(
    find "$BACKUP_ROOT" \
      -mindepth 1 \
      -maxdepth 1 \
      -type d \
      | sort \
      | tail -1
  )"
elif [[ "$requested_backup" = /* ]]; then
  BACKUP_DIR="$requested_backup"
else
  BACKUP_DIR="${BACKUP_ROOT}/${requested_backup}"
fi

if [[ -z "${BACKUP_DIR:-}" || ! -d "$BACKUP_DIR" ]]; then
  echo "[rollback] ERROR: no se encontró el respaldo solicitado." >&2
  echo "[rollback] Disponibles:" >&2
  find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '  %f\n' | sort -r >&2 || true
  exit 1
fi

if [[ ! -d "$BACKUP_DIR/app" ]]; then
  echo "[rollback] ERROR: el respaldo no contiene app/." >&2
  exit 1
fi

if [[ ! -f "$BACKUP_DIR/next-build/BUILD_ID" ]]; then
  echo "[rollback] ERROR: el respaldo no contiene un build de Next.js utilizable." >&2
  echo "[rollback] Selecciona un respaldo creado después de habilitar next-build/." >&2
  exit 1
fi

echo "[rollback] Respaldo seleccionado: $BACKUP_DIR"

if [[ -f "$BACKUP_DIR/backup-info.txt" ]]; then
  echo "[rollback] Información del respaldo:"
  sed 's/^/  /' "$BACKUP_DIR/backup-info.txt"
fi

read -r -p "¿Restaurar este respaldo? Escribe RESTAURAR para continuar: " confirmation

if [[ "$confirmation" != "RESTAURAR" ]]; then
  echo "[rollback] Operación cancelada."
  exit 0
fi

echo "[rollback] Deteniendo $SERVICE_NAME..."
sudo systemctl stop "$SERVICE_NAME"

rollback_failed=0

echo "[rollback] Restaurando código..."
if ! rsync -a --delete \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.git/' \
  --exclude='.next/' \
  --exclude='node_modules/' \
  --exclude='.tmp/' \
  --exclude='deployment/releases/' \
  "$BACKUP_DIR/app/" "$APP_DIR/"; then
  rollback_failed=1
fi

if [[ "$rollback_failed" -eq 0 ]]; then
  echo "[rollback] Restaurando build de Next.js..."
  rm -rf "$APP_DIR/.next"

  if ! mkdir -p "$APP_DIR/.next"; then
    rollback_failed=1
  elif ! rsync -a "$BACKUP_DIR/next-build/" "$APP_DIR/.next/"; then
    rollback_failed=1
  fi
fi

if [[ "$rollback_failed" -ne 0 ]]; then
  echo "[rollback] ERROR: no se pudo restaurar completamente el respaldo." >&2
  echo "[rollback] Intentando volver a iniciar el servicio para facilitar el diagnóstico..." >&2
  sudo systemctl start "$SERVICE_NAME" || true
  exit 1
fi

echo "[rollback] Ajustando permisos..."
chown -R "$(id -un):$(id -gn)" "$APP_DIR/.next"

echo "[rollback] Iniciando $SERVICE_NAME..."
sudo systemctl start "$SERVICE_NAME"

echo "[rollback] Verificando servicio..."
if ! sudo systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "[rollback] ERROR: systemd no pudo iniciar el servicio." >&2
  sudo systemctl status "$SERVICE_NAME" --no-pager || true
  sudo journalctl -u "$SERVICE_NAME" -n 100 --no-pager || true
  exit 1
fi

echo "[rollback] Ejecutando health check..."
if ! "$SCRIPT_DIR/health-check.sh"; then
  echo "[rollback] ERROR: la versión restaurada no superó el health check." >&2
  sudo systemctl status "$SERVICE_NAME" --no-pager || true
  sudo journalctl -u "$SERVICE_NAME" -n 120 --no-pager || true
  exit 1
fi

echo "[rollback] Restauración completada correctamente."
echo "[rollback] Versión activa: $(cat "$APP_DIR/.next/BUILD_ID")"
