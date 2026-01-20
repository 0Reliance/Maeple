# Vercel Deployment Guide for Maeple

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start Deployment](#quick-start-deployment)
3. [Detailed Setup](#detailed-setup)
4. [Environment Variables](#environment-variables)
5. [Build Configuration](#build-configuration)
6. [Custom Domains](#custom-domains)
7. [Monitoring & Logs](#monitoring--logs)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Prerequisites

Before deploying to Vercel, ensure you have:

- ✅ Vercel account (free at vercel.com)
- ✅ GitHub account with Maeple repository
- ✅ Node.js 22.x installed locally
- ✅ Maeple repository code ready
- ✅ API keys and secrets ready (Supabase, Gemini, etc.)

---

## Quick Start Deployment

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Authorize Vercel to access your GitHub account
5. Select the `Maeple` repository
6. Click **"Import"**

### Step 2: Configure Project

Vercel will detect the project settings automatically:

```
Framework: Vite (detected)
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Click **Deploy** and Vercel will build and deploy automatically.

### Step 3: Access Your Deployment

After 2-3 minutes, you'll see:

- ✅ "Congratulations!" message
- 🔗 Production URL: `https://your-project.vercel.app`
- 📊 Live deployment logs
- 🔍 Preview URLs for each commit

---

## Detailed Setup

### 1. Account Setup

#### Create Vercel Account

1. Visit [vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub, GitLab, or Bitbucket
3. Verify your email address
4. **Free tier** includes:
   - Unlimited deployments
   - 100GB bandwidth/month
   - Automatic HTTPS
   - Global CDN
   - Fast builds

#### Install Vercel CLI (Optional)

```bash
npm install -g vercel

# Login
vercel login

# Link existing project
cd Maeple
vercel link

# Deploy to production
vercel --prod
```

### 2. Project Configuration

#### Using `vercel.json`

The `vercel.json` file in Maeple root handles configuration:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs22.x"
    }
  }
}
```

**Configuration Explained**:

- `rewrites`: SPA routing support (all routes → index.html)
- `buildCommand`: Command to build production bundle
- `outputDirectory`: Where build output is created
- `framework`: Explicitly set to Vite
- `regions`: Deployment region (iad1 = US East)
- `functions`: Node.js 22.x runtime for API functions

---

## Environment Variables

### Required Environment Variables

Navigate to **Settings → Environment Variables** in Vercel dashboard:

| Variable                  | Description            | Example                   | Required |
| ------------------------- | ---------------------- | ------------------------- | -------- |
| `VITE_SUPABASE_URL`       | Supabase project URL   | `https://xyz.supabase.co` | Yes      |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anonymous key | `your-supabase-anon-key`  | Yes      |
| `VITE_GEMINI_API_KEY`     | Google Gemini API key  | `your-gemini-api-key`     | Yes      |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key     | `sk-or-v1...`             | Optional |
| `VITE_ANTHROPIC_API_KEY`  | Anthropic API key      | `sk-ant-...`              | Optional |

### Adding Environment Variables

1. Go to **Project Settings → Environment Variables**
2. Click **"Add New"**
3. Enter variable name (e.g., `VITE_SUPABASE_URL`)
4. Enter variable value
5. Select environments:
   - ✅ **Production** - Live deployment
   - ✅ **Preview** - Pull request deployments
   - ✅ **Development** - Branch deployments
6. Click **"Save"**
7. **Redeploy** to apply changes

### Getting Your API Keys

#### Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings → API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

#### Google Gemini

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key → `VITE_GEMINI_API_KEY`

#### OpenRouter (Optional)

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create account
3. Generate API key → `VITE_OPENROUTER_API_KEY`

---

## Build Configuration

### Understanding the Build Process

When Vercel builds Maeple:

```
1. Install Dependencies
   ↓
   npm install (2-3 minutes)

2. Type Check
   ↓
   npm run typecheck (30 seconds)

3. Build Production Bundle
   ↓
   npm run build (2-3 minutes)

4. Output to dist/
   ↓
   - index.html
   - assets/*.js (bundled code)
   - assets/*.css (styles)
   - assets/*.png|.svg (images)

5. Deploy to Edge Network
   ↓
   - Upload to Vercel CDN
   - Configure HTTPS
   - Set up caching
```

### Build Settings in Vercel Dashboard

Go to **Settings → Build & Development**:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 22.x
```

### Custom Build Options

#### Enable CI/CD with GitHub

When you push to GitHub:

- **main branch**: Auto-deploys to Production
- **other branches**: Auto-deploys to Preview
- **pull requests**: Creates preview deployments

#### Build Caching

Vercel automatically caches:

- `node_modules/` between builds
- NPM packages for faster installs
- Build artifacts

To clear cache:

```bash
# Add empty commit to trigger fresh build
git commit --allow-empty -m "Clear build cache"
git push
```

---

## Custom Domains

### Adding a Custom Domain

1. Go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter domain name (e.g., `maeple.com`)
4. Choose configuration type:

#### Option A: Vercel Managed DNS (Recommended)

- Vercel handles DNS automatically
- Automatic SSL certificate
- No manual DNS configuration required

**Steps**:

1. Update nameservers at your registrar:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
2. Wait 24-48 hours for propagation
3. Vercel automatically configures SSL

#### Option B: CNAME Record

If keeping existing DNS provider:

```
Type: CNAME
Name: @ (or www)
Value: cname.vercel-dns.com
TTL: 300
```

### Enabling HTTPS

Vercel provides **automatic SSL certificates** for:

- ✅ Custom domains
- ✅ Auto-generated domains (\*.vercel.app)
- ✅ Subdomains (app.yourdomain.com)

No manual configuration needed!

---

## Monitoring & Logs

### Real-time Logs

View logs during build and deployment:

1. Go to **Deployments** tab
2. Click on a deployment
3. View **Build Logs**:
   ```
   01: Installing dependencies
   02: Type checking
   03: Building production bundle
   04: Optimizing
   05: Uploading
   ```

### Runtime Logs

Monitor your application in production:

1. Go to **Logs** tab
2. Filter by:
   - **Time range**: Last hour, 24 hours, 7 days
   - **Status**: Error, Warning, Info
   - **Environment**: Production, Preview
3. View:
   - Server errors
   - Client errors
   - Console logs
   - Network requests

### Analytics

Vercel provides built-in analytics:

1. Go to **Analytics** tab
2. View:
   - **Page views**: Unique visitors, total views
   - **Bandwidth**: Data transfer usage
   - **Performance**: Load times, TTFB, LCP
   - **Routes**: Most visited pages
   - **Browsers**: User browser breakdown
   - **Devices**: Desktop vs Mobile vs Tablet

---

## Troubleshooting

### Common Issues

#### Issue 1: Build Fails - "Module not found"

**Error**:

```
Error: Cannot find module './components/SomeComponent'
```

**Solution**:

```bash
# Check file paths in imports
# Fix import statements:
import SomeComponent from './components/SomeComponent'  # Wrong
import SomeComponent from './components/SomeComponent.tsx'  # Correct

# Commit and push changes
git add .
git commit -m "Fix import paths"
git push
```

#### Issue 2: Build Fails - "TypeScript errors"

**Error**:

```
error TS2322: Type 'string' is not assignable to type 'number'
```

**Solution**:

```bash
# Run type check locally to see all errors
cd Maeple
npm run typecheck

# Fix all TypeScript errors
# Commit and push
git add .
git commit -m "Fix TypeScript errors"
git push
```

#### Issue 3: Environment Variables Not Working

**Symptom**: API calls failing in production

**Solution**:

1. Check variable names in Vercel dashboard:

   ```
   VITE_SUPABASE_URL  ✅ (starts with VITE_)
   SUPABASE_URL        ❌ (wrong prefix)
   ```

2. Ensure variables are selected for **Production**

3. Redeploy after adding variables:
   ```
   Settings → Deployments → Redeploy
   ```

#### Issue 4: Blank Page on Load

**Symptom**: White screen, no content

**Solution**:

1. Check build output in Vercel dashboard:
   - Did `npm run build` complete successfully?
   - Is `dist/` directory generated?

2. Check browser console for errors:
   - F12 → Console tab
   - Look for red errors

3. Verify routing:
   - Is `vercel.json` configured correctly?
   - Are rewrites working?

4. Clear browser cache:
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

#### Issue 5: Deploy is Slow

**Symptom**: Build takes 10+ minutes

**Solution**:

1. Check for large files:

   ```bash
   # Find large files in repo
   find . -type f -size +10M -exec ls -lh {} \;
   ```

2. Optimize images:
   - Use WebP format
   - Compress images before committing

3. Check `node_modules` size:
   - Vercel caches `node_modules`
   - Clear cache if needed

#### Issue 6: Preview Deployments Not Working

**Symptom**: PR previews show errors

**Solution**:

1. Ensure environment variables are set for **Preview**
2. Check if API keys work for preview URLs
3. Verify routing works in preview environment

---

## Best Practices

### 1. Branch Strategy

```
main          → Production deployment (automatic)
develop       → Preview deployment (automatic)
feature/*     → Preview deployment (automatic)
bugfix/*      → Preview deployment (automatic)
```

### 2. Pull Request Workflow

1. Create branch: `feature/new-feature`
2. Make changes
3. Push to GitHub
4. Create Pull Request
5. Vercel creates **Preview URL**: `https://maeple-feature-new-feature.vercel.app`
6. Review and test preview
7. Merge to `main`
8. Vercel auto-deploys to **Production**

### 3. Build Optimization

#### Reduce Build Time

```bash
# In package.json
{
  "scripts": {
    "build": "vite build",
    "build:production": "vite build --mode production"
  }
}
```

#### Reduce Bundle Size

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["lucide-react"],
        },
      },
    },
  },
});
```

### 4. Environment-Specific Config

```typescript
// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const isProduction = import.meta.env.PROD;
const apiUrl = isProduction ? "https://api.production.com" : "https://api.dev.com";
```

### 5. Error Handling

```typescript
// src/services/errorLogger.ts
export const logError = (error: Error, context?: any) => {
  console.error("[Error]", error, context);

  // In production, send to error tracking
  if (import.meta.env.PROD) {
    // Sentry, LogRocket, etc.
  }
};
```

### 6. Performance Monitoring

```typescript
// src/utils/performance.ts
export const measureRender = (componentName: string) => {
  if (import.meta.env.DEV) {
    performance.mark(`${componentName}-start`);
    return () => {
      performance.mark(`${componentName}-end`);
      performance.measure(componentName, `${componentName}-start`, `${componentName}-end`);
    };
  }
};
```

---

## Deployment Commands Reference

### Vercel CLI Commands

```bash
# Login to Vercel
vercel login

# Deploy current directory (creates preview)
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List recent deployments
vercel ls

# Remove deployment
vercel rm <deployment-url>

# View environment variables
vercel env ls

# Add environment variable
vercel env add VITE_API_KEY

# Pull environment variables to local .env
vercel env pull .env.production
```

### GitHub Actions (Optional)

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
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

---

## Post-Deployment Checklist

After each deployment, verify:

### 1. Application Loads

- [ ] Homepage loads without errors
- [ ] No console errors in browser
- [ ] All assets load correctly

### 2. Authentication

- [ ] Login works
- [ ] Registration works
- [ ] Logout works
- [ ] Session persists across page reloads

### 3. Core Features

- [ ] Journal entries create successfully
- [ ] Dashboard displays correctly
- [ ] Biofeedback camera works
- [ ] Settings page accessible

### 4. API Integration

- [ ] Supabase connection works
- [ ] AI providers respond correctly
- [ ] Wearables sync (if applicable)

### 5. Responsive Design

- [ ] Mobile view works (iPhone/Android)
- [ ] Tablet view works (iPad)
- [ ] Desktop view works

### 6. Performance

- [ ] Page load time < 3 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Lighthouse score > 90

### 7. Security

- [ ] HTTPS enabled
- [ ] Environment variables not exposed
- [ ] API keys secure
- [ ] No console warnings

---

## Resources

### Official Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vite on Vercel](https://vercel.com/guides/vite)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

### Maeple-Specific

- [Maeple README](../../README.md)
- [Deployment Readiness](./DEPLOYMENT_READINESS.md)
- [Setup Guide](../SETUP.md)

### External Tools

- [GitHub Integration](https://vercel.com/docs/git-integrations)
- [Custom Domains](https://vercel.com/docs/custom-domains)
- [Analytics Dashboard](https://vercel.com/docs/analytics)

---

## Quick Reference

### Deployment URLs

- **Production**: `https://your-app-url` (or your custom domain)
- **Preview**: `https://your-project-git-branch.vercel.app`

### Useful Commands

```bash
# Deploy from local
vercel --prod

# View logs
vercel logs

# Check status
vercel inspect
```

### Environment Variables Template

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Support

### Get Help

- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://vercel.com/community)
- [Maeple GitHub Issues](https://github.com/poziverse/maeple/issues)

### Common Issues Search

- Search Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Search GitHub issues: [github.com/vercel/vercel](https://github.com/vercel/vercel/issues)

---

**Document Version:** 1.0  
**Last Updated:** December 30, 2025  
**Status:** ✅ **CURRENT & COMPLETE**
