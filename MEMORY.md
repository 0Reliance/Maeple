# Project Memory & Context

## Project Overview
**MAEPLE** (Mental And Emotional Pattern Literacy Engine) is a neuro-affirming health intelligence platform.
- **Version**: 2.0.0
- **Stack**: React (Vite), Node.js (Express), PostgreSQL.
- **AI**: Multi-provider router (Gemini, OpenAI, Anthropic, etc.).

## Development Environment
- **Location**: `/opt/Maeple` on `maeple-dev` VM.
- **Deployment**: Docker Compose (`deploy/docker-compose.yml`).

## Key Configuration Decisions

### 1. Nginx Proxy
The frontend is served by Nginx, which also acts as a reverse proxy for the API.
- **Frontend**: `/` -> `index.html`
- **API**: `/api` -> `http://api:3001`

This avoids CORS issues and simplifies the `VITE_API_URL` configuration.

### 2. Environment Variables
- `VITE_API_URL` is set to `/api` in `.env`. This ensures the frontend makes relative requests that Nginx can intercept and proxy.
- Database credentials match the defaults in `docker-compose.yml` for ease of development.

### 3. Docker Build Context
- The `docker-compose.yml` uses `context: ..` (root of repo).
- `.dockerignore` was modified to **allow** the `deploy/` directory so that `nginx.conf` can be copied during the build.

### 4. Infrastructure Stabilization (v2.0.1)
- **Node.js Version**: Upgraded to **v22** (LTS) in Dockerfiles. This is required because the project uses Vite 7 and React Router 7, which drop support for Node 18.
- **Vite Configuration**: Removed manual `manualChunks` configuration for `recharts` and other libraries. The previous configuration caused circular dependency issues (`ReferenceError: Cannot access 'r' before initialization`).
- **Meta Tags**: Updated `index.html` to comply with modern PWA and viewport standards.
- **AI Response Validation**: Added `validateParsedResponse` in `geminiService.ts` to prevent crashes when AI returns incomplete JSON (missing arrays like `medications`).

## Important Paths
- **Source Code**: `/opt/Maeple/src`
- **API Code**: `/opt/Maeple/api`
- **Deploy Config**: `/opt/Maeple/deploy`
- **Documentation**: `/opt/Maeple/specifications`

## Future Considerations
- **SSL/TLS**: Currently handled by Cloudflare Tunnel / NPM. The container runs on HTTP port 80.
- **Data Persistence**: PostgreSQL data is persisted in the `postgres_data` volume.
- **AI Keys**: Real API keys need to be added to `.env` for AI features to work.
