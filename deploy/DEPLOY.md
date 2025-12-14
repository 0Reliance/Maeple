# MAEPLE Deployment Guide

This guide outlines the recommended deployment strategies for the MAEPLE platform (v2.0.0).

## Architecture Overview

- **Frontend**: React + Vite (Static SPA)
- **Backend**: Node.js + Express (Stateful API)
- **Database**: PostgreSQL

## Option 1: Docker Compose (Recommended for VPS)

This is the most robust method as it encapsulates the entire stack (Frontend, Backend, Database) in containers, ensuring the environment matches development.

### Prerequisites

- Docker & Docker Compose installed on the host (e.g., DigitalOcean Droplet, AWS EC2).

### Steps

1.  **Clone the repository** to your server.
2.  **Configure Environment**:
    Create a `.env` file in the root directory (or rely on the defaults in `docker-compose.yml` for testing).
    ```bash
    DB_PASSWORD=your_secure_password
    JWT_SECRET=your_production_secret
    ```
3.  **Build and Run**:
    ```bash
    cd deploy
    docker-compose up -d --build
    ```
4.  **Access**:
    - Frontend: `http://your-server-ip`
    - API: `http://your-server-ip/api` (proxied internally)

## Option 2: Hybrid (Vercel + Railway/Render)

Best for performance and scalability.

### Frontend (Vercel)

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  **Build Settings**:
    - Framework Preset: Vite
    - Build Command: `npm run build`
    - Output Directory: `dist`
4.  **Environment Variables**:
    - `VITE_API_URL`: The URL of your deployed backend (e.g., `https://maeple-api.up.railway.app/api`)
    - `VITE_GEMINI_API_KEY`: Your AI key.

### Backend (Railway / Render)

1.  Connect your GitHub repo.
2.  **Build Settings**:
    - Root Directory: `.`
    - Build Command: `npm install`
    - Start Command: `node api/index.cjs`
3.  **Database**:
    - Provision a PostgreSQL database within the PaaS.
    - Set environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

## Option 3: Monolithic PaaS (Railway/Render)

Deploy the entire repo as a single service (or linked services) on a PaaS.

1.  **Database**: Create a PostgreSQL service.
2.  **Backend**: Deploy the repo, set start command to `node api/index.cjs`. Link to DB.
3.  **Frontend**: Deploy the repo as a Static Site. Configure it to point to the Backend URL.

## Notes

- **Database Migrations**: The `local_schema.sql` file is mounted in the Docker container for initialization. For production updates, consider using a migration tool or manually running SQL updates.
- **Security**: Ensure `JWT_SECRET` and database passwords are strong and not committed to version control.
