# MAEPLE Development Quick Reference

**Version**: 1.0.0  
**Last Updated**: December 26, 2025

---

## Getting Started

### Initial Setup

```bash
# Run the automated setup script
bash scripts/setup-dev.sh

# This will:
# - Check Node.js version (requires 22+)
# - Create .env file from .env.example
# - Create necessary directories
# - Install dependencies
# - Install VS Code extensions (optional)
# - Run health checks
```

### Manual Setup

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Edit .env with your API keys
# All required keys are pre-configured in .env.example

# 3. Install dependencies
npm install

# 4. Run type check
npm run typecheck

# 5. Run linter
npm run lint

# 6. Start development server
npm run dev
```

---

## Available Commands

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run health           # Run health check
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run typecheck        # Type check with TypeScript
npm run typecheck:watch  # Watch mode for type checking
```

### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage    # Run tests with coverage
npm run test:ai          # Test AI providers
npm run test:all         # Run all checks (build, analyze, test:ai)
```

### Comprehensive Checks
```bash
npm run check-all        # Run lint + typecheck + tests
npm run fix-all          # Run lint:fix + format + typecheck
```

---

## API Keys Configuration

### Pre-Configured Keys (in .env.example)

| Service | API Key Variable | Status |
|---------|-----------------|--------|
| Gemini | `VITE_GEMINI_API_KEY` | ✅ Configured |
| Z.ai | `ZAI_API_KEY` | ✅ Configured |
| Perplexity | `PERPLEXITY_API_KEY` | ✅ Configured |
| Brave Search | `BRAVE_API_KEY` | ✅ Configured |
| ElevenLabs | `ELEVENLABS_API_KEY` | ✅ Configured |
| Jina AI | `JINA_API_KEY` | ✅ Configured |
| Giphy | `GIFY_API_KEY` | ✅ Configured |
| Resend | `RESEND_API_KEY` | ✅ Configured |
| OpenRouter | `OPENROUTER_API_KEY` | ✅ Configured |
| Firecrawl | `FIRECRAWL_API_KEY` | ✅ Configured |
| Moonshot Kimi | `MOONSHOT_KIMI_API_KEY` | ✅ Configured |
| GitHub Genpozi | `GITHUB_GENPOZI_TOKEN` | ✅ Configured |

### Keys to Add (Optional)

| Service | API Key Variable | Get Key From |
|---------|-----------------|--------------|
| OpenAI | `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| Anthropic | `ANTHROPIC_API_KEY` | https://console.anthropic.com/ |
| Oura Ring | `VITE_OURA_CLIENT_ID` | https://cloud.ouraring.com/oauth/applications |
| Whoop | `VITE_WHOOP_CLIENT_ID` | https://developer.whoop.com/ |
| Garmin | `VITE_GARMIN_CONSUMER_KEY` | https://developer.garmin.com/ |

---

## MCP (Model Context Protocol) Servers

### Configured Servers

1. **Filesystem Server**
   - Path: `/opt/Maeple`
   - Purpose: Read and write project files
   - Tools: read_file, write_to_file, list_files, search_files

2. **Git Server**
   - Repository: `/opt/Maeple`
   - Purpose: Git operations and version control
   - Tools: git status, commit, branch management

3. **Brave Search Server**
   - API Key: Pre-configured
   - Purpose: Web search for research and development
   - Tools: web_search

4. **PostgreSQL Server**
   - Connection: `postgresql://localhost:5432/maeple`
   - Purpose: Direct database access
   - Tools: execute_query, list_tables

5. **Memory Server**
   - Storage: `.mcp-memory/`
   - Purpose: Persistent memory for AI assistants
   - Tools: store_memory, recall_memory, search_memory

### MCP Configuration

Configuration is in `mcp-config.json` and `.vscode/settings.json`.

**Key Settings:**
```json
{
  "mcp.enabled": true,
  "mcp.logLevel": "info",
  "mcp.maxRetries": 3,
  "mcp.timeout": 30000
}
```

---

## AI Provider Capabilities

### Vision Capabilities

| Provider | Vision Support | Primary Use |
|----------|---------------|-------------|
| ✅ Gemini | Native | Bio-Mirror, Live Coach |
| ✅ OpenAI | Native | Image analysis, DALL-E |
| ❌ Z.ai | None | Code generation (needs preprocessing) |
| ❌ Anthropic | None | Text analysis |
| ❌ Perplexity | None | Web search |

### Multi-Provider Pattern for Vision

When using Z.ai (no vision) with image data:

```typescript
// Step 1: Vision analysis with Gemini
const visionData = await gemini.analyzeImage({
  image: imageData,
  prompt: "Describe facial features, fatigue, tension..."
});

// Step 2: Use vision data with Z.ai for code
const code = await zai.generateCode(`
  Process this facial analysis data:
  ${JSON.stringify(visionData)}
  
  Generate TypeScript code for capacity calculation.
`);
```

### Provider Selection by Task

| Task | Primary Provider | Fallback |
|------|-----------------|-----------|
| Vision Analysis | Gemini | OpenAI |
| Code Generation | Z.ai | Anthropic, Gemini |
| Text Analysis | Anthropic | Gemini, OpenAI |
| Web Search | Perplexity | Brave Search, Jina |
| Voice Synthesis | ElevenLabs | Gemini (text-to-speech) |
| Real-time Coaching | Gemini (multimodal) | Anthropic |

---

## File Structure

```
MAEPLE/
├── .env                          # Environment variables (create from .env.example)
├── .env.example                  # Template with all keys pre-configured
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── mcp-config.json               # MCP server definitions
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Project dependencies and scripts
├── .gitignore                   # Git ignore rules
├── vite.config.ts               # Vite build configuration
│
├── docs/
│   ├── DEVELOPMENT_TOOLING.md     # Complete development tooling guide
│   ├── AI_INTEGRATION_GUIDE.md   # AI integration and best practices
│   └── QUICK_REFERENCE.md        # This file
│
├── specifications/
│   ├── COMPLETE_SPECIFICATIONS.md # Comprehensive system specifications
│   ├── DATA_MODELS.md          # Data model definitions
│   ├── API_REFERENCE.md         # API documentation
│   └── SYSTEM_ARCHITECTURE.md   # Architecture overview
│
├── src/
│   ├── components/              # React components
│   ├── services/               # Business logic
│   │   ├── ai/                # AI services layer
│   │   │   ├── router.ts      # AI router with fallback
│   │   │   └── adapters/     # Provider adapters
│   │   ├── storageService.ts   # Local storage
│   │   ├── syncService.ts     # Sync logic
│   │   └── encryptionService.ts # Data encryption
│   ├── stores/                # Zustand state management
│   └── types.ts              # TypeScript types
│
├── tests/                     # Test files
├── scripts/
│   ├── setup-dev.sh           # Automated setup script
│   ├── health-check.cjs       # Health check script
│   └── test-ai-providers.cjs # AI provider testing
│
└── api/                      # Backend API
```

---

## Common Development Tasks

### Adding a New AI Provider

1. Create adapter in `src/services/ai/adapters/[provider]Adapter.ts`
2. Register in `src/services/ai/router.ts`
3. Add capabilities to `PROVIDER_CAPABILITIES`
4. Add API key to `.env.example`
5. Test with `npm run test:ai`

### Creating a New Component

```bash
# Component file location
src/components/MyComponent.tsx

# Test file location
tests/components/MyComponent.test.tsx

# Best practices:
# - Use TypeScript strict mode
# - Follow ESLint rules
# - Write tests
# - Use Prettier for formatting
```

### Running Tests

```bash
# Watch mode (development)
npm test

# Single run (CI/CD)
npm run test:run

# With coverage report
npm run test:coverage

# Specific test file
npm test -- MyComponent.test.tsx
```

### Type Checking

```bash
# Single check
npm run typecheck

# Watch mode (rechecks on file changes)
npm run typecheck:watch
```

### Linting and Formatting

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format all files
npm run format

# Check formatting without changing
npm run format:check
```

---

## Troubleshooting

### TypeScript Errors

**Problem**: Type errors after installing new packages
```bash
# Solution 1: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Solution 2: Clear TypeScript cache
npm run typecheck -- --force
```

**Problem**: `Cannot find module` errors
```bash
# Solution: Check tsconfig paths are correct
# Ensure imports use @/* alias for src/ directory
import { MyComponent } from '@/components/MyComponent';
```

### ESLint Errors

**Problem**: ESLint errors that won't auto-fix
```bash
# Solution: Check ESLint configuration
cat .eslintrc.js

# Common issues:
# - Missing @ts-nocheck for intentionally any types
# - Unused variables (remove or prefix with _)
# - Missing dependencies (npm install missing-package)
```

### Build Errors

**Problem**: Build fails with TypeScript errors
```bash
# Solution 1: Fix type errors first
npm run typecheck

# Solution 2: Check for circular dependencies
npm run build:analyze
# Review bundle-analysis.json for issues

# Solution 3: Clean build cache
rm -rf dist
npm run build
```

### MCP Server Issues

**Problem**: MCP servers not connecting
```bash
# Solution 1: Check MCP configuration
cat mcp-config.json

# Solution 2: Check logs
ls -la .mcp/logs/

# Solution 3: Restart VS Code
code --reload

# Solution 4: Verify API keys
grep -r "API_KEY" .env
```

### AI Provider Issues

**Problem**: AI requests failing
```bash
# Solution 1: Test AI providers
npm run test:ai

# Solution 2: Check API keys are set
cat .env | grep API_KEY

# Solution 3: Check rate limits
# Look for "rate limit exceeded" in console

# Solution 4: Verify network connectivity
curl https://api.openai.com/v1/models
```

### Database Issues

**Problem**: Database connection fails
```bash
# Solution 1: Check PostgreSQL is running
sudo systemctl status postgresql

# Solution 2: Check connection string
echo $DATABASE_URL

# Solution 3: Test connection
psql $DATABASE_URL

# Solution 4: Run migrations
npm run migrate
```

---

## Performance Optimization

### Bundle Size Analysis

```bash
# Analyze bundle size
npm run analyze

# Review output:
# - dist/assets/*.js files
# - bundle-analysis.json
# - Look for large dependencies

# Optimization strategies:
# - Code splitting (lazy loading)
# - Tree shaking (remove unused code)
# - Use @vitejs/plugin-react-swc for faster builds
```

### Load Testing

```bash
# Test API with load
npm run load-test

# Monitor:
# - Response times
# - Error rates
# - Memory usage
```

### Database Optimization

```bash
# Analyze queries
psql $DATABASE_URL -f scripts/analyze-queries.sql

# Add indexes if needed
CREATE INDEX idx_health_entries_user_timestamp 
ON health_entries (user_id, timestamp DESC);

# Vacuum database
VACUUM ANALYZE;
```

---

## Security Best Practices

### API Key Management

```bash
# ✅ GOOD: Use environment variables
const apiKey = process.env.VITE_GEMINI_API_KEY;

# ❌ BAD: Hardcode keys
const apiKey = "your_gemini_api_key_here";

# ✅ GOOD: Use backend proxy for server-side keys
fetch('/api/proxy/ai', { body: JSON.stringify({ provider: 'zai' }) })

# ❌ BAD: Expose server keys to client
const clientKey = process.env.ZAI_API_KEY; // Never do this!
```

### Data Encryption

```typescript
// Biometric data is automatically encrypted
import { encryptionService } from '@/services/encryptionService';

// Encrypt before storing
const encrypted = await encryptionService.encrypt(imageBuffer, userKey);

// Decrypt when needed
const decrypted = await encryptionService.decrypt(encrypted, iv, userKey);
```

### Rate Limiting

```typescript
// Rate limiting is automatically applied
// - 55 requests/minute per user
// - 1400 requests/day per user
// - 100 requests/minute per IP

// Custom rate limits
import { rateLimiter } from '@/services/rateLimiter';

await rateLimiter.check(userId, 55, 60000); // 55 per minute
```

---

## Documentation Links

### Core Documentation
- [Complete Specifications](../specifications/COMPLETE_SPECIFICATIONS.md) - Full system documentation
- [Development Tooling Guide](./DEVELOPMENT_TOOLING.md) - Detailed tooling setup
- [AI Integration Guide](./AI_INTEGRATION_GUIDE.md) - AI provider usage
- [This Quick Reference](./QUICK_REFERENCE.md) - Fast lookup guide

### API Documentation
- [API Reference](../specifications/API_REFERENCE.md) - REST API documentation
- [Data Models](../specifications/DATA_MODELS.md) - Data structure documentation

### Architecture
- [System Architecture](../specifications/SYSTEM_ARCHITECTURE.md) - Architecture overview
- [Data Analysis Logic](../specifications/DATA_ANALYSIS_LOGIC.md) - Analysis algorithms

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Gemini API](https://ai.google.dev/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Support and Resources

### Getting Help

1. **Check Documentation**: Start with the relevant guide above
2. **Search Issues**: Check GitHub Issues for similar problems
3. **Health Check**: Run `npm run health` to diagnose issues
4. **Logs**: Check `.mcp/logs/` for MCP server logs
5. **Console**: Browser DevTools Console for frontend errors
6. **Terminal**: Check terminal for backend errors

### Reporting Issues

When reporting issues, include:
- MAEPLE version (from package.json)
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages (full stack trace)

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run check-all` to ensure quality
5. Submit a pull request

---

## Keyboard Shortcuts (VS Code)

### General
- `Ctrl/Cmd + P` - Quick Open
- `Ctrl/Cmd + Shift + P` - Command Palette
- `Ctrl/Cmd + `` - Terminal
- `Ctrl/Cmd + B` - Toggle sidebar

### Editing
- `Alt/Option + Up/Down` - Move line
- `Shift + Alt/Option + Up/Down` - Copy line
- `Ctrl/Cmd + /` - Toggle comment
- `Ctrl/Cmd + D` - Select next occurrence

### TypeScript
- `F12` - Go to definition
- `Shift + F12` - Peek definition
- `F2` - Rename symbol
- `Ctrl/Cmd + .` - Quick fix

### Testing
- `Ctrl/Cmd + Shift + T` - Go to test file
- `Ctrl/Cmd + ;` - Toggle test coverage

---

## Useful Snippets

### React Component with TypeScript

```typescript
import { useState, useEffect } from 'react';

interface MyComponentProps {
  title: string;
  onSave: (data: string) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onSave
}) => {
  const [data, setData] = useState<string>('');
  
  useEffect(() => {
    // Component mount logic
  }, []);
  
  const handleSave = () => {
    onSave(data);
  };
  
  return (
    <div>
      <h1>{title}</h1>
      <input
        value={data}
        onChange={(e) => setData(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

### Zustand Store

```typescript
import { create } from 'zustand';

interface AppState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useStore = create<AppState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 }))
}));
```

### API Service Call

```typescript
export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${endpoint}`
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${endpoint}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  }
};
```

---

**Document Version**: 1.0.0  
**Last Updated**: December 26, 2025  
**Maintained By**: MAEPLE Development Team