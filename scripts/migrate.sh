#!/bin/bash
# ─────────────────────────────────────────────────────────────
# migrate.sh — Safe Database Migration
# Usage: ./scripts/migrate.sh [backup|check|apply]
# ─────────────────────────────────────────────────────────────
set -euo pipefail

COMMAND="${1:-apply}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log() { echo "[migrate] $(date '+%H:%M:%S') $1"; }
error() { echo "[migrate] ERROR: $1" >&2; exit 1; }

# ── Database Backup ──────────────────────────────────────────
do_backup() {
    log "Creating database backup..."
    mkdir -p "$BACKUP_DIR"

    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

    if [[ -n "${DATABASE_URL:-}" ]]; then
        # Parse DATABASE_URL: postgres://user:pass@host:port/dbname
        if [[ "$DATABASE_URL" =~ postgres://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
            PGUSER="${BASH_REMATCH[1]}"
            PGPASSWORD="${BASH_REMATCH[2]}"
            PGHOST="${BASH_REMATCH[3]}"
            PGPORT="${BASH_REMATCH[4]}"
            PGDATABASE="${BASH_REMATCH[5]}"

            PGPASSWORD="$PGPASSWORD" pg_dump \
                -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" \
                -d "$PGDATABASE" \
                --format=custom \
                --no-owner \
                --no-privileges \
                -f "$BACKUP_FILE"
        else
            error "Cannot parse DATABASE_URL"
        fi
    elif [[ -f "backend/db.sqlite3" ]]; then
        cp backend/db.sqlite3 "$BACKUP_FILE"
    else
        log "No database found to backup - skipping"
        return 0
    fi

    log "Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

    # Retain only last 10 backups
    ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    log "Backup complete"
}

# ── Migration Safety Check ───────────────────────────────────
do_check() {
    log "Checking migration safety..."

    # Show pending migrations
    cd backend
    PENDING=$(python manage.py showmigrations --plan 2>/dev/null | grep "\[ \]" | wc -l)
    cd ..

    if [[ "$PENDING" -eq 0 ]]; then
        log "No pending migrations"
        return 0
    fi

    log "Pending migrations: $PENDING"

    # Generate SQL for pending migrations to check for destructive ops
    MIGRATION_SQL=$(cd backend && python manage.py sqlmigrate api 0001 2>/dev/null || echo "")

    if [[ -z "$MIGRATION_SQL" ]]; then
        log "Could not generate migration SQL for analysis - proceeding with caution"
        return 0
    fi

    # Detect destructive operations
    HAS_DESTRUCTIVE=false
    for pattern in "DROP TABLE" "DROP COLUMN" "ALTER.*DROP" "RENAME TABLE" "TRUNCATE" "DELETE FROM"; do
        if echo "$MIGRATION_SQL" | grep -iqE "$pattern"; then
            log "WARNING: Found '$pattern' in pending migrations"
            HAS_DESTRUCTIVE=true
        fi
    done

    if [[ "$HAS_DESTRUCTIVE" == "true" ]]; then
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log "WARNING: DESTRUCTIVE MIGRATIONS DETECTED"
        log "A database backup will be created before applying."
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        if [[ "${CI:-}" != "true" ]]; then
            read -rp "Continue with migration? [y/N] " confirm
            [[ "$confirm" =~ ^[Yy] ]] || error "Migration aborted by user"
        fi
    else
        log "No destructive operations detected"
    fi
}

# ── Apply Migrations ─────────────────────────────────────────
do_apply() {
    log "Applying migrations..."
    cd backend

    if python manage.py migrate --run-syncdb 2>&1 | tee /tmp/migrate_output.txt; then
        log "Migrations applied successfully"
    else
        MIGRATE_EXIT=$?
        log "Migration failed (exit code: $MIGRATE_EXIT)"
        cat /tmp/migrate_output.txt
        error "Migration failed - database may need manual intervention"
    fi

    cd ..
}

# ── Main ─────────────────────────────────────────────────────
case "$COMMAND" in
    backup)  do_backup ;;
    check)   do_check ;;
    apply)
        do_backup
        do_check
        do_apply
        ;;
    *)
        echo "Usage: $0 [backup|check|apply]"
        echo "  backup  - Create database backup"
        echo "  check   - Check for destructive migrations"
        echo "  apply   - Backup + check + apply migrations"
        exit 1
        ;;
esac
