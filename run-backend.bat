@echo off
echo ========================================================
echo   Starting ShopVerse Flask Backend (Port 5000)
echo ========================================================
cd backend

IF NOT EXIST venv (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate

echo [INFO] Installing / updating requirements...
pip install -r requirements.txt

IF NOT EXIST .env (
    echo [WARNING] .env file not found! Copying from .env.example...
    copy .env.example .env
    echo [ACTION REQUIRED] Please edit backend\.env with your Aiven MySQL credentials!
    pause
)

echo [INFO] Starting Flask backend server...
python run.py
pause
