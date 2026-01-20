# Maeple Local Development & Deployment Guide

> **Version:** 2.0.0  
> **Last Updated:** January 20, 2026  
> **Status:** ✅ Fully Operational

---

## Current Infrastructure Overview

### Production Environment

- **URL:** https://maeple.0reliance.com
- **Platform:** Vercel + Supabase
- **Status:** Production ready

### Local Docker Stack (Currently Running)

```
┌─────────────────────────────────────────────────────────────────┐
│  Local Development Stack (VM-125)                                │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Frontend   │───▶│  API Server  │───▶│  PostgreSQL  │       │
│  │   (nginx)    │    │  (Express)   │    │    (16)      │       │
│  │   Port: 80   │    │  Port: 3001  │    │  Port: 5432  │       │
│  │ deploy-web-1 │    │ deploy-api-1 │    │  deploy-db-1 │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Currently Active:**
| Container | Status | Port | Purpose |
|-----------|--------|------|---------|
| deploy-db-1 | ✅ Running | 5432 | PostgreSQL 16 database |
| deploy-api-1 | ✅ Running | 3001 | Express API server |
| deploy-web-1 | ✅ Running | 80 | Static frontend (nginx) |

**Database Configuration:**
- **Database**: `maeple`
- **User**: `maeple_user`
- **Password**: `maeple_beta_2025`
- **Schema**: Applied from `local_schema.sql`

---

## Development Options Comparison

### Option 1: Docker Compose (Current - Recommended for Stable Testing)

**Pros:**

- ✅ Production-like environment
- ✅ Isolated from host system
- ✅ Easy to reset/rebuild
- ✅ Currently running and stable
- ✅ Good for integration testing

**Cons:**

- ⚠️ Requires rebuild for code changes
- ⚠️ No hot module replacement (HMR)
- ⚠️ Slower iteration cycle

**Commands:**

```bash
# View status
docker ps

# View logs
docker logs deploy-web-1
docker logs deploy-api-1

# Restart containers
cd /opt/Maeple/deploy
docker-compose restart

# Rebuild after code changes
docker-compose down
docker-compose up --build -d

# Full reset
docker-compose down -v
docker-compose up --build -d
```

**Access:** http://localhost:80 or http://localhost

---

### Option 2: Vite Dev Server (Best for Active Development)

**Pros:**

- ✅ Instant hot module replacement (HMR)
- ✅ Fast feedback loop
- ✅ Source maps for debugging
- ✅ React Fast Refresh
- ✅ Best for UI development

**Cons:**

- ⚠️ Different from production build
- ⚠️ Needs API server running separately (if using API features)
- ⚠️ May behave differently than production

**Commands:**

```bash
cd /opt/Maeple

# Start dev server
npm run dev

# With type checking
npm run typecheck:watch &
npm run dev
```

**Access:** http://localhost:5173

**Configuration:** See [vite.config.ts](../vite.config.ts)

- Proxy configured: `/api` → `http://localhost:3001`

---

### Option 3: Production Preview (For Pre-deployment Testing)

**Pros:**

- ✅ Tests actual production build
- ✅ Catches build-time issues
- ✅ Tests minified code

**Cons:**

- ⚠️ No HMR
- ⚠️ Must rebuild for changes

**Commands:**

```bash
cd /opt/Maeple

# Build and preview
npm run build:production
npm run preview
```

**Access:** http://localhost:4173

---

## Recommended Workflow

### For Day-to-Day Development

```bash
# 1. Keep Docker stack running for stable testing
#    (Already running on port 80)

# 2. Use Vite dev server for active development
cd /opt/Maeple
npm run dev   # Port 5173
```

This gives you:

- **Port 80:** Stable Docker deployment for reference testing
- **Port 5173:** Fast HMR development server

### For Testing Production Builds

```bash
# Stop Vite dev server if running
# Then:
npm run build:production
npm run preview   # Port 4173
```

### For Full Integration Testing

```bash
# Rebuild Docker stack
cd /opt/Maeple/deploy
docker-compose down
docker-compose up --build -d
```

---

## Quick Reference Commands

| Task             | Command                    |
| ---------------- | -------------------------- |
| Start dev server | `npm run dev`              |
| Run tests        | `npm run test:run`         |
| Type check       | `npm run typecheck`        |
| Build production | `npm run build:production` |
| Preview build    | `npm run preview`          |
| Lint code        | `npm run lint`             |
| Fix all issues   | `npm run fix-all`          |
| Check everything | `npm run check-all`        |

### Docker Commands

| Task            | Command                        |
| --------------- | ------------------------------ |
| View containers | `docker ps`                    |
| View logs       | `docker logs <container>`      |
| Restart all     | `docker-compose restart`       |
| Rebuild         | `docker-compose up --build -d` |
| Stop all        | `docker-compose down`          |
| Full reset      | `docker-compose down -v`       |

---

## Environment Variables

### Required for Development

Create `.env` file in project root:

```bash
# Supabase (Required for auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (at least one recommended)
VITE_GEMINI_API_KEY=your-gemini-key
VITE_OPENAI_API_KEY=your-openai-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key

# App Settings
VITE_APP_ENV=development
```

### Checking Current Config

```bash
cat /opt/Maeple/.env
```

---

## Troubleshooting

### Docker containers not responding

```bash
docker ps                          # Check status
docker logs deploy-web-1           # Check web logs
docker logs deploy-api-1           # Check api logs
docker-compose restart             # Restart all
```

### Port already in use

```bash
# Find process using port
lsof -i :5173
lsof -i :80

# Kill process
kill -9 <PID>
```

### Build fails

```bash
npm run typecheck    # Check for TS errors
npm run lint         # Check for lint errors
npm run test:run     # Run tests
```

### Clear all caches

```bash
rm -rf node_modules/.vite
rm -rf dist
npm run build:production
```

---

## Architecture Notes

### Frontend Stack

- **React 19.2** with concurrent features
- **TypeScript 5.2+** (strict mode)
- **Vite 7.2** (build tool)
- **Zustand 5.0** (state management)
- **TailwindCSS 4** (styling)

### Backend Services

- **Supabase** - Authentication & cloud sync
- **Multi-provider AI** - Gemini, OpenAI, Anthropic
- **Circuit Breaker** - Resilience pattern for API calls

### Mobile

- **Capacitor 8** - iOS and Android builds

---

## Maintaining Stability

To keep the site running stable for ongoing testing:

1. **Keep Docker stack running** - It's isolated and won't interfere with development
2. **Use Vite dev server** for active coding (different port)
3. **Run tests before rebuilding Docker** - `npm run check-all`
4. **Don't modify production Vercel** unless verified locally first

### Health Check

```bash
# Check Docker services
curl -s http://localhost:80 | head -5

# Check if app loads correctly
curl -s http://localhost:80 | grep -o "MAEPLE"
```

---

## See Also

- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development setup guide
- [DEPLOY.md](../deploy/DEPLOY.md) - Production deployment
- [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) - Vercel specifics
- [INDEX.md](INDEX.md) - Documentation index
