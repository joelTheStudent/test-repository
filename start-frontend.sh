#!/bin/bash
# ─────────────────────────────────────────────
#  Calendra — React Frontend Startup Script
#  Works on: Windows (Git Bash), macOS, Linux
# ─────────────────────────────────────────────

cd "$(dirname "$0")/frontend"

echo "Setting up Calendra frontend..."
echo ""

if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install from https://nodejs.org (LTS version)"
  exit 1
fi
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"

if [ ! -d "node_modules" ]; then
  echo ""
  echo "Installing npm packages (this takes a minute)..."
  npm install
  echo "Packages installed."
fi

echo ""
echo "-------------------------------------------"
echo "  Starting Calendra frontend..."
echo ""
echo "  App:  http://localhost:3000"
echo "  Stop: Ctrl+C"
echo "-------------------------------------------"
echo ""
npm start
