docker
# MAEPLE Development Tooling Guide

**Version**: 1.0.0  
**Updated**: December 26, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Visual Tooling Configuration](#visual-tooling-configuration)
4. [MCP (Model Context Protocol)](#mcp-model-context-protocol)
5. [Z.ai Integration](#zai-integration)
6. [Cline Best Practices](#cline-best-practices)
7. [Development Workflow](#development-workflow)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide explains the complete development tooling setup for MAEPLE, including ESLint, Prettier, TypeScript, MCP servers, Z.ai integration, and Cline AI assistant configuration.

### Tooling Stack

- **Language Server**: TypeScript with strict mode
- **Linting**: ESLint with TypeScript, React, and accessibility rules
- **Formatting**: Prettier with consistent style
- **Testing**: Vitest with React Testing Library
- **AI Integration**: Z.ai + GitHub Copilot
- **MCP Servers**: Filesystem, Git, Search, PostgreSQL, Memory
- **AI Assistant**: Cline with MCP integration

---

## Setup Instructions

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/0Reliance/Maeple.git
cd Maeple

# Install dependencies
npm install

# Install required VS Code extensions
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension vitest.explorer
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/maeple

# AI Services (optional)
ZAI_API_KEY=your_zai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Search (optional)
BRAVE_API_KEY=your_brave_api_key_here
```

---

## Visual Tooling Configuration

### ESLint Configuration

**File**: `.eslintrc.js`

ESLint is configured with:

- TypeScript recommended rules
- React and React Hooks rules
- Accessibility (jsx-a11y) rules
- Import organization rules
- Security best practices
- Prettier integration

**Key Rules**:

- No `any` types (warn, error in production)
- Unused variables detection
- Import organization and deduplication
- No eval, no new Function
- Strict React Hooks rules

**Running ESLint**:

```bash
# Lint all files
npm run lint

# Lint and auto-fix
npm run lint:fix

# Lint specific file
npx eslint src/components/JournalEntry.tsx
```

### Prettier Configuration

**File**: `.prettierrc`

Prettier is configured for:

- Semi-colons: Yes
- Quotes: Double
- Print width: 100 characters
- Tab width: 2 spaces
- Trailing commas: ES5
- End of line: LF

**Running Prettier**:

```bash
# Format all files
npx prettier --write "src/**/*.{ts,tsx,js,jsx}"

# Check formatting
npx prettier --check "src/**/*.{ts,tsx,js,jsx}"

# Format specific file
npx prettier --write src/components/JournalEntry.tsx
```

### TypeScript Configuration

**File**: `tsconfig.json`

TypeScript is configured with:

- Strict mode enabled
- No implicit any
- Strict null checks
- Strict function types
- No unused locals
- Path aliases for clean imports

**Key Settings**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Running TypeScript**:

```bash
# Type check
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### VS Code Configuration

**File**: `.vscode/settings.json`

VS Code is configured to:

- Format on save
- Organize imports on save
- Use Prettier as default formatter
- Enable TypeScript strict mode
- Configure Tailwind CSS IntelliSense
- Enable Vitest explorer

**Recommended Extensions**:

| Extension                          | Purpose                          |
| ---------------------------------- | -------------------------------- |
| `dbaeumer.vscode-eslint`           | ESLint integration               |
| `esbenp.prettier-vscode`           | Prettier integration             |
| `bradlc.vscode-tailwindcss`        | Tailwind CSS IntelliSense        |
| `ms-vscode.vscode-typescript-next` | Latest TypeScript features       |
| `vitest.explorer`                  | Test runner UI                   |
| `github.copilot`                   | AI code completion               |
| `formulahendry.auto-rename-tag`    | Auto rename paired HTML/XML tags |

---

## MCP (Model Context Protocol)

### Overview

MCP servers provide AI assistants (like Cline) with tools to interact with the development environment. MAEPLE is configured with 5 MCP servers:

### Configured MCP Servers

#### 1. Filesystem Server

**Purpose**: Read, write, and navigate files

**Tools**:

- `read_file` - Read file contents
- `write_to_file` - Create or overwrite files
- `list_files` - List directory contents
- `search_files` - Search for patterns across files
- `list_code_definition_names` - List functions/classes in code

**Permissions**:

- Allowed: `/opt/Maeple`
- Denied: `/opt/Maeple/node_modules`, `/opt/Maeple/.git`

#### 2. Git Server

**Purpose**: Access git repository information

**Tools**:

- `git_log` - Get commit history
- `git_diff` - Get diff between commits
- `git_status` - Get repository status

**Permissions**:

- Repository: `/opt/Maeple`

#### 3. Brave Search Server

**Purpose**: Search the web for current information

**Tools**:

- `search` - Web search with results

**Requirements**:

- API Key: `BRAVE_API_KEY` (optional, get from [Brave Search API](https://api.search.brave.com/))
- Rate limit: 60 requests/minute

#### 4. PostgreSQL Server

**Purpose**: Query database directly

**Tools**:

- `query` - Execute SQL SELECT queries
- `execute` - Execute SQL INSERT/UPDATE/DELETE
- `schema` - Get database schema

**Requirements**:

- Connection string: `DATABASE_URL`
- Max connections: 10

#### 5. Memory Server

**Purpose**: Persistent memory across AI sessions

**Tools**:

- `read` - Read stored memories
- `write` - Store new memories
- `search` - Search memories

**Storage**:

- Type: File-based
- Path: `/opt/Maeple/.mcp-memory`

### MCP Configuration File

**File**: `mcp-config.json`

The MCP configuration includes:

- Server definitions and tools
- Environment variable requirements
- Permissions and rate limits
- Logging configuration

### Using MCP with Cline

Cline automatically loads MCP servers when configured. Servers are listed in `.vscode/settings.json`:

```json
{
  "cline.useMCP": true,
  "cline.mcpServers": ["filesystem", "git", "brave-search", "postgres", "memory"]
}
```

### MCP Commands

From Cline or VS Code, you can:

```bash
# List files in a directory
list_files("src/services", recursive=true)

# Read a file
read_file("src/components/JournalEntry.tsx")

# Search for code patterns
search_files("src/services", "interface.*Service")

# Get git log
git_log(limit=10)

# Search the web
search("TypeScript strict mode best practices 2025")

# Query database
query("SELECT * FROM health_entries ORDER BY created_at DESC LIMIT 10")
```

---

## Z.ai Integration

### Overview

Z.ai is a next-generation AI platform that provides advanced code generation, refactoring, and analysis capabilities.

### Configuration

Z.ai is configured in `.vscode/settings.json`:

```json
{
  "ai.provider": "zai",
  "ai.zai.apiKey": "${ZAI_API_KEY}",
  "ai.zai.baseUrl": "https://api.z.ai/v1",
  "ai.zai.model": "zai-latest",
  "ai.zai.temperature": 0.7,
  "ai.zai.maxTokens": 4096
}
```

### Setting Up Z.ai

1. **Get API Key**: Visit [Z.ai Developer Portal](https://z.ai/developers)
2. **Create Account**: Sign up and create a new API key
3. **Configure**: Add key to `.env` file:
   ```bash
   ZAI_API_KEY=your_api_key_here
   ```

### Z.ai Capabilities

#### Code Generation

```typescript
// Generate a React component
import { generateComponent } from "@zai/react";

const component = await generateComponent({
  prompt: "Create a form with validation",
  framework: "react",
  typescript: true,
  styling: "tailwind",
});
```

#### Code Refactoring

```typescript
// Refactor for performance
const refactored = await zai.refactor({
  code: sourceCode,
  rules: ["performance", "readability", "typescript-strict"],
  context: "This is a high-traffic component",
});
```

#### Code Review

```typescript
// AI code review
const review = await zai.review({
  files: ["src/services/authService.ts"],
  focus: ["security", "typescript-strictness", "performance"],
});
```

#### Documentation Generation

```typescript
// Generate JSDoc comments
await zai.document({
  files: ["src/**/*.ts"],
  format: "jsdoc",
});
```

### Best Practices for Z.ai

1. **Always Review Generated Code**: Never blindly accept AI-generated code
2. **Provide Context**: Give Z.ai context about your codebase and requirements
3. **Iterate**: Use multiple passes to refine results
4. **Test Thoroughly**: Always test AI-generated code
5. **Security First**: Never include API keys or secrets in prompts

### Z.ai + TypeScript

Z.ai works best with TypeScript:

```typescript
// Provide type definitions in prompts
const prompt = `
  Generate a function that:
  - Accepts: HealthEntry object (see types.ts)
  - Returns: ProcessedHealthEntry with calculated metrics
  - Follows strict TypeScript typing
  - Handles edge cases and null values
`;
```

---

## Cline Best Practices

### Overview

Cline is an AI development assistant that uses MCP tools to help with coding tasks. It's configured in `.vscode/settings.json`.

### Cline Configuration

```json
{
  "cline.enabled": true,
  "cline.autoApprove": false,
  "cline.contextWindow": 200000,
  "cline.maxTokens": 4096,
  "cline.temperature": 0.3,
  "cline.model": "claude-sonnet-4-20250514",
  "cline.useMCP": true,
  "cline.mcpServers": ["filesystem", "git", "brave-search", "postgres"]
}
```

### Cline Best Practices (December 2025)

#### 1. Context Management

**Provide Clear Context**:

```
"I'm working on the MAEPLE health platform. Current task: Add validation to the journal entry component to ensure all required fields are present before submission."
```

**Relevant Files**:

```
"Relevant files:
- src/components/JournalEntry.tsx
- src/types.ts (HealthEntry interface)
- src/services/validationService.ts"
```

#### 2. Tool Usage Strategy

**Use MCP Tools Effectively**:

- `list_files` first to understand structure
- `read_file` for specific files you mention
- `search_files` for finding patterns
- `git_log` to understand recent changes
- `git_diff` to see what changed

**Example**:

```
"First, list the files in src/services to see available services.
Then read the validationService.ts to understand current implementation.
Then search for validation patterns in the codebase."
```

#### 3. Incremental Approach

**Break Down Tasks**:

```
"Task: Add form validation to JournalEntry

Step 1: Read current JournalEntry component
Step 2: Identify validation requirements from types.ts
Step 3: Add validation functions to validationService.ts
Step 4: Integrate validation into JournalEntry component
Step 5: Add tests for validation logic"
```

#### 4. TypeScript Strictness

**Always Maintain Type Safety**:

```
"Ensure all new code follows TypeScript strict mode:
- No 'any' types (use unknown instead and type guard)
- Handle null/undefined explicitly
- Use type assertions carefully
- Import types from types.ts"
```

#### 5. Error Handling

**Handle Errors Gracefully**:

```
"Add proper error handling:
- Try-catch around async operations
- User-friendly error messages
- Logging for debugging
- Fallback UI states"
```

#### 6. Testing

**Test Your Changes**:

```
"After implementation:
1. Run unit tests: npm test
2. Run lint: npm run lint
3. Type check: npx tsc --noEmit
4. Manual test in dev environment"
```

#### 7. Documentation

**Document Changes**:

```
"Update relevant documentation:
- Add to CHANGELOG.md if user-facing
- Update DEVELOPMENT.md if architecture change
- Add inline comments for complex logic
- Update types.ts if new types added"
```

#### 8. Git Hygiene

**Commit Granular Changes**:

```
"Commit structure:
- 'feat: add validation to journal entry'
- 'fix: handle edge case in validation'
- 'test: add unit tests for validation'
- 'docs: update DEVELOPMENT.md with validation docs'"
```

#### 9. Security

**Security First**:

```
"Security considerations:
- Validate all user inputs
- Never expose sensitive data in logs
- Use parameterized queries for database
- Encrypt biometric data with encryptionService"
```

#### 10. Performance

**Consider Performance**:

```
"Performance optimization:
- Use React.memo for expensive components
- Debounce user input (300ms)
- Lazy load images
- Virtualize long lists with react-virtuoso"
```

### Common Cline Workflows

#### Adding a New Feature

```
1. "Read requirements and relevant documentation"
2. "Examine similar existing features in codebase"
3. "Plan the implementation with file structure"
4. "Implement core functionality step by step"
5. "Add TypeScript types and validation"
6. "Write tests"
7. "Update documentation"
8. "Test manually"
```

#### Debugging an Issue

```
1. "Read error logs and stack traces"
2. "Search codebase for error patterns"
3. "Review recent git changes"
4. "Add debug logging"
5. "Reproduce the issue"
6. "Identify root cause"
7. "Implement fix"
8. "Add regression test"
```

#### Refactoring Code

```
1. "Read current implementation"
2. "Identify refactoring opportunities"
3. "Plan refactoring to maintain API compatibility"
4. "Refactor step by step"
5. "Update types if needed"
6. "Run existing tests to ensure no breakage"
7. "Add new tests if behavior changed"
8. "Update documentation"
```

---

## Development Workflow

### Recommended Daily Workflow

1. **Start Day**:

   ```bash
   # Pull latest changes
   git pull origin main

   # Install dependencies (if needed)
   npm install

   # Run health check
   npm run health
   ```

2. **Start Development**:

   ```bash
   # Start dev server
   npm run dev

   # In another terminal, start API (if needed)
   cd api && npm start
   ```

3. **Before Commits**:

   ```bash
   # Run linter
   npm run lint:fix

   # Type check
   npx tsc --noEmit

   # Run tests
   npm test
   ```

4. **After Commits**:

   ```bash
   # Push changes
   git push

   # Verify CI/CD pipeline passes
   ```

### Code Review Checklist

- [ ] Code follows TypeScript strict mode
- [ ] No ESLint errors or warnings
- [ ] Prettier formatting applied
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance considered
- [ ] Accessibility guidelines followed
- [ ] No sensitive data exposed
- [ ] Error handling implemented

### Pre-Merge Checklist

- [ ] All tests passing (100% coverage for critical paths)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Manual testing completed
- [ ] Code reviewed by peer
- [ ] CHANGELOG.md updated
- [ ] Breaking changes documented
- [ ] Migration needed? If yes, provide migration script
- [ ] API documentation updated (if API changes)

---

## Troubleshooting

### Common Issues

#### ESLint Errors

**Issue**: "ESLint: 'any' type is not allowed"

**Solution**:

```typescript
// Bad
const data: any = response;

// Good
const data: unknown = response;
// Then type guard
if (isHealthEntry(data)) {
  // Use data as HealthEntry
}
```

#### TypeScript Errors

**Issue**: "Object is possibly 'null'"

**Solution**:

```typescript
// Bad
const entry = getEntry(id);
entry.mood; // Error: entry might be null

// Good
const entry = getEntry(id);
if (entry) {
  entry.mood; // Safe
}
```

#### Prettier Conflicts

**Issue**: Prettier and ESLint disagree on formatting

**Solution**: Prettier overrides ESLint formatting rules. Run:

```bash
npx prettier --write "src/**/*.{ts,tsx}"
```

#### MCP Servers Not Connecting

**Issue**: MCP server not found

**Solutions**:

1. Check `.vscode/settings.json` for correct server config
2. Ensure required environment variables are set
3. Verify Node.js version is 22+
4. Restart VS Code after config changes

#### Z.ai API Errors

**Issue**: "Z.ai API key invalid"

**Solutions**:

1. Verify `ZAI_API_KEY` in `.env` file
2. Check key validity in Z.ai dashboard
3. Ensure API key has correct permissions
4. Check rate limits (may need to upgrade plan)

### Getting Help

- **Documentation**: Check `docs/` folder
- **Issues**: Create GitHub issue with reproduction steps
- **Discussions**: Use GitHub Discussions for questions
- **Slack**: Join MAEPLE development Slack

---

## Resources

### Official Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Vitest Documentation](https://vitest.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### AI and MCP

- [Cline Documentation](https://cline.dev)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Z.ai Documentation](https://docs.z.ai/)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)

### MAEPLE Specific

- [Complete Specifications](../specifications/COMPLETE_SPECIFICATIONS.md)
- [System Architecture](../specifications/SYSTEM_ARCHITECTURE.md)
- [Data Models](../specifications/DATA_MODELS.md)
- [API Reference](../specifications/API_REFERENCE.md)

---

**Last Updated**: December 26, 2025  
**Maintained By**: MAEPLE Development Team
