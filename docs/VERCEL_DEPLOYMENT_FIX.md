# Vercel Deployment Fix - Login/Registration Issues

## Problem Identified

The Vercel deployment was failing with "failed to fetch" errors on login/registration because:

1. **Missing Backend**: The `vercel.json` had a placeholder backend URL (`https://your-backend-url.com/api/$1`)
2. **No Serverless Functions**: The API endpoints weren't deployed as Vercel serverless functions
3. **Missing Database**: No PostgreSQL database was configured in Vercel
4. **Missing Environment Variables**: `DATABASE_URL` and `JWT_SECRET` were not set

## Solution Applied

### 1. Fixed Vercel Configuration
- Removed the invalid backend rewrite rule
- Kept SPA routing for the frontend
- Added cache-control headers for API routes

### 2. Created Serverless Functions
Created API endpoints as Vercel serverless functions:
- `api/auth/signup.js` - User registration
- `api/auth/signin.js` - User authentication
- `api/auth/me.js` - Get current user
- `api/health.js` - Health check endpoint

### 3. Created Database Schema
Created `database/schema.sql` with all required tables:
- `users` - User accounts
- `user_settings` - User preferences
- `health_entries` - Journal entries and health data

## Required Setup Steps

### Step 1: Set Up Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Click "Storage" → "Create Database"
3. Select "Postgres" and create a new database
4. Once created, click the database and go to "Settings" → "General"
5. Copy the `POSTGRES_PRISMA_URL` or `POSTGRES_URL`

### Step 2: Run Database Schema

In the Vercel Postgres console:
1. Open your newly created database
2. Click "Console" or "Query"
3. Copy and paste the contents of `database/schema.sql`
4. Run the SQL script to create tables

### Step 3: Add Environment Variables

Add these environment variables in Vercel:

**Option A: Using Vercel CLI**
```bash
# Add DATABASE_URL (replace with your actual Postgres URL)
vercel env add DATABASE_URL production
# Paste your POSTGRES_PRISMA_URL when prompted

# Add JWT_SECRET
vercel env add JWT_SECRET production
# Generate a secure secret: openssl rand -base64 32
# Paste the generated secret when prompted

# Redeploy with the new environment variables
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to your project settings → "Environment Variables"
2. Add `DATABASE_URL` with your Postgres connection string
3. Add `JWT_SECRET` with a secure random string
4. Click "Save"
5. Redeploy the project

### Step 4: Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
openssl rand -base64 32
```

Use this value for the `JWT_SECRET` environment variable.

### Step 5: Verify Deployment

After adding environment variables and redeploying:

1. Test the health endpoint:
   ```bash
   curl https://your-app-name.vercel.app/api/health
   ```
   Should return: `{"status":"healthy",...}`

2. Test registration (via the app):
   - Open your deployed app
   - Try to create a new account
   - Should successfully register and log in

## Alternative: Use External Database

If you prefer not to use Vercel Postgres, you can use any PostgreSQL database:

1. Create a PostgreSQL database (e.g., Supabase, Railway, Neon, AWS RDS)
2. Get the connection string: `postgresql://user:password@host:port/database`
3. Set `DATABASE_URL` environment variable in Vercel
4. Run the `database/schema.sql` script in your database
5. Redeploy

## Troubleshooting

### "Database connection failed"
- Check that `DATABASE_URL` is set in Vercel environment variables
- Verify the database is accessible from Vercel
- Check database credentials are correct

### "Invalid or expired token"
- Ensure `JWT_SECRET` is set and matches between deployments
- Clear localStorage and try logging in again

### "Endpoint not found"
- Verify serverless functions are in the `api/` directory
- Check that files use `.js` extension (not `.cjs`)
- Ensure functions export `default` handler

### "Failed to fetch"
- Check browser console for specific error messages
- Verify network requests are going to `/api/*` endpoints
- Check Vercel function logs for errors

## Serverless Function Structure

Each API endpoint follows this structure:

```javascript
export default async function handler(req, res) {
  // Validate HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Handle request
  try {
    // Your logic here
  } catch (error) {
    res.status(500).json({ error: 'Error message' });
  }
}
```

## Next Steps

1. Set up Vercel Postgres database
2. Run the database schema
3. Add environment variables
4. Redeploy the application
5. Test login/registration functionality

## Monitoring

After deployment:
- Check Vercel Function Logs for any errors
- Monitor database connections
- Test all auth endpoints
- Verify user data is being saved correctly

## Security Notes

- Never commit `DATABASE_URL` or `JWT_SECRET` to git
- Use strong, unique `JWT_SECRET` in production
- Enable SSL for all database connections
- Regularly rotate secrets if compromised
- Monitor for suspicious activity