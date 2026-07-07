# Hướng dẫn sửa lỗi WebSocket Vite HMR

## Vấn đề

```
WebSocket connection to 'wss://172.16.116.48/?token=...' failed
WebSocket connection to 'wss://localhost:3000/?token=...' failed
[vite] failed to connect to websocket
```

## Nguyên nhân

- Vite dev server đang chạy ở `0.0.0.0:3000` (listen tất cả network interfaces)
- Browser truy cập từ IP address cụ thể (VD: `172.16.116.48`)
- HMR WebSocket không được cấu hình đúng để match với IP đang dùng
- Dẫn đến Hot Module Reload không hoạt động (phải F5 manual sau mỗi thay đổi code)

## Giải pháp đã áp dụng

### 1. Cấu hình HMR trong `vite.config.ts`:

```typescript
server: {
  host: '0.0.0.0',
  port: 3000,
  hmr: {
    protocol: 'ws',  // hoặc 'wss' nếu dùng HTTPS
    host: undefined, // Let Vite auto-detect từ browser URL
    clientPort: 3000,
  },
}
```

### 2. Restart Dev Server

**Cách 1: Dùng script tự động**
```bash
# Windows Command Prompt
restart-dev.bat

# PowerShell
.\restart-dev.ps1
```

**Cách 2: Manual**
```bash
# Stop server hiện tại (Ctrl+C trong terminal)
# Sau đó start lại
npm run dev
```

## Kiểm tra đã fix

1. Mở browser console (F12)
2. Không còn thấy lỗi WebSocket màu đỏ
3. Thay đổi code → trang tự động reload
4. Thấy log: `[vite] connected.` màu xanh

## Lưu ý

### Nếu dùng HTTPS:

```bash
npm run dev:https
```

HMR sẽ dùng protocol `wss://` và host `localhost`

### Nếu truy cập từ nhiều devices:

- Desktop: `http://localhost:3000`
- Laptop trong LAN: `http://172.16.116.48:3000`
- Mobile trong LAN: `http://172.16.116.48:3000`

HMR sẽ tự động detect đúng URL đang dùng.

### Firewall:

Nếu vẫn lỗi, check Windows Firewall cho phép port 3000:

```powershell
# PowerShell as Admin
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

## Debug thêm

### Xem HMR config đang dùng:

```javascript
// Trong browser console
console.log(window.__vite_hmr_config)
```

### Test WebSocket manually:

```javascript
const ws = new WebSocket('ws://172.16.116.48:3000');
ws.onopen = () => console.log('WebSocket connected!');
ws.onerror = (e) => console.error('WebSocket error:', e);
ws.onclose = () => console.log('WebSocket closed');
```

## Tham khảo

- [Vite Server Options](https://vite.dev/config/server-options.html)
- [Vite HMR Configuration](https://vite.dev/config/server-options.html#server-hmr)
