#!/bin/bash
# Cài GitHub Actions self-hosted runner trên server Debian.
# Runner tự kết nối RA ngoài tới GitHub => không cần mở cổng vào (phù hợp với Cloudflare Tunnel).
#
# Cách dùng:
#   1. GitHub repo -> Settings -> Actions -> Runners -> "New self-hosted runner"
#      -> chọn Linux x64 -> copy giá trị TOKEN (dòng ./config.sh --url ... --token <TOKEN>)
#   2. Chạy:  RUNNER_TOKEN=<TOKEN> bash scripts/setup-github-runner.sh
#      (biến môi trường tuỳ chọn: GITHUB_REPOSITORY, RUNNER_NAME, RUNNER_WORKDIR)

set -euo pipefail

GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-ththuan/quanlytaisan2026}"
RUNNER_TOKEN="${RUNNER_TOKEN:-}"
RUNNER_NAME="${RUNNER_NAME:-$(hostname)}"
RUNNER_WORKDIR="${RUNNER_WORKDIR:-/root/actions-runner}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

if [ -z "$RUNNER_TOKEN" ]; then
    echo "Thiếu RUNNER_TOKEN."
    echo "Vào GitHub repo -> Settings -> Actions -> Runners -> New self-hosted runner (Linux x64) để lấy token."
    echo "Sau đó chạy lại: RUNNER_TOKEN=<TOKEN> bash scripts/setup-github-runner.sh"
    exit 1
fi

command -v curl >/dev/null 2>&1 || { apt-get update; apt-get install -y curl; }

log "Lấy phiên bản runner mới nhất..."
LATEST_TAG=$(curl -sSf https://api.github.com/repos/actions/runner/releases/latest | grep -oP '"tag_name":\s*"\K[^"]+')
VERSION="${LATEST_TAG#v}"
log "Runner version: $LATEST_TAG"

mkdir -p "$RUNNER_WORKDIR"
cd "$RUNNER_WORKDIR"

if [ ! -f "./svc.sh" ]; then
    log "Tải runner..."
    curl -o actions-runner.tar.gz -L "https://github.com/actions/runner/releases/download/${LATEST_TAG}/actions-runner-linux-x64-${VERSION}.tar.gz"
    tar xzf actions-runner.tar.gz
    rm -f actions-runner.tar.gz
fi

# GitHub runner mặc định từ chối chạy dưới quyền root.
# Home server đơn giản nên cho phép chạy root (cần quyền docker + git vào /root repo).
export RUNNER_ALLOW_RUNASROOT=1

log "Đăng ký runner với repo $GITHUB_REPOSITORY ..."
./config.sh --url "https://github.com/${GITHUB_REPOSITORY}" \
            --token "$RUNNER_TOKEN" \
            --name "$RUNNER_NAME" \
            --labels "self-hosted,linux,x64,prod" \
            --unattended \
            --replace

log "Cài runner thành systemd service..."
./svc.sh install

# Cho phép service chạy dưới root: thêm Environment vào systemd drop-in.
# (run-helper.sh kiểm tra RUNNER_ALLOW_RUNASROOT khi khởi động listener)
SERVICE_FILE=$(ls /etc/systemd/system/actions.runner.*.service 2>/dev/null | head -n 1)
if [ -n "$SERVICE_FILE" ]; then
    SERVICE_NAME=$(basename "$SERVICE_FILE")
    DROP_IN_DIR="/etc/systemd/system/${SERVICE_NAME}.d"
    mkdir -p "$DROP_IN_DIR"
    printf '[Service]\nEnvironment=RUNNER_ALLOW_RUNASROOT=1\n' > "$DROP_IN_DIR/allow-root.conf"
    systemctl daemon-reload
    log "Đã thêm drop-in cho phép chạy root vào $SERVICE_NAME"
else
    warn "Không tìm thấy service actions.runner.* — nếu khởi động lỗi, chạy: systemctl edit actions.runner.*"
fi

./svc.sh start

log "Done. Kiểm tra: ./svc.sh status  hoặc  systemctl status actions.runner.*"
