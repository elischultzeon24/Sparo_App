#!/bin/bash

# Farben für bessere Ausgabe
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starte Sparo-Anwendung...${NC}\n"

# Prüfe ob Docker verwendet werden soll
USE_DOCKER=${1:-"local"}

if [ "$USE_DOCKER" = "docker" ]; then
    echo -e "${YELLOW}🐳 Starte mit Docker...${NC}"
    docker-compose up -d
    echo -e "\n${GREEN}✅ Docker-Services gestartet!${NC}\n"
    echo -e "${GREEN}🔧 Backend:  http://localhost:3000${NC}"
    echo -e "${GREEN}🗄️  Datenbank: localhost:3306${NC}\n"
    echo -e "${YELLOW}Frontend muss separat gestartet werden:${NC}"
    echo -e "${YELLOW}  cd frontend && npm run dev${NC}\n"
    exit 0
fi

# Lokaler Modus (ohne Docker für Backend)
# 1. Docker Compose starten (nur Datenbank)
echo -e "${YELLOW}1. Starte Datenbank (Docker)...${NC}"
docker-compose up -d budget-db

# Warte bis Datenbank bereit ist
echo -e "${YELLOW}   Warte auf Datenbank...${NC}"
sleep 5

# 2. Backend starten
echo -e "${YELLOW}2. Starte Backend-Server (lokal)...${NC}"
cd backend
deno task dev &
BACKEND_PID=$!
cd ..

# Warte kurz
sleep 2

# 3. Frontend starten
echo -e "${YELLOW}3. Starte Frontend...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ Alles gestartet!${NC}\n"
echo -e "${GREEN}📊 Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}🔧 Backend:  http://localhost:3000${NC}"
echo -e "${GREEN}🗄️  Datenbank: localhost:3306${NC}\n"
echo -e "${YELLOW}Zum Beenden: Drücke Ctrl+C${NC}\n"

# Warte auf Ctrl+C
wait

