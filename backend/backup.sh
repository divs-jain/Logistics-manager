#!/bin/bash

# Configuration
BACKUP_DIR="/Users/dibyanshujain/Desktop/inventory/backend/backups"
DB_NAME="logistics_db"
DB_USER="root"
# Leave blank if no password
DB_PASS=""
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
if [ -z "$DB_PASS" ]; then
    mysqldump -u "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/backup_$DATE.sql"
else
    mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_DIR/backup_$DATE.sql"
fi

# Keep only the last 10 backups (works on Mac and Linux)
cd "$BACKUP_DIR" || exit
ls -t backup_*.sql | tail -n +11 | xargs -I {} rm -f "{}" 2>/dev/null

echo "Backup completed: backup_$DATE.sql"
