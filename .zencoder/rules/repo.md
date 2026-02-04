---
description: Repository Information Overview
alwaysApply: true
---

# MAEPLE (Mental And Emotional Pattern Literacy Engine) Information

## Summary
MAEPLE is a neuro-affirming health intelligence platform designed to help users (particularly those with ADHD, Autism, or CPTSD) understand their mental and emotional patterns. It correlates subjective reports with objective physiological data using AI-powered analysis, including facial expression analysis (FACS) and multi-modal journaling.

## Structure
The repository is organized as a multi-component project supporting web, mobile, and backend services:
- **[./src](./src)**: React 19 frontend application (Vite-powered).
- **[./api](./api)**: Node.js/Express backend API for authentication and data storage.
- **[./android](./android)** & **[./ios](./ios)**: Capacitor 8 mobile application wrappers.
- **[./deploy](./deploy)**: Docker and deployment configurations (Dockerfile, Docker Compose, Nginx).
- **[./supabase](./supabase)**: Supabase configuration for authentication and cloud synchronization.
- **[./package](./package)**: Contains a local copy of the npm CLI (v11.0.0).
- **[./tests](./tests)**: Comprehensive test suite including unit, integration, and E2E tests.
- **[./specifications](./specifications)** & **[./docs](./docs)**: Extensive technical and user documentation.

## Projects

### MAEPLE Web & Mobile Frontend
**Configuration File**: [./package.json](./package.json)

#### Language & Runtime
**Language**: TypeScript 5.2+  
**Version**: Node.js 22+  
**Build System**: Vite 7  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `react` ^19.2.3
- `react-router-dom` ^7.10.1
- `zustand` ^5.0.0
- `@capacitor/core` ^8.0.0
- `@supabase/supabase-js` ^2.89.0
- `@google/genai` ^0.14.0
- `lucide-react`, `recharts`, `tailwind-merge`

**Development Dependencies**:
- `vite` ^7.2.7
- `vitest` ^4.0.15
- `tailwindcss` ^3.4.1
- `@playwright/test` ^1.58.1

#### Build & Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

#### Testing
**Framework**: Vitest (Unit/Integration), Playwright (E2E)
**Test Location**: [./tests](./tests)
**Naming Convention**: `*.test.ts`, `*.test.tsx`
**Configuration**: [./vitest.config.ts](./vitest.config.ts), [./playwright.config.ts](./playwright.config.ts)

**Run Command**:
```bash
npm test          # Watch mode
npm run test:run  # Single run
```

### MAEPLE Backend API
**Configuration File**: [./api/index.cjs](./api/index.cjs)

#### Language & Runtime
**Language**: JavaScript (Node.js)  
**Version**: Node.js 22  
**Framework**: Express 5.2

#### Dependencies
**Main Dependencies**:
- `express` ^5.2.1
- `pg` ^8.16.3 (PostgreSQL client)
- `jsonwebtoken` ^9.0.3
- `bcryptjs` ^3.0.3
- `cors`, `dotenv`, `express-rate-limit`

#### Build & Installation
The API is typically run via Docker or directly with Node:
```bash
node api/index.cjs
```

#### Docker
**Dockerfile**: [./deploy/Dockerfile.api](./deploy/Dockerfile.api), [./deploy/Dockerfile.web](./deploy/Dockerfile.web)
**Configuration**: [./deploy/docker-compose.yml](./deploy/docker-compose.yml)
- **db**: PostgreSQL 16-alpine
- **api**: Node 22-alpine service on port 3001
- **web**: Nginx-based frontend service on port 80

### Internal Tooling (npm CLI)
**Configuration File**: [./package/package.json](./package/package.json)
**Type**: Non-traditional / Tooling Reference
**Description**: A local copy of the npm CLI (v11.0.0) used for specific package management tasks or reference within the repository.
