#!/bin/bash

# ===========================================
# PostgreSQL Database Backup Script
# ===========================================

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="./backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting PostgreSQL backup..."

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\(.*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/.*:\(.*\)@.*/\1/p')

# Perform backup
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Backup created: $BACKUP_FILE"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📦 Backup size: $BACKUP_SIZE"

# Clean up old backups
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
echo "📊 Total backups: $BACKUP_COUNT"

echo "✅ Database backup completed successfully!"
