#!/bin/bash
# Tự động sửa các secret yếu trong .env (JWT_SECRET, DEFAULT_PASSWORD, ADMIN_PASSWORD).
# An toàn khi chạy lại nhiều lần: chỉ sinh giá trị mới khi còn thiếu/yếu.
# KHÔNG đụng tới DB_PASSWORD (đổi sẽ làm hỏng volume postgres đang chạy).

set -euo pipefail

ENV_FILE="${ENV_FILE:-/root/quanlytaisan2026/.env}"

if [ ! -f "$ENV_FILE" ]; then
    echo "[ERROR] Không tìm thấy $ENV_FILE"
    exit 1
fi

get_key() { sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1; }

set_key() {
    local key="$1" val="$2"
    sed -i "/^${key}=/d" "$ENV_FILE"
    echo "${key}=${val}" >> "$ENV_FILE"
}

gen_pw() { echo "$(openssl rand -base64 15 | tr -d '/+=')!Aa1"; }

changed=0

JWT=$(get_key JWT_SECRET)
if [ -z "$JWT" ] || [ "${#JWT}" -lt 32 ]; then
    JWT=$(openssl rand -hex 32)
    set_key JWT_SECRET "$JWT"
    echo "[OK] Đã sinh JWT_SECRET mới"
    changed=1
fi

DP=$(get_key DEFAULT_PASSWORD)
if [ -z "$DP" ] || [ "$DP" = "Ctec@123" ]; then
    DP=$(gen_pw)
    set_key DEFAULT_PASSWORD "$DP"
    echo "[OK] Đã sinh DEFAULT_PASSWORD mới"
    changed=1
fi

AP=$(get_key ADMIN_PASSWORD)
if [ -z "$AP" ] || [ "$AP" = "Admin@123" ]; then
    AP=$(gen_pw)
    set_key ADMIN_PASSWORD "$AP"
    echo "[OK] Đã sinh ADMIN_PASSWORD mới"
    changed=1
fi

if [ "$changed" -eq 0 ]; then
    echo "Các secret đã đủ mạnh, không cần sửa."
else
    echo ""
    echo "=== GIÁ TRỊ MỚI (lưu lại) ==="
    echo "JWT_SECRET=$JWT"
    echo "DEFAULT_PASSWORD=$DP"
    echo "ADMIN_PASSWORD=$AP"
    echo ""
    echo "Khởi động lại backend:"
    echo "  docker compose -f docker-compose.prod.yml up -d --build backend"
fi
