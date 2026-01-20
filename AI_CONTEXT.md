# MAEPLE Project AI Context

> **Document Purpose**: Persistent context for AI systems assisting with MAEPLE development
> **Location**: VM-125 (maeple-dev) at 192.168.1.192
> **Last Updated**: January 20, 2026
> **App Version**: 0.97.7
> **Maintained By**: 0Reliance Knowledge Stack Orchestration
> **Local Database**: ✅ Fully Operational (PostgreSQL 16 in Docker)

---

## 🎯 Project Identity

### What is MAEPLE?
**Mental And Emotional Pattern Literacy Engine** - A neuro-affirming health intelligence platform designed to help users (particularly those with ADHD, Autism, or CPTSD) understand their mental and emotional patterns.

### Project Location
| Property | Value |
|----------|-------|
| **VM ID** | 125 |
| **Hostname** | maeple-dev |
| **IP Address** | 192.168.1.192 |
| **Project Path** | `/opt/Maeple/` |
| **Deploy Path** | `/opt/Maeple/deploy/` |
| **Public URL** | https://maeple.0reliance.com |
| **Local URL** | http://192.168.1.192 |

### Current Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | 19.2 |
| Build | Vite | 7.2 |
| Language | TypeScript | 5.2+ |
| Backend | Node.js | 22+ |
| Database | PostgreSQL | 16 |
| Container | Docker | 29.1.3 |

---

## ⚠️ CRITICAL MANDATES

### 1. Application Independence Mandate
> **The MAEPLE application MUST remain self-contained and NOT incorporate external tools from the broader infrastructure into its runtime dependencies.**

This means:
- ❌ DO NOT add dependencies on external MCP servers in production code
- ❌ DO NOT require CT122 services for the app to function
- ❌ DO NOT hardcode references to 192.168.1.99 or other infrastructure IPs in app code
- ❌ DO NOT make the app dependent on Ollama, LiteLLM, or other external AI services
- ✅ The app MUST work standalone with its own database and API
- ✅ External AI providers (Gemini, OpenAI, etc.) are acceptable as they are user-configured

### 2. Development Tooling Access Mandate
> **ALL tools in the 0Reliance Knowledge Stack are available and SHOULD be used for development, testing, debugging, and tooling purposes.**

This means:
- ✅ USE external AI models (via CT122/CT194) for code generation, review, and analysis
- ✅ USE MCP servers for file operations, git management, and research during development
- ✅ USE the knowledge stack services for documentation, research, and planning
- ✅ USE the infrastructure for CI/CD, testing, and deployment automation
- ✅ LEVERAGE the full AI ecosystem for development velocity

### 3. Separation of Concerns
```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT TIME                         │
│  Use ANY tool in the stack for building MAEPLE              │
│  • AI assistance, code review, research, testing            │
└─────────────────────────────────────────────────────────────┘
                            ↓ builds ↓
┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME (Production)                     │
│  MAEPLE runs INDEPENDENTLY with:                            │
│  • Its own PostgreSQL database                              │
│  • Its own Node.js API                                      │
│  • Its own React frontend                                   │
│  • User-configured AI providers only                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Available Development Tools

### AI Hub (CT122 - 192.168.1.99)

#### Language Models
| Model | Endpoint | Use For |
|-------|----------|---------|
| Ollama Models | http://192.168.1.99:11434 | Code generation, review |
| Open WebUI | http://192.168.1.99:8084 | Interactive AI chat |
| LiteLLM Proxy | http://192.168.1.194:4000 | Unified model access |

**Available Models via Ollama:**
- `deepseek-r1` - Reasoning and complex logic
- `gemma3` - General purpose
- `mistral-7b` - Fast code assistance
- `phi3-mini` - Lightweight tasks
- `qwen2.5-coder-1.5b` - Code-specialized

#### MCP Servers (Development Tooling)
| Server | Endpoint | Purpose |
|--------|----------|---------|
| Filesystem | http://192.168.1.99:3010 | File operations |
| Fetch | http://192.168.1.99:3011 | HTTP requests |
| Git | http://192.168.1.99:3012 | Repository management |

#### Research & Knowledge
| Service | URL | Purpose |
|---------|-----|---------|
| SurfSense | http://192.168.1.99:3000 | AI-powered research |
| DeepWiki | http://192.168.1.99:3001 | Documentation analysis |
| Storm | http://192.168.1.99:8503 | Research synthesis |
| Fabric | http://192.168.1.99:1337 | AI patterns/prompts |
| Mem0 | http://192.168.1.99:8005 | Memory/context management |

#### Productivity
| Service | URL | Purpose |
|---------|-----|---------|
| n8n | http://192.168.1.99:5678 | Workflow automation |
| Stirling-PDF | http://192.168.1.99:8088 | PDF processing |
| Browser Use | http://192.168.1.99:8004 | Browser automation |
| Marker | http://192.168.1.99:8008 | Document conversion |

### Knowledge Tools (CT161 - 192.168.1.161)

| Service | URL | Purpose |
|---------|-----|---------|
| Tolkien | http://192.168.1.161:3000 | Voice notes & knowledge graph |
| Khoj AI | http://192.168.1.161:42110 | Personal AI assistant |
| AFFiNE | http://192.168.1.161:3010 | Knowledge workspace |
| GPT Researcher | http://192.168.1.161:8001 | Deep research |

### Creative Tools (CT122)

| Service | URL | Purpose |
|---------|-----|---------|
| ComfyUI | http://192.168.1.99:8188 | Image generation |
| Langflow | http://192.168.1.99:7860 | AI workflow builder |
| Penpot | http://192.168.1.99:9001 | Design tool |

### LiteLLM Gateway (CT194 - 192.168.1.194)

**Unified API Endpoint**: `http://192.168.1.194:4000/v1`

Use this for:
- Consistent API interface across all models
- Request logging and observability
- Rate limiting and quota management
- Model fallback chains

---

## 🔌 Integration Instructions

### Using AI Models for Development

```bash
# Query Ollama directly
curl http://192.168.1.99:11434/api/generate -d '{
  "model": "deepseek-r1",
  "prompt": "Review this TypeScript code for MAEPLE...",
  "stream": false
}'

# Use LiteLLM unified endpoint
curl http://192.168.1.194:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "ollama/deepseek-r1", "messages": [{"role": "user", "content": "Help me refactor..."}]}'
```

### SSH Access to AI Hub

```bash
# From this VM to AI Hub (key-based auth configured)
ssh root@192.168.1.99

# Run commands on AI Hub
ssh root@192.168.1.99 "docker ps"
ssh root@192.168.1.99 "ollama list"
```

---

## 📋 Development Workflows

### Code Review Workflow
1. Write/modify code in `/opt/Maeple/`
2. Use AI models via CT122 for code review
3. Run local tests: `npm test`
4. Commit changes locally

### Research Workflow
1. Use SurfSense or GPT Researcher for technical research
2. Use DeepWiki for analyzing external documentation
3. Use Khoj for searching local knowledge base
4. Synthesize findings with Storm

---

## 🗂️ Local Project Structure

```
/opt/Maeple/
├── src/                    # Application source code
├── deploy/                 # Docker deployment files
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   └── Dockerfile.web
├── tests/                  # Test suites
├── docs/                   # Documentation
├── database/               # Database schemas
├── public/                 # Static assets
├── package.json            # Dependencies
└── AI_CONTEXT.md           # THIS FILE
```

---

## 🚀 Quick Commands

```bash
# Start development server
cd /opt/Maeple && npm run dev

# Run tests
cd /opt/Maeple && npm test

# Build for production
cd /opt/Maeple && npm run build

# Deploy with Docker
cd /opt/Maeple/deploy && docker compose up -d --build

# Check container status
docker ps | grep deploy

# View logs
docker logs deploy-api-1
docker logs deploy-web-1

# Database access
docker exec -it deploy-db-1 psql -U maeple_user -d maeple
```

---

## 📡 Network Context

```
┌─────────────────────────────────────────────────────────────────┐
│                 0Reliance Knowledge Stack                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ CT122        │    │ CT161        │    │ CT194        │      │
│  │ AI Hub       │    │ Knowledge    │    │ LiteLLM      │      │
│  │ 192.168.1.99 │    │ 192.168.1.161│    │ 192.168.1.194│      │
│  │ • Ollama     │    │ • Tolkien    │    │ • Unified    │      │
│  │ • MCP        │    │ • Khoj       │    │   Gateway    │      │
│  │ • Research   │    │ • AFFiNE     │    │              │      │
│  └──────┬───────┘    └──────────────┘    └──────────────┘      │
│         │ SSH + HTTP                                            │
│         ▼                                                        │
│  ┌──────────────────────────────────────┐                       │
│  │         VM-125 (THIS VM)             │                       │
│  │         maeple-dev @ 192.168.1.192   │                       │
│  │  ┌─────────────────────────────────┐ │                       │
│  │  │          MAEPLE APP             │ │                       │
│  │  │  (Runs independently)           │ │                       │
│  │  │  • React Frontend :80           │ │                       │
│  │  │  • Node.js API :3001            │ │                       │
│  │  │  • PostgreSQL :5432             │ │                       │
│  │  └─────────────────────────────────┘ │                       │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist for AI Assistants

Before making changes, verify:
- [ ] Change does NOT add runtime dependency on external infrastructure
- [ ] Change is compatible with standalone deployment
- [ ] Tests pass locally (`npm test`)
- [ ] Docker build succeeds (`docker compose build`)

When using external tools:
- [ ] Using for development/tooling purposes only
- [ ] Not embedding tool URLs in production code
- [ ] Documenting any new development workflows

---

*This context file is maintained by the 0Reliance orchestration system. For updates, contact the orchestration layer at CT122 (192.168.1.99).*
