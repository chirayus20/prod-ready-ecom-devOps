@echo off
echo ========================================================
echo   Starting ShopVerse React + Vite Frontend (Port 3000)
echo ========================================================
cd frontend

IF NOT EXIST node_modules (
    echo [INFO] Installing npm dependencies...
    call npm install
)

echo [INFO] Starting Vite development server...
call npm run dev
pause
