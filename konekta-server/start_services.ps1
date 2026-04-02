# Start KONEK TA Services
Write-Host "Starting KONEK TA Services..." -ForegroundColor Green

# Start Django Backend
Write-Host "Starting Django Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\fulls\Documents\Tridiots\KONEK TA\Website\konekta-server\konekta-backend\konekta'; python manage.py runserver 0.0.0.0:8000"

# Wait a moment
Start-Sleep -Seconds 3

# Start React Frontend
Write-Host "Starting React Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\fulls\Documents\Tridiots\KONEK TA\Website\konekta-server\konekta-frontend'; npm run dev"

Write-Host "Services started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Admin:   http://localhost:8000/admin" -ForegroundColor Cyan
