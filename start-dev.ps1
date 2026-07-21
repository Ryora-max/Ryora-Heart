# Ryora Dev Server Starter
# Automatically detects local IP and starts dev server

Write-Host "🔍 Detecting local IP address..." -ForegroundColor Cyan

# Get all IPv4 addresses
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*","WLAN*" -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" }

if ($ipAddresses) {
    $localIP = $ipAddresses[0].IPAddress
    Write-Host "✅ Local IP detected: $localIP" -ForegroundColor Green
} else {
    $localIP = "localhost"
    Write-Host "⚠️  Could not detect local IP, using localhost" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting Ryora dev server..." -ForegroundColor Cyan
Write-Host "   Local:  http://localhost:3000" -ForegroundColor Gray
Write-Host "   Network: http://$localIP`:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tip: Access from other devices using the Network URL above" -ForegroundColor Yellow
Write-Host "   Make sure all devices are on the same WiFi network" -ForegroundColor Yellow
Write-Host ""

Set-Location "C:\Ryora\ryora"
npm run dev
