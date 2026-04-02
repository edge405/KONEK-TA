@echo off
REM KONEK TA Development Startup Script for Windows
REM This script starts both the Django backend and React frontend

echo 🚀 Starting KONEK TA Development Environment...
echo ==============================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Start backend
echo 🐍 Starting Django Backend...
cd konekta-backend\konekta

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Run migrations
echo 🗄️ Running database migrations...
python manage.py makemigrations
python manage.py migrate

REM Create superuser if it doesn't exist
echo 👤 Creating superuser (if needed)...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123') and print('Superuser created: admin/admin123') or print('Superuser already exists')"

REM Start Django server in new window
echo 🚀 Starting Django server on http://localhost:8000
start "Django Backend" cmd /k "python manage.py runserver 0.0.0.0:8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo ⚛️ Starting React Frontend...
cd ..\..\konekta-frontend

REM Install dependencies
echo 📦 Installing Node.js dependencies...
npm install

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    copy .env.example .env
)

REM Start React development server in new window
echo 🚀 Starting React development server on http://localhost:5173
start "React Frontend" cmd /k "npm run dev"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak >nul

echo 🎉 KONEK TA is now running!
echo ==============================================
echo 🌐 Frontend: http://localhost:5173
echo 🐍 Backend:  http://localhost:8000
echo 📊 Admin:   http://localhost:8000/admin
echo ==============================================
echo.
echo Both servers are running in separate windows.
echo Close the windows to stop the servers.
echo.
pause
