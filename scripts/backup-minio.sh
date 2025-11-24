#!/bin/bash

# ===========================================
# MinIO Storage Backup Script
# ===========================================

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="./backups/minio"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/minio_backup_${TIMESTAMP}.tar.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting MinIO backup..."

# Determine MinIO data directory
if [ -d "minio_data" ]; then
  MINIO_DATA_DIR="minio_data"
elif [ -d "/data" ]; then
  MINIO_DATA_DIR="/data"
else
  echo "❌ MinIO data directory not found"
  exit 1
fi

# Create backup archive
tar -czf "$BACKUP_FILE" -C "$MINIO_DATA_DIR" .

echo "✅ Backup created: $BACKUP_FILE"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📦 Backup size: $BACKUP_SIZE"

# Clean up old backups
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "minio_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/minio_backup_*.tar.gz 2>/dev/null | wc -l)
echo "📊 Total backups: $BACKUP_COUNT"

echo "✅ MinIO backup completed successfully!"
