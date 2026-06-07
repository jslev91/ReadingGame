# restart-dev.ps1
# Kills any process on port 5173, then starts the Vite dev server with network access

$port = 5173

Write-Host "Checking for processes on port $port..." -ForegroundColor Cyan

$connections = netstat -ano | Select-String "TCP.*:$port\s"
$killed = $false

foreach ($conn in $connections) {
    $parts = $conn.ToString().Trim() -split '\s+'
    $procId = $parts[-1]
    if ($procId -match '^\d+$' -and $procId -ne '0') {
        Write-Host "Killing PID $procId..." -ForegroundColor Yellow
        taskkill /PID $procId /F
        $killed = $true
    }
}

if (-not $killed) {
    Write-Host "No existing process on port $port." -ForegroundColor Green
}

Write-Host ""
Write-Host "App URLs:" -ForegroundColor Cyan
Write-Host "  Phonics  ->  http://localhost:$port/phonics.html" -ForegroundColor White
Write-Host "  Maths    ->  http://localhost:$port/maths.html" -ForegroundColor White
Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Cyan

$env:BROWSER = 'none'
npm run dev -- --host
