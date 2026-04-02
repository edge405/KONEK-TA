# KONEK TA Development Startup Script for PowerShell
# This script starts both the Django backend and React frontend

Write-Host "🚀 Starting KONEK TA Development Environment..." -ForegroundColor Blue
Write-Host "==============================================" -ForegroundColor Blue

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Blue

# Check if Python is installed
if (-not (Test-Command "python")) {
    Write-Host "❌ Python is not installed. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed. Please install npm" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Function to start backend
function Start-Backend {
    Write-Host "🐍 Starting Django Backend..." -ForegroundColor Blue
    Set-Location "konekta-backend\konekta"
    
    # Check if virtual environment exists
    if (-not (Test-Path "venv")) {
        Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
        python -m venv venv
    }
    
    # Activate virtual environment
    Write-Host "🔧 Activating virtual environment..." -ForegroundColor Blue
    & "venv\Scripts\Activate.ps1"
    
    # Install dependencies
    Write-Host "📦 Installing Python dependencies..." -ForegroundColor Blue
    pip install -r requirements.txt
    
    # Run migrations
    Write-Host "🗄️ Running database migrations..." -ForegroundColor Blue
    python manage.py makemigrations
    python manage.py migrate
    
    # Create superuser if it doesn't exist
    Write-Host "👤 Creating superuser (if needed)..." -ForegroundColor Blue
    python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123') and print('Superuser created: admin/admin123') or print('Superuser already exists')"
    
    # Start Django server
    Write-Host "🚀 Starting Django server on http://localhost:8000" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python manage.py runserver 0.0.0.0:8000"
}

# Function to start frontend
function Start-Frontend {
    Write-Host "⚛️ Starting React Frontend..." -ForegroundColor Blue
    Set-Location "..\..\konekta-frontend"
    
    # Install dependencies
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Blue
    npm install
    
    # Create .env file if it doesn't exist
    if (-not (Test-Path ".env")) {
        Write-Host "📝 Creating .env file..." -ForegroundColor Blue
        Copy-Item ".env.example" ".env"
    }
    
    # Start React development server
    Write-Host "🚀 Starting React development server on http://localhost:5173" -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
}

# Start both servers
Write-Host "🚀 Starting servers..." -ForegroundColor Blue

# Start backend
Start-Backend

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend
Start-Frontend

# Wait a moment for frontend to start
Start-Sleep -Seconds 3

Write-Host "🎉 KONEK TA is now running!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "🐍 Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "📊 Admin:   http://localhost:8000/admin" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host "Both servers are running in separate PowerShell windows." -ForegroundColor Yellow
Write-Host "Close the windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this script..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
