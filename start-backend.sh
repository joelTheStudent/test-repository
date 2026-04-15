#!/bin/bash
# ─────────────────────────────────────────────
#  Calendra — Django Backend Startup Script
#  Works on: Windows (Git Bash), macOS, Linux
# ─────────────────────────────────────────────

cd "$(dirname "$0")/backend"

echo "Setting up Calendra backend..."
echo ""

# ── 1. Find Python ────────────────────────────
PYTHON=""
for cmd in python3.12 python3.11 python3.10 python3.9 python3 python; do
  if command -v "$cmd" &>/dev/null; then
    PYTHON="$cmd"
    echo "Using Python: $($PYTHON --version)"
    break
  fi
done

if [ -z "$PYTHON" ]; then
  echo "ERROR: Python not found. Install Python 3.9+ and try again."
  exit 1
fi

# ── 2. Create virtual environment ────────────
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  if ! $PYTHON -m venv venv; then
    echo "ERROR: Failed to create venv."
    echo "On Ubuntu/Debian run: sudo apt install python3-venv"
    exit 1
  fi
  echo "Virtual environment created."
else
  echo "Virtual environment found."
fi

# ── 3. Detect OS and set paths ────────────────
if [ -f "venv/Scripts/python.exe" ]; then
  VENV_PYTHON="venv/Scripts/python.exe"
  echo "Detected: Windows"
elif [ -f "venv/bin/python" ]; then
  VENV_PYTHON="venv/bin/python"
  echo "Detected: Unix/macOS"
else
  echo "ERROR: Could not find Python inside venv. Delete the 'venv' folder and try again."
  exit 1
fi

# ── 4. Install dependencies ───────────────────
echo ""
echo "Installing dependencies..."
$VENV_PYTHON -m pip install --quiet --upgrade pip
$VENV_PYTHON -m pip install --quiet \
  "django>=4.2,<5.0" \
  djangorestframework \
  djangorestframework-simplejwt \
  django-cors-headers \
  psycopg2-binary \
  Pillow \
  python-decouple
echo "Dependencies installed."

# ── 5. Run migrations ─────────────────────────
echo ""
echo "Running database migrations..."
$VENV_PYTHON manage.py migrate
echo "Database ready."

# ── 6. Create superuser if missing ───────────
echo ""
echo "Checking admin user..."
$VENV_PYTHON manage.py shell -c "
from accounts.models import User
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(email='admin@calendra.app', password='admin123')
    print('Admin created: admin@calendra.app / admin123')
else:
    print('Admin already exists.')
"

# ── 7. Start server ───────────────────────────
echo ""
echo "-------------------------------------------"
echo "  Calendra backend is running!"
echo ""
echo "  API:    http://localhost:8000/api/"
echo "  Admin:  http://localhost:8000/admin/"
echo "  Stop:   Ctrl+C"
echo "-------------------------------------------"
echo ""
$VENV_PYTHON manage.py runserver 0.0.0.0:8000
