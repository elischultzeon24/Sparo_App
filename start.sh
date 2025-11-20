#!/bin/bash

# Farben für bessere Ausgabe
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starte Sparo-Anwendung...${NC}\n"

# Prüfe ob Docker verwendet werden soll
USE_DOCKER=${1:-"local"}

# Prüfe ob Docker läuft (für Docker-Modus)
if [ "$USE_DOCKER" = "docker" ] || [ "$USE_DOCKER" = "local" ]; then
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker läuft nicht!${NC}"
        echo -e "${YELLOW}Bitte starte Docker Desktop und versuche es erneut.${NC}\n"
        exit 1
    fi
fi

if [ "$USE_DOCKER" = "docker" ]; then
    echo -e "${YELLOW}🐳 Starte mit Docker...${NC}"
    docker-compose -f docker-compose.yml up -d
    echo -e "\n${GREEN}✅ Docker-Services gestartet!${NC}\n"
    echo -e "${GREEN}🔧 Backend:  http://localhost:3000${NC}"
    echo -e "${GREEN}🗄️  Datenbank: localhost:3306${NC}\n"
    echo -e "${YELLOW}Frontend muss separat gestartet werden:${NC}"
    echo -e "${YELLOW}  cd frontend && npm run dev${NC}\n"
    exit 0
fi


echo -e "${YELLOW}1. Starte Datenbank (Docker)...${NC}"
docker-compose -f docker-compose.dev.yml up -d budget-db


echo -e "${YELLOW}   Warte auf Datenbank...${NC}"
sleep 5


echo -e "${YELLOW}2. Starte Backend-Server (lokal)...${NC}"


export DB_HOST=localhost
export DB_PORT=3306
export DB_DATABASE=budget_tracker_db
export DB_USER=sparo_user
export DB_PASSWORD=app_password123
export PORT=3000
export FRONTEND_URL=http://localhost:5173
export JWT_SECRET=your_super_secret_jwt_key_that_is_very_long_and_random_12345

cd backend

deno task dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..


sleep 3
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend konnte nicht gestartet werden!${NC}"
    echo -e "${YELLOW}Letzte Logs:${NC}"
    tail -20 backend.log
    exit 1
fi


sleep 2


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
echo -e "${YELLOW}Backend-Logs werden in backend.log geschrieben${NC}\n"


cleanup() {
    echo -e "\n${YELLOW}🛑 Beende Services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo -e "${GREEN}✅ Services beendet${NC}"
    exit 0
}


trap cleanup SIGINT SIGTERM


wait

