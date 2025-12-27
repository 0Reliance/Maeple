# MAEPLE - Setup Guide

Complete guide to setting up MAEPLE for development and production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [API Keys Configuration](#api-keys-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/0Reliance/Maeple.git
cd Maeple

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start development server
npm run dev
```

Visit `http://localhost:5173` to see MAEPLE running.

---

## 📦 Prerequisites

### Required Software

- **Node.js** 22 or higher
  ```bash
  node --version  # Should be v22.x or higher
  ```
  Download: https://nodejs.org/

- **npm** (comes with Node.js)
  ```bash
  npm --version
  ```

- **Git** for version control
  ```bash
  git --version
  ```
  Download: https://git-scm.com/

### Optional Software

- **PostgreSQL** 14+ (for backend API)
  - Only needed if running full stack with backend
  - Download: https://www.postgresql.org/download/

- **Docker** (for containerized deployment)
  - Download: https://docs.docker.com/get-docker/

- **VS Code** (recommended editor)
  - Download: https://code.visualstudio.com/
  - Install extensions: ESLint, Prettier, TypeScript

---

## 🔧 Detailed Setup

### 1. Clone the Repository

```bash
git clone https://github.com/0Reliance/Maeple.git
cd Maeple
```

### 2. Install Dependencies

```bash
npm install
```

This installs all frontend dependencies including:
- React and React Router
- TypeScript
- Vite (build tool)
- Tailwind CSS
- Zustand (state management)
- Various AI service adapters

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and replace placeholder values with your actual API keys.

**Minimum Required Keys for Development:**

```bash
# Primary AI (required for core features)
VITE_GEMINI_API_KEY=your_actual_gemini_key_here

# Optional but recommended
ZAI_API_KEY=your_actual_zai_key_here
BRAVE_API_KEY=your_actual_brave_key_here
JINA_API_KEY=your_actual_jina_key_here
ELEVENLABS_API_KEY=your_actual_elevenlabs_key_here
```

**All other services can be added later.** The application will work with just the Gemini API key.

### 4. Generate Secure Keys

Generate secure random strings for encryption:

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
```

Add these to your `.env` file.

### 5. Database Setup (Optional - for full stack)

If you want to run the backend API:

```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Windows:
# Download installer from postgresql.org

# Create database
createdb maeple

# Run migrations (if available)
npm run migrate
```

---

## 🔑 API Keys Configuration

### Step-by-Step Key Acquisition

#### 1. Google Gemini API (Primary - Required)

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the key
5. Add to `.env`:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_key_here
   ```

**Free tier:** Generous free quota for development and testing.

#### 2. Z.ai API (Code Generation - Recommended)

1. Visit: https://z.ai/
2. Create an account
3. Navigate to API settings
4. Generate API key
5. Add to `.env`:
   ```bash
   ZAI_API_KEY=your_zai_key_here
   ```

#### 3. Brave Search API (Web Search - Recommended)

1. Visit: https://brave.com/search/api/
2. Create an account
3. Go to API section
4. Generate free API key
5. Add to `.env`:
   ```bash
   BRAVE_API_KEY=your_brave_key_here
   ```

**Free tier:** 2,000 requests/month.

#### 4. ElevenLabs API (Voice Synthesis - Optional)

1. Visit: https://elevenlabs.io/
2. Create an account
3. Go to Settings > API Keys
4. Generate API key
5. Add to `.env`:
   ```bash
   ELEVENLABS_API_KEY=your_elevenlabs_key_here
   ```

**Free tier:** 10,000 characters/month.

#### 5. Jina AI (Content Extraction - Optional)

1. Visit: https://jina.ai/
2. Create an account
3. Get API key from dashboard
4. Add to `.env`:
   ```bash
   JINA_API_KEY=your_jina_key_here
   ```

**Free tier:** Available for development.

### Additional Services (Optional)

See `.env.example` for complete list of optional services including:
- OpenAI API
- Anthropic API
- Perplexity AI
- Oura Ring, Garmin, Fitbit, Whoop wearables

---

## 🗄️ Database Setup

### Option 1: PostgreSQL (Production Recommended)

```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Create database
sudo -u postgres createdb maeple

# Create user (optional)
sudo -u postgres createuser --interactive

# Test connection
psql -d maeple
```

Update `.env`:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/maeple
```

### Option 2: SQLite (Development Only)

For local development without PostgreSQL:

```bash
# No additional setup needed
# Application will use local SQLite database automatically
```

### Option 3: Docker (Containerized)

```bash
# Run PostgreSQL container
docker run --name maeple-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=maeple \
  -p 5432:5432 \
  -d postgres:14

# Update .env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/maeple
```

---

## ▶️ Running the Application

### Development Mode

```bash
# Start frontend development server
npm run dev
```

The application will be available at `http://localhost:5173`

Features:
- Hot Module Replacement (HMR)
- Fast refresh
- TypeScript type checking
- ESLint warnings

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The production build will be in the `dist/` directory.

### Backend API (if using)

```bash
# Start backend server (requires database)
cd api
npm install
npm run dev
```

API will be available at `http://localhost:3001`

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Code Quality Checks

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format

# Run all checks
npm run check-all
```

---

## 🔍 Troubleshooting

### Common Issues

#### Issue: `module not found` errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: API key errors

- Verify keys are in `.env` file
- Check for extra spaces or quotes
- Ensure keys are properly copied (no trailing whitespace)
- Restart development server after adding keys

#### Issue: Port already in use

```bash
# Kill process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

#### Issue: Database connection errors

- Verify PostgreSQL is running: `sudo service postgresql status`
- Check database exists: `psql -l`
- Verify DATABASE_URL in `.env` is correct
- Ensure database user has proper permissions

#### Issue: TypeScript errors

```bash
# Clear TypeScript cache
rm -rf .tsbuildinfo

# Re-run type check
npm run typecheck
```

#### Issue: Build fails

```bash
# Clear build cache
rm -rf dist

# Clean install
npm run clean
npm install

# Try building again
npm run build
```

### Getting Help

1. **Check logs**: Look at console output for specific error messages
2. **Health check**: Run `npm run health` for diagnostics
3. **Documentation**: See [docs/](docs/) for detailed guides
4. **GitHub Issues**: Search existing issues or create a new one

---

## 📚 Additional Resources

- [Quick Reference](docs/QUICK_REFERENCE.md) - Fast lookup for common tasks
- [AI Integration Guide](docs/AI_INTEGRATION_GUIDE.md) - AI provider configuration
- [Complete Specifications](specifications/COMPLETE_SPECIFICATIONS.md) - Full system documentation
- [Development Tooling Guide](docs/DEVELOPMENT_TOOLING.md) - Development environment setup

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Node.js version is 22 or higher
- [ ] All dependencies installed (`npm install` completed)
- [ ] `.env` file exists with required API keys
- [ ] Development server starts without errors (`npm run dev`)
- [ ] Application loads in browser at `http://localhost:5173`
- [ ] Core features (journal entry, capacity grid) work
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## 🚀 Next Steps

1. **Explore the application** - Try journaling and capacity tracking
2. **Read documentation** - Learn about features and capabilities
3. **Customize** - Adjust settings and preferences
4. **Contribute** - See [Contributing Guide](CONTRIBUTING.md) if you want to help
5. **Deploy** - See [Deployment Guide](deploy/DEPLOY.md) for production

---

**Need help?** Check our [GitHub Issues](https://github.com/0Reliance/Maeple/issues) or [Discussions](https://github.com/0Reliance/Maeple/discussions)