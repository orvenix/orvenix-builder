#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/orvenix/apps/orvenix-builder}"
BACKUP_ROOT="${BACKUP_ROOT:-/srv/orvenix/backups/application/orvenix-builder}"
KEEP_BACKUPS="${KEEP_BACKUPS:-10}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"

echo "[backup] Preparando respaldo en ${BACKUP_DIR}"

mkdir -p "$BACKUP_DIR"

rsync -a \
  --delete \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.git/' \
  --exclude='.next/' \
  --exclude='node_modules/' \
  --exclude='.tmp/' \
  --exclude='deployment/releases/' \
  --exclude='*.log' \
  "${APP_DIR}/" "${BACKUP_DIR}/app/"

if [[ -d "${APP_DIR}/.next" ]]; then
  echo "[backup] Guardando build activo de Next.js..."
  rsync -a     --exclude='cache/'     "${APP_DIR}/.next/" "${BACKUP_DIR}/next-build/"
fi

if [[ -f /etc/systemd/system/orvenix-builder.service ]]; then
  cp /etc/systemd/system/orvenix-builder.service "${BACKUP_DIR}/orvenix-builder.service"
fi

cat > "${BACKUP_DIR}/backup-info.txt" <<INFO
created_at=${TIMESTAMP}
source=${APP_DIR}
hostname=$(hostname)
git_commit=$(cd "$APP_DIR" && git rev-parse HEAD 2>/dev/null || echo "unknown")
git_branch=$(cd "$APP_DIR" && git branch --show-current 2>/dev/null || echo "unknown")
INFO

echo "[backup] Respaldo creado correctamente."

mapfile -t OLD_BACKUPS < <(
  find "$BACKUP_ROOT" \
    -mindepth 1 \
    -maxdepth 1 \
    -type d \
    -printf '%T@ %p\n' \
    | sort -nr \
    | tail -n "+$((KEEP_BACKUPS + 1))" \
    | cut -d' ' -f2-
)

for old_backup in "${OLD_BACKUPS[@]:-}"; do
  [[ -n "$old_backup" ]] || continue
  echo "[backup] Eliminando respaldo antiguo: ${old_backup}"
  rm -rf -- "$old_backup"
done

echo "[backup] Respaldos disponibles:"
find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort -r
