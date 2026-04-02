#!/usr/bin/env bash
# start-dev.sh — Simple Django backend + React frontend startup

echo "🚀 Starting KONEK TA Development Environment..."
echo "=============================================="

# Start Django Backend
echo "🐍 Starting Django Backend..."
cd konekta-backend/konekta
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
echo "Django running at http://localhost:8000 (pid: $BACKEND_PID)"

# Wait a moment
sleep 3

# Start React Frontend
echo "⚛️ Starting React Frontend..."
cd ../../konekta-frontend
npm run dev &
FRONTEND_PID=$!
echo "React running at http://localhost:5173 (pid: $FRONTEND_PID)"

echo ""
echo "🎉 KONEK TA is now running!"
echo "=============================================="
echo "🌐 Frontend: http://localhost:5173"
echo "🐍 Backend:  http://localhost:8000"
echo "📊 Admin:   http://localhost:8000/admin"
echo "=============================================="
echo ""
echo "Both servers are running in the background."
echo "Press Ctrl+C to stop both servers."

# Keep script alive
wait
