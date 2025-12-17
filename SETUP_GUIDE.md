# MAEPLE Development Environment Setup Guide

## 🖥️ VM Details

- **Hostname**: maeple-dev
- **IP Address**: 192.168.1.192
- **OS**: Debian 12 (Bookworm)
- **Resources**: 4 vCPUs, 6GB RAM, 20GB Disk
- **Docker**: Installed with Docker Compose Plugin
- **Runtime**: Node.js v22 (Alpine) in containers

## 🌐 Network Configuration

- **Internal IP**: 192.168.1.192
- **NPM Proxy**: 192.168.1.169 (Points `*.0reliance.com` to this VM)
- **Cloudflare Tunnel**: Points to NPM

## 🚀 Installation & Setup

The project is set up in `/opt/Maeple`.

### 1. Repository

The repository is cloned at `/opt/Maeple`.

```bash
cd /opt/Maeple
```

### 2. Environment Configuration

A `.env` file has been created in the root directory with the following configuration:

```dotenv
# Backend API URL (Relative for Nginx Proxy)
VITE_API_URL=/api

# AI Provider Keys (Placeholder - Update with real keys)
VITE_GEMINI_API_KEY=placeholder_key

# Database Credentials
DB_USER=maeple_user
DB_PASSWORD=maeple_beta_2025
DB_NAME=maeple
DB_HOST=db
DB_PORT=5432

# Security
JWT_SECRET=maeple-production-secret-change-me
```

### 3. Running the Application

We use Docker Compose to run the full stack (Frontend, Backend, Database).

**Start the services:**

```bash
cd /opt/Maeple/deploy
docker compose up -d --build
```

**Stop the services:**

```bash
cd /opt/Maeple/deploy
docker compose down
```

**View Logs:**

```bash
cd /opt/Maeple/deploy
docker compose logs -f
```

## 🏗️ Architecture

The setup uses three Docker containers:

1.  **deploy-web-1**: Nginx serving the React Frontend.
    -   Port: 80 (Mapped to host port 80)
    -   Proxies `/api` requests to the backend.
2.  **deploy-api-1**: Node.js Express Backend.
    -   Port: 3001 (Internal)
3.  **deploy-db-1**: PostgreSQL 16 Database.
    -   Port: 5432 (Internal)

## 🔍 Verification

-   **Frontend**: `http://192.168.1.192` (or via `*.0reliance.com` if DNS is propagated)
-   **API Health**: `http://192.168.1.192/api/health`

## 🛠️ Troubleshooting

### Recent Fixes (v2.0.1)
- **Build Error**: `Uncaught ReferenceError: Cannot access 'r' before initialization` was caused by an aggressive manual chunking strategy in `vite.config.ts`. This has been simplified to let Vite handle dependency splitting automatically.
- **Node Version**: Upgraded Docker containers to `node:22-alpine` to support Vite 7 and React Router 7 dependencies.
- **Meta Tags**: Fixed viewport and PWA meta tag warnings in `index.html`.

-   **Build Failures**: Ensure `.dockerignore` does not exclude `deploy/` (this has been fixed).
-   **API Connection Issues**: The frontend expects the API at `/api`. Nginx handles the proxying. Ensure `VITE_API_URL` is set to `/api` or left empty (defaults to `/api`).
-   **Database Connection**: The API container connects to `db` host. Ensure the `db` service is healthy.
