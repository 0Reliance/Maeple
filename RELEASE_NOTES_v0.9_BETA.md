# MAEPLE v0.9 Beta Release Notes

**Release Date:** December 27, 2025

---

## 🎉 Major Updates

This release represents a significant cleanup and reorganization of the MAEPLE project, preparing it for a proper GitHub experience and professional deployment.

### 🔒 Security Improvements

**Secret Removal from Git History**
- Cleaned all API secrets from git history using git-filter-repo
- Replaced 10 hardcoded API keys with secure placeholders
- Enhanced .gitignore to prevent future secrets commits
- Removed sensitive configuration files from repository

**New Security Features**
- Comprehensive `.gitignore` with security-focused rules
- Protected environment variable files (.env, .env.*)
- Excluded credentials files (*.credentials.md)
- Archive directory protection

### 📚 Documentation Overhaul

**New Comprehensive Setup Guide**
- Added `SETUP.md` with step-by-step setup instructions
- Quick start for rapid deployment
- Detailed API key acquisition guide
- Database setup options (PostgreSQL, SQLite, Docker)
- Comprehensive troubleshooting section
- Verification checklist

**Updated Environment Configuration**
- Completely rewrote `.env.example` with:
  - Clear security notices and warnings
  - Detailed descriptions for each API key
  - Links to obtain API keys
  - Free tier information for each service
  - Proper categorization (Primary, Secondary, Optional)

**Documentation Organization**
- Archived 32 outdated documentation files
- Removed redundant development artifacts
- Streamlined docs/ directory structure
- Clear separation between active docs and archives

### 🗂️ Project Structure

**Cleaned Root Directory**
- Removed: CHANGELOG.md, MEMORY.md, PLAN.md
- Removed: Maeple.code-workspace, mcp-config.json
- Removed: metadata.json, setup_db.sh
- Removed: bundle-analysis.json
- Removed: local_schema.sql
- Removed: .credentials.md, LOCAL_DEPLOYMENT_CREDENTIALS.md

**Archive Structure**
```
.archive/
├── docs-old/     - 32 archived documentation files
└── config-old/    - Archived configuration files
```

**Active Documentation**
```
docs/
├── AI_INTEGRATION_GUIDE.md
├── CAPACITY_METRICS.md
├── DEPLOYMENT_CHECKLIST.md
├── DEPLOYMENT_READINESS.md
├── DEVELOPMENT_TOOLING.md
├── FEATURES.md
├── INSTALLATION.md
├── INTEGRATION_STATUS.md
├── MAEPLE_COMPLETE_SPECIFICATIONS.md
├── QUICK_REFERENCE.md
└── AI/Prompt related files
```

### 🚀 Developer Experience

**Improved Onboarding**
- Clear setup path for new contributors
- Minimal required API keys (just Gemini for core features)
- Optional services can be added progressively
- Detailed troubleshooting guide

**Git Repository Health**
- Clean git history (secrets removed)
- Comprehensive .gitignore
- No sensitive information in commits
- Proper commit messages

---

## 📦 Installation

### Quick Start

```bash
# Clone repository
git clone https://github.com/0Reliance/Maeple.git
cd Maeple

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys (minimum: VITE_GEMINI_API_KEY)

# Start development
npm run dev
```

### Minimum Requirements

- Node.js 22+
- npm (comes with Node.js)
- At least one API key (Gemini recommended)

### API Keys Needed

**Required for Core Features:**
- Google Gemini API (primary AI)

**Recommended for Full Experience:**
- Z.ai API (code generation)
- Brave Search API (web search)
- ElevenLabs API (voice synthesis)

**Optional:**
- OpenAI API
- Anthropic API
- Perplexity AI
- Wearables (Oura, Garmin, Fitbit, Whoop)

---

## ✅ Known Issues

- Build requires Node.js 22+ (verified working)
- Some archived documentation may reference old workflows
- MCP configuration files removed (can be regenerated if needed)

---

## 🔧 Breaking Changes

### Removed Files
The following files have been removed or archived:
- `CHANGELOG.md` → Use git log for history
- `MEMORY.md` → Migrated to specifications/MEMORY_BANK.md
- `PLAN.md` → Use specifications/MASTER_PLAN.md
- `local_schema.sql` → Database setup now in SETUP.md
- `.credentials.md` → Use .env for configuration

### Environment Variables
All environment variables must now be set in `.env` file following the new `.env.example` template.

---

## 📋 Upgrade from Previous Version

If you have a previous version installed:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Update environment configuration
cp .env.example .env
# Compare with your old .env and migrate settings

# 3. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Rebuild (if needed)
npm run build
```

---

## 🎯 What's Next

### v1.0 Roadmap

- [ ] Complete API key rotation and security audit
- [ ] Add comprehensive test suite
- [ ] Implement CI/CD pipeline
- [ ] Complete deployment documentation
- [ ] Add automated backups
- [ ] Enhance monitoring and logging

---

## 🙏 Acknowledgments

- Security improvements based on best practices from GitHub Security Lab
- Documentation structure inspired by industry standards
- Community feedback on setup experience

---

## 📞 Support

- **Documentation:** See [SETUP.md](SETUP.md) for detailed instructions
- **Issues:** Report bugs at https://github.com/0Reliance/Maeple/issues
- **Discussions:** Feature requests at https://github.com/0Reliance/Maeple/discussions

---

## 📄 Download

- **Source Code:** https://github.com/0Reliance/Maeple
- **Tag:** v0.9-beta
- **Commit:** 0fa41db

---

**Built with ❤️ for the neurodivergent community**

© 2025 MAEPLE. All rights reserved.