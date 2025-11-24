#!/bin/bash

# ===========================================
# PostgreSQL Database Restore Script
# ===========================================

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Usage: ./restore-database.sh <backup-file>"
  echo "Available backups:"
  ls -1 ./backups/postgres/backup_*.sql.gz
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will REPLACE the current database!"
echo "📁 Backup file: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ Restore cancelled"
  exit 1
fi

echo "🔄 Starting database restore..."

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\(.*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/.*:\(.*\)@.*/\1/p')

# Decompress and restore
export PGPASSWORD="$DB_PASS"
gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"

echo "✅ Database restored successfully!"
