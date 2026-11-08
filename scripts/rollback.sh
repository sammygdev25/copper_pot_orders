#!/bin/bash
# ─────────────────────────────────────────────────────────────
# rollback.sh — Safe Rollback to Previous Version
# Usage: ./scripts/rollback.sh [auto|to <tag>]
# ─────────────────────────────────────────────────────────────
set -euo pipefail

COMMAND="${1:-auto}"
TARGET_TAG="${2:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

log() { echo "[rollback] $(date '+%H:%M:%S') $1"; }
error() { echo "[rollback] ERROR: $1" >&2; exit 1; }

# ── Find Previous Version ────────────────────────────────────
get_previous_tag() {
    TAGS=$(git tag --sort=-creatordate | grep '^v[0-9]' | head -2)
    PREVIOUS=$(echo "$TAGS" | tail -1)

    if [[ -z "$PREVIOUS" ]]; then
        error "No previous version tag found - cannot rollback"
    fi

    echo "$PREVIOUS"
}

# ── Restore Database ─────────────────────────────────────────
restore_db() {
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -1)

    if [[ -z "$BACKUP_FILE" ]]; then
        log "No database backup found - skipping DB restore"
        return 0
    fi

    log "Restoring database from: $BACKUP_FILE"

    if [[ -n "${DATABASE_URL:-}" ]]; then
        if [[ "$DATABASE_URL" =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
            PGUSER="${BASH_REMATCH[1]}"
            PGPASSWORD="${BASH_REMATCH[2]}"
            PGHOST="${BASH_REMATCH[3]}"
            PGPORT="${BASH_REMATCH[4]}"
            PGDATABASE="${BASH_REMATCH[5]}"

            PGPASSWORD="$PGPASSWORD" pg_restore \
                -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" \
                -d "$PGDATABASE" \
                --clean --if-exists \
                --no-owner --no-privileges \
                "$BACKUP_FILE" 2>/dev/null || true
        fi
    elif [[ -f "$BACKUP_FILE" ]]; then
        cp "$BACKUP_FILE" backend/db.sqlite3
    fi

    log "Database restored"
}

# ── Rollback Application ─────────────────────────────────────
do_rollback() {
    local TAG="$1"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Rolling back to: $TAG"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 1. Restore database first (before code change)
    restore_db

    # 2. Checkout previous version
    log "Checking out $TAG..."
    git checkout "$TAG" -- .

    # 3. Rebuild and restart
    log "Rebuilding Docker containers..."
    docker compose -f docker-compose.prod.yml build --no-cache
    docker compose -f docker-compose.prod.yml up -d --wait --timeout 120

    # 4. Re-run migrations for the old version
    log "Running migrations for $TAG..."
    docker compose -f docker-compose.prod.yml exec -T app \
        python backend/manage.py migrate --run-syncdb 2>&1 || true

    # 5. Verify rollback
    log "Verifying rollback..."
    chmod +x scripts/healthcheck.sh
    if ./scripts/healthcheck.sh; then
        log "Rollback to $TAG successful"
    else
        error "Rollback to $TAG failed health check - MANUAL INTERVENTION REQUIRED"
    fi

    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Rollback complete: $TAG"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ── Main ─────────────────────────────────────────────────────
case "$COMMAND" in
    auto)
        PREVIOUS=$(get_previous_tag)
        log "Auto-rollback target: $PREVIOUS"
        do_rollback "$PREVIOUS"
        ;;
    to)
        [[ -n "$TARGET_TAG" ]] || error "Usage: $0 to <tag>"
        git tag | grep -q "^${TARGET_TAG}$" || error "Tag '$TARGET_TAG' not found"
        do_rollback "$TARGET_TAG"
        ;;
    *)
        echo "Usage: $0 [auto|to <tag>]"
        echo "  auto        - Rollback to previous deploy version"
        echo "  to <tag>    - Rollback to specific version tag"
        echo ""
        echo "Examples:"
        echo "  $0 auto"
        echo "  $0 to v20240115-abc12345"
        exit 1
        ;;
esac
