# Local Development Guide

This guide explains how to run the full Maeple stack locally, including the PostgreSQL database, API server, and Frontend.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v16+)
- Git

## Quick Start

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Setup Database**

    We have a script to automate the PostgreSQL setup (user, database, and schema creation).

    ```bash
    bash setup_db.sh
    ```

    _Note: This script assumes you have `sudo` access to start the postgres service and `psql` access._

3.  **Start the API Server**

    The API server runs on port 3001 and handles authentication and data persistence.

    ```bash
    node api/index.cjs
    ```

    _You can verify it's running by visiting `http://localhost:3001/api/health`_

4.  **Start the Frontend**

    In a new terminal, start the Vite development server.

    ```bash
    npm run dev
    ```

    The app will be available at `http://localhost:5173`.

## Architecture

- **Frontend**: React + Vite (Port 5173)
  - Proxies `/api` requests to `http://localhost:3001`
- **Backend**: Node.js + Express (Port 3001)
  - Located in `api/index.cjs`
- **Database**: PostgreSQL
  - Schema defined in `local_schema.sql`

## Troubleshooting

- **API Connection Failed**: Ensure the API server is running on port 3001. Check the console logs for any database connection errors.
- **Database Errors**: If you see "role does not exist" or "database does not exist", rerun `bash setup_db.sh`.
- **Auth Errors**: The auth service uses the local API exclusively. Ensure the API server is running on port 3001.
