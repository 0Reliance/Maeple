# MAEPLE Deployment Guide

This guide outlines the recommended deployment strategies for the MAEPLE platform (v0.97.0).

## <¯ Quick Start - Already Deployed!

**MAEPLE is already deployed and live:**

< **Production URL:** https://maeple.vercel.app

- Status:  Production Ready
- Build Time: 17.80s
- Deployment Time: 47s
- Environment Variables: Configured
- API Key: Active (Gemini)

### Deploy Updates

```bash
# Option 1: Automatic (Git Push)
git add .
git commit -m "Your commit message"
git push origin main
# Vercel auto-deploys within 30-60 seconds

# Option 2: Manual (CLI)
vercel --prod
```

## Architecture Overview

- **Frontend**: React + Vite (Static SPA)
- **Backend**: Node.js + Express (Stateful API) - Optional for AI features
- **Database**: PostgreSQL - Optional for cloud sync

## Option 1: Vercel (Recommended - Fastest & Easiest)

**Production:** https://maeple.vercel.app

### Prerequisites

- Node.js 18+ installed
- Git configured
- Vercel account (free tier)

### First-Time Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login
# Visit https://vercel.com/device and enter the code

# 3. Deploy to production
vercel --yes --prod

# 4. Add environment variables
echo "AIzaSyDcOGeN1Ve4But_GpQtHuKNf7zh-5VQAbM" | vercel env add VITE_GEMINI_API_KEY production
```

### Deploying Updates

```bash
# Automatic (Git Push - Recommended)
git add .
git commit -m "Update description"
git push origin main
# Vercel automatically deploys within 30-60 seconds

# Manual (CLI)
vercel --prod
```

### Vercel Dashboard Method

1. Go to https://vercel.com/new
2. Import GitHub repository: `https://github.com/0Reliance/Maeple`
3. Configure build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables:
   - `VITE_GEMINI_API_KEY`: Your Gemini API key
   - `VITE_ENABLE_BIOMIRROR`: `true`
   - `VITE_ENABLE_VOICE_JOURNAL`: `true`
   - `VITE_ENABLE_WEARABLES`: `true`
5. Click Deploy

### Vercel CLI Commands

```bash
# List deployments
vercel ls

# Deploy preview (non-production)
vercel

# Deploy to production
vercel --prod

# List environment variables
vercel env ls

# Add environment variable
echo "value" | vercel env add VARIABLE_NAME production

# Remove environment variable
vercel env rm VARIABLE_NAME production

# View deployment logs
vercel logs

# View deployment URLs
vercel ls
```

### Environment Variables

Required for Vercel deployment:

```bash
# AI Provider (Required)
VITE_GEMINI_API_KEY=AIzaSyDcOGeN1Ve4But_GpQtHuKNf7zh-5VQAbM

# API Configuration (Optional - if using separate backend)
VITE_API_URL=https://your-backend-url.com/api
VITE_BASE_URL=https://maeple.vercel.app

# Feature Flags (Optional)
VITE_ENABLE_BIOMIRROR=true
VITE_ENABLE_VOICE_JOURNAL=true
VITE_ENABLE_WEARABLES=true
VITE_ENABLE_CLOUD_SYNC=true
VITE_ENABLE_OFFLINE_MODE=true
```

### Build Output

Production build generates optimized bundles:
```
dist/index.html                                   1.78 kB  gzip:   0.78 kB
dist/assets/index-Dt_62KGt.css                   87.25 kB  gzip:  14.07 kB
dist/assets/index-BBPayEgE.js                   876.77 kB  gzip: 214.50 kB
dist/assets/analytics-CdrI8NLY.js               405.61 kB  gzip: 109.54 kB
dist/assets/Settings-cf_A99zT.js                190.13 kB  gzip:  44.09 kB
dist/assets/HealthMetricsDashboard-xadUxFn3.js   67.60 kB  gzip:  12.68 kB
dist/assets/ClinicalReport-BV04iuHN.js           47.79 kB  gzip:  10.00 kB
dist/assets/VisionBoard-5REE5WQO.js              12.72 kB  gzip:   3.16 kB
dist/assets/LiveCoach-D9oNU_Jw.js                 7.76 kB  gzip:   2.61 kB
```

### Verification

```bash
# Check deployment status
vercel ls

# Verify deployment is live
curl -I https://maeple.vercel.app
# Should return: HTTP/2 200

# Verify API key in build
curl -s "https://maeple.vercel.app/assets/index-BBPayEgE.js" | grep -o "AIzaSyDcOGeN1Ve4But_GpQtHuKNf7zh-5VQAbM"
```

### Vercel Features

-  Global CDN deployment
-  Automatic HTTPS/SSL
-  Edge caching
-  Preview deployments for PRs
-  Custom domains (maeple.vercel.app)
-  Zero-downtime deployments
-  Automatic rollbacks
-  Analytics dashboard

### Troubleshooting

**Build Fails:**
```bash
# Check build logs
vercel logs

# Common issues:
# - Missing environment variables
# - Node.js version mismatch
# - TypeScript errors
```

**Deployment Not Updating:**
```bash
# Clear Vercel cache
vercel --prod --force

# Or check if deployment queue is backed up
vercel ls
```

---

## Option 2: Docker Compose (For Full Stack with Backend)

Recommended for VPS when you need the full backend API and database.

### Prerequisites

- Docker & Docker Compose installed on the host (e.g., DigitalOcean Droplet, AWS EC2).

### Steps

1.  **Clone the repository** to your server.
2.  **Configure Environment**:
    Create a `.env` file in the root directory (or rely on the defaults in `docker-compose.yml` for testing).
    ```bash
    DB_PASSWORD=your_secure_password
    JWT_SECRET=your_production_secret
    VITE_GEMINI_API_KEY=your_gemini_api_key
    ```
3.  **Build and Run**:
    ```bash
    cd deploy
    # Pass the env file to ensure VITE_GEMINI_API_KEY is picked up by the build args
    docker compose --env-file ../.env up -d --build
    ```
4.  **Access**:
    - Frontend: `http://your-server-ip`
    - API: `http://your-server-ip/api` (proxied internally)

### Docker Commands

```bash
# Start services
docker compose -f deploy/docker-compose.yml up -d

# Stop services
docker compose -f deploy/docker-compose.yml down

# View logs
docker compose -f deploy/docker-compose.yml logs -f

# Rebuild
docker compose -f deploy/docker-compose.yml up -d --build

# Update containers
docker compose -f deploy/docker-compose.yml pull
```

## Option 3: Hybrid (Vercel Frontend + Railway/Render Backend)

Best for performance and scalability when you need backend API capabilities.

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
5.  **Configuration**:
    - A `vercel.json` file is included in the root to handle SPA routing and API rewrites (if needed). Update the destination URL in `vercel.json` to match your backend URL if you want to use the `/api` proxy feature on Vercel.

### Backend (Railway)

1.  Connect your GitHub repo to Railway.
2.  Create a new service from your repository.
3.  **Build Settings**:
    - Root Directory: `.`
    - Build Command: `npm install`
    - Start Command: `node api/index.cjs`
4.  **Database**:
    - Provision a PostgreSQL database within Railway.
    - Set environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DATABASE_URL`.
5.  **Environment Variables**:
    - `DATABASE_URL`: Railway provides this automatically
    - `JWT_SECRET`: Generate a secure random string
    - `GEMINI_API_KEY`: Your Gemini API key

### Backend (Render)

1.  Connect your GitHub repo to Render.
2.  Create a new "Web Service".
3.  **Build Settings**:
    - Root Directory: `.`
    - Build Command: `npm install`
    - Start Command: `node api/index.cjs`
4.  **Database**:
    - Create a PostgreSQL database.
    - Add environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

## Option 4: Monolithic PaaS (Railway/Render)

Deploy the entire repo as a single service (or linked services) on a PaaS.

### Railway

1.  **Database**: Create a PostgreSQL service.
2.  **Backend**: Deploy the repo, set start command to `node api/index.cjs`. Link to DB.
3.  **Frontend**: Deploy the repo as a Static Site. Configure it to point to the Backend URL.
4.  **Environment Variables**: Add all required variables to the service.

### Render

1.  **Database**: Create a PostgreSQL database.
2.  **Backend**: Create a Web Service, start command: `node api/index.cjs`.
3.  **Frontend**: Create a Static Site, build command: `npm run build`, publish directory: `dist`.
4.  **Environment Variables**: Configure each service with required variables.

## Security Best Practices

### Environment Variables

- **Never commit** `.env` files to version control
- Use strong, unique passwords and secrets
- Rotate API keys regularly
- Use different keys for development, staging, and production

### Database Security

- Enable SSL connections
- Use connection pooling
- Implement rate limiting
- Regular backups and testing of restore procedures

### API Security

- Implement CORS properly
- Use JWT with short expiration times
- Enable rate limiting on endpoints
- Validate and sanitize all inputs

---

## Database Migrations

The `local_schema.sql` file is mounted in the Docker container for initialization. For production updates:

1. Consider using a migration tool (e.g., Knex.js, TypeORM)
2. Test migrations in staging first
3. Backup database before running migrations
4. Document schema changes in version control

---

## Monitoring & Logging

### Vercel

```bash
# View deployment logs
vercel logs

# View real-time logs
vercel logs --follow

# View specific deployment
vercel inspect <deployment-url>
```

### Docker

```bash
# View container logs
docker compose logs -f

# View specific service logs
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f database
```

### Application Logs

Check browser console for client-side errors and `localStorage` for application logs.

---

## Rollback Procedures

### Vercel

```bash
# Rollback to previous deployment
vercel rollback <deployment-id>

# Or use Vercel dashboard:
# 1. Go to project deployments
# 2. Click on previous deployment
# 3. Click "Promote to Production"
```

### Docker

```bash
# Revert to previous image
docker compose down
# Update docker-compose.yml to use previous image tag
docker compose up -d
```

---

## Performance Optimization

### Vercel

- Enable edge caching for static assets
- Use image optimization
- Implement service worker for offline support
- Enable gzip/brotli compression

### Docker

- Use multi-stage builds to reduce image size
- Implement health checks
- Use volume mounts for persistent data
- Configure resource limits

---

## Troubleshooting

### Common Issues

**Build fails on Vercel:**
- Check Node.js version in `package.json`
- Verify all dependencies are listed
- Check environment variables are set
- Review build logs for specific errors

**Environment variables not working:**
- Ensure `VITE_` prefix for client-side variables
- Check variable names match exactly
- Verify variables are set in correct environment (production/preview)
- Redeploy after adding variables

**Database connection issues:**
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Verify firewall rules allow connections
- Test connection string with `psql` or similar tool

**API routes not working:**
- Check `vercel.json` rewrite rules
- Verify build output includes API files
- Test locally with `npm run build && npm run preview`
- Check CORS configuration

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run all tests: `npm test:run`
- [ ] Run type check: `npm run typecheck`
- [ ] Run lint: `npm run lint`
- [ ] Build successfully: `npm run build`
- [ ] Test locally: `npm run preview`
- [ ] Update environment variables
- [ ] Backup database (if applicable)
- [ ] Update documentation

### Post-Deployment

- [ ] Verify site loads
- [ ] Test all major features
- [ ] Check console for errors
- [ ] Verify API keys are working
- [ ] Test wearables integration (if applicable)
- [ ] Monitor performance metrics
- [ ] Check analytics dashboard

---

## Support

### Getting Help

1. **Check Documentation**: Start with [README.md](../README.md) and [QUICK_REFERENCE.md](../docs/QUICK_REFERENCE.md)
2. **Search Issues**: Check [GitHub Issues](https://github.com/0Reliance/Maeple/issues)
3. **Vercel Docs**: https://vercel.com/docs
4. **Docker Docs**: https://docs.docker.com

### Reporting Issues

When reporting deployment issues, please include:
- Deployment method (Vercel/Docker/Railway/Render)
- Environment (development/production)
- Error messages (full logs)
- Steps to reproduce
- Expected vs actual behavior

---

**Last Updated:** December 28, 2025  
**Version:** 0.97.0  
**Production URL:** https://maeple.vercel.app