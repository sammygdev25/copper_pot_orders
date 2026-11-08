#!/bin/bash
# ─────────────────────────────────────────────────────────────
# healthcheck.sh — Post-Deploy Health Verification
# Usage: ./scripts/healthcheck.sh
# Env:   HEALTH_URL, MAX_RETRIES, RETRY_INTERVAL
# ─────────────────────────────────────────────────────────────
set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://localhost:8000/health/}"
API_URL="${API_URL:-http://localhost:8000/api/}"
AUTH_URL="${AUTH_URL:-http://localhost:8000/api/auth/login/}"
MAX_RETRIES="${MAX_RETRIES:-10}"
RETRY_INTERVAL="${RETRY_INTERVAL:-5}"
CHECKS_PASSED=0
CHECKS_TOTAL=3

log() { echo "[health] $(date '+%H:%M:%S') $1"; }

# ── Check 1: Health Endpoint ─────────────────────────────────
check_health() {
    log "Checking health endpoint: $HEALTH_URL"
    for i in $(seq 1 "$MAX_RETRIES"); do
        HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
        if [[ "$HTTP_CODE" == "200" ]]; then
            log "Health endpoint: OK (attempt $i)"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
            return 0
        fi
        log "Waiting... ($i/$MAX_RETRIES, got HTTP $HTTP_CODE)"
        sleep "$RETRY_INTERVAL"
    done
    log "Health endpoint: FAILED after $MAX_RETRIES attempts"
    return 1
}

# ── Check 2: API Endpoint ────────────────────────────────────
check_api() {
    log "Checking API endpoint: $API_URL"
    HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$API_URL" 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" =~ ^(200|301|302|401|403)$ ]]; then
        log "API endpoint: OK (HTTP $HTTP_CODE)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        return 0
    fi
    log "API endpoint: FAILED (HTTP $HTTP_CODE)"
    return 1
}

# ── Check 3: Auth Endpoint ───────────────────────────────────
check_auth() {
    log "Checking auth endpoint: $AUTH_URL"
    HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
        -X POST "$AUTH_URL" \
        -H "Content-Type: application/json" \
        -d '{"username":"healthcheck","password":"invalid"}' \
        2>/dev/null || echo "000")
    # 400 or 401 means the endpoint is responding correctly
    if [[ "$HTTP_CODE" =~ ^(400|401|403)$ ]]; then
        log "Auth endpoint: OK (HTTP $HTTP_CODE - correctly rejects bad creds)"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        return 0
    fi
    log "Auth endpoint: FAILED (HTTP $HTTP_CODE)"
    return 1
}

# ── Main ─────────────────────────────────────────────────────
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Post-Deploy Health Check"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_health || true
check_api || true
check_auth || true

log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Results: $CHECKS_PASSED/$CHECKS_TOTAL checks passed"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$CHECKS_PASSED" -lt 2 ]]; then
    log "DEPLOY UNHEALTHY - less than 2/3 checks passed"
    exit 1
fi

log "Deploy is healthy"
exit 0
