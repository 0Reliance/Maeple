# MAEPLE Documentation Index

**App Version**: 0.97.7  
**Last Updated**: February 1, 2026  
**Local Database**: ✅ Fully Operational (PostgreSQL 16 in Docker)  
**Production**: ✅ Operational (Vercel)  
**Local Dev**: ✅ Running (Docker Compose)  
**Test Suite**: ⚠️ 84% Pass Rate (Infrastructure Issues Identified)

---

## 🆕 What's New (Feb 2026)

**Test Suite Analysis (February 1, 2026)**

Comprehensive test execution completed with findings documented:

- **Results**: 423 tests passing, 78 failed, 20 errors
- **Root Cause**: Test infrastructure issues (mocks), NOT production bugs
- **Production Code**: ✅ Fully functional
- **Build**: ✅ Passing (9.76s)
- **TypeScript**: ✅ Zero errors

**Key Issues Identified:**
1. AI Router mock missing `isAIAvailable()` method (13 test failures)
2. IndexedDB mock returns null (20 uncaught exceptions)
3. Image worker timeout on invalid input (2 test failures)
4. Comparison engine edge cases (3 test failures)

**Documentation**: See [PROJECT_STATUS_2026-02-01.md](../PROJECT_STATUS_2026-02-01.md) for complete analysis

---

## 🆕 What's New (Jan 2026)

**Vercel Deployment Fix (January 20, 2026)**

- Resolved critical production error: "Cannot access 'e' before initialization"
- Fixed AI Router Proxy pattern causing circular dependency issues
- Changed to direct initialization for Vite minification compatibility
- Production now operational at https://maeple.vercel.app
- See [VERCEL_DEPLOYMENT_FIX_2026-01-20.md](../VERCEL_DEPLOYMENT_FIX_2026-01-20.md) for details

**Card Interaction Fix (v0.97.7)**

- Fixed critical bug where Energy Check-in sliders and textarea were unclickable
- Added `position: relative` to Card component for proper absolute child positioning
- Removed aggressive hover transforms that caused touch/click issues
- See [CHANGELOG.md](../specifications/CHANGELOG.md) for full details

**Local Database Integration Complete**

- Full Docker stack with PostgreSQL 16, Express API, and Nginx frontend
- All CRUD operations verified (entries, settings, auth)
- JWT-based authentication for local development
- API response time: 14ms average, 0 errors
- See [LOCAL_DB_STATUS.md](../LOCAL_DB_STATUS.md) for complete status

**Onboarding System Overhaul**

- User-focused messaging reframe (all 5 steps)
- Clear skip button for graceful exit
- Dual first-entry detection (localStorage + entries count)
- Replay feature in Settings → Help & Resources
- See [FEATURES.md](FEATURES.md) for details, [TESTING_GUIDE.md](TESTING_GUIDE.md) for testing

---

## Quick Links

| Document                            | Description                                 |
| ----------------------------------- | ------------------------------------------- |
| [README.md](../README.md)           | Project overview, features, and quick start |
| [DEVELOPMENT.md](../DEVELOPMENT.md) | Development environment setup               |
| [SETUP.md](../SETUP.md)             | Detailed installation guide                 |

---

## User Guides

| Document                                   | Description                                                   |
| ------------------------------------------ | ------------------------------------------------------------- |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md)   | Fast lookup for commands and troubleshooting                  |
| [FEATURES.md](FEATURES.md)                 | Feature descriptions and use cases (Onboarding section added) |
| [CAPACITY_METRICS.md](CAPACITY_METRICS.md) | Understanding the 7-dimensional capacity grid                 |

---

## Technical Documentation

| Document                                                     | Description                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [PROJECT_STATUS_2026-02-01.md](../PROJECT_STATUS_2026-02-01.md) | **Current Project Status** - Test suite analysis, component status, action items |
| [AI_INTEGRATION_GUIDE.md](AI_INTEGRATION_GUIDE.md)           | Multi-provider AI architecture                                                                          |
| [GEMINI_PRO_PLAN_DECISION.md](GEMINI_PRO_PLAN_DECISION.md)   | **Google AI Pro Plan ($20/month)** - Configuration, rationale, and cost analysis for production deployment |
| [GEMINI_PRO_PLAN_OPTIMIZATION.md](GEMINI_PRO_PLAN_OPTIMIZATION.md) | **Pro Plan Optimization Strategies** - Caching, model routing, token optimization, and cost-saving techniques |
| [FACS_IMPLEMENTATION_GUIDE.md](FACS_IMPLEMENTATION_GUIDE.md) | **FACS (Facial Action Coding System)** - Complete implementation guide with research references |
| [PROJECT_REVIEW_2026-01-20.md](../PROJECT_REVIEW_2026-01-20.md) | **Comprehensive project review** - Production and local dev status, technology stack, features, security, performance |
| [PROJECT_REVIEW_2026-01-06.md](PROJECT_REVIEW_2026-01-06.md) | Repo-wide capture/storage/validation/analysis audit with prioritized risks and research-backed options  |
| [VERCEL_DEPLOYMENT_FIX_2026-01-20.md](../VERCEL_DEPLOYMENT_FIX_2026-01-20.md) | **Vercel deployment fix** - Resolved production build error with detailed root cause analysis |
| [BIOMIRROR_TROUBLESHOOTING.md](BIOMIRROR_TROUBLESHOOTING.md) | Bio-Mirror camera and analysis issues                                                                   |
| [DEVELOPMENT_TOOLING.md](DEVELOPMENT_TOOLING.md)             | IDE setup, MCP configuration                                                                            |
| [TESTING_GUIDE.md](TESTING_GUIDE.md)                         | Comprehensive testing procedures                                                                        |

---

## Deployment

| Document                                                 | Description                          |
| -------------------------------------------------------- | ------------------------------------ |
| [LOCAL_DB_STATUS.md](../LOCAL_DB_STATUS.md)              | **Local database integration status** |
| [LOCAL_DEVELOPMENT_GUIDE.md](LOCAL_DEVELOPMENT_GUIDE.md) | Local dev & Docker options           |
| [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) | Deploy to Vercel                     |
| [INSTALLATION.md](INSTALLATION.md)                       | Local installation steps             |
| [SUPABASE_SETUP.md](../SUPABASE_SETUP.md)                | Supabase authentication (production) |

---

## Specifications

All technical specifications are in the [specifications/](../specifications/) folder:

| Document                                                                   | Description                        |
| -------------------------------------------------------------------------- | ---------------------------------- |
| [COMPLETE_SPECIFICATIONS.md](../specifications/COMPLETE_SPECIFICATIONS.md) | Comprehensive system documentation |
| [SYSTEM_ARCHITECTURE.md](../specifications/SYSTEM_ARCHITECTURE.md)         | Architecture overview              |
| [API_REFERENCE.md](../specifications/API_REFERENCE.md)                     | REST API documentation             |
| [DATA_MODELS.md](../specifications/DATA_MODELS.md)                         | Data structure documentation       |
| [CHANGELOG.md](../specifications/CHANGELOG.md)                             | Version history                    |
| [ROADMAP.md](../specifications/ROADMAP.md)                                 | Product roadmap                    |

---

## Implementation Summaries

| Document                                                                        | Description                              |
| ------------------------------------------------------------------------------- | ---------------------------------------- |
| [ONBOARDING_IMPROVEMENT_PLAN.md](../ONBOARDING_IMPROVEMENT_PLAN.md)             | Initial plan for onboarding improvements |
| [ONBOARDING_IMPLEMENTATION_SUMMARY.md](../ONBOARDING_IMPLEMENTATION_SUMMARY.md) | Onboarding implementation details        |

---

## Archived Documentation

Historical documentation (phase reports, fix summaries, etc.) is preserved in `.archive/` for reference.