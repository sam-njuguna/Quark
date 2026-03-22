#!/usr/bin/env bash
# Quark database backup script
# Usage: ./scripts/backup.sh
# Requires: pg_dump, AWS CLI (optional for S3 upload)

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${BACKUP_DIR}/quark_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting database backup at $TIMESTAMP"

pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

echo "[backup] Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Optional: upload to S3
if [[ -n "${S3_BACKUP_BUCKET:-}" ]]; then
  aws s3 cp "$BACKUP_FILE" "s3://${S3_BACKUP_BUCKET}/quark/$(basename "$BACKUP_FILE")"
  echo "[backup] Uploaded to s3://${S3_BACKUP_BUCKET}/quark/$(basename "$BACKUP_FILE")"
fi

# Prune old local backups
find "$BACKUP_DIR" -name "quark_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[backup] Pruned backups older than ${RETENTION_DAYS} days"

echo "[backup] Done"
