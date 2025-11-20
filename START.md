# Sparo - Startanleitung

## Voraussetzungen

- Docker und Docker Compose installiert
- Node.js und npm installiert (für Frontend)
- Deno installiert (für Backend im lokalen Modus)

**Windows-Benutzer:** PowerShell 5.1 oder höher (standardmäßig auf Windows 10/11)

## Start der Anwendung

### Windows-Benutzer

**PowerShell verwenden:**
```powershell
.\start.ps1
```

**Oder mit Docker:**
```powershell
.\start.ps1 docker
```

**Hinweis:** Falls die Ausführung von Skripten blockiert ist, führen Sie zuerst aus:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Linux/macOS-Benutzer

### Option 1: Mit Docker (empfohlen)

```bash
./start.sh docker
```

Dies startet:
- Backend-Server (Docker) auf Port 3000
- Datenbank (Docker) auf Port 3306

**Danach Frontend separat starten:**
```bash
cd frontend
npm install
npm run dev
```

Das Frontend läuft dann auf `http://localhost:5173`

---

### Option 2: Vollständig mit Docker Compose

```bash
docker-compose up -d
```

**Danach Frontend separat starten:**
```bash
cd frontend
npm install
npm run dev
```

---

### Option 3: Lokaler Start (Backend lokal, DB in Docker)

**Linux/macOS:**
```bash
./start.sh
```

**Windows:**
```powershell
.\start.ps1
```

Dies startet automatisch:
- Datenbank (Docker)
- Backend (lokal mit Deno)
- Frontend (lokal mit npm)

---

## Zugriff

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Datenbank**: localhost:3306

## Stoppen der Anwendung

### Bei Docker:
```bash
docker-compose down
```

### Bei lokalem Start:
Drücke `Ctrl+C` im Terminal

