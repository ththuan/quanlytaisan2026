$ErrorActionPreference = "Continue"
$certDir = "D:\QLTS\quanlytaisan\nginx\ssl"
$pfxPath = "$certDir\server.pfx"
$pfxPassword = "qlts2024"

# Auto-detect hostname and all active IPv4 addresses
$hostname = hostname
Write-Host "Hostname: $hostname"

$ips = @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -ne '127.0.0.1' -and
    $_.InterfaceAlias -notlike "*Loopback*" -and
    $_.InterfaceAlias -notlike "*WSL*" -and
    $_.InterfaceAlias -notlike "*Bluetooth*"
} | ForEach-Object { $_.IPAddress } | Where-Object { $_ -match '^\d+\.\d+\.\d+\.\d+$' })

$allIPs = @("127.0.0.1") + $ips
Write-Host "Detected IPs: $($allIPs -join ', ')"

# Build SAN text extension
$sanParts = @("DNS=localhost", "DNS=$hostname", "DNS=$hostname.local")
foreach ($ip in $allIPs) {
    $sanParts += "IPAddress=$ip"
}
$sanText = $sanParts -join "&"
Write-Host "SAN: $sanText"

# Remove old cert from store
Get-ChildItem "Cert:\CurrentUser\My" | Where-Object { $_.Subject -eq "CN=localhost, O=CTEC, L=HoChiMinh, C=VN" } | Remove-Item

# Create new cert
Write-Host "`n[1/3] Creating self-signed certificate..."
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost, O=CTEC, L=HoChiMinh, C=VN" `
    -TextExtension @("2.5.29.17={text}$sanText") `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddYears(10) `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -ErrorAction Stop

Write-Host "  Thumbprint: $($cert.Thumbprint)"

# Export PFX
Write-Host "[2/3] Exporting PFX..."
$pfx = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, $pfxPassword)
[System.IO.File]::WriteAllBytes($pfxPath, $pfx)

# Export CRT (PEM)
$cert2 = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, $pfxPassword, "Exportable,MachineKeySet,PersistKeySet")
$crtPem = "-----BEGIN CERTIFICATE-----`r`n" + [Convert]::ToBase64String($cert2.RawData, "InsertLineBreaks") + "`r`n-----END CERTIFICATE-----"
[System.IO.File]::WriteAllText("$certDir\server.crt", $crtPem)

# Export KEY via Docker openssl (proper PKCS#8 PEM format)
Write-Host "[3/3] Converting key to PEM via Docker openssl..."
$keyOutput = docker run --rm -v "${certDir}:/ssl" alpine/openssl pkcs12 `
    -in /ssl/server.pfx -nocerts -nodes -passin "pass:${pfxPassword}" 2>&1
$cleanKey = ($keyOutput | Where-Object { $_ -match 'BEGIN PRIVATE KEY|END PRIVATE KEY|^[A-Za-z0-9+/=]+$' }) -join "`r`n"
if ($cleanKey.Length -lt 100) {
    # Fallback: extract PEM content from raw output
    $raw = $keyOutput -join "`n"
    $start = $raw.IndexOf('-----BEGIN PRIVATE KEY-----')
    if ($start -ge 0) {
        $cleanKey = $raw.Substring($start)
        $end = $cleanKey.IndexOf('-----END PRIVATE KEY-----')
        if ($end -ge 0) {
            $cleanKey = $cleanKey.Substring(0, $end + 29)
        }
    }
}
[System.IO.File]::WriteAllText("$certDir\server.key", $cleanKey)

Write-Host ""
Write-Host "=== Certificate generated! ==="
Write-Host "CRT: $certDir\server.crt"
Write-Host "KEY: $certDir\server.key"
Write-Host ""
Write-Host "Access URLs:"
foreach ($ip in $allIPs) {
    if ($ip -ne '127.0.0.1') {
        Write-Host "  https://${ip}:4000/"
    }
}
Write-Host "  https://$hostname.local:4000/  (mDNS)"
Write-Host "  https://${hostname}:4000/        (NetBIOS)"
