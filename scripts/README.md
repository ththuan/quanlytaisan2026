# 🛠️ Deployment Scripts

Các script tự động hóa việc triển khai và quản lý hệ thống.

---

## 📋 Danh sách Scripts

### 1. Setup Scripts

#### `setup-traefik.sh` (Linux/Mac)
Tự động setup Traefik + Docker với SSL miễn phí.

**Usage:**
```bash
chmod +x scripts/setup-traefik.sh
./scripts/setup-traefik.sh
```

**Chức năng:**
- ✅ Validate cấu hình .env
- ✅ Kiểm tra DNS
- ✅ Kiểm tra Docker
- ✅ Tạo volumes
- ✅ Khởi động services
- ✅ Đợi SSL certificate

**Thời gian:** ~5-10 phút

---

#### `setup-traefik.ps1` (Windows)
Phiên bản Windows PowerShell của setup script.

**Usage:**
```powershell
.\scripts\setup-traefik.ps1
```

**Chức năng:** Giống `setup-traefik.sh`

**Yêu cầu:** PowerShell 5.1+

---

### 2. Monitoring Scripts

#### `check-ssl.sh`
Kiểm tra trạng thái SSL certificate.

**Usage:**
```bash
chmod +x scripts/check-ssl.sh
./scripts/check-ssl.sh
```

**Hiển thị:**
- Certificate file status
- Certificate details (issuer, subject)
- Expiry date và số ngày còn lại
- Certificate type (staging/production)
- HTTP to HTTPS redirect
- HTTPS response status
- SSL Labs test link

**Khi nào dùng:**
- Sau khi setup xong
- Khi certificate sắp hết hạn
- Khi có vấn đề với HTTPS

---

#### `troubleshoot-traefik.sh`
Chẩn đoán và troubleshoot các vấn đề thường gặp.

**Usage:**
```bash
chmod +x scripts/troubleshoot-traefik.sh
./scripts/troubleshoot-traefik.sh
```

**Kiểm tra:**
1. Docker environment
2. DNS configuration
3. Container status
4. Port binding
5. SSL certificate
6. HTTP/HTTPS response
7. Backend API
8. Database
9. Traefik configuration
10. Recent errors

**Khi nào dùng:**
- Khi gặp lỗi
- Khi certificate không được tạo
- Khi HTTPS không hoạt động
- Khi backend API fail

---

## 🚀 Quick Start

### Lần đầu setup:

```bash
# 1. Copy environment file
cp .env.traefik.example .env

# 2. Edit configuration
nano .env

# 3. Run setup
chmod +x scripts/setup-traefik.sh
./scripts/setup-traefik.sh
```

### Kiểm tra sau khi setup:

```bash
# Check SSL
./scripts/check-ssl.sh

# Troubleshoot nếu có vấn đề
./scripts/troubleshoot-traefik.sh
```

---

## 📝 Script Details

### setup-traefik.sh

**Prerequisites:**
- .env file đã được cấu hình
- Docker và Docker Compose đã cài đặt
- Domain đã trỏ về server
- Ports 80, 443 mở

**Các bước thực hiện:**

1. **Validation**
   - Kiểm tra .env file tồn tại
   - Validate DOMAIN và ACME_EMAIL
   - Kiểm tra không dùng giá trị mặc định

2. **DNS Check**
   - Resolve domain name
   - So sánh với server IP
   - Cảnh báo nếu không khớp

3. **Docker Check**
   - Kiểm tra Docker daemon
   - Kiểm tra Docker Compose
   - Verify versions

4. **Port Check**
   - Kiểm tra port 80, 443 available
   - Hiển thị process đang dùng port (nếu có)

5. **Firewall Setup**
   - Kiểm tra UFW status
   - Thêm rules cho ports 22, 80, 443

6. **Volume Creation**
   - Tạo postgres_data volume
   - Tạo traefik-certificates volume

7. **Directory Creation**
   - Tạo logs directory
   - Tạo storage directory
   - Tạo backups directory

8. **Environment Selection**
   - Chọn staging hoặc production
   - Set ACME_CA_SERVER nếu staging

9. **Docker Operations**
   - Pull images
   - Build images
   - Start services

10. **Certificate Wait**
    - Đợi certificate được tạo (tối đa 5 phút)
    - Monitor Traefik logs
    - Verify acme.json file

11. **Final Report**
    - Hiển thị URLs
    - Hiển thị credentials
    - Hiển thị useful commands

---

### check-ssl.sh

**Output sections:**

1. **Certificate File**
   - Kiểm tra acme.json tồn tại
   - Kiểm tra file size

2. **Certificate Details**
   - Issuer
   - Subject
   - Validity period

3. **Certificate Expiry**
   - Expiration date
   - Days remaining
   - Status (valid/expiring/expired)

4. **Certificate Type**
   - Staging or Production
   - Issuer verification

5. **HTTP Redirect**
   - Test HTTP to HTTPS redirect
   - Check status code

6. **HTTPS Response**
   - Test HTTPS endpoint
   - Check status code

7. **SSL Labs Link**
   - Provide detailed test link

---

### troubleshoot-traefik.sh

**Diagnostic sections:**

1. **Docker Environment**
   - Docker daemon status
   - Docker Compose version

2. **DNS Configuration**
   - Domain resolution
   - IP comparison

3. **Docker Containers**
   - Container status
   - Running/stopped state

4. **Port Binding**
   - Port 80, 443 binding
   - Traefik port exposure

5. **SSL Certificate**
   - Certificate file check
   - Certificate content
   - Domain count

6. **HTTP/HTTPS Response**
   - HTTP redirect test
   - HTTPS response test

7. **Backend API**
   - API health check
   - Status code

8. **Database**
   - PostgreSQL ready check

9. **Traefik Configuration**
   - Router count
   - Service count

10. **Recent Errors**
    - Last 10 error lines from logs

**Common solutions provided:**
- Certificate not generated
- HTTPS not working
- Backend API not working
- General troubleshooting steps

---

## 🔧 Customization

### Thêm custom checks

Edit `troubleshoot-traefik.sh`:

```bash
# Add new check section
echo -e "${BLUE}11. Custom Check${NC}"
echo "-------------------"
# Your check logic here
echo ""
```

### Thêm custom setup steps

Edit `setup-traefik.sh`:

```bash
# Add before "Final checks"
print_info "Running custom setup..."
# Your setup logic here
print_success "Custom setup complete"
```

---

## 🐛 Troubleshooting

### Script không chạy được

**Problem:** Permission denied

**Solution:**
```bash
chmod +x scripts/*.sh
```

---

### Script báo lỗi "command not found"

**Problem:** Missing dependencies

**Solution:**
```bash
# Install required tools
sudo apt install -y curl git nano dnsutils

# For check-ssl.sh
sudo apt install -y openssl
```

---

### DNS check fail

**Problem:** DNS chưa propagate

**Solution:**
- Đợi 5-10 phút
- Kiểm tra DNS settings
- Dùng `nslookup` hoặc `dig` để verify

---

## 📚 Related Documentation

- [TRAEFIK_QUICK_START.md](../TRAEFIK_QUICK_START.md) - Quick start guide
- [TRAEFIK_SSL_GUIDE.md](../TRAEFIK_SSL_GUIDE.md) - Complete guide
- [DEPLOYMENT_COMPARISON.md](../DEPLOYMENT_COMPARISON.md) - Deployment options

---

## 🤝 Contributing

Để contribute script mới:

1. Tạo script trong `scripts/`
2. Thêm shebang: `#!/bin/bash`
3. Thêm description header
4. Test kỹ trước khi commit
5. Update README này

---

## 📞 Support

Nếu script gặp lỗi:
1. Chạy với verbose mode: `bash -x scripts/script-name.sh`
2. Kiểm tra logs
3. Tạo GitHub issue với error output

---

**Last updated**: 2026-03-15
