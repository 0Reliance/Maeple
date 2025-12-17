# 🚀 Installation & Deployment Guide

Welcome to the **MAEPLE** installation guide. This document covers how to set up the development environment, deploy to production using Docker, and configure the necessary services.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

-   **Docker Engine** (v24.0+) & **Docker Compose** (v2.20+)
-   **Node.js** (v22+ recommended for local dev)
-   **Git**

## 🛠️ Quick Start (Docker)

The easiest way to run MAEPLE is using the provided Docker Compose configuration. This spins up the Frontend, Backend API, and PostgreSQL database.

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/maeple.git
cd maeple
```

### 2. Configure Environment

Copy the example environment file and update it with your credentials.

```bash
cp .env.example .env
```

**Key Configuration Variables:**

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL for the backend API (relative for proxy) | `/api` |
| `DB_PASSWORD` | PostgreSQL password | `maeple_beta_2025` |
| `JWT_SECRET` | Secret for signing auth tokens | *Change in production* |
| `VITE_GEMINI_API_KEY` | API Key for Google Gemini AI | *Required for AI features* |

### 3. Launch Services

Navigate to the deploy directory and start the stack:

```bash
cd deploy
docker compose up -d --build
```

This will start:
-   **Frontend**: `http://localhost` (Port 80)
-   **API**: `http://localhost/api` (Internal Port 3001)
-   **Database**: PostgreSQL (Internal Port 5432)

### 4. Verify Installation

Visit `http://localhost` in your browser. You should see the MAEPLE login screen.
To check the API health, visit `http://localhost/api/health`.

---

## 💻 Local Development Setup

If you prefer to run the services locally without Docker (e.g., for rapid UI development):

### Frontend

```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

### Backend

```bash
cd api
npm install
npm run dev
```
The API will run on `http://localhost:3001`.

*Note: You will still need a running PostgreSQL instance. You can use `docker compose up -d db` to start just the database.*

---

## 🌐 Production Deployment (VM/VPS)

For deploying to a Virtual Machine (like our `maeple-dev` environment):

### System Requirements
-   **OS**: Debian 12 (Bookworm) or Ubuntu 22.04 LTS
-   **RAM**: Minimum 4GB (6GB+ recommended for AI processing)
-   **CPU**: 2+ vCPUs

### Network Configuration
Ensure your firewall allows traffic on:
-   **Port 80/443**: HTTP/HTTPS
-   **Port 22**: SSH

### Nginx Proxy Manager (Optional)
If you are using Nginx Proxy Manager (NPM) or Cloudflare Tunnels:
1.  Point your domain (e.g., `app.maeple.com`) to the VM's IP.
2.  Configure NPM to forward requests to the Docker container on port 80.

---

## 🔧 Troubleshooting

### Common Issues

**1. "Cannot access 'r' before initialization"**
*   **Cause**: Circular dependencies or aggressive chunking in Vite.
*   **Fix**: We have simplified `vite.config.ts` in v2.0.1+. Ensure you are on the latest branch.

**2. Database Connection Refused**
*   **Check**: Ensure the `db` container is healthy (`docker compose ps`).
*   **Fix**: Check logs with `docker compose logs db`.

**3. AI Features Not Working**
*   **Check**: Verify `VITE_GEMINI_API_KEY` is set in `.env`.
*   **Fix**: Restart the frontend container after changing `.env` variables.

### Logs

To view real-time logs for all services:

```bash
cd deploy
docker compose logs -f
```
