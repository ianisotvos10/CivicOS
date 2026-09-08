#!/bin/bash
# CivicOS - Oprire toate serviciile
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/.logs"

echo "Oprire servicii CivicOS..."

for service in frontend backend ai-service; do
    pid_file="$LOG_DIR/$service.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        kill "$pid" 2>/dev/null && echo "  ✓ $service oprit (PID: $pid)" || echo "  - $service nu rula"
        rm "$pid_file"
    fi
done

# Elibereaza porturile
fuser -k 5173/tcp 2>/dev/null || true
fuser -k 8081/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true

echo "Toate serviciile oprite."

