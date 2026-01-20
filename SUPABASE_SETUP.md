# Supabase Authentication Setup Guide

## Overview

Maeple uses **Supabase** for **production** authentication and user management on Vercel.

> **Note:** For local development, the Docker stack includes a full PostgreSQL database with JWT-based authentication. See [LOCAL_DB_STATUS.md](LOCAL_DB_STATUS.md) for local setup details.

## Local vs Production

| Environment | Database | Auth | Setup |
|-------------|----------|------|-------|
| **Local** | PostgreSQL 16 (Docker) | JWT via local API | `docker-compose up -d` |
| **Production** | Supabase (Cloud) | Supabase Auth | Configure env vars |

## Why Supabase for Production?

✅ **No serverless functions needed** - Works entirely client-side
✅ **Vercel-compatible** - Deploys without additional configuration
✅ **Built-in security** - Handles JWT tokens, password hashing, and user management
✅ **Free tier** - 500MB database, 50k MAU (monthly active users)
✅ **Real-time auth** - Instant session updates across browser tabs

---

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Sign in/up (use GitHub or Google for quick signup)
4. Fill in project details:
   - **Name**: `maeple` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose nearest region (e.g., US East)
   - **Pricing**: Free tier is fine for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for project setup to complete

---

## Step 2: Get Your API Credentials

Once your project is ready:

1. Go to **Settings** → **API** (left sidebar)
2. Copy these values:

```
Project URL: https://your-project.supabase.co
Anon/public key: your-anon-key-here
```

⚠️ **Important**: Never commit your service_role key! Only use the anon/public key in your frontend.

Note: Use your own Supabase project credentials for your environment.

---

## Step 3: Configure Environment Variables

### For Local Development:

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Start your dev server:
   ```bash
   npm run dev
   ```

### For Vercel Deployment:

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Settings** → **Environment Variables**
3. Add the following:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environments**: Production, Preview, Development

4. Add the second variable:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon/public key
   - **Environments**: Production, Preview, Development

5. Click **Save**
6. Redeploy: Go to **Deployments** → Click the three dots on latest deployment → **Redeploy**

---

## Step 4: Configure Authentication Settings (Optional)

Customize auth behavior in Supabase:

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. **Email**:
   - Enable/disable email confirmation
   - Set password requirements
3. **Social Providers** (optional):
   - Enable Google, GitHub, etc.
   - Add OAuth credentials from those platforms
4. **Email Templates**:
   - Customize confirmation emails
   - Customize password reset emails

---

## Step 5: Test Authentication

After configuration, test auth flow:

1. Open your app: `https://your-app-url` (or `http://localhost:5173` locally)
2. Click **Sign Up**
3. Enter email and password
4. Click **Create Account**
5. You should see:
   - ✅ "Account created successfully" or
   - ✅ "Check your email to confirm your account"

---

## Troubleshooting

### "Supabase not configured" error

**Cause**: Environment variables not set correctly

**Fix**:

1. Check `.env` file exists and has correct values
2. For Vercel: Check environment variables in project settings
3. Restart your dev server after updating `.env`

### "Failed to fetch" or network errors

**Cause**: Network connectivity or incorrect URL

**Fix**:

1. Verify `VITE_SUPABASE_URL` is correct (includes `https://`)
2. Check Supabase status page: https://status.supabase.com
3. Ensure your VPN or firewall isn't blocking requests

### "Invalid login credentials"

**Cause**: Wrong email/password or user doesn't exist

**Fix**:

1. Try signing up again (if user doesn't exist)
2. Check for typos in email/password
3. Verify email confirmation is enabled in Supabase settings

### "Email confirmation required"

**Cause**: User signed up but didn't confirm email

**Fix**:

1. Check inbox (including spam folder)
2. In Supabase dashboard, go to **Authentication** → **Users**
3. Manually confirm user (for testing):
   - Click the user row
   - Click **Confirm** button

---

## Advanced Features

### OAuth Login (Google, GitHub, etc.)

Implemented in this repo. Enable providers in Supabase:

1. Go to **Authentication** → **Providers**
2. Enable desired providers (Google, GitHub, GitLab)
3. Add OAuth credentials from those platforms
4. The login button will automatically appear in your app

### Password Reset

Implemented in this repo:

1. User clicks "Forgot Password" in login form
2. Enters email
3. Receives reset link in email
4. Creates new password

### User Profile Updates

Implemented in this repo:

```typescript
import { updateProfile } from "./services/authService";

// Update user's display name
await updateProfile({ full_name: "John Doe" });

// Update avatar
await updateProfile({ avatar_url: "https://..." });
```

---

## Database Schema (Optional)

If you want to store additional user data:

1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL:

```sql
-- Create custom profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Automatic profile creation
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();
```

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.gg/supabase
- **Issue Tracker**: https://github.com/supabase/supabase/issues

---

## Migration from Custom API

If you were previously using custom serverless functions:

✅ **No changes needed** to your React components
✅ **Auth service handles the switch** automatically
✅ **All existing auth methods still work**:

- `signInWithEmail()`
- `signUpWithEmail()`
- `signOut()`
- `updateProfile()`
- etc.

Just configure Supabase credentials, and it works!

---

## Security Best Practices

1. ✅ Always use the **anon/public key** in frontend (never service_role)
2. ✅ Enable email confirmation for production
3. ✅ Set strong password requirements
4. ✅ Enable Row Level Security (RLS) on all tables
5. ✅ Regularly rotate your JWT secret (in Supabase settings)
6. ✅ Monitor your auth logs for suspicious activity

---

## Cost Summary (Free Tier)

- ✅ 500MB PostgreSQL database
- ✅ 50,000 Monthly Active Users (MAU)
- ✅ 1GB file storage
- ✅ 2GB bandwidth per month
- ✅ Unlimited API requests

**Upgrade needed only if**:

- More than 50k monthly users
- More than 500MB database
- Need dedicated support

For most apps, the free tier is sufficient!
