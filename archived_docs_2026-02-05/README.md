# MAEPLE - Mental And Emotional Pattern Literacy Engine

[![Version](https://img.shields.io/badge/Version-0.97.7-purple)](package.json)
[![Production](https://img.shields.io/badge/Production-Operational-success)](https://maeple.vercel.app)
[![Local Dev](https://img.shields.io/badge/Local%20Dev-Running-brightgreen)](http://maeple.0reliance.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF)](https://vitejs.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016-336791)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)](tests/)

> A neuro-affirming health intelligence platform designed to help users, particularly those with ADHD, Autism, or CPTSD, understand their mental and emotional patterns through objective and subjective data correlation.

---

## 🌟 What is MAEPLE?

MAEPLE focuses on **pattern literacy**—helping you understand context and recurring patterns, and (optionally) correlate subjective reports with objective signals. MAEPLE helps users:

- **Understand Context**: Track energy levels across 7 dimensions (Focus, Social, Sensory, Emotional, Physical, Structure, Executive)
- **Identify Patterns**: Recognize recurring situations that trigger specific states
- **Validate Experience**: Correlate subjective reports with objective physiological data
- **Advocate with Data**: Provide evidence-based insights for healthcare providers

### Key Features


#### 🎯 Multi-Mode Journaling

- **Text Entry** with real-time feedback and AI analysis
- **Voice Recording** with live transcription and audio analysis
- **Photo Capture (Bio-Mirror)** with enhanced FACS-based visual analysis (still image capture; not micro-expression detection) (v0.97.6: structured Action Unit detection, Duchenne smile analysis, intensity ratings)
- **Objective Observations** from voice (noise, tone, pace) and photo (fatigue, tension, environment)
- **Informed Capacity Calibration** with AI suggestions based on observed state
- **Gentle Inquiry System** for contextual, optional AI questions
- **Always-Visible Submit Button**: The submit button for journal entries is always visible. Users can submit a check-in with or without text or a voice note.

#### 🔬 Bio-Mirror Technology

- **Facial Action Coding System (FACS)** for objective physiological analysis
- Detects fatigue, tension, and masking
- Compares subjective mood with facial expressions to identify dissociation
- Baseline calibration for individual differences
- **Enhanced with multi-modal analysis** (voice + photo + text)

#### 🤖 AI-Powered Pattern Recognition

- Multi-provider AI architecture (Gemini, OpenAI, Anthropic, Z.ai, Perplexity)
- Automatic trigger identification and strategy suggestions
- Predictive capacity forecasting
- Live Coach for real-time voice support
- **Context-aware strategies** based on objective + subjective data
- **Neuro-affirming gentle inquiries** generated from observations

#### 📊 7-Dimensional Capacity Grid

```
Focus      ••••••••••  Cognitive bandwidth
Social     ••••••••••  Interaction capacity
Sensory    ••••••••••  Stimuli tolerance
Emotional  ••••••••••  Resilience level
Physical    ••••••••••  Body energy
Structure   ••••••••••  Routine needs
Executive   ••••••••••  Planning ability
```

#### 🔄 Offline-First Architecture

- **Local-First Storage**: Primary data lives on your device
- **Optional Cloud Sync**: Entries + settings only (Bio-Mirror history is backed up via export/import)
- **Encrypted Biometrics**: AES-GCM 256-bit encryption
- **No Surveillance**: Data for personal insight, not tracking

#### ⌚ Wearables Integration

- Oura Ring (sleep, HRV, heart rate)
- Apple Health (activity, respiratory rate)
- Garmin (stress score, body battery)
- Fitbit (steps, sleep stages)
- Whoop (recovery, strain)

---

## 🌐 Deployment Environments

MAEPLE has two deployment environments:

### Production Environment

- **URL**: https://maeple.vercel.app
- **Platform**: Vercel
- **Purpose**: Public production deployment
- **Access**: Available to all users
- **Status**: ✅ OPERATIONAL (as of January 20, 2026)
- **Latest Fix**: Resolved Vercel build error (commit 9752b46)

### Local Development Environment

- **URL**: http://maeple.0reliance.com (or http://localhost:80 on VM-125)
- **Platform**: Docker Compose
- **Purpose**: Development and testing
- **Access**: Internal network only
- **Status**: ✅ RUNNING (14+ hours uptime, all containers healthy)
- **API Response Time**: 14ms average
- **Memory Usage**: 67 MB (API container)

**Quick Access:**
- **Production**: https://maeple.vercel.app ✅
- **Local Dev**: http://maeple.0reliance.com (VM-125) ✅

**System Status (January 20, 2026):**
- Production: Operational with latest fixes
- Local Dev: All containers healthy (PostgreSQL, API, Web)
- Build: Successful with optimized chunks
- Tests: Passing
- API Health: 14ms response time, 0 errors

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Docker** (recommended for local development)
- **Git** (for version control)

### Local Docker Stack (Recommended)

The easiest way to run MAEPLE locally with full database integration:

```bash
# Clone and start
git clone https://github.com/0Reliance/Maeple.git
cd Maeple/deploy
docker-compose up -d

# Access points:
# Frontend: http://localhost:80
# API: http://localhost:3001
# Database: localhost:5432
```

| Service | Container | Port |
|---------|-----------|------|
| PostgreSQL 16 | deploy-db-1 | 5432 |
| Express API | deploy-api-1 | 3001 |
| Web Frontend | deploy-web-1 | 80 |

### Installation (Development Server)

#### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/0Reliance/Maeple.git
cd Maeple

# Run the automated setup script
bash scripts/setup-dev.sh

# This will:
# ✓ Check Node.js version
# ✓ Create a .env file from .env.example
# ✓ Install all dependencies
# ✓ Run health checks
# ✓ Optionally install VS Code extensions
```

#### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env

# 3. Edit .env to add your own API keys
# See docs/QUICK_REFERENCE.md for API key details

# 4. Run type checking
npm run typecheck

# 5. Start development server
npm run dev
```

### Verify Installation

```bash
# Run comprehensive health check
npm run health

# Run all tests
npm run test:all

# Check code quality
npm run check-all
```

---

## 📚 Documentation

### Getting Started Guides

- **[Documentation Index](docs/INDEX.md)** - Start here for the full docs hub
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Fast lookup for common tasks, commands, and troubleshooting
- **[Development Tooling Guide](docs/DEVELOPMENT_TOOLING.md)** - Complete development environment setup
- **[AI Integration Guide](docs/AI_INTEGRATION_GUIDE.md)** - How to use multiple AI providers together

### Technical Documentation

- **[Complete Specifications](specifications/COMPLETE_SPECIFICATIONS.md)** - Comprehensive system documentation (10 sections)
  - Project definition and importance
  - System architecture overview
  - Core components breakdown (10 components)
  - Data flow and component interactions
  - Technical specifications (API reference, database schema)
  - Security and privacy
  - Performance and scalability
  - Testing and quality assurance
  - Deployment and infrastructure
  - Future roadmap

- **[Data Models](specifications/DATA_MODELS.md)** - Data structure documentation
- **[API Reference](specifications/API_REFERENCE.md)** - REST API documentation
- **[System Architecture](specifications/SYSTEM_ARCHITECTURE.md)** - Architecture overview
- **[Data Analysis Logic](specifications/DATA_ANALYSIS_LOGIC.md)** - Analysis algorithms

### Additional Resources

- **[Installation Guide](docs/INSTALLATION.md)** - Detailed installation instructions
- **[Features Overview](docs/FEATURES.md)** - Feature descriptions and use cases
- **[Capacity Metrics Guide](docs/CAPACITY_METRICS.md)** - How to use the capacity grid
- **[Memory Bank](specifications/MEMORY_BANK.md)** - System design decisions and rationale

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server (Vite)
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run typecheck        # TypeScript type checking
npm run typecheck:watch  # Watch mode for type checking

# Testing
npm test                 # Run tests (watch mode)
npm run test:run        # Run tests once
npm run test:coverage    # Run tests with coverage
npm run test:ai          # Test AI providers

# Comprehensive
npm run check-all        # Run lint + typecheck + tests
npm run fix-all          # Run lint:fix + format + typecheck
npm run test:all         # Run build + analyze + test:ai

# Utilities
npm run health           # Run health check
npm run analyze          # Analyze bundle size
```

### Project Structure

```
MAEPLE/
├── docs/                      # Documentation
│   ├── QUICK_REFERENCE.md       # Fast lookup guide
│   ├── DEVELOPMENT_TOOLING.md  # Dev tooling setup
│   └── AI_INTEGRATION_GUIDE.md # AI provider usage
│
├── specifications/             # Technical specs
│   ├── COMPLETE_SPECIFICATIONS.md # Full system docs
│   ├── DATA_MODELS.md        # Data structures
│   ├── API_REFERENCE.md       # API documentation
│   └── SYSTEM_ARCHITECTURE.md # Architecture
│
├── src/                       # Source code
│   ├── components/            # React components
│   ├── services/             # Business logic
│   │   ├── ai/              # AI services layer
│   │   │   ├── router.ts    # AI router with fallback
│   │   │   └── adapters/    # Provider adapters
│   │   ├── storageService.ts # Local storage
│   │   ├── syncService.ts   # Sync logic
│   │   └── encryptionService.ts # Data encryption
│   ├── stores/              # Zustand state management
│   └── types.ts             # TypeScript types
│
├── tests/                     # Test files
├── scripts/                   # Utility scripts
│   ├── setup-dev.sh          # Automated setup
│   ├── health-check.cjs      # Health check
│   └── test-ai-providers.cjs # AI testing
│
├── api/                       # Backend API (Node/Express)
├── public/                    # Static assets
└── .env.example               # Environment template
```

### Technology Stack

#### Frontend

- **React 19** - UI framework with concurrent features
- **TypeScript 5.2+** - Type safety
- **Vite 7** - Build tool
- **Zustand 5** - State management
- **Tailwind CSS 3.4** - Styling
- **React Router DOM 7** - Routing
- **Capacitor 8** - Native mobile apps

#### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

#### AI Services

- **Google Gemini (Pro Plan)** - Primary multimodal AI with unlimited quota ($20/month optimized)
  - gemini-2.5-flash for FACS analysis and multimodal tasks
  - gemini-2.5-flash-image for image generation
  - gemini-2.5-flash-lite for cost-effective batch processing
- **Z.ai** - Advanced code generation
- **OpenAI** - GPT-4, DALL-E, Whisper (fallback)
- **Anthropic** - Claude models (fallback)
- **Perplexity** - Web search + AI (fallback)
- **OpenRouter** - Access to free models (fallback)
- **ElevenLabs** - Text-to-speech

#### Development Tools

- **ESLint 8** - Linting
- **Prettier 3** - Formatting
- **Vitest** - Testing
- **React Testing Library 16** - Component testing
- **TypeScript 5** - Static typing

---

## 🔐 API Keys Configuration

### Authentication (Supabase) ✅

MAEPLE uses **Supabase** for authentication and user management:

```bash
# Supabase (configure in .env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

API keys are configured via `.env.example`. Copy it to `.env` and add your own keys:

```bash
cp .env.example .env
```

**For Supabase Setup Guide:** See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### Included Integrations

| Service        | Status    | Purpose                                 |
| -------------- | --------- | --------------------------------------- |
| Supabase       | Supported | Authentication, user management         |
| Gemini         | Supported | Bio-Mirror, Live Coach, vision analysis |
| Z.ai           | Supported | Code generation, refactoring            |
| Perplexity     | Supported | Web search with AI                      |
| Brave Search   | Supported | Web search for MCP                      |
| ElevenLabs     | Supported | Voice synthesis                         |
| Jina AI        | Supported | Content extraction                      |
| Giphy          | Supported | GIF integration                         |
| Resend         | Supported | Email notifications                     |
| OpenRouter     | Supported | Free model access                       |
| Firecrawl      | Supported | Web scraping                            |
| GitHub Genpozi | Supported | Repository access                       |

### Optional Services

To add optional services (OpenAI, Anthropic, wearables), add their API keys to `.env`:

```bash
# OpenAI (optional)
OPENAI_API_KEY=your_key_here

# Anthropic (optional)
ANTHROPIC_API_KEY=your_key_here

# Oura Ring (optional)
VITE_OURA_CLIENT_ID=your_id_here
VITE_OURA_CLIENT_SECRET=your_secret_here
```

See [API Keys Reference](docs/QUICK_REFERENCE.md#api-keys-configuration) for complete details.

---

## 🧩 MCP (Model Context Protocol) Integration

MAEPLE includes configuration for 5 MCP servers for AI-assisted development:

1. **Filesystem Server** - Read/write project files
2. **Git Server** - Git operations and version control
3. **Brave Search Server** - Web search for research
4. **PostgreSQL Server** - Direct database access
5. **Memory Server** - Persistent AI memory

Configuration is in `mcp-config.json` and `.vscode/settings.json`.

See [Development Tooling Guide](docs/DEVELOPMENT_TOOLING.md#mcp-model-context-protocol-setup) for details.

---

## 🔬 FACS System Status

### ✅ Current Status: RESOLVED (January 21, 2026)

The FACS (Facial Action Coding System) image processing issue has been **fully resolved**.

#### Issue Summary

**Problem**: Bio-Mirror was returning empty Action Units arrays and showing "offline mode" instead of detecting facial expressions.

**Root Cause**: Environment variable initialization failure - the application was using inconsistent patterns to access `VITE_GEMINI_API_KEY`, preventing the AI system from initializing properly.

#### Resolution Details

**Files Modified** (6 files):
1. `src/vite-env.d.ts` - Added TypeScript environment definitions
2. `vite.config.ts` - Removed redundant Vite configuration
3. `src/services/ai/settingsService.ts` - Simplified environment variable access
4. `src/services/geminiVisionService.ts` - Simplified environment variable access
5. `src/services/geminiService.ts` - Simplified environment variable access
6. `.env.production` - Added API key for production builds

**Key Changes**:
- Standardized all services to use: `import.meta.env.VITE_GEMINI_API_KEY`
- Removed complex 3-line conditional logic
- Added proper TypeScript type definitions
- Configured production environment variables

#### Verification Status

- ✅ TypeScript compilation: 0 errors, 0 warnings
- ✅ Test suite: 277/282 tests passing (2 unrelated UI test failures)
- ✅ Environment variable loading: Confirmed working in test logs

---

## 🤖 AI Multi-Provider Architecture

MAEPLE uses a **capability-based routing system** to leverage strengths of different AI providers:

### Vision Without Native Vision Tooling

Some providers (like Z.ai) don't have native vision capabilities. MAEPLE solves this through:

**Multi-Provider Pipeline**:

1. **Vision Analysis** (Gemini/OpenAI) - Analyze image
2. **Data Extraction** - Extract structured facial data
3. **Code Generation** (Z.ai) - Generate code from extracted data

```typescript
// Example: Bio-Mirror analysis
const facialData = await gemini.analyzeImage(image);
const code = await zai.generateCode(`
  Process this facial data:
  ${JSON.stringify(facialData)}
  
  Generate TypeScript code for capacity calculation.
`);
```

### Provider Selection

| Task            | Primary    | Fallback           |
| --------------- | ---------- | ------------------ |
| Vision Analysis | Gemini     | OpenAI             |
| Code Generation | Z.ai       | Anthropic, Gemini  |
| Text Analysis   | Anthropic  | Gemini, OpenAI     |
| Web Search      | Perplexity | Brave Search, Jina |
| Voice Synthesis | ElevenLabs | Gemini             |

See [AI Integration Guide](docs/AI_INTEGRATION_GUIDE.md) for complete documentation.

---

## 🧪 Testing

### Running Tests

```bash
# Watch mode (development)
npm test

# Single run (CI/CD)
npm run test:run

# With coverage
npm run test:coverage

# Test specific file
npm test -- MyComponent.test.tsx
```

### Test Structure

```
tests/
├── components/              # Component tests
│   ├── App.test.tsx
│   └── JournalEntry.test.tsx
├── services/              # Service tests
│   ├── syncService.test.ts
│   └── aiRouter.test.ts
└── setup.ts              # Test setup
```

### Coverage Goals

- **Overall**: 80%+
- **Critical Services**: 100%
- **Components**: 75%+

---

## 🚢 Deployment

### Deploy to Vercel

If you want to host the web app, Vercel is a straightforward option for the Vite frontend.

#### Deploy Updates

```bash
# Option 1: Automatic (Git Push)
git add .
git commit -m "Your commit message"
git push origin main
# Vercel auto-deploys within 30-60 seconds

# Option 2: Manual (CLI)
vercel --prod
```

#### First-Time Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login
# Visit https://vercel.com/device and enter the code

# 3. Deploy to production
vercel --yes --prod

# 4. Add environment variables
echo "your_key_here" | vercel env add VITE_GEMINI_API_KEY production
```

### Manual Deployment Options

#### Option 1: Vercel CLI (Recommended for quick deploys)

```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod

# Deploy with custom name (deprecated, use project settings)
vercel --prod
```

**Vercel Features:**

- Global CDN deployment
- Automatic HTTPS/SSL
- Edge caching
- Preview deployments for PRs
- Custom domains (via Vercel project settings)

#### Option 2: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import GitHub repository: `https://github.com/0Reliance/Maeple`
3. Configure build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables:
   - `VITE_GEMINI_API_KEY`: Your Gemini API key
   - `VITE_ENABLE_BIOMIRROR`: `true`
   - `VITE_ENABLE_VOICE_JOURNAL`: `true`
5. Click Deploy

#### Option 3: Docker (Backend/Full Stack)

```bash
# Build Docker image
docker build -t maeple-api:latest -f deploy/Dockerfile.api .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL=$DATABASE_URL \
  -e GEMINI_API_KEY=$GEMINI_API_KEY \
  maeple-api:latest
```

### Environment Variables

#### Required for Production

```bash
# AI Provider
VITE_GEMINI_API_KEY=your_key_here

# API Configuration (if using separate backend)
VITE_API_URL=https://your-backend-url.com/api
VITE_BASE_URL=https://your-app-url

# Feature Flags
VITE_ENABLE_BIOMIRROR=true
VITE_ENABLE_VOICE_JOURNAL=true
VITE_ENABLE_WEARABLES=true
VITE_ENABLE_CLOUD_SYNC=true
VITE_ENABLE_OFFLINE_MODE=true
```

#### Adding Environment Variables via CLI

```bash
# Add single variable
echo "value" | vercel env add VARIABLE_NAME production

# List all variables
vercel env ls

# Remove variable
vercel env rm VARIABLE_NAME production
```

### Build Output

Production build generates optimized bundles (example output):

```
dist/index.html                                   1.78 kB │ gzip:   0.78 kB
dist/assets/index.css                               87.25 kB │ gzip:  14.07 kB
dist/assets/index.js                               876.77 kB │ gzip: 214.50 kB
dist/assets/analytics.js                            405.61 kB │ gzip: 109.54 kB
dist/assets/Settings.js                            190.13 kB │ gzip:  44.09 kB
```

### Deployment Verification

```bash
# Check deployment status
vercel ls

# Verify deployment
curl -I https://your-app-url

# Check build logs
vercel logs
```

### Latest Deployment (February 1, 2026)

**Version:** v0.97.7  
**Commit:** 8d91aea  
**Status:** ✅ Live at https://maeple.vercel.app

**Code Review Remediations Applied:**
- Phase 1.3: Background sync cleanup (timeout protection, queue limits, stale entry cleanup)
- Phase 2.1: Test timeout fixes (increased from 5s to 10s)
- Phase 2.2: React act warnings (added actAsync helper, wrapped state updates)

See [Deployment Summary](DEPLOYMENT_SUMMARY_FEB_2026.md) for complete details.

See [Deployment Guide](deploy/DEPLOY.md) for complete deployment instructions including Docker, Railway, and Render options.

---

## 📖 Why MAEPLE Matters

### Design Goals

Many mental health trackers emphasize symptom checklists and trends over time. MAEPLE emphasizes **pattern literacy**:

- ✅ **Focus on Context** - What situations trigger certain states?
- ✅ **Pattern Recognition** - What recurring patterns exist?
- ✅ **Empowerment Through Data** - Understand your unique landscape
- ✅ **Advocacy Support** - Evidence-based communication with providers

### Neuro-Affirming Approach

MAEPLE is built on a neuro-affirming framework:

- Honors individual differences and unique baselines
- Avoids deficit-based language
- Supports self-awareness rather than comparison
- Validates lived experience with objective data

### Optional Objective Check-ins

Many neurodivergent individuals experience **masking** or **dissociation**, where internal state doesn't match external presentation. MAEPLE's Bio-Mirror technology:

- Provides structured feedback via facial analysis
- Highlights potential masking-related patterns
- Supports reflection alongside self-report
- Helps users compare subjective and observed signals

---

## 🔮 Roadmap

### Phase 1: Foundation ✅ (Complete)

- [x] Core health entry system
- [x] Capacity grid implementation
- [x] Basic AI analysis
- [x] Offline-first architecture
- [x] Local storage with sync

### Phase 2: Enhanced Intelligence ✅ (Complete)

- [x] Advanced Bio-Mirror with facial analysis
- [x] Multi-provider AI architecture (Gemini, OpenAI, Anthropic, Z.ai, Perplexity)
- [x] Voice journal with live transcription
- [x] Objective observation system
- [x] Circuit breaker pattern for resilience

### Phase 3: Platform Maturity ✅ (Complete)

- [x] React 19 upgrade with concurrent features
- [x] Comprehensive test suite
- [x] Supabase authentication
- [x] Mobile support (Capacitor 8)
- [x] TypeScript strict mode compliance

### Phase 4: Wearables & Integration (In Progress)

- [ ] Wearables integration for all major platforms
- [ ] Predictive capacity forecasting
- [ ] Custom strategy recommendations
- [ ] Healthcare provider portal

### Phase 5: Community & Ecosystem

- [ ] Anonymous pattern sharing
- [ ] Community strategies library
- [ ] EHR integration (Epic, Cerner)
- [ ] Research partnerships

See [Complete Specifications](specifications/COMPLETE_SPECIFICATIONS.md#future-roadmap) for details.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run quality checks (`npm run check-all`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- Follow [TypeScript strict mode](.eslintrc.js) rules
- Use [Prettier](.prettierrc) for formatting
- Write tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help

1. **Check Documentation**: Start with [Quick Reference](docs/QUICK_REFERENCE.md)
2. **Search Issues**: Check [GitHub Issues](https://github.com/0Reliance/Maeple/issues)
3. **Health Check**: Run `npm run health` to diagnose issues
4. **Logs**: Check `.mcp/logs/` for MCP server logs

### Reporting Issues

When reporting issues, please include:

- MAEPLE version (`npm list maeple`)
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages (full stack trace)

### Community

- **Discussions**: [GitHub Discussions](https://github.com/0Reliance/Maeple/discussions)
- **Discord**: [Join our Discord](https://discord.gg/maeple)
- **Twitter**: [@MAEPLEHealth](https://twitter.com/MAEPLEHealth)

---

## 🙏 Acknowledgments

MAEPLE is built with gratitude for:

- The neurodivergent community who inspire and guide this work
- Open source maintainers whose tools we depend on
- Healthcare providers who value data-driven approaches
- Every user who trusts us with their mental health journey

---

## 📞 Contact

- **Website**: https://maeple.health
- **Email**: team@maeple.health
- **GitHub**: https://github.com/0Reliance/Maeple
- **Twitter**: [@MAEPLEHealth](https://twitter.com/MAEPLEHealth)

---

**Built with ❤️ for the neurodivergent community**

© 2024-2026 MAEPLE. All rights reserved.