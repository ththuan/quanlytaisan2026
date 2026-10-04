#!/bin/bash
# Auto-deploy trên server Debian: pull code mới nhất từ GitHub rồi rebuild container.
# Được gọi tự động bởi GitHub Actions (self-hosted runner) khi có push lên main,
# hoặc chạy thủ công: ./deploy.sh
#
# GitHub là nguồn duy nhất (source of truth). Server chỉ pull, không chỉnh sửa code.
# Các file quan trọng (.env, nginx/ssl/, storage/, backups) nằm ngoài git nên được giữ nguyên.

set -euo pipefail

REPO_PATH="${REPO_PATH:-/root/quanlytaisan2026}"
COMPOSE_FILE="docker-compose.prod.yml"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if [ ! -d "$REPO_PATH/.git" ]; then
    log "ERROR: repo not found: $REPO_PATH"
    exit 1
fi

cd "$REPO_PATH"

log "Fetching updates from GitHub..."
git fetch origin main

LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    log "No changes. Nothing to deploy."
    exit 0
fi

log "New changes detected (${LOCAL_COMMIT:0:7} -> ${REMOTE_COMMIT:0:7}). Deploying..."

# Dùng reset --hard để tránh lỗi merge conflict; .env/nginx/ssl/storage là untracked nên không bị ảnh hưởng.
git reset --hard origin/main

log "Rebuilding backend + frontend..."
docker compose -f "$COMPOSE_FILE" up -d --build backend frontend

log "Waiting for backend to become healthy..."
for i in $(seq 1 30); do
    if docker compose -f "$COMPOSE_FILE" exec -T backend node -e "require('http').get('http://127.0.0.1:5000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" >/dev/null 2>&1; then
        log "Backend is healthy."
        break
    fi
    if [ "$i" -eq 30 ]; then
        log "WARNING: backend not healthy after 150s. Check: docker compose -f $COMPOSE_FILE logs backend"
    fi
    sleep 5
done

# Quan trọng: backend vừa được tạo lại => IP nội bộ đổi. Restart nginx để nó re-resolve
# DNS backend, tránh lỗi 502 (nginx giữ IP backend cũ trong bộ nhớ khi dùng upstream keepalive).
log "Restarting nginx to refresh backend IP..."
docker compose -f "$COMPOSE_FILE" restart nginx

docker image prune -f

log "Deploy complete!"
