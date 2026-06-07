#!/bin/bash
echo "===================================="
echo "  FitForge - Local Dev Setup"
echo "===================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    exit 1
fi
echo "[OK] Node.js found"

echo ""
echo "[1/4] Installing API dependencies..."
cd apps/api && npm install
echo ""

echo "[2/4] Installing Web dependencies..."
cd ../web && npm install
echo ""

echo "[3/4] Starting API server (port 3001)..."
cd ../api
npx ts-node-dev src/index.ts &
API_PID=$!
echo "[OK] API starting on http://localhost:3001"
echo ""

echo "[4/4] Starting Web dev server (port 3000)..."
cd ../web
npx vite --host &
WEB_PID=$!
echo "[OK] Web starting on http://localhost:3000"
echo ""

echo "===================================="
echo "  FitForge is running!"
echo "  Web:  http://localhost:3000"
echo "  API:  http://localhost:3001"
echo "===================================="
echo ""
echo "Prerequisites: PostgreSQL + Redis running locally"
echo "Or use: docker-compose up postgres redis -d"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $API_PID $WEB_PID 2>/dev/null; exit 0" INT TERM
wait
