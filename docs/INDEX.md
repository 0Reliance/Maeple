# MAEPLE Documentation Index

**App Version**: 0.97.7  
**Last Updated**: January 20, 2026  
**Local Database**: ✅ Fully Operational (PostgreSQL 16 in Docker)

---

## 🆕 What's New (Jan 2026)

**Card Interaction Fix (v0.97.7)**

- Fixed critical bug where Energy Check-in sliders and textarea were unclickable
- Added `position: relative` to Card component for proper absolute child positioning
- Removed aggressive hover transforms that caused touch/click issues
- See [CHANGELOG.md](../specifications/CHANGELOG.md) for full details

**Local Database Integration Complete**

- Full Docker stack with PostgreSQL 16, Express API, and Nginx frontend
- All CRUD operations verified (entries, settings, auth)
- JWT-based authentication for local development
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
| [AI_INTEGRATION_GUIDE.md](AI_INTEGRATION_GUIDE.md)           | Multi-provider AI architecture                                                                          |
| [FACS_IMPLEMENTATION_GUIDE.md](FACS_IMPLEMENTATION_GUIDE.md) | **FACS (Facial Action Coding System)** - Complete implementation guide with research references |
| [PROJECT_REVIEW_2026-01-06.md](PROJECT_REVIEW_2026-01-06.md) | Repo-wide capture/storage/validation/analysis audit with prioritized risks and research-backed options  |
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
