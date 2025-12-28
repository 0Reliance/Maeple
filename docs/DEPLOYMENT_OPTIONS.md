# MAEPLE Deployment Options - Complete Guide

## Project Architecture Overview

```
MAEPLE Platform (v0.97.0)
├── Frontend: React 18 + Vite (Static SPA)
│   ├── Build: TypeScript + Tailwind CSS
│   ├── Output: dist/ (static files)
│   └── PWA Support: Service Worker + Manifest
├── Backend: Node.js + Express (REST API)
│   ├── Port: 3001
│   ├── Auth: JWT + bcrypt
│   └── Database: PostgreSQL
└── Mobile: Capacitor (iOS + Android)
    ├── WebDir: dist/
    └── Platforms: Android, iOS
```

---

## Option 1: Vercel (RECOMMENDED for Frontend)

### Overview
Vercel is ideal for the frontend SPA with excellent CI/CD, preview deployments, and global CDN.

### What Works Out-of-the-Box
- ✅ Pre-configured `vercel.json` for SPA routing
- ✅ Vite preset support
- ✅ Automatic HTTPS
- ✅ Edge caching with CDN
- ✅ Preview deployments on PRs
- ✅ Free tier available

### Setup Instructions

#### Using Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No (first time)
# - Project name: maeple (or your choice)
# - Directory: ./
# - Build Command: npm run build
# - Output Directory: dist
```

#### Using Git Integration

```bash
# Push to GitHub
git add .
git commit -m "Ready for Vercel deployment"
git push origin main

# Then in Vercel dashboard:
# 1. Import repository
# 2. Framework Preset: Vite
# 3. Build Settings (auto-detected):
#    - Build Command: npm run build
#    - Output Directory: dist
# 4. Environment Variables:
#    - VITE_API_URL: https://your-backend-url.com/api
#    - VITE_GEMINI_API_KEY: your_api_key
```

### Environment Variables Required

```bash
VITE_API_URL=https://your-backend-url.com/api
VITE_GEMINI_API_KEY=your_gemini_key_here
```

### Verifying Deployment

```bash
# View deployment logs
vercel logs

# Open production URL
vercel --prod

# Check environment variables in dashboard
vercel env ls
```

### Vercel Configuration Details

The `vercel.json` file handles:
- SPA routing (rewrites all routes to index.html)
- API proxy (can proxy /api requests to backend)
- Custom headers for cache control

**Important:** Update the backend URL in `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR_BACKEND_URL/api/$1"
    }
  ]
}
```

---

## Option 2: Netlify (Alternative to Vercel)

### Overview
Similar to Vercel with generous free tier and great dev tools.

### Netlify CLI Setup

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize project
netlify init

# Deploy
netlify deploy --prod
```

### Netlify Configuration (netlify.toml)

Create `netlify.toml` in project root:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

## Option 3: Cloudflare Pages (Fastest Global CDN)

### Setup Using Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler pages project create maeple
wrangler pages deploy dist --project-name=maeple
```

### Configuration (.env.production)
```bash
VITE_API_URL=https://your-backend.com/api
VITE_GEMINI_API_KEY=your_key
```

---

## Option 4: Docker Deployment (Full Stack)

### Overview
Containerize entire application (Frontend + Backend + Database).

### Prerequisites
- Docker installed
- VPS or cloud server (DigitalOcean, AWS EC2, Linode)

### Quick Setup

```bash
# Build and run all services
cd deploy
docker compose --env-file ../.env up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Docker Compose Services

```
Services:
├── web (Nginx + React SPA)
├── api (Express + Node.js)
└── db (PostgreSQL)
```

### Access
- Frontend: http://your-server-ip
- API: http://your-server-ip/api
- Database: localhost:5432

---

## Option 5: Railway (Full PaaS)

### Overview
Deploy everything as managed services with automatic scaling.

### Setup Using CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Add Backend (API)
railway up
# Set start command to: node api/index.cjs

# Add Frontend (Static)
railway add static
# Set directory to: ./

# Deploy
railway up
```

### Railway Environment Variables

Set these in Railway dashboard:
```bash
DB_HOST (auto-provided)
DB_PORT=5432
DB_NAME (auto-provided)
DB_USER (auto-provided)
DB_PASSWORD (auto-provided)
JWT_SECRET=your_secret_here
VITE_GEMINI_API_KEY=your_key
```

---

## Option 6: Render (Alternative to Railway)

### Setup Using CLI

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Deploy
render deploy
```

### Manual Setup (Web Dashboard)

1. **PostgreSQL**: Create a PostgreSQL database
2. **Web Service**: Connect repo, set build/start commands
3. **Static Site**: Deploy the dist/ folder

---

## Option 7: AWS (Enterprise Grade)

### Option 7a: AWS Amplify (Easiest)

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

### Option 7b: S3 + CloudFront (Manual)

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://maeple-bucket

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## Backend Deployment Options

### Option 1: Railway (Recommended)

```bash
# Connect GitHub repo
# Set build settings:
#   - Root Directory: ./
#   - Build Command: npm install
#   - Start Command: node api/index.cjs
```

### Option 2: Render

Similar to Railway with PostgreSQL support.

### Option 3: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Create app
heroku create maeple-api

# Add PostgreSQL
heroku addons:create heroku-postgresql

# Deploy
git push heroku main
```

### Option 4: DigitalOcean App Platform

```bash
# Install doctl
brew install doctl  # macOS
# or download from website

# Authenticate
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

---

## Mobile Deployment

### Android

```bash
# Sync latest build
npm run build
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

# Build AAB (for Play Store)
./gradlew bundleRelease

# Open in Android Studio (for signing)
npx cap open android
```

### iOS

```bash
# Sync latest build
npm run build
npx cap sync ios

# Open in Xcode
npx cap open ios

# Archive and upload to App Store
```

---

## Recommended Deployment Strategy

### For Development/Testing
```
Frontend: Vercel (Preview Deployments)
Backend: Railway (Free tier)
Database: Railway PostgreSQL
Mobile: Local builds via Capacitor
```

### For Production
```
Frontend: Vercel (Pro tier)
Backend: Railway/Render (Scaleable)
Database: Managed PostgreSQL
Mobile: App Store + Google Play
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Update version in package.json
- [ ] Run `npm run build` successfully
- [ ] Test build locally (`npm run preview`)
- [ ] Set all environment variables
- [ ] Update API URLs in configuration
- [ ] Test all critical features

### Frontend Deployment

- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy to platform
- [ ] Verify production URL works
- [ ] Test mobile responsiveness
- [ ] Check service worker registration

### Backend Deployment

- [ ] Set up database
- [ ] Configure connection string
- [ ] Set JWT_SECRET
- [ ] Deploy backend service
- [ ] Test all API endpoints
- [ ] Verify authentication works

### Mobile Deployment

- [ ] Sync latest build to platforms
- [ ] Update app version
- [ ] Test on physical devices
- [ ] Clear caches before testing
- [ ] Prepare screenshots for stores
- [ ] Submit to App Store/Play Store

---

## Cost Comparison (Monthly Estimates)

### Free Tiers Available
- **Vercel**: 100GB bandwidth, 6 builds/day
- **Netlify**: 100GB bandwidth, 300 minutes/month
- **Railway**: $5 free credit
- **Render**: Free tier available
- **Cloudflare Pages**: Unlimited bandwidth

### Production Costs (Estimates)
- **Vercel Pro**: $20/month
- **Railway**: $5-20/month (scales with usage)
- **Render**: Free + $7/month for PostgreSQL
- **AWS Amplify**: $0-20/month (scales with usage)

---

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vercel cache
vercel build --force
```

#### Environment Variables Not Working
- Check they're set correctly in platform dashboard
- Ensure they're prefixed with `VITE_` for frontend access
- Rebuild after adding variables

#### API Connection Issues
- Verify CORS settings in backend
- Check API URL in environment variables
- Test backend health endpoint: `/api/health`

#### Mobile App Not Updating
- Clear app data or reinstall
- Run `npx cap sync` after building
- Check service worker logs for version

---

## Monitoring and Analytics

### Health Check Endpoint

Your API has a health check at `/api/health`:
```bash
curl https://your-api.com/api/health
```

### Monitoring Services

- **Vercel Analytics**: Built-in
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **PostHog**: Product analytics

---

## Continuous Deployment

### GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Support and Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Docker Docs](https://docs.docker.com)

### Getting Help
- Check platform-specific documentation
- Review deployment logs
- Test locally before deploying
- Use platform communities for support

---

## Quick Start Commands

```bash
# Vercel (Recommended for frontend)
npm run build
vercel --prod

# Railway (Recommended for backend)
railway up

# Docker (Full stack)
cd deploy
docker compose up -d --build

# Mobile sync
npm run build
npx cap sync android
npx cap sync ios