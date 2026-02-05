# MAEPLE Local Database Integration - Status Report

**Date**: February 5, 2026  
**Version**: v0.97.8 (Latest)  
**Status**: ✅ FULLY OPERATIONAL - UPDATED TO LATEST

## Overview

The local development environment is now fully operational with a complete database integration stack running in Docker.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Local Development Stack                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Frontend   │───▶│  API Server  │───▶│  PostgreSQL  │   │
│  │   (port 80)  │    │  (port 3001) │    │  (port 5432) │   │
│  │  deploy-web  │    │  deploy-api  │    │   deploy-db  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Services

| Service | Container | Port | Status |
|---------|-----------|------|--------|
| PostgreSQL 16 | `deploy-db-1` | 5432 | ✅ Running |
| Express API | `deploy-api-1` | 3001 | ✅ Running |
| Web Frontend | `deploy-web-1` | 80 | ✅ Running |

## Database Configuration

- **Database**: `maeple`
- **User**: `maeple_user`
- **Password**: `maeple_beta_2025`
- **Schema**: Applied from `local_schema.sql`

### Tables
1. `users` - User accounts with password hashing
2. `user_settings` - JSON settings per user
3. `health_entries` - Journal entries with UUID primary keys

## API Endpoints Verified

### Authentication
- ✅ `POST /api/auth/signup` - User registration
- ✅ `POST /api/auth/signin` - User login
- ✅ `GET /api/auth/me` - Get current user
- ✅ `POST /api/auth/signout` - Logout

### Entries
- ✅ `GET /api/entries` - List all entries
- ✅ `POST /api/entries` - Create entry (auto-generates UUID)
- ✅ `PUT /api/entries/:id` - Update entry
- ✅ `DELETE /api/entries/:id` - Delete entry
- ✅ `POST /api/entries/sync` - Bulk sync entries

### Settings
- ✅ `GET /api/settings` - Get user settings
- ✅ `PUT /api/settings` - Update user settings

### Health
- ✅ `GET /api/health` - System health check with DB status

## Frontend Integration

The frontend properly integrates with the local API:

1. **API Client** (`src/services/apiClient.ts`):
   - Token-based authentication
   - Retry logic with exponential backoff
   - Timeout handling (10 seconds)
   - JSON validation

2. **Sync Service** (`src/services/syncService.ts`):
   - Offline-first architecture
   - Pending changes queue
   - Last Write Wins conflict resolution
   - Bidirectional sync

3. **Vite Proxy**:
   - `/api` requests proxy to `http://localhost:3001`

## Important Notes

### Entry IDs
- Entry IDs **must be valid UUIDs** (database column type)
- Frontend uses `uuid` package (`v4 as uuidv4`) for generation
- API can auto-generate UUID if not provided

### Starting the Stack
```bash
cd /opt/Maeple/deploy
docker-compose up -d
```

### Stopping the Stack
```bash
cd /opt/Maeple/deploy
docker-compose down
```

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker logs deploy-api-1 --tail 50
```

## Test Commands

```bash
# Health check
curl http://localhost:3001/api/health

# Sign up
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","displayName":"Test"}'

# Create entry (note: entry wrapper required)
curl -X POST http://localhost:3001/api/entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"entry":{"timestamp":"2026-01-20T12:00:00Z","mood":5,"moodLabel":"Good","rawText":"Test"}}'
```

## Production Notes

This local setup mirrors the production environment:
- **Local**: Docker stack on development VM
- **Production**: Supabase (PostgreSQL) + Vercel (Frontend + API)

The same API code and frontend will work in both environments - only connection strings change.

---

---

## Recent Updates (February 5, 2026)

**✅ Rebuilt Docker Containers with Latest Code**
- Previous containers were running outdated version (built Feb 1, 2026)
- Latest commit: `0cc8baf` - v0.97.8 (Navigation Redesign & System Improvements)
- Rebuild completed successfully in 30 seconds
- All services now running with latest codebase

**Current Commit Details:**
- Commit Hash: `0cc8baf25e987512932a6ed7e96c6d50cd058492`
- Version: 0.97.8
- Date: February 4, 2026 at 23:27:43 UTC
- Features: Navigation Redesign, System Improvements, Enhanced Error Documentation

**Container Status:**
- ✅ deploy-web-1: Created February 5, 00:18:31 UTC
- ✅ deploy-api-1: Created February 5, 00:18:31 UTC
- ✅ deploy-db-1: Created February 5, 00:18:30 UTC

---

*Last Updated: 2026-02-05T00:20:00Z*
