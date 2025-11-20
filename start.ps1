# PowerShell-Skript zum Starten der Sparo-Anwendung

# Farben für bessere Ausgabe
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Cyan "🚀 Starte Sparo-Anwendung...`n"

# Prüfe ob Docker verwendet werden soll
$USE_DOCKER = if ($args[0]) { $args[0] } else { "local" }

if ($USE_DOCKER -eq "docker") {
    Write-ColorOutput Yellow "🐳 Starte mit Docker..."
    docker-compose -f docker-compose.yml up -d
    Write-ColorOutput Green "`n✅ Docker-Services gestartet!`n"
    Write-ColorOutput Green "🔧 Backend:  http://localhost:3000"
    Write-ColorOutput Green "🗄️  Datenbank: localhost:3306`n"
    Write-ColorOutput Yellow "Frontend muss separat gestartet werden:"
    Write-ColorOutput Yellow "  cd frontend && npm run dev`n"
    exit 0
}

# Lokaler Modus (ohne Docker für Backend)
# 1. Docker Compose starten (nur Datenbank)
Write-ColorOutput Yellow "1. Starte Datenbank (Docker)..."
docker-compose -f docker-compose.dev.yml up -d budget-db

# Warte bis Datenbank bereit ist
Write-ColorOutput Yellow "   Warte auf Datenbank..."
Start-Sleep -Seconds 5

# 2. Backend starten
Write-ColorOutput Yellow "2. Starte Backend-Server (lokal)..."

# Setze Umgebungsvariablen für Backend
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_DATABASE = "budget_tracker_db"
$env:DB_USER = "sparo_user"
$env:DB_PASSWORD = "app_password123"
$env:PORT = "3000"
$env:FRONTEND_URL = "http://localhost:5173"
$env:JWT_SECRET = "your_super_secret_jwt_key_that_is_very_long_and_random_12345"

# Wechsle ins Backend-Verzeichnis und starte
Push-Location backend
$backendProcess = Start-Process -FilePath "deno" -ArgumentList "task", "dev" -PassThru -NoNewWindow -RedirectStandardOutput "../backend.log" -RedirectStandardError "../backend.log"
Pop-Location

# Warte kurz und prüfe ob Backend läuft
Start-Sleep -Seconds 3
if ($backendProcess.HasExited) {
    Write-ColorOutput Red "❌ Backend konnte nicht gestartet werden!"
    Write-ColorOutput Yellow "Letzte Logs:"
    if (Test-Path "backend.log") {
        Get-Content "backend.log" -Tail 20
    }
    exit 1
}

# Warte kurz
Start-Sleep -Seconds 2

# 3. Frontend starten
Write-ColorOutput Yellow "3. Starte Frontend..."
Push-Location frontend
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow
Pop-Location

Write-ColorOutput Green "`n✅ Alles gestartet!`n"
Write-ColorOutput Green "📊 Frontend: http://localhost:5173"
Write-ColorOutput Green "🔧 Backend:  http://localhost:3000"
Write-ColorOutput Green "🗄️  Datenbank: localhost:3306`n"
Write-ColorOutput Yellow "Backend-Logs werden in backend.log geschrieben`n"
Write-ColorOutput Yellow "Zum Beenden: Drücke Ctrl+C`n"

# Cleanup-Funktion beim Beenden
function Cleanup {
    Write-ColorOutput Yellow "`n🛑 Beende Services..."
    if ($backendProcess -and !$backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-ColorOutput Green "✅ Services beendet"
    exit 0
}

# Trap für Ctrl+C
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Warte auf Prozesse
try {
    while ($true) {
        # Prüfe ob Prozesse noch laufen
        if ($backendProcess.HasExited) {
            Write-ColorOutput Red "❌ Backend-Prozess beendet unerwartet!"
            if (Test-Path "backend.log") {
                Write-ColorOutput Yellow "Letzte Logs:"
                Get-Content "backend.log" -Tail 20
            }
            Cleanup
        }
        
        if ($frontendProcess.HasExited) {
            Write-ColorOutput Red "❌ Frontend-Prozess beendet unerwartet!"
            Cleanup
        }
        
        Start-Sleep -Seconds 1
    }
} catch [System.Management.Automation.PipelineStoppedException] {
    # Wird bei Ctrl+C geworfen
    Cleanup
} catch {
    Write-ColorOutput Red "Fehler: $_"
    Cleanup
}

