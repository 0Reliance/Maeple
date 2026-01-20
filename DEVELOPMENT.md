# MAEPLE Development Guide

**App Version**: 0.97.7  
**Last Updated**: January 20, 2026

This guide explains how to set up and run the MAEPLE development environment, including the local Docker stack with PostgreSQL database.

## Prerequisites

| Requirement | Version | Purpose                           |
| ----------- | ------- | --------------------------------- |
| Node.js     | 22+     | JavaScript runtime                |
| npm         | 10+     | Package manager                   |
| Git         | 2.0+    | Version control                   |
| PostgreSQL  | 14+     | Database (optional for local dev) |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Add your own API keys in .env
# See docs/QUICK_REFERENCE.md for details
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Local Docker Stack (Recommended)

The complete local development environment runs in Docker:

```bash
# Start the full stack
cd /opt/Maeple/deploy
docker-compose up -d

# Check status
docker ps

# View logs
docker logs deploy-api-1 --tail 50
```

### Services
| Container | Port | Purpose |
|-----------|------|---------|
| deploy-db-1 | 5432 | PostgreSQL 16 database |
| deploy-api-1 | 3001 | Express API server |
| deploy-web-1 | 80 | Production frontend |

### Database
- **Database**: `maeple`
- **User**: `maeple_user`
- **Password**: `maeple_beta_2025`
- **Schema**: Initialized from `local_schema.sql`

### Access Points
- **Frontend**: http://localhost:80
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

### 4. Verify Installation

```bash
# Run health check
npm run health

# Check API health
curl http://localhost:3001/api/health

# Run type checking
npm run typecheck

# Run tests
npm run test:run
```

## Available Scripts

| Script              | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start development server     |
| `npm run build`     | Build for production         |
| `npm run preview`   | Preview production build     |
| `npm run typecheck` | TypeScript type checking     |
| `npm run test`      | Run tests (watch mode)       |
| `npm run test:run`  | Run tests once               |
| `npm run lint`      | Run ESLint                   |
| `npm run lint:fix`  | Fix ESLint errors            |
| `npm run format`    | Format code with Prettier    |
| `npm run check-all` | Run lint + typecheck + tests |

## Architecture Overview

```
src/
├── components/        # React UI components
├── services/         # Business logic
│   ├── ai/          # AI router and adapters
│   ├── wearables/   # Wearable integrations
│   └── ...
├── stores/          # Zustand state management
├── adapters/        # Service adapters (DI)
├── patterns/        # Design patterns (Circuit Breaker)
├── contexts/        # React contexts (DI)
└── types.ts         # TypeScript interfaces

tests/
├── components/      # Component tests
├── services/        # Service tests
├── patterns/        # Pattern tests
└── setup.ts        # Test configuration
```

## Key Patterns

### Circuit Breaker

Services use the Circuit Breaker pattern for resilience:

- `src/patterns/CircuitBreaker.ts` - Core implementation
- `src/adapters/serviceAdapters.ts` - Service adapters with circuit breakers

### Dependency Injection

Components receive services via React context:

- `src/contexts/DependencyContext.tsx` - Service interfaces and providers

## Recent Updates

### Onboarding System Improvements

#### Changes Made:

1. **OnboardingWizard.tsx** - Complete messaging and UX overhaul
   - Added "Skip" button on every step for graceful exit
   - Reframed all 5 steps from feature-focused to user-need-focused messaging
   - Improved visual hierarchy and layout

2. **appStore.ts** - Dual first-entry detection
   - Now checks BOTH localStorage flag AND entries.length
   - Survives browser cache clearing
   - Works across device switches

3. **Settings.tsx** - Replay functionality
   - New "Help & Resources" section
   - "Replay Onboarding Tutorial" button
   - Users can re-watch onboarding anytime

#### Testing Onboarding:

```bash
# Clear onboarding flag to test first-time flow
# In browser console:
localStorage.removeItem('maeple_onboarding_complete');
location.reload();

# Test skip flow:
# On any onboarding step, click "Skip" button
# Verify modal closes and user sees dashboard
# Refresh page - onboarding should reappear (no entries created yet)

# Test replay:
# Go to Settings → Help & Resources
# Click "Replay Onboarding Tutorial"
# Verify modal opens with all 5 steps
```

## Database Setup (Optional)

For local development with PostgreSQL:

```bash
# Run database setup script
bash setup_db.sh

# Start API server
node api/index.cjs
```

## Cloud Development

MAEPLE uses Supabase for production authentication and data:

1. Configure Supabase credentials in `.env`
2. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup guide

## Troubleshooting

### TypeScript Errors

```bash
npm run typecheck
```

### Test Failures

```bash
npm run test:run
```

### Build Failures

```bash
npm run build:production
```

### Onboarding Issues

- Onboarding not appearing? Check `localStorage.getItem('maeple_onboarding_complete')` and `getEntries().length`
- Both must be falsy for onboarding to show on startup
- Use browser DevTools to clear localStorage and test

## Code Quality Standards

- TypeScript strict mode enabled
- ESLint with React hooks rules
- Prettier for consistent formatting
- Test coverage for core functionality (run `npm run test:run`)
- Onboarding follows accessibility standards (keyboard navigation, ARIA labels)
