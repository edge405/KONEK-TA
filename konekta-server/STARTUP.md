# KONEK TA Development Startup Guide

This guide explains how to start the KONEK TA development environment with both frontend and backend servers.

## Quick Start

### Option 1: Automated Scripts (Recommended)

#### For Windows (PowerShell - Recommended)
```powershell
.\start.ps1
```

#### For Windows (Command Prompt)
```cmd
start.bat
```

#### For Linux/macOS (Bash)
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual Startup

#### Start Backend (Django)
```bash
cd konekta-backend/konekta
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

#### Start Frontend (React)
```bash
cd konekta-frontend
npm install
npm run dev
```

## What the Scripts Do

### Prerequisites Check
- ✅ Verifies Python 3.8+ is installed
- ✅ Verifies Node.js 18+ is installed
- ✅ Verifies npm is available
- ✅ Checks port availability (8000, 5173)

### Backend Setup
- 🐍 Creates Python virtual environment
- 📦 Installs Django dependencies
- 🗄️ Runs database migrations
- 👤 Creates admin superuser (admin/admin123)
- 🚀 Starts Django server on http://localhost:8000

### Frontend Setup
- ⚛️ Installs Node.js dependencies
- 📝 Creates .env file from template
- 🚀 Starts React development server on http://localhost:5173

## Access Points

After running the startup script, you can access:

- **🌐 Frontend**: http://localhost:5173
- **🐍 Backend API**: http://localhost:8000/api/
- **📊 Django Admin**: http://localhost:8000/admin/
- **📚 API Documentation**: http://localhost:8000/api/

### Default Admin Credentials
- **Username**: admin
- **Password**: admin123

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes using ports 5173 and 8000
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :5173
lsof -i :8000
kill -9 <PID>
```

#### Python Virtual Environment Issues
```bash
# Remove and recreate virtual environment
rm -rf konekta-backend/konekta/venv
cd konekta-backend/konekta
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Node.js Dependencies Issues
```bash
# Clear npm cache and reinstall
cd konekta-frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Database Issues
```bash
# Reset database
cd konekta-backend/konekta
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

#### Backend (settings.py)
```python
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

## Development Workflow

### 1. Start Development Environment
```bash
# Choose your preferred method
.\start.ps1        # PowerShell (Windows)
start.bat          # Command Prompt (Windows)
./start.sh         # Bash (Linux/macOS)
```

### 2. Make Changes
- **Frontend**: Edit files in `konekta-frontend/src/`
- **Backend**: Edit files in `konekta-backend/konekta/apps/`

### 3. View Changes
- Frontend changes auto-reload at http://localhost:5173
- Backend changes require server restart

### 4. Stop Servers
- Close the terminal windows running the servers
- Or use Ctrl+C in the terminal

## Script Features

### Windows PowerShell Script (start.ps1)
- ✅ Full PowerShell compatibility
- ✅ Colored output
- ✅ Error handling
- ✅ Separate windows for each server
- ✅ Prerequisites checking

### Windows Batch Script (start.bat)
- ✅ Command Prompt compatibility
- ✅ Simple execution
- ✅ Separate windows for each server
- ✅ Basic error handling

### Bash Script (start.sh)
- ✅ Unix/Linux/macOS compatibility
- ✅ Process management
- ✅ Signal handling (Ctrl+C)
- ✅ Colored output
- ✅ Comprehensive error checking

## Advanced Usage

### Custom Ports
Edit the scripts to use different ports:

#### Backend (Django)
```bash
python manage.py runserver 0.0.0.0:8001
```

#### Frontend (React)
```bash
npm run dev -- --port 5174
```

### Environment-Specific Settings

#### Development
```bash
# Use development settings
export DJANGO_SETTINGS_MODULE=konekta.settings
```

#### Production
```bash
# Use production settings
export DJANGO_SETTINGS_MODULE=konekta.settings_production
```

## Security Notes

- 🔒 Default admin credentials are for development only
- 🔒 Change admin password in production
- 🔒 Use environment variables for sensitive data
- 🔒 Enable HTTPS in production
- 🔒 Configure proper CORS settings

## Performance Tips

- 🚀 Use `npm run build` for production frontend
- 🚀 Enable Django caching for better performance
- 🚀 Use database indexes for large datasets
- 🚀 Implement pagination for API endpoints
- 🚀 Use CDN for static files in production

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check port availability
4. Review error messages in the console
5. Check the logs in the server windows

For additional help, refer to the main README.md files in each project directory.
