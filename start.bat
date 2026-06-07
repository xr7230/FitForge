@echo off
title FitForge

echo.
echo   FitForge - Your Personal Fitness Buddy
echo   ======================================
echo.

cd /d "D:\exersie\apps\api"
echo   [1/2] Starting API on port 3001...
start "FitForge-API" cmd /c "npx ts-node-dev --respawn src/index.ts"

cd /d "D:\exersie\apps\web"
echo   [2/2] Starting Web on port 5173...
start "FitForge-Web" cmd /c "npx vite --host 0.0.0.0"

echo.
echo   Ready!
echo.
echo   Web: http://localhost:5173
echo   API: http://localhost:3001
echo.
echo   Opening browser in 8 seconds...
timeout /t 8 /nobreak >nul
start http://localhost:5173
echo.
pause