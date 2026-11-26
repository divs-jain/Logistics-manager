#!/bin/bash

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Read DB credentials from backend/.env (same values the server uses)
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    . "$SCRIPT_DIR/.env"
    set +a
fi
DB_NAME="${DB_NAME:-logistics_db}"
DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-localhost}"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup (password passed via env var so it isn't visible in `ps`)
if ! MYSQL_PWD="$DB_PASSWORD" mysqldump -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    rm -f "$BACKUP_FILE"
    echo "Backup failed" >&2
    exit 1
fi

# Keep only the last 10 backups (works on Mac and Linux)
cd "$BACKUP_DIR" || exit
ls -t backup_*.sql | tail -n +11 | xargs -I {} rm -f "{}" 2>/dev/null

echo "Backup completed: backup_$DATE.sql"
