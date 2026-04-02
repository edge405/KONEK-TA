# KONEK TA Port Configuration

## Default Ports

### Frontend (React + Vite)
- **Port**: 5173
- **URL**: http://localhost:5173
- **Framework**: Vite (default port)
- **Hot Reload**: Enabled

### Backend (Django)
- **Port**: 8000
- **URL**: http://localhost:8000
- **API**: http://localhost:8000/api/
- **Admin**: http://localhost:8000/admin/
- **Framework**: Django development server

## Port Configuration in Scripts

All startup scripts have been updated to use the correct ports:

### Bash Script (start.sh)
```bash
# Backend port check
if port_in_use 8000; then
    echo "⚠️  Port 8000 is already in use. Backend might already be running."
fi

# Frontend port check  
if port_in_use 5173; then
    echo "⚠️  Port 5173 is already in use. Frontend might already be running."
fi

# Start servers
python manage.py runserver 0.0.0.0:8000 &  # Backend
npm run dev &                              # Frontend (Vite uses 5173 by default)
```

### PowerShell Script (start.ps1)
```powershell
# Start Django server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python manage.py runserver 0.0.0.0:8000"

# Start React development server  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
```

### Batch Script (start.bat)
```cmd
REM Start Django server
start "Django Backend" cmd /k "python manage.py runserver 0.0.0.0:8000"

REM Start React development server
start "React Frontend" cmd /k "npm run dev"
```

## CORS Configuration

The Django backend has been configured to allow requests from the correct frontend port:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

### Backend (settings.py)
```python
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

## Custom Port Configuration

If you need to use different ports, update the following:

### Change Frontend Port
```bash
# In vite.config.js
export default defineConfig({
  server: {
    port: 3000  # Change to desired port
  }
})
```

### Change Backend Port
```bash
# In startup scripts
python manage.py runserver 0.0.0.0:8001  # Change to desired port
```

### Update CORS Settings
```python
# In settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Update to match frontend port
    "http://127.0.0.1:3000",
]
```

## Port Troubleshooting

### Check Port Usage
```bash
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :8000

# Linux/macOS
lsof -i :5173
lsof -i :8000
```

### Kill Processes Using Ports
```bash
# Windows
taskkill /PID <PID> /F

# Linux/macOS
kill -9 <PID>
```

### Common Port Conflicts
- **Port 5173**: Usually Vite development server
- **Port 8000**: Usually Django development server
- **Port 3000**: Often used by other React apps (Create React App)
- **Port 8080**: Often used by other development servers

## Development Workflow

1. **Start Backend**: Django server on port 8000
2. **Start Frontend**: Vite dev server on port 5173
3. **Access Application**: 
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/
   - Admin Panel: http://localhost:8000/admin/

## Production Considerations

In production, you'll typically use:
- **Frontend**: Port 80/443 (HTTP/HTTPS)
- **Backend**: Port 8000 or reverse proxy
- **Database**: Default database ports
- **Static Files**: CDN or dedicated static file server

The development ports (5173, 8000) are only for local development.

