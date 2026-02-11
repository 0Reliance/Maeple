# MAEPLE Documentation Index

**App Version**: 0.97.9  
**Last Updated**: February 9, 2026  
**Local Database**: ✅ Fully Operational (PostgreSQL 16 in Docker)  
**Production**: ✅ Operational (Vercel)  
**Local Dev**: ✅ Running (Docker Compose)  
**Test Suite**: ✅ All relevant tests passing

---

## 🆕 What's New (Feb 2026)

**v0.97.9 — Documentation & Bug Fix Release (February 9, 2026)**

- **Bio Mirror & Energy Check-in Fixes**: 7 bugs fixed across source files including FACS comparison engine flat scoring, array safety guards, camera capture stability, and validation edge cases
- **Comprehensive Documentation Overhaul**: All specifications and developer docs rewritten with detailed component definitions, service references, and architecture diagrams
- **New Specification Documents**:
  - `specifications/COMPONENT_REFERENCE.md` — All 40 React components documented with props, logic, and dependencies
  - `specifications/SERVICES_REFERENCE.md` — All services, stores, hooks, patterns, and utilities documented
  - `specifications/SYSTEM_ARCHITECTURE.md` — Complete architecture with data flow diagrams

**Previous Updates**

- **v0.97.7**: Card interaction fix, local database integration, onboarding overhaul
- **Vercel Deployment Fix (Jan 20)**: Resolved circular dependency in AI Router Proxy
- **Test Suite Analysis (Feb 1)**: Infrastructure-level test failures identified and documented

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

| Document                                                                   | Description                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [COMPLETE_SPECIFICATIONS.md](../specifications/COMPLETE_SPECIFICATIONS.md) | Comprehensive system documentation — features, data flows, security |
| [SYSTEM_ARCHITECTURE.md](../specifications/SYSTEM_ARCHITECTURE.md)         | Architecture overview — data flow diagrams, patterns, deployment    |
| [COMPONENT_REFERENCE.md](../specifications/COMPONENT_REFERENCE.md)         | **All 40 React components** — props, logic, dependencies            |
| [SERVICES_REFERENCE.md](../specifications/SERVICES_REFERENCE.md)           | **All services, stores, hooks, patterns, utilities** — interfaces, algorithms |
| [DATA_MODELS.md](../specifications/DATA_MODELS.md)                         | Core data types — HealthEntry, CapacityProfile, FacialAnalysis      |
| [DATA_ANALYSIS_LOGIC.md](../specifications/DATA_ANALYSIS_LOGIC.md)         | Analysis algorithms — FACS scoring, quality assessment, AI matrix   |
| [API_REFERENCE.md](../specifications/API_REFERENCE.md)                     | REST API endpoints and service interfaces                           |
| [UI_UX_GUIDELINES.md](../specifications/UI_UX_GUIDELINES.md)               | Design philosophy, theming, accessibility                           |
| [CHANGELOG.md](../specifications/CHANGELOG.md)                             | Version history                                                      |
| [ROADMAP.md](../specifications/ROADMAP.md)                                 | Product roadmap                                                      |

---

## Implementation Summaries

| Document                                                                        | Description                              |
| ------------------------------------------------------------------------------- | ---------------------------------------- |
| [ONBOARDING_IMPROVEMENT_PLAN.md](../ONBOARDING_IMPROVEMENT_PLAN.md)             | Initial plan for onboarding improvements |
| [ONBOARDING_IMPLEMENTATION_SUMMARY.md](../ONBOARDING_IMPLEMENTATION_SUMMARY.md) | Onboarding implementation details        |

---

## Archived Documentation

Historical documentation (phase reports, fix summaries, etc.) is preserved in `.archive/` for reference.