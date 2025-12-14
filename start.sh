#!/bin/bash
# Quick startup script for MAEPLE
# Usage: ./start.sh

set -e

echo "🚀 Starting MAEPLE Development Environment..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js v18 or higher is required (current: v$NODE_VERSION)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
else
  echo "✅ Dependencies already installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo ""
  echo "⚙️  Creating .env file from template..."
  cp .env.example .env
  echo "✅ .env file created"
  echo "⚠️  IMPORTANT: Add your VITE_GEMINI_API_KEY to .env"
  echo "   Get your key at: https://aistudio.google.com/app/apikey"
else
  echo "✅ .env file exists"
  
  # Check if API key is configured
  if grep -q "your_gemini_api_key_here" .env; then
    echo "⚠️  REMINDER: Update VITE_GEMINI_API_KEY in .env"
  else
    echo "✅ API key appears to be configured"
  fi
fi

echo ""
echo "🌐 Starting development server..."
echo "   Server will be available at: http://localhost:5173"
echo "   Press Ctrl+C to stop"
echo ""

# Start the dev server
npm run dev
