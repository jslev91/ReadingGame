# Kill any running Vite/Node dev server
$killed = Get-Process -Name node -ErrorAction SilentlyContinue
if ($killed) {
    $killed | Stop-Process -Force
    Write-Host "Stopped existing Node process(es)." -ForegroundColor Yellow
}

# Start dev server in background via cmd so npm is resolved from PATH
$job = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev -- --host --port 5173" `
    -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden

# Wait for server to be ready
Write-Host "Starting dev server..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
}

if (-not $ready) {
    Write-Host "Server did not start in time." -ForegroundColor Red
    exit 1
}

# Find local network IP (192.168.x.x preferred, else first non-loopback)
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Sort-Object { if ($_.IPAddress -like '192.168.*') { 0 } else { 1 } } |
    Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "  Dev server ready!" -ForegroundColor Green
Write-Host ""
Write-Host "  Local:   http://localhost:5173" -ForegroundColor White
Write-Host "  Mobile:  http://${ip}:5173" -ForegroundColor White
Write-Host ""
