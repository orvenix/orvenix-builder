#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/home/orvenix/apps/orvenix-builder}"
ENV_FILE="${ENV_FILE:-${APP_DIR}/.env}"
BACKUP_ROOT="${DB_BACKUP_ROOT:-/srv/orvenix/backups/database/orvenix-database}"
KEEP_BACKUPS="${KEEP_DB_BACKUPS:-30}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[db-backup] ERROR: no existe ${ENV_FILE}" >&2
  exit 1
fi

DATABASE_URL="$(
  node --env-file="$ENV_FILE" -e '
    if (!process.env.DATABASE_URL) process.exit(1)
    process.stdout.write(process.env.DATABASE_URL)
  '
)"

if [[ -z "$DATABASE_URL" ]]; then
  echo "[db-backup] ERROR: DATABASE_URL no está configurada." >&2
  exit 1
fi

readarray -t DB_CONFIG < <(
  DATABASE_URL="$DATABASE_URL" node - <<'NODE'
const url = new URL(process.env.DATABASE_URL)

console.log(url.hostname)
console.log(url.port || "3306")
console.log(decodeURIComponent(url.username))
console.log(decodeURIComponent(url.password))
console.log(url.pathname.replace(/^\//, ""))
NODE
)

DB_HOST="${DB_CONFIG[0]}"
DB_PORT="${DB_CONFIG[1]}"
DB_USER="${DB_CONFIG[2]}"
DB_PASSWORD="${DB_CONFIG[3]}"
DB_NAME="${DB_CONFIG[4]}"

if [[ -z "$DB_NAME" || -z "$DB_USER" ]]; then
  echo "[db-backup] ERROR: DATABASE_URL incompleta." >&2
  exit 1
fi

mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"

BACKUP_FILE="${BACKUP_ROOT}/${DB_NAME}-${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
TEMP_CONFIG="$(mktemp)"

cleanup() {
  rm -f "$TEMP_CONFIG"
}
trap cleanup EXIT

chmod 600 "$TEMP_CONFIG"

cat > "$TEMP_CONFIG" <<CONFIG
[client]
host=${DB_HOST}
port=${DB_PORT}
user=${DB_USER}
password=${DB_PASSWORD}
CONFIG

echo "[db-backup] Respaldando ${DB_NAME}..."

mariadb-dump \
  --defaults-extra-file="$TEMP_CONFIG" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --default-character-set=utf8mb4 \
  --databases "$DB_NAME" \
  | gzip -9 > "$BACKUP_FILE"

chmod 600 "$BACKUP_FILE"

if [[ ! -s "$BACKUP_FILE" ]]; then
  echo "[db-backup] ERROR: el respaldo quedó vacío." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

if ! gzip -t "$BACKUP_FILE"; then
  echo "[db-backup] ERROR: el archivo comprimido está dañado." >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
chmod 600 "$CHECKSUM_FILE"

mapfile -t OLD_BACKUPS < <(
  find "$BACKUP_ROOT" \
    -maxdepth 1 \
    -type f \
    -name "${DB_NAME}-*.sql.gz" \
    -printf '%T@ %p\n' \
    | sort -nr \
    | tail -n "+$((KEEP_BACKUPS + 1))" \
    | cut -d' ' -f2-
)

for old_backup in "${OLD_BACKUPS[@]:-}"; do
  [[ -n "$old_backup" ]] || continue

  echo "[db-backup] Eliminando respaldo antiguo: ${old_backup}"
  rm -f -- "$old_backup" "${old_backup}.sha256"
done

echo "[db-backup] Respaldo completado:"
echo "  Archivo: ${BACKUP_FILE}"
echo "  Tamaño: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "  SHA-256: $(cut -d' ' -f1 "$CHECKSUM_FILE")"
