#!/bin/bash
# ============================================================
# CivicOS - Script de pornire toate serviciile local
# Utilizare: chmod +x start.sh && ./start.sh
# ============================================================

set -e
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"

echo -e "${CYAN}=======================================${NC}"
echo -e "${CYAN}   CivicOS - Pornire servicii locale   ${NC}"
echo -e "${CYAN}=======================================${NC}"

# ─────────────────────────────────────────
# 1. PostgreSQL & Redis
# ─────────────────────────────────────────
echo -e "\n${YELLOW}[1/6] Pornire PostgreSQL & Redis...${NC}"
if pg_lsclusters 2>/dev/null | grep -q "online"; then
    echo -e "${GREEN}  ✓ PostgreSQL deja pornit${NC}"
else
    pg_ctlcluster 16 main start 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}  ✓ PostgreSQL pornit${NC}"
fi

# Creaza DB daca nu exista
sudo -u postgres psql -p 5433 -P pager=off -c "CREATE USER civicos_user WITH PASSWORD 'civicos_password';" 2>/dev/null || true
sudo -u postgres psql -p 5433 -P pager=off -c "CREATE DATABASE civicos_db OWNER civicos_user;" 2>/dev/null || true
sudo -u postgres psql -p 5433 -P pager=off -c "GRANT ALL PRIVILEGES ON DATABASE civicos_db TO civicos_user;" 2>/dev/null || true

# Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Redis deja pornit${NC}"
else
    redis-server --daemonize yes 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}  ✓ Redis pornit${NC}"
fi

# ─────────────────────────────────────────
# 2. AI Service (FastAPI Python / OCR)
# ─────────────────────────────────────────
echo -e "\n${YELLOW}[2/6] Pornire AI Service (Python/FastAPI) pe portul 8001...${NC}"
if curl -sf http://localhost:8001/docs > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ AI Service deja pornit${NC}"
else
    cd "$ROOT_DIR/backend-ai"
    if [ ! -d venv ]; then
        python3 -m venv venv
        ./venv/bin/pip install --upgrade pip -q
        ./venv/bin/pip install fastapi uvicorn pydantic python-multipart google-genai requests -q
    fi
    
    nohup ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 \
        > "$LOG_DIR/ai-service.log" 2>&1 &
    echo $! > "$LOG_DIR/ai-service.pid"
    sleep 3
    
    if curl -sf http://localhost:8001/docs > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ AI Service pornit (PID: $(cat $LOG_DIR/ai-service.pid))${NC}"
    else
        echo -e "${RED}  ✗ AI Service nu s-a pornit. Vezi: $LOG_DIR/ai-service.log${NC}"
    fi
fi

# ─────────────────────────────────────────
# 3. Microserviciu Notificări (Go / WebSocket)
# ─────────────────────────────────────────
echo -e "\n${YELLOW}[3/6] Pornire Notificări WebSocket (Go) pe portul 9090...${NC}"
if curl -sf http://localhost:9090/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Notification Service deja pornit${NC}"
else
    cd "$ROOT_DIR/backend-notifications"
    if [ ! -f ./notifications ]; then
        go build -o notifications .
    fi
    nohup ./notifications > "$LOG_DIR/notifications.log" 2>&1 &
    echo $! > "$LOG_DIR/notifications.pid"
    sleep 2

    if curl -sf http://localhost:9090/health > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Notification Service pornit (PID: $(cat $LOG_DIR/notifications.pid))${NC}"
    else
        echo -e "${RED}  ✗ Notification Service nu s-a pornit. Vezi: $LOG_DIR/notifications.log${NC}"
    fi
fi

# ─────────────────────────────────────────
# 4. Backend Spring Boot (Java)
# ─────────────────────────────────────────
echo -e "\n${YELLOW}[4/6] Pornire Backend Java (Spring Boot) pe portul 8081...${NC}"
if curl -sf http://localhost:8081/api/v1/requests > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Backend deja pornit${NC}"
else
    fuser -k 8081/tcp 2>/dev/null || true
    sleep 1
    
    cd "$ROOT_DIR/backend-core"
    nohup ./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Xmx512m" \
        > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$LOG_DIR/backend.pid"
    
    echo -n "  Asteptam Spring Boot"
    for i in {1..30}; do
        sleep 2
        echo -n "."
        if curl -sf http://localhost:8081/api/v1/requests > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}  ✓ Backend pornit (PID: $(cat $LOG_DIR/backend.pid))${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo ""
            echo -e "${RED}  ✗ Backend nu s-a pornit in 60s. Vezi: $LOG_DIR/backend.log${NC}"
        fi
    done
fi

# ─────────────────────────────────────────
# 5. Frontend React (Vite)
# ─────────────────────────────────────────
echo -e "\n${YELLOW}[5/6] Pornire Frontend React (Vite) pe portul 5173...${NC}"
if curl -sf http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Frontend deja pornit${NC}"
else
    cd "$ROOT_DIR/frontend"
    [ -d node_modules ] || npm install -q
    
    nohup npm run dev -- --host 0.0.0.0 \
        > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$LOG_DIR/frontend.pid"
    sleep 4
    echo -e "${GREEN}  ✓ Frontend pornit (PID: $(cat $LOG_DIR/frontend.pid))${NC}"
fi

# ─────────────────────────────────────────
# Sumar
# ─────────────────────────────────────────
echo ""
echo -e "${CYAN}======================================================${NC}"
echo -e "${GREEN}  Toate serviciile CivicOS sunt pornite și gata!${NC}"
echo -e "${CYAN}======================================================${NC}"
echo ""
echo -e "  ${GREEN}Portal Cetățean:      ${NC}http://localhost:5173/"
echo -e "  ${GREEN}Portal Administrație: ${NC}http://localhost:5173/admin"
echo -e "  ${GREEN}Notificări WebSocket: ${NC}ws://localhost:9090/ws"
echo -e "  ${GREEN}Backend API:          ${NC}http://localhost:8081/api/v1/requests"
echo -e "  ${GREEN}AI Service & OCR:     ${NC}http://localhost:8001/docs"
echo -e "  ${GREEN}Redis Caching:        ${NC}localhost:6379 (PONG)"
echo -e "  ${GREEN}Logs:                 ${NC}$LOG_DIR/"
echo ""
echo -e "${YELLOW}  Pentru a opri toate serviciile: ./stop.sh${NC}"
echo ""
