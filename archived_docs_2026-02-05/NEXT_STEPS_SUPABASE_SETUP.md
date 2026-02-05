# MAEPLE - Supabase Setup Notes

**Updated:** January 20, 2026  
**Status:** ✅ Local Database Integration Complete (Alternative Approach)

---

## ✅ Resolution Summary

Instead of running the full Supabase CLI stack locally (which requires 10+ Docker containers and ~4GB+ of images, causing VM resource issues), we implemented a lightweight alternative:

### Local Development Stack (Currently Running)

| Service | Container | Port | Status |
|---------|-----------|------|--------|
| PostgreSQL 16 | deploy-db-1 | 5432 | ✅ Running |
| Express API | deploy-api-1 | 3001 | ✅ Running |
| Web Frontend | deploy-web-1 | 80 | ✅ Running |

### Features
- ✅ Full authentication (signup, signin, JWT tokens)
- ✅ All CRUD operations for entries and settings
- ✅ Database schema from `local_schema.sql`
- ✅ Matches production API interface

See [LOCAL_DB_STATUS.md](LOCAL_DB_STATUS.md) for complete details.

---

## Production Setup (Supabase Cloud)

For production deployment on Vercel, use Supabase Cloud:
| `/opt/Maeple/supabase/config.toml` | Local Supabase configuration |
| `/opt/Maeple/database/schema.sql` | Database schema |
| `/opt/Maeple/local_schema.sql` | Alternative schema file |
| `/opt/Maeple/src/services/authService.ts` | Auth service (already has error handling) |
| `/opt/Maeple/src/lib/supabase.ts` | Supabase client initialization |

---

## 🛠️ Useful Commands

```bash
# Check Supabase status
supabase status

# Stop local Supabase
supabase stop

# Reset database (destructive)
supabase db reset

# View logs
supabase logs

# Access local PostgreSQL
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

---

## 📊 Disk Space Requirements

| Component | Size |
|-----------|------|
| supabase/postgres | ~1.0 GB |
| supabase/gotrue | ~200 MB |
| supabase/realtime | ~300 MB |
| supabase/storage-api | ~200 MB |
| supabase/studio | ~300 MB |
| Other services | ~500 MB |
| **Total needed** | **~4 GB** |

Current state: 798 MB free, need ~4 GB more.

---

## 🎯 After Supabase Running

Once local Supabase is running, verify:
- [ ] `supabase status` shows all services healthy
- [ ] `.env` updated with local URLs/keys
- [ ] Dev server restarted
- [ ] Sign up creates user in local DB
- [ ] No console errors on auth operations
- [ ] Tests still pass (282 tests)
