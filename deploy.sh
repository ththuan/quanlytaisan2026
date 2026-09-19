#!/bin/bash
# Manual deploy on the Debian home server: pull latest from GitHub and rebuild Docker containers.
# Usage: ./deploy.sh   (run after `chmod +x deploy.sh` once, whenever you want to update)

REPO_PATH="/root/quanlytaisan2026"
cd "$REPO_PATH" || { echo "ERROR: repo path not found: $REPO_PATH"; exit 1; }

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking for updates..."
git fetch origin main

LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] No changes. Nothing to deploy."
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] New changes detected! Deploying..."

git pull origin main
if [ $? -ne 0 ]; then
    echo "ERROR: Git pull failed!"
    exit 1
fi

docker compose -f docker-compose.prod.yml up -d --build backend frontend
if [ $? -ne 0 ]; then
    echo "ERROR: Docker compose failed!"
    exit 1
fi

docker image prune -f

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy complete!"
