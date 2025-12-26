#!/bin/bash

# MAEPLE Development Environment Setup Script
# This script sets up the development environment for MAEPLE

set -e  # Exit on error

echo "🚀 MAEPLE Development Environment Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 22+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    print_error "Node.js version 22+ is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) installed"

# Check npm version
echo "Checking npm version..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm -v) installed"

# Check for git
echo "Checking Git..."
if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    exit 1
fi
print_success "Git $(git --version | awk '{print $3}') installed"

# Create .env file if it doesn't exist
echo ""
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please edit .env file and add your API keys"
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_success ".env file already exists"
fi

# Create necessary directories
echo ""
echo "Creating necessary directories..."
mkdir -p .mcp/logs
mkdir -p .mcp-memory
print_success "Created MCP directories"

# Install dependencies
echo ""
echo "Installing dependencies..."
if ! npm install; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed"

# Check for VS Code
echo ""
echo "Checking for VS Code..."
if command -v code &> /dev/null; then
    print_success "VS Code is installed"
    
    # Ask if user wants to install recommended extensions
    echo ""
    read -p "Would you like to install recommended VS Code extensions? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installing VS Code extensions..."
        code --install-extension dbaeumer.vscode-eslint || print_warning "Failed to install ESLint extension"
        code --install-extension esbenp.prettier-vscode || print_warning "Failed to install Prettier extension"
        code --install-extension bradlc.vscode-tailwindcss || print_warning "Failed to install Tailwind CSS extension"
        code --install-extension ms-vscode.vscode-typescript-next || print_warning "Failed to install TypeScript extension"
        code --install-extension vitest.explorer || print_warning "Failed to install Vitest extension"
        code --install-extension github.copilot || print_warning "Failed to install Copilot extension"
        code --install-extension github.copilot-chat || print_warning "Failed to install Copilot Chat extension"
        print_success "VS Code extensions installed"
    fi
else
    print_warning "VS Code is not installed. Install it from https://code.visualstudio.com/"
fi

# Run health check
echo ""
echo "Running health check..."
if npm run health; then
    print_success "Health check passed"
else
    print_error "Health check failed"
    exit 1
fi

# Run TypeScript type check
echo ""
echo "Running TypeScript type check..."
if npm run typecheck; then
    print_success "TypeScript type check passed"
else
    print_error "TypeScript type check failed"
    print_warning "This might be expected if you haven't finished setting up"
fi

# Final message
echo ""
echo "======================================"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your API keys:"
echo "   - DATABASE_URL (required for backend)"
echo "   - ZAI_API_KEY (optional, for Z.ai integration)"
echo "   - GEMINI_API_KEY (optional, for AI features)"
echo "   - OPENAI_API_KEY (optional, for AI features)"
echo "   - BRAVE_API_KEY (optional, for web search)"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Run tests:"
echo "   npm test"
echo ""
echo "4. For more information, see docs/DEVELOPMENT_TOOLING.md"
echo ""
print_info "Happy coding! 🎉"
