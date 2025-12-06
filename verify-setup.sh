#!/bin/bash
# POZIMIND Setup Verification Script

echo "🔍 POZIMIND Setup Verification"
echo "================================"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  Node.js version: $NODE_VERSION"
else
    echo "  ❌ Node.js not found. Please install Node.js v18+"
    exit 1
fi

# Check npm
echo "✓ Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "  npm version: $NPM_VERSION"
else
    echo "  ❌ npm not found"
    exit 1
fi

# Check dependencies
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  Dependencies installed ✓"
else
    echo "  ⚠️  Dependencies not installed. Run: npm install"
fi

# Check .env file
echo "✓ Checking environment configuration..."
if [ -f ".env" ]; then
    if grep -q "PLACEHOLDER_API_KEY" .env; then
        echo "  ⚠️  .env exists but API key is placeholder"
        echo "     Action needed: Add your Gemini API key to .env"
        echo "     Get one free at: https://aistudio.google.com/app/apikey"
    else
        echo "  .env configured ✓"
    fi
else
    echo "  ⚠️  .env file not found"
    echo "     Action needed: Copy .env.example to .env and add your API key"
fi

# Check build
echo "✓ Checking build configuration..."
if [ -f "vite.config.ts" ] && [ -f "tsconfig.json" ]; then
    echo "  Build configuration ✓"
else
    echo "  ❌ Build configuration incomplete"
fi

echo ""
echo "================================"
echo "Summary:"
echo "  • Node.js: ✓"
echo "  • Dependencies: $([ -d 'node_modules' ] && echo '✓' || echo '⚠️ ')"
echo "  • Environment: $([ -f '.env' ] && grep -q 'PLACEHOLDER' .env && echo '⚠️  (needs API key)' || echo '✓')"
echo ""
echo "Next steps:"
echo "  1. Add your Gemini API key to .env"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:5173"
echo ""
