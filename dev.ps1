# Kill any process using port 5173 or 5174
foreach ($port in 5173, 5174) {
    $conns = netstat -ano | Select-String "TCP.*:$port\s"
    foreach ($c in $conns) {
        $procId = ($c.ToString().Trim() -split '\s+')[-1]
        if ($procId -match '^\d+$' -and $procId -ne '0') {
            Write-Host "Stopping PID $procId (port $port)..." -ForegroundColor Yellow
            taskkill /PID $procId /F | Out-Null
        }
    }
}

Start-Sleep -Milliseconds 500

# Add firewall rules so phone can reach the dev servers (requires admin; skips silently if not)
foreach ($port in 5173, 5174) {
    $rule = "Vite Dev $port"
    if (-not (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue)) {
        try {
            New-NetFirewallRule -DisplayName $rule -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow -ErrorAction Stop | Out-Null
            Write-Host "Added firewall rule for port $port" -ForegroundColor Green
        } catch {
            Write-Host "Note: could not add firewall rule for port $port - run as admin if phone can't connect" -ForegroundColor DarkYellow
        }
    }
}

$dir = $PSScriptRoot

# Start both servers in the background with no window
$phonicsCmd = "`$env:BROWSER='none'; Set-Location '$dir'; npm run dev -- --host --port 5173"
$mathsCmd   = "`$env:BROWSER='none'; Set-Location '$dir'; npm run dev:maths -- --host"

Start-Process powershell -WindowStyle Hidden -ArgumentList "-NonInteractive", "-Command", $phonicsCmd
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NonInteractive", "-Command", $mathsCmd

# Get local network IP (prefer 192.168.x.x)
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Sort-Object { if ($_.IPAddress -like '192.168.*') { 0 } else { 1 } } |
    Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "  Phonics" -ForegroundColor White
Write-Host "    Local:         http://localhost:5173/phonics.html" -ForegroundColor Cyan
Write-Host "    Local (test):  http://localhost:5173/phonics.html?testMode=1" -ForegroundColor DarkYellow
Write-Host "    Mobile:        http://${ip}:5173/phonics.html" -ForegroundColor Cyan
Write-Host "    Mobile (test): http://${ip}:5173/phonics.html?testMode=1" -ForegroundColor DarkYellow
Write-Host ""
Write-Host "  Maths" -ForegroundColor White
Write-Host "    Local:         http://localhost:5174/maths.html" -ForegroundColor Cyan
Write-Host "    Local (test):  http://localhost:5174/maths.html?testMode=1" -ForegroundColor DarkYellow
Write-Host "    Mobile:        http://${ip}:5174/maths.html" -ForegroundColor Cyan
Write-Host "    Mobile (test): http://${ip}:5174/maths.html?testMode=1" -ForegroundColor DarkYellow
Write-Host ""
