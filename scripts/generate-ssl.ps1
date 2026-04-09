# Script tạo SSL certificate tự ký cho mạng nội bộ
# Chạy: PowerShell -ExecutionPolicy Bypass -File scripts\generate-ssl.ps1

param(
    [string]$IP = "",
    [string]$Domain = "localhost",
    [string]$OutputDir = "$PSScriptRoot\..\nginx\ssl",
    [int]$ValidDays = 3650
)

# Tự động phát hiện IP nội bộ nếu không truyền vào
if (-not $IP) {
    $IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.InterfaceAlias -notlike '*Loopback*' -and
        $_.InterfaceAlias -notlike '*Hyper*' -and
        $_.IPAddress -notlike '127.*' -and
        $_.IPAddress -notlike '172.*'
    } | Select-Object -First 1).IPAddress

    if (-not $IP) { $IP = "127.0.0.1" }
}

Write-Host "Tao SSL certificate cho IP: $IP, Domain: $Domain" -ForegroundColor Cyan

# Tạo thư mục output nếu chưa có
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$certFile = Join-Path $OutputDir "server.crt"
$keyFile  = Join-Path $OutputDir "server.key"
$cnfFile  = Join-Path $env:TEMP "openssl_san.cnf"

# Tạo file config openssl với Subject Alternative Names
@"
[req]
default_bits       = 2048
prompt             = no
default_md         = sha256
distinguished_name = dn
x509_extensions    = v3_req

[dn]
C  = VN
ST = HoChiMinh
L  = HoChiMinh
O  = Internal
CN = $Domain

[v3_req]
subjectAltName = @alt_names
keyUsage       = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = $Domain
DNS.2 = localhost
IP.1  = $IP
IP.2  = 127.0.0.1
"@ | Set-Content $cnfFile -Encoding UTF8

# Tạo certificate bằng openssl trong Docker (không cần cài openssl trên Windows)
docker run --rm -v "${OutputDir}:/out" -v "${cnfFile}:/tmp/san.cnf" `
    alpine/openssl req -x509 -nodes -newkey rsa:2048 `
    -keyout /out/server.key -out /out/server.crt `
    -days $ValidDays -config /tmp/san.cnf 2>&1

if ($LASTEXITCODE -eq 0 -and (Test-Path $certFile) -and (Test-Path $keyFile)) {
    Write-Host ""
    Write-Host "Certificate da tao thanh cong!" -ForegroundColor Green
    Write-Host "  Certificate : $certFile"
    Write-Host "  Private key : $keyFile"
    Write-Host ""
    Write-Host "Truy cap ung dung tai:" -ForegroundColor Yellow
    Write-Host "  https://$IP" -ForegroundColor Yellow
    Write-Host "  https://localhost" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Lan dau truy cap trinh duyet se bao khong tin cay." -ForegroundColor Cyan
    Write-Host "Chon 'Advanced' -> 'Proceed' de tiep tuc." -ForegroundColor Cyan
} else {
    Write-Host "Loi tao certificate!" -ForegroundColor Red
    Write-Host "Dam bao Docker dang chay tren may." -ForegroundColor Yellow
    exit 1
}
