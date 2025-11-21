# PowerShell Script zum Starten der Sparo-Anwendung

function Write-ColorOutput {
    param(
        [string]$Color,
        [string]$Text
    )
    $originalColor = $host.UI.RawUI.ForegroundColor
    switch ($Color) {
        "Cyan" { $host.UI.RawUI.ForegroundColor = "Cyan" }
        "Green" { $host.UI.RawUI.ForegroundColor = "Green" }
        "Yellow" { $host.UI.RawUI.ForegroundColor = "Yellow" }
        "Red" { $host.UI.RawUI.ForegroundColor = "Red" }
    }
    Write-Output $Text
    $host.UI.RawUI.ForegroundColor = $originalColor
}

Write-ColorOutput -Color Cyan -Text "Starte Sparo-Anwendung..."

$USE_DOCKER = if ($args[0]) { $args[0] } else { "local" }

if ($USE_DOCKER -eq "docker" -or $USE_DOCKER -eq "local") {
    try {
        docker info | Out-Null
    } catch {
        Write-ColorOutput -Color Red -Text "FEHLER: Docker laeuft nicht!"
        Write-ColorOutput -Color Yellow -Text "Bitte starte Docker Desktop und versuche es erneut."
        exit 1
    }
}

if ($USE_DOCKER -eq "docker") {
    Write-ColorOutput -Color Yellow -Text "Starte mit Docker..."
    docker-compose -f docker-compose.yml up -d
    Write-ColorOutput -Color Green -Text ""
    Write-ColorOutput -Color Green -Text "Docker-Services gestartet!"
    Write-ColorOutput -Color Green -Text "Backend:  http://localhost:3000"
    Write-ColorOutput -Color Green -Text "Datenbank: localhost:3306"
    Write-ColorOutput -Color Yellow -Text "Frontend muss separat gestartet werden:"
    Write-ColorOutput -Color Yellow -Text "  cd frontend && npm run dev"
    exit 0
}

Write-ColorOutput -Color Yellow -Text "1. Starte Datenbank (Docker)..."
docker-compose -f docker-compose.dev.yml up -d budget-db

Write-ColorOutput -Color Yellow -Text "   Warte auf Datenbank..."
Start-Sleep -Seconds 5

Write-ColorOutput -Color Yellow -Text "2. Starte Backend-Server (lokal)..."

$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_DATABASE = "budget_tracker_db"
$env:DB_USER = "sparo_user"
$env:DB_PASSWORD = "app_password123"
$env:PORT = "3000"
$env:FRONTEND_URL = "http://localhost:5173"
$env:JWT_SECRET = "your_super_secret_jwt_key_that_is_very_long_and_random_12345"

Push-Location backend
$backendProcess = Start-Process -FilePath "deno" -ArgumentList "task", "dev" -PassThru -NoNewWindow -RedirectStandardOutput "../backend.log" -RedirectStandardError "../backend.log"
Pop-Location

Start-Sleep -Seconds 3
if ($backendProcess.HasExited) {
    Write-ColorOutput -Color Red -Text "FEHLER: Backend konnte nicht gestartet werden!"
    Write-ColorOutput -Color Yellow -Text "Letzte Logs:"
    if (Test-Path "backend.log") {
        Get-Content "backend.log" -Tail 20
    }
    exit 1
}

Start-Sleep -Seconds 2

Write-ColorOutput -Color Yellow -Text "3. Starte Frontend..."
Push-Location frontend
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow
Pop-Location

Write-ColorOutput -Color Green -Text ""
Write-ColorOutput -Color Green -Text "Alles gestartet!"
Write-ColorOutput -Color Green -Text "Frontend: http://localhost:5173"
Write-ColorOutput -Color Green -Text "Backend:  http://localhost:3000"
Write-ColorOutput -Color Green -Text "Datenbank: localhost:3306"
Write-ColorOutput -Color Yellow -Text "Backend-Logs werden in backend.log geschrieben"
Write-ColorOutput -Color Yellow -Text "Zum Beenden: Druecke Ctrl+C"

function Cleanup {
    Write-ColorOutput -Color Yellow -Text ""
    Write-ColorOutput -Color Yellow -Text "Beende Services..."
    if ($backendProcess -and !$backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-ColorOutput -Color Green -Text "Services beendet"
    exit 0
}

$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

try {
    while ($true) {
        if ($backendProcess.HasExited) {
            Write-ColorOutput -Color Red -Text "FEHLER: Backend-Prozess beendet unerwartet!"
            if (Test-Path "backend.log") {
                Write-ColorOutput -Color Yellow -Text "Letzte Logs:"
                Get-Content "backend.log" -Tail 20
            }
            Cleanup
        }
        if ($frontendProcess.HasExited) {
            Write-ColorOutput -Color Red -Text "FEHLER: Frontend-Prozess beendet unerwartet!"
            Cleanup
        }
        Start-Sleep -Seconds 1
    }
} catch [System.Management.Automation.PipelineStoppedException] {
    Cleanup
} catch {
    Write-ColorOutput -Color Red -Text "Fehler: $_"
    Cleanup
}
