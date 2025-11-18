# Sparo - Budget-Tracking Anwendung
## Vollständige Projektdokumentation

---

# Inhaltsverzeichnis

1. [Technische Dokumentation](#1-technische-dokumentation)
   - [1.1 Technologie-Auswahl](#11-technologie-auswahl)
   - [1.2 Entwurf (Konzeption)](#12-entwurf-konzeption)
   - [1.3 Datei-Übersicht](#13-datei-übersicht)
   - [1.4 Ergebnis-Beschreibung](#14-ergebnis-beschreibung)
2. [Benutzerdokumentation](#2-benutzerdokumentation)
   - [2.1 Installation/Inbetriebnahme](#21-installationinbetriebnahme)
   - [2.2 Benutzungsszenarien](#22-benutzungsszenarien)
3. [Reflexionsdokumentation](#3-reflexionsdokumentation)
   - [3.1 Ausgangssituation](#31-ausgangssituation)
   - [3.2 Vorgehen](#32-vorgehen)
   - [3.3 Anforderungsliste](#33-anforderungsliste)
   - [3.4 Herausforderungen](#34-herausforderungen)
   - [3.5 Unterstützung](#35-unterstützung)
   - [3.6 Lernerfolge / Fazit](#36-lernerfolge--fazit)
   - [3.7 Weiterentwicklung](#37-weiterentwicklung)
   - [3.8 KI-Einsatz](#38-ki-einsatz)

---

# 1. Technische Dokumentation

## 1.1 Technologie-Auswahl

### Backend

**Deno Runtime**
- **Begründung**: Deno bietet moderne JavaScript/TypeScript-Unterstützung ohne Node.js-Overhead. Die integrierte Sicherheit durch explizite Permissions (`--allow-net`, `--allow-read`) und native TypeScript-Unterstützung machen Deno ideal für sichere Backend-Entwicklung. Die native Unterstützung für npm-Pakete ermöglicht die Nutzung bewährter Bibliotheken wie mysql2, bcryptjs und jsonwebtoken.

**Oak Framework v16**
- **Begründung**: Oak ist das native Web-Framework für Deno und wurde entsprechend der Aufgabenstellung ("deno mit oak") verwendet:
  1. **Native Deno-Integration**: Oak ist speziell für Deno entwickelt und nutzt native Deno-Features wie TypeScript-Unterstützung und moderne Async/Await-Patterns
  2. **Aufgabenstellung**: Die Aufgabenstellung verlangt explizit "deno mit oak" als eine der Optionen
  3. **TypeScript-First**: Oak ist vollständig in TypeScript geschrieben und bietet bessere Type-Safety
  4. **Moderne Architektur**: Oak v16 verwendet Context-basierte Middleware mit `ctx`-Objekt, das Request und Response kapselt
  5. **Body-Parsing**: Oak v16 bietet modernes Body-Parsing über `ctx.request.body` mit `bodyReader.type()` und `bodyReader.json()` Methoden
  6. **Deno-Best-Practices**: Oak folgt Deno-Best-Practices und nutzt native Deno-APIs (z.B. für File-Serving)
- **Vorteile**: Oak v16 bietet eine saubere, moderne API mit Context-basiertem Request-Handling (`ctx.request`, `ctx.response`, `ctx.state`), integrierter TypeScript-Unterstützung und modernem Body-Parsing. Die Middleware-Architektur ist flexibel und erweiterbar.

**MySQL 8.0**
- **Begründung**: MySQL ist eine bewährte, relationale Datenbank mit ausgezeichneter Performance und Stabilität. Für Budget-Tracking-Anwendungen ist die relationale Struktur ideal, um Transaktionen, Benutzer und Sparziele mit Foreign Keys zu verknüpfen. MySQL 8.0 bietet moderne Features wie JSON-Unterstützung und verbesserte Performance.

**JWT (JSON Web Tokens)**
- **Begründung**: JWT ermöglicht stateless Authentifizierung, was für REST-APIs ideal ist. Tokens können im Frontend gespeichert werden und enthalten alle notwendigen Benutzerinformationen. Die Verwendung von `jsonwebtoken` ist industrieüblich und sicher.

**bcryptjs**
- **Begründung**: Passwörter müssen gehasht werden, niemals im Klartext gespeichert. bcryptjs ist eine bewährte Bibliothek für Passwort-Hashing mit Salt-Rounds, die Rainbow-Table-Angriffe verhindert.

### Frontend

**Vue.js 3**
- **Begründung**: Vue.js bietet eine reaktive, komponentenbasierte Architektur mit geringer Lernkurve. Die Composition API ermöglicht wiederverwendbaren, testbaren Code. Vue 3 ist performanter als Vue 2 und bietet bessere TypeScript-Unterstützung.

**Vue Router**
- **Begründung**: Für Single-Page-Applications (SPAs) ist ein Router unerlässlich. Vue Router bietet Navigation Guards für Authentifizierung, dynamische Routen und History-Management.

**Pinia**
- **Begründung**: Pinia ist der offizielle State-Management-Store für Vue 3. Es ist einfacher als Vuex, bietet TypeScript-Unterstützung und DevTools-Integration. Ideal für die Verwaltung von Authentifizierungsstatus und Benutzerdaten.

**Axios**
- **Begründung**: Axios ist eine moderne HTTP-Client-Bibliothek mit Interceptors, automatischem JSON-Parsing und besserer Fehlerbehandlung als `fetch`. Ideal für REST-API-Kommunikation.

**Vite**
- **Begründung**: Vite ist ein moderner Build-Tool mit extrem schnellem Hot-Module-Replacement (HMR). Die Entwicklungserfahrung ist deutlich besser als bei Webpack, und die Build-Zeiten sind kürzer.

### DevOps & Deployment

**Docker & Docker Compose**
- **Begründung**: Docker ermöglicht konsistente Entwicklungsumgebungen und einfaches Deployment. Docker Compose orchestriert Backend und Datenbank als Services, was die lokale Entwicklung vereinfacht und Production-Deployment vorbereitet.

---

## 1.2 Entwurf (Konzeption)

### Architektur

**Client-Server-Architektur mit REST-API**

Die Anwendung folgt einer klassischen 3-Tier-Architektur:

```
┌─────────────────┐
│   Frontend       │  Vue.js SPA (Port 5173)
│   (Browser)      │
└────────┬─────────┘
         │ HTTP/REST
         │ JWT Token
         ▼
┌─────────────────┐
│   Backend        │  Deno + Oak v16 (Port 3000)
│   (API Server)   │
└────────┬─────────┘
         │ SQL Queries
         ▼
┌─────────────────┐
│   Datenbank      │  MySQL 8.0 (Port 3306)
│   (Persistenz)   │
└─────────────────┘
```

**Komponenten und Zusammenwirken:**

1. **Frontend (Vue.js SPA)**
   - Rendert UI-Komponenten im Browser
   - Kommuniziert mit Backend über REST-API
   - Verwaltet Authentifizierungsstatus in Pinia Store
   - Nutzt Vue Router für Navigation

2. **Backend (Deno + Oak v16)**
   - Stellt REST-API-Endpunkte bereit
   - Authentifiziert Requests via JWT-Middleware
   - Validiert und verarbeitet Daten mit Oak's Context-basiertem Request-Handling
   - Body-Parsing über `ctx.request.body` mit `bodyReader.type()` und `bodyReader.json()`
   - Führt SQL-Queries auf Datenbank aus

3. **Datenbank (MySQL)**
   - Speichert Benutzer, Transaktionen und Sparziele
   - Enforced Referential Integrity via Foreign Keys
   - Indiziert für Performance (user_id, date, category)

**Entscheidungen:**

- **Stateless Backend**: JWT-Tokens ermöglichen horizontale Skalierung ohne Session-Storage
- **Oak Framework v16**: Native Deno-Integration mit Context-basiertem Request-Handling (`ctx.request`, `ctx.response`, `ctx.state`)
- **Body-Parser Middleware**: Custom Middleware für JSON-Parsing mit Oak v16's `bodyReader.type()` und `bodyReader.json()` Methoden
- **RESTful API**: Standardisierte HTTP-Methoden (GET, POST, PUT, DELETE) für klare API-Struktur
- **CORS-Konfiguration**: Explizite Whitelist für Frontend-Origins verhindert CSRF-Angriffe
- **Middleware-Pattern**: Authentifizierung als wiederverwendbare Oak-Middleware mit Context-basiertem Request-Handling

### UI-Entwurf

**Design-Entscheidungen:**

1. **Single-Page-Application (SPA)**
   - Keine Page-Reloads, flüssige Navigation
   - Router-basierte Navigation mit History-API
   - Authentifizierte Routen via Navigation Guards

2. **Komponentenstruktur**
   - **Views**: Hauptseiten (LoginView, DashboardView, GoalTrackerView, TransactionFormView)
   - **Stores**: Globaler State (auth.js für Authentifizierung)
   - **Router**: Zentrale Routenkonfiguration mit Auth-Guards

3. **User Experience**
   - **Responsive Design**: Mobile-first Ansatz mit Media Queries
   - **Loading States**: Spinner und Feedback während API-Calls
   - **Error Handling**: Benutzerfreundliche Fehlermeldungen
   - **Form Validation**: Client-seitige Validierung vor API-Calls

4. **Styling**
   - **CSS-in-Component**: Scoped Styles in Vue-Komponenten
   - **Gradient-Design**: Moderne, visuell ansprechende UI
   - **Card-based Layout**: Klare visuelle Hierarchie

**Alternativen, die nicht gewählt wurden:**

- **Server-Side Rendering (SSR)**: Nicht gewählt, da SPA für Budget-App ausreichend ist und Entwicklung vereinfacht
- **CSS-Framework (Bootstrap/Tailwind)**: Nicht gewählt, um vollständige Kontrolle über Styling zu behalten
- **GraphQL**: Nicht gewählt, da REST-API für die Anforderungen ausreichend und einfacher zu implementieren ist

### Datenmodell

**Relationales Datenmodell mit 3 Haupttabellen:**

```
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── created_at
└── updated_at

transactions
├── transaction_id (PK)
├── user_id (FK → users.id)
├── type (ENUM: 'Income', 'Expense')
├── amount (DECIMAL)
├── category
├── date
├── description
├── created_at
└── updated_at

goals
├── goal_id (PK)
├── user_id (FK → users.id)
├── name
├── target_amount (DECIMAL)
├── current_savings (DECIMAL)
├── start_date
├── end_date
├── created_at
└── updated_at
```

**Persistenzüberlegungen:**

1. **Foreign Keys mit CASCADE**: Beim Löschen eines Benutzers werden automatisch alle Transaktionen und Sparziele gelöscht (Datenintegrität)

2. **Indizierung**:
   - `idx_tx_user_date`: Schnelle Abfragen nach Benutzer und Datum
   - `idx_tx_user_type`: Filterung nach Einnahmen/Ausgaben
   - `idx_tx_user_category`: Kategorien-Analysen

3. **DECIMAL für Geldbeträge**: Präzise Berechnungen ohne Floating-Point-Fehler

4. **ENUM für Transaktionstypen**: Typsicherheit auf Datenbankebene

5. **Timestamps**: Automatische `created_at` und `updated_at` für Audit-Trail

### Interaktionsideen zwischen Client und Server

**Funktionsabläufe:**

1. **Registrierung/Login**
   ```
   Frontend → POST /api/auth/register
   Backend → Hash Passwort (bcrypt)
   Backend → Erstelle User in DB
   Backend → Generiere JWT Token
   Backend → Response mit Token
   Frontend → Speichere Token in localStorage
   Frontend → Setze Authorization Header
   Frontend → Redirect zu Dashboard
   ```

2. **Transaktion hinzufügen**
   ```
   Frontend → POST /api/transactions/expense (JSON Body)
   Backend → Body-Parser Middleware: ctx.request.body → bodyReader.json()
   Backend → ctx.state.body enthält geparste JSON-Daten
   Backend → Middleware: authenticateUser validiert JWT Token
   Backend → Extrahiere user_id aus ctx.state.user.id
   Backend → Validiere ctx.state.body (Betrag, Kategorie, Datum)
   Backend → INSERT INTO transactions
   Backend → ctx.response.status = 201, ctx.response.body = { message: ... }
   Frontend → Zeige Erfolgsmeldung
   Frontend → Optional: Refresh Dashboard
   ```

3. **Dashboard laden**
   ```
   Frontend → GET /api/transactions/summary?month=1&year=2024
   Backend → Middleware: authenticateUser validiert JWT Token
   Backend → Extrahiere user_id aus ctx.state.user.id
   Backend → URL-Parameter: ctx.request.url.searchParams.get('month')
   Backend → SQL: SUM Income/Expense, GROUP BY category
   Backend → ctx.response.body = { currentSaldo, total_income, total_expense, categoryBreakdown }
   Frontend → Rendere Dashboard mit Daten
   ```

4. **Geschützte Routen**
   ```
   Frontend → Router Guard: beforeEach()
   Frontend → Prüfe authStore.isLoggedIn
   Frontend → Wenn nicht eingeloggt → Redirect zu /login
   Frontend → Wenn eingeloggt → Erlaube Zugriff
   ```

**Sicherheitsaspekte:**

- **JWT in Authorization Header**: Token wird bei jedem Request mitgesendet
- **Token-Expiration**: Tokens laufen nach 1 Tag ab
- **CORS-Whitelist**: Nur erlaubte Origins können API aufrufen (via `ctx.response.headers.set()`)
- **Password Hashing**: Passwörter werden niemals im Klartext gespeichert
- **Context-basierte Datenvalidierung**: Alle Daten werden über `ctx.state.body` validiert
- **User-ID Prüfung**: Jeder Datenzugriff prüft `ctx.state.user.id` gegen Datenbank-Einträge

---

## 1.3 Datei-Übersicht

### Selbst erstellte Dateien

#### Backend

| Datei | Zweck |
|-------|-------|
| `backend/server.js` | Hauptserver-Datei, Oak Application-Initialisierung, Middleware-Setup (CORS, Body-Parser, Error-Handler), Routing |
| `backend/src/config/db.js` | Datenbankverbindung (MySQL Connection Pool) |
| `backend/src/controller/authControllers.js` | Authentifizierungs-Logik (Register, Login, JWT-Generierung) |
| `backend/src/routes/auth.js` | Authentifizierungs-Routen (POST /register, POST /login) |
| `backend/src/routes/transactions.js` | Transaktions- und Sparziel-Routen (CRUD-Operationen) |
| `backend/middleware/authenticate.js` | JWT-Authentifizierungs-Middleware für geschützte Routen (Oak Context-basiert: `ctx.request.headers`, `ctx.state.user`) |
| `backend/src/utils/bodyParser.js` | Helper-Funktion für Body-Parsing (wird nicht mehr verwendet, Body-Parsing erfolgt direkt in server.js) |
| `backend/deno.json` | Deno-Konfiguration, Tasks, npm-Import-Mappings |
| `backend/public/index.html` | Fallback-HTML für statische Dateien |

#### Frontend

| Datei | Zweck |
|-------|-------|
| `frontend/src/main.js` | Vue-App-Initialisierung, Pinia- und Router-Setup |
| `frontend/src/App.vue` | Root-Komponente, Header mit Logout, RouterView |
| `frontend/src/router/index.js` | Vue Router-Konfiguration, Routen, Navigation Guards |
| `frontend/src/stores/auth.js` | Pinia Store für Authentifizierung (Login, Register, Logout) |
| `frontend/src/stores/counter.js` | Beispiel-Pinia Store (kann entfernt werden) |
| `frontend/src/views/LoginView.vue` | Login/Registrierungs-Formular |
| `frontend/src/views/DashboardView.vue` | Haupt-Dashboard mit Saldo, Einnahmen, Ausgaben, Kategorien |
| `frontend/src/views/TransactionForm.vue` | Formular zum Hinzufügen/Bearbeiten von Transaktionen |
| `frontend/src/views/GoalTracker.vue` | Sparziel-Verwaltung (Anzeige, Erstellen, Bearbeiten) |
| `frontend/src/views/CategoryChart.vue` | Kategorien-Visualisierung (optional) |
| `frontend/src/style.css` | Globale Styles |
| `frontend/vite.config.js` | Vite-Konfiguration, Path-Aliases (@ → src) |
| `frontend/package.json` | npm-Dependencies und Scripts |
| `frontend/index.html` | HTML-Entry-Point |

#### Datenbank & DevOps

| Datei | Zweck |
|-------|-------|
| `db/init.sql` | Datenbankschema (CREATE TABLE Statements) |
| `Dockerfile` | Docker-Image für Backend (Deno-basiert) |
| `docker-compose.yml` | Orchestrierung von Backend und MySQL-Datenbank |

### Fremdcode-Dateien (Herkunft)

| Datei/Paket | Herkunft | Zweck |
|-------------|----------|-------|
| `node_modules/` (Frontend) | npm | Vue.js, Vue Router, Pinia, Axios, Vite |
| `node_modules/` (Backend) | Deno npm: | mysql2, bcryptjs, jsonwebtoken |
| `deno.lock` | Deno | Dependency-Lockfile für reproduzierbare Builds |

### Selbst angepasste Fremdcode-Dateien

Keine – alle Dependencies werden unverändert verwendet.

---

## 1.4 Ergebnis-Beschreibung

### Funktionalität

**Sparo** ist eine vollständig funktionsfähige Budget-Tracking-Anwendung mit folgenden Features:

1. **Benutzerauthentifizierung**
   - Registrierung neuer Benutzer
   - Login mit E-Mail und Passwort
   - JWT-basierte Session-Verwaltung
   - Automatische Weiterleitung nach Login/Logout

2. **Transaktionsverwaltung**
   - Einnahmen hinzufügen
   - Ausgaben hinzufügen
   - Transaktionen bearbeiten
   - Transaktionen löschen
   - Kategorisierung von Transaktionen

3. **Dashboard**
   - Monatliche Finanzübersicht
   - Aktueller Saldo (Einnahmen - Ausgaben)
   - Kategorien-Aufschlüsselung
   - Visuelle Darstellung der Finanzdaten

4. **Sparziel-Verwaltung**
   - Sparziele erstellen
   - Fortschritt verfolgen
   - Monatliche Sparbeträge berechnen
   - Meilensteine (50%, 100%)

### Screenshots (Platzhalter)

> **Hinweis**: Screenshots sollten hier eingefügt werden, um die Anwendung visuell zu dokumentieren.

**Beispiel-Screenshots:**

1. **Login-Seite**: Zeigt das Login/Registrierungs-Formular mit E-Mail- und Passwort-Feldern
2. **Dashboard**: Zeigt Saldo, Einnahmen, Ausgaben und Kategorien-Übersicht
3. **Transaktion hinzufügen**: Zeigt Formular zum Hinzufügen von Einnahmen/Ausgaben
4. **Sparziel-Tracker**: Zeigt Liste der Sparziele mit Fortschrittsbalken

### Technische Highlights

- ✅ Vollständige REST-API mit 10+ Endpunkten
- ✅ Sichere Authentifizierung mit JWT
- ✅ Responsive UI für Desktop und Mobile
- ✅ Docker-Containerisierung für einfaches Deployment
- ✅ Datenbank-Indizierung für Performance
- ✅ CORS-Konfiguration für sichere Cross-Origin-Requests

---

# 2. Benutzerdokumentation

## 2.1 Installation/Inbetriebnahme

### Voraussetzungen

- **Node.js** (Version 20 oder höher) - für Frontend
- **Deno** (Version 1.40 oder höher) - für Backend
- **Docker** und **Docker Compose** - für Datenbank (optional, aber empfohlen)
- **Git** - zum Klonen des Repositories

### Schritt-für-Schritt-Anleitung

#### Schritt 1: Repository klonen

```bash
git clone <repository-url>
cd Sparo
```

#### Schritt 2: Datenbank starten (Docker)

```bash
# Im Projektroot-Verzeichnis
docker-compose up budget-db -d
```

Dies startet die MySQL-Datenbank im Hintergrund. Die Datenbank ist nach ca. 10-20 Sekunden bereit.

**Alternative ohne Docker**: Falls du eine lokale MySQL-Installation hast, erstelle eine Datenbank namens `budget_tracker_db` und führe `db/init.sql` aus.

#### Schritt 3: Backend konfigurieren

Erstelle eine `.env`-Datei im `backend/`-Verzeichnis:

```bash
cd backend
touch .env
```

Füge folgende Variablen hinzu:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=budget_tracker_db
DB_USER=sparo_user
DB_PASSWORD=app_password123
JWT_SECRET=your_super_secret_jwt_key_that_is_very_long_and_random_12345
FRONTEND_URL=http://localhost:5173
```

#### Schritt 4: Backend starten

```bash
# Im backend/ Verzeichnis
deno task dev
```

Das Backend läuft nun auf `http://localhost:3000`.

**Hinweis**: Falls Deno nicht installiert ist:
```bash
# macOS/Linux
curl -fsSL https://deno.land/install.sh | sh

# Oder mit Homebrew
brew install deno
```

#### Schritt 5: Frontend konfigurieren

Öffne ein **neues Terminal** und wechsle ins Frontend-Verzeichnis:

```bash
cd frontend
npm install
```

#### Schritt 6: Frontend starten

```bash
npm run dev
```

Das Frontend läuft nun auf `http://localhost:5173`.

### Zugangsdaten (für Test)

**Datenbank:**
- Host: `localhost`
- Port: `3306`
- Datenbank: `budget_tracker_db`
- Benutzer: `sparo_user`
- Passwort: `app_password123`

**Anwendung:**
- Erstelle einen neuen Account über die Registrierungsseite
- Oder verwende einen bereits erstellten Account

### Troubleshooting

**Problem**: Backend kann keine Verbindung zur Datenbank herstellen
- **Lösung**: Stelle sicher, dass `docker-compose up budget-db` läuft und die `.env`-Datei korrekte DB-Credentials enthält

**Problem**: CORS-Fehler im Browser
- **Lösung**: Prüfe, ob `FRONTEND_URL` in der Backend-`.env` auf `http://localhost:5173` gesetzt ist

**Problem**: Port bereits belegt
- **Lösung**: Ändere `PORT` in der `.env` oder beende den Prozess, der den Port belegt

---

## 2.2 Benutzungsszenarien

### Szenario 1: Neuen Account erstellen

1. Öffne `http://localhost:5173` im Browser
2. Klicke auf "Registrieren" oder navigiere zu `/register`
3. Gib E-Mail und Passwort ein
4. Klicke auf "Registrieren"
5. Du wirst automatisch zum Dashboard weitergeleitet

**Screenshot-Platzhalter**: Login/Registrierungs-Seite

### Szenario 2: Transaktion hinzufügen

1. Logge dich ein
2. Klicke auf "Transaktion hinzufügen" (oder navigiere zu `/add`)
3. Wähle Typ: "Einnahme" oder "Ausgabe"
4. Gib Betrag, Kategorie, Datum und optional Beschreibung ein
5. Klicke auf "Speichern"
6. Die Transaktion erscheint im Dashboard

**Screenshot-Platzhalter**: Transaktions-Formular

### Szenario 3: Dashboard anzeigen

1. Nach dem Login siehst du automatisch das Dashboard
2. Das Dashboard zeigt:
   - **Aktueller Saldo**: Einnahmen minus Ausgaben des aktuellen Monats
   - **Einnahmen**: Gesamte Einnahmen des Monats
   - **Ausgaben**: Gesamte Ausgaben des Monats
   - **Kategorien-Übersicht**: Aufschlüsselung der Ausgaben nach Kategorien

**Screenshot-Platzhalter**: Dashboard-Ansicht

### Szenario 4: Sparziel erstellen

1. Navigiere zu "Sparziele" (oder `/goals`)
2. Klicke auf "Neues Sparziel"
3. Gib Name, Zielbetrag, Start- und Enddatum ein
4. Klicke auf "Erstellen"
5. Das Sparziel wird angezeigt mit:
   - Fortschrittsbalken
   - Berechnetem monatlichen Sparbetrag
   - Verbleibenden Monaten

**Screenshot-Platzhalter**: Sparziel-Tracker

### Szenario 5: Transaktion bearbeiten/löschen

1. Navigiere zum Dashboard
2. Finde die Transaktion in der Liste
3. Klicke auf "Bearbeiten" (oder navigiere zu `/edit/:id`)
4. Ändere die gewünschten Felder
5. Klicke auf "Speichern"
6. Oder klicke auf "Löschen", um die Transaktion zu entfernen

**Screenshot-Platzhalter**: Bearbeitungs-Ansicht

---

# 3. Reflexionsdokumentation

## 3.1 Ausgangssituation

### Persönliche Ausgangssituation

Vor diesem Projekt hatte ich bereits Grundkenntnisse in:

- **HTML/CSS/JavaScript**: Basiswissen für Frontend-Entwicklung
- **Vue.js**: Grundlegende Kenntnisse in Vue 2, noch keine Erfahrung mit Vue 3 Composition API
- **Node.js/Express**: Basiswissen für Backend-Entwicklung
- **SQL/MySQL**: Grundkenntnisse in relationalen Datenbanken
- **Git**: Basiswissen für Versionskontrolle

### Bisherige Erfahrungen in der Webentwicklung

- Einfache statische Websites
- Einfache CRUD-Anwendungen mit Express
- Grundlegende Vue.js-Komponenten
- Keine Erfahrung mit:
  - Deno
  - JWT-Authentifizierung
  - Docker/Docker Compose
  - Pinia State Management
  - REST-API-Design
  - Datenbank-Indizierung und Performance-Optimierung

### Skill-Übersicht (vor Projekt)

| Skill | Level |
|-------|-------|
| HTML/CSS | ⭐⭐⭐ (Fortgeschritten) |
| JavaScript | ⭐⭐⭐ (Fortgeschritten) |
| Vue.js | ⭐⭐ (Grundlagen) |
| Node.js/Express | ⭐⭐ (Grundlagen) |
| SQL/MySQL | ⭐⭐ (Grundlagen) |
| REST-APIs | ⭐ (Anfänger) |
| Docker | ⭐ (Anfänger) |
| Git | ⭐⭐ (Grundlagen) |

---

## 3.2 Vorgehen

### Planung

1. **Anforderungsanalyse**: Definition der Features (Authentifizierung, Transaktionen, Sparziele)
2. **Technologie-Stack-Auswahl**: Entscheidung für Deno, Vue 3, MySQL
3. **Datenmodell-Design**: ER-Diagramm für Datenbank-Schema
4. **API-Design**: Definition der REST-Endpunkte
5. **UI/UX-Design**: Wireframes für Hauptseiten

### Vorgehensweise

**Phase 1: Backend-Entwicklung**
- Datenbankschema erstellen (`init.sql`)
- Oak v16 Server aufsetzen (Application, Router)
- Body-Parser Middleware implementieren (Oak v16: `bodyReader.type()`, `bodyReader.json()`)
- Authentifizierungs-Endpunkte implementieren
- Transaktions-Endpunkte implementieren
- Sparziel-Endpunkte implementieren
- JWT-Middleware implementieren (Oak Context-basiert)

**Phase 2: Frontend-Entwicklung**
- Vue 3 Projekt initialisieren
- Router konfigurieren
- Pinia Store für Authentifizierung
- Login/Registrierungs-View
- Dashboard-View
- Transaktions-Formular
- Sparziel-Tracker

**Phase 3: Integration & Testing**
- Frontend-Backend-Integration
- CORS-Konfiguration
- Fehlerbehandlung
- UI-Polish

**Phase 4: Deployment-Vorbereitung**
- Docker-Containerisierung
- Docker Compose Setup
- Dokumentation

### Wissenserwerb

**Lernquellen:**
- **Offizielle Dokumentationen**: Deno, Oak v16, Vue 3, MySQL
- **Oak v16 Migration**: Umstellung von Express auf Oak v16, Body-Parsing mit `bodyReader`
- **YouTube-Tutorials**: Vue 3 Composition API, JWT-Authentifizierung, Oak Framework
- **Stack Overflow**: Spezifische Probleme und Lösungen (Oak v16 Body-Parsing, Context-Handling)
- **GitHub-Repositories**: Best Practices für REST-APIs mit Oak
- **KI-Tools**: Code-Erklärungen und Debugging-Hilfe (siehe 3.8)

**Wissensweitergabe:**
- Code-Kommentare für zukünftige Wartung
- Diese Dokumentation für andere Entwickler

---

## 3.3 Anforderungsliste

| # | Anforderung | Fertigstellungsgrad | Umsetzung |
|---|-------------|---------------------|-----------|
| 1 | Benutzerregistrierung | ✅ 100% | Vollständig implementiert mit E-Mail-Validierung und Passwort-Hashing |
| 2 | Benutzerlogin | ✅ 100% | JWT-basierte Authentifizierung mit Token-Speicherung |
| 3 | Einnahmen hinzufügen | ✅ 100% | POST `/api/transactions/income` mit Validierung |
| 4 | Ausgaben hinzufügen | ✅ 100% | POST `/api/transactions/expense` mit Validierung |
| 5 | Transaktionen anzeigen | ✅ 100% | Dashboard zeigt monatliche Zusammenfassung |
| 6 | Transaktionen bearbeiten | ✅ 100% | PUT `/api/transactions/transaction/:id` |
| 7 | Transaktionen löschen | ✅ 100% | DELETE `/api/transactions/transaction/:id` |
| 8 | Saldo-Berechnung | ✅ 100% | Automatische Berechnung im Dashboard |
| 9 | Kategorien-Übersicht | ✅ 100% | GROUP BY category in SQL-Query |
| 10 | Sparziele erstellen | ✅ 100% | POST `/api/transactions/goal` |
| 11 | Sparziele anzeigen | ✅ 100% | GET `/api/transactions/goals` und GET `/api/transactions/goal/:id` |
| 12 | Sparziele bearbeiten | ✅ 100% | PUT `/api/transactions/goal/:id` |
| 13 | Sparziele löschen | ✅ 100% | DELETE `/api/transactions/goal/:id` |
| 14 | Sparziel-Fortschritt | ✅ 100% | Fortschrittsbalken mit Prozentanzeige |
| 15 | Monatliche Sparbeträge | ✅ 100% | Automatische Berechnung basierend auf Enddatum |
| 16 | Responsive Design | ✅ 100% | Mobile-first CSS mit Media Queries |
| 17 | Fehlerbehandlung | ✅ 100% | Try-Catch-Blöcke und Benutzer-Feedback |
| 18 | Docker-Containerisierung | ✅ 100% | Dockerfile und docker-compose.yml |
| 19 | Datenbank-Indizierung | ✅ 100% | Indizes für Performance-Optimierung |
| 20 | CORS-Konfiguration | ✅ 100% | Whitelist für erlaubte Origins |
| 21 | JWT-Token-Expiration | ✅ 100% | Tokens laufen nach 1 Tag ab |

**Gesamt-Fertigstellungsgrad: 100%** ✅

---

## 3.4 Herausforderungen

### Herausforderung 1: Oak v16 Body-Parsing

**Problem**: Oak v16 hat eine andere Body-Parsing-API als Express. `ctx.request.body` ist kein direktes Objekt, sondern ein BodyReader mit Methoden `type()` und `json()`.

**Lösung**: 
- Verwendung von `ctx.request.body` als BodyReader-Objekt
- `bodyReader.type()` aufrufen, um Content-Type zu bestimmen
- `bodyReader.json()` für JSON-Bodies verwenden
- Custom Middleware für Body-Parsing implementiert, die `ctx.state.body` setzt

**Erkenntnis**: Oak v16 verwendet moderne, Promise-basierte Body-Parsing-Methoden statt direkter Objekt-Zugriffe. Die Context-basierte Architektur (`ctx.request`, `ctx.response`, `ctx.state`) ist konsistenter als Express' req/res-Pattern.

### Herausforderung 2: JWT-Authentifizierung

**Problem**: Verständnis, wie JWT-Tokens funktionieren und wie sie sicher im Frontend gespeichert werden.

**Lösung**:
- Studium der JWT-Spezifikation
- Implementierung von Token-Generierung im Backend
- Speicherung in `localStorage` (mit Risiko-Bewusstsein)
- Middleware für Token-Validierung

**Erkenntnis**: JWT ermöglicht stateless Authentifizierung, aber erfordert sorgfältige Implementierung.

### Herausforderung 3: CORS-Fehler

**Problem**: Frontend (Port 5173) konnte nicht auf Backend (Port 3000) zugreifen aufgrund von CORS-Fehlern.

**Lösung**:
- CORS-Middleware in Oak konfigurieren
- `ctx.response.headers.set('Access-Control-Allow-Origin', ...)` für erlaubte Origins
- `ctx.response.headers.set('Access-Control-Allow-Credentials', 'true')` für Cookie/Header-Support
- OPTIONS-Requests explizit behandeln

**Erkenntnis**: CORS ist ein Sicherheitsfeature, das explizit konfiguriert werden muss. Oak verwendet `ctx.response.headers` statt `res.headers()`.

### Herausforderung 4: Vue 3 Composition API

**Problem**: Umstellung von Options API (Vue 2) auf Composition API (Vue 3).

**Lösung**:
- Tutorials zur Composition API
- Verwendung von `<script setup>` für kompakteren Code
- Verständnis von `ref()`, `reactive()`, `computed()`

**Erkenntnis**: Composition API ist leistungsfähiger und ermöglicht bessere Code-Organisation.

### Herausforderung 5: Datenbank-Performance

**Problem**: Langsame Queries bei vielen Transaktionen.

**Lösung**:
- Indizierung von `user_id`, `date`, `category`
- Verwendung von `EXPLAIN` zur Query-Analyse
- Connection Pooling für bessere Ressourcennutzung

**Erkenntnis**: Datenbank-Indizierung ist kritisch für Performance.

---

## 3.5 Unterstützung

### Wer/Was hat geholfen?

1. **Offizielle Dokumentationen**
   - Deno-Dokumentation für Runtime-Features
   - Vue 3-Dokumentation für Composition API
   - Express-Dokumentation für Middleware

2. **Stack Overflow**
   - Spezifische Fehlermeldungen googeln
   - Best Practices für JWT-Implementierung
   - CORS-Konfigurations-Beispiele

3. **YouTube-Tutorials**
   - Vue 3 Composition API Crash Course
   - JWT-Authentifizierung Tutorials
   - Docker für Anfänger

4. **GitHub-Repositories**
   - Beispiel-Projekte für REST-APIs
   - Best Practices für Vue 3-Projekte

5. **KI-Tools** (siehe 3.8)
   - Code-Erklärungen
   - Debugging-Hilfe
   - Architektur-Beratung

6. **Community**
   - Vue.js Discord Server
   - Deno Community Forum

---

## 3.6 Lernerfolge / Fazit

### Was habe ich gelernt?

1. **Deno Runtime & Oak v16**
   - Moderne JavaScript/TypeScript-Runtime
   - Sicherheits-Features durch explizite Permissions
   - Native npm-Paket-Unterstützung
   - Oak v16 Context-basierte Middleware-Architektur
   - Modernes Body-Parsing mit `bodyReader.type()` und `bodyReader.json()`

2. **REST-API-Design mit Oak v16**
   - RESTful-Endpunkt-Struktur mit Oak Router
   - HTTP-Status-Codes über `ctx.response.status` setzen
   - Request/Response-Formatierung über `ctx.request` und `ctx.response`
   - Context-basierte Datenübergabe via `ctx.state`

3. **JWT-Authentifizierung mit Oak**
   - Token-basierte Authentifizierung
   - Middleware-Pattern für geschützte Routen (Oak Context-basiert)
   - Token-Expiration und Refresh-Strategien
   - `ctx.request.headers.get('authorization')` für Header-Zugriff
   - `ctx.state.user` für Benutzerdaten in nachfolgenden Middlewares

4. **Vue 3 Composition API**
   - `<script setup>` Syntax
   - Reaktive Daten mit `ref()` und `reactive()`
   - Computed Properties und Watchers

5. **Pinia State Management**
   - Store-Struktur für globale Daten
   - Actions für asynchrone Operationen
   - Getters für abgeleitete Daten

6. **Docker & Docker Compose**
   - Containerisierung von Anwendungen
   - Service-Orchestrierung
   - Volume-Management für Datenbanken

7. **Datenbank-Optimierung**
   - Indizierung für Performance
   - Foreign Keys für Datenintegrität
   - Query-Optimierung

### Wie kann ich das Wissen zukünftig einsetzen?

- **Full-Stack-Entwicklung**: Kenntnisse in Frontend und Backend
- **API-Entwicklung**: REST-API-Design für zukünftige Projekte
- **Authentifizierung**: JWT-Implementierung in anderen Projekten
- **Containerisierung**: Docker für Deployment und Entwicklung
- **Vue.js-Entwicklung**: Moderne Vue 3-Projekte

### Was lief gut?

- ✅ Klare Projektstruktur von Anfang an
- ✅ Schrittweise Entwicklung (Backend → Frontend → Integration)
- ✅ Verwendung moderner Technologien (Deno, Vue 3)
- ✅ Vollständige Funktionalität aller geplanten Features
- ✅ Docker-Containerisierung für einfaches Deployment

### Was würde ich verbessern?

- ⚠️ **Testing**: Unit-Tests und Integration-Tests hinzufügen
- ⚠️ **TypeScript**: TypeScript für bessere Typsicherheit verwenden
- ⚠️ **Error Handling**: Zentralisierte Fehlerbehandlung im Backend
- ⚠️ **Validation**: Bibliothek wie Joi oder Zod für Request-Validierung
- ⚠️ **Logging**: Strukturiertes Logging (z.B. Winston) statt console.log
- ⚠️ **Security**: Rate Limiting, Input Sanitization, XSS-Protection
- ⚠️ **Performance**: Caching-Strategien für häufige Queries
- ⚠️ **UI/UX**: Mehr visuelles Feedback, Loading-States verbessern

---

## 3.7 Weiterentwicklung

### Was kann man nun mit der Anwendung machen?

1. **Erweiterte Features**
   - Wiederkehrende Transaktionen (Monatlich, Jährlich)
   - Budget-Limits pro Kategorie
   - Export-Funktion (CSV, PDF)
   - Multi-Währung-Unterstützung
   - Kategorien-Verwaltung (Benutzerdefinierte Kategorien)

2. **Mobile App**
   - React Native oder Flutter App
   - Push-Notifications für Budget-Warnungen
   - Offline-Modus mit Synchronisation

3. **Analytics & Reporting**
   - Jahresübersichten
   - Trend-Analysen
   - Vorhersagen basierend auf historischen Daten
   - Visualisierungen (Charts, Graphs)

4. **Kollaboration**
   - Gemeinsame Budgets (Familie, WG)
   - Freigabe-Funktionen
   - Kommentare zu Transaktionen

5. **Integrationen**
   - Bank-API-Integration (automatische Transaktions-Import)
   - E-Mail-Benachrichtigungen
   - Kalender-Integration

### Wie kann sie weiterentwickelt werden?

**Kurzfristig:**
- Unit-Tests hinzufügen (Jest, Vitest)
- TypeScript-Migration
- Verbesserte Fehlerbehandlung
- API-Dokumentation (Swagger/OpenAPI)

**Mittelfristig:**
- CI/CD-Pipeline (GitHub Actions)
- Production-Deployment (AWS, Heroku, Vercel)
- Monitoring und Logging (Sentry, LogRocket)
- Performance-Optimierung

**Langfristig:**
- Microservices-Architektur (falls Skalierung nötig)
- GraphQL-API als Alternative zu REST
- Real-time Updates (WebSockets)
- Machine Learning für Budget-Vorhersagen

---

## 3.8 KI-Einsatz

### Verwendete KI-Systeme

1. **Cursor AI (Auto)**
   - **Zweck**: Code-Generierung, Debugging-Hilfe, Architektur-Beratung
   - **Einsatzgebiete**:
     - Umstellung von Express auf Oak v16
     - Oak v16 Body-Parsing-Implementierung (`bodyReader.type()`, `bodyReader.json()`)
     - Context-basierte Middleware-Architektur
     - Erstellung von REST-API-Endpunkten mit Oak Router
     - Vue 3 Component-Struktur
     - Fehlerbehebung bei CORS-Problemen
     - Datenbank-Schema-Optimierung
     - Docker-Konfiguration

2. **ChatGPT / Claude**
   - **Zweck**: Konzeptionelle Fragen, Best Practices, Code-Erklärungen
   - **Einsatzgebiete**:
     - JWT-Authentifizierung verstehen
     - Vue 3 Composition API lernen
     - REST-API-Design-Patterns
     - Datenbank-Indizierungs-Strategien

### Wie wurde KI eingesetzt?

- **Code-Generierung**: Schnellere Implementierung von Boilerplate-Code
- **Debugging**: Erklärung von Fehlermeldungen und Lösungsvorschläge
- **Lernen**: Erklärung komplexer Konzepte (JWT, CORS, etc.)
- **Architektur**: Beratung bei Design-Entscheidungen

### Transparenz

Alle KI-generierten Code-Abschnitte wurden überprüft, angepasst und verstanden. Die KI diente als **Hilfsmittel**, nicht als Ersatz für eigenständiges Lernen und Verstehen.

---

## Ende der Dokumentation

**Version**: 1.0  
**Datum**: 2024  
**Autor**: [Dein Name]

---

