# Maeple Deployment Checklist

## Pre-Deployment Verification

### Code Quality ✅
- [x] Design system implemented
- [x] All TypeScript files compile without errors
- [x] ESLint passes without warnings
- [x] New design system components created
- [x] Core pages redesigned (Landing, Dashboard, Journal)
- [x] Dark mode support added
- [x] Navigation updated with new colors

### Functionality ✅
- [x] All routes defined
- [x] Authentication flow intact
- [x] State management (Zustand) configured
- [x] PWA service worker configured
- [x] API client configured
- [x] Cloud sync functionality intact

### Dependencies ✅
- [x] All dependencies up to date
- [x] No security vulnerabilities (check with `npm audit`)
- [x] Required build tools installed

---

## Build Process

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Type Check
```bash
npm run typecheck
```
**Expected:** No TypeScript errors

### Step 3: Lint Code
```bash
npm run lint
```
**Expected:** No ESLint errors or warnings

### Step 4: Build for Production
```bash
npm run build:production
```
**Expected:** 
- Build completes successfully
- `dist/` folder created with all assets
- No build errors or warnings

### Step 5: Preview Build
```bash
npm run preview
```
**Expected:** 
- Application runs at http://localhost:4173
- All pages load correctly
- Dark mode works
- Navigation functions properly

---

## Production Deployment

### Option 1: Vercel Deployment

#### Pre-Deployment Setup
1. **Verify Vercel Configuration**
   - Check `vercel.json` is present and correct
   - Ensure environment variables are set in Vercel dashboard:
     - `VITE_GEMINI_API_KEY`
     - `VITE_SUPABASE_URL` (if applicable)
     - `VITE_SUPABASE_ANON_KEY` (if applicable)

2. **GitHub Integration**
   - Repository connected to Vercel
   - Auto-deployment enabled on main branch push

#### Deploy via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Deploy via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Click "Redeploy" (if already deployed) or push to main branch

---

### Option 2: Manual Deployment to Hosting

#### Build and Deploy
```bash
# Build the application
npm run build:production

# The built files are in the `dist/` folder
# Upload contents of `dist/` to your web server
```

#### Upload dist/ folder to:
- Netlify: Drag and drop `dist/` folder
- GitHub Pages: Push to gh-pages branch
- AWS S3: Upload via AWS CLI or Console
- Custom server: Upload via FTP/SFTP or SCP

---

## Post-Deployment Verification

### Functional Testing Checklist
- [ ] **Home Page** - Landing page loads and displays correctly
- [ ] **Authentication** - Login/Register works
- [ ] **Navigation** - All routes accessible
- [ ] **Dark Mode** - Toggle works, colors correct
- [ ] **Journal** - Create entry, save data
- [ ] **Dashboard** - Stats display, charts render
- [ ] **Settings** - Settings panel accessible
- [ ] **Mobile** - Test on mobile device or emulator
- [ ] **Tablet** - Test on tablet or emulator
- [ ] **Desktop** - Test on desktop browser

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Performance Checks
- [ ] Page load time < 3 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Time to Interactive < 3.5 seconds
- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)

### PWA Verification
- [ ] Install prompt appears
- [ ] Works offline (after first visit)
- [ ] Service worker registered
- [ ] Manifest configured correctly

---

## Monitoring & Maintenance

### Post-Launch Monitoring

1. **Check for errors:**
   - Browser console for JavaScript errors
   - Vercel deployment logs
   - Application error tracking (if configured)

2. **Monitor performance:**
   - Page load times
   - API response times
   - Bundle size (should be under 500KB gzipped)

3. **User feedback:**
   - Monitor support channels
   - Check for bug reports
   - Gather feature requests

### Regular Maintenance Tasks

**Weekly:**
- [ ] Check for dependency updates
- [ ] Review error logs
- [ ] Monitor performance metrics

**Monthly:**
- [ ] Run security audits (`npm audit`)
- [ ] Update dependencies as needed
- [ ] Review and optimize bundle size

**Quarterly:**
- [ ] Major dependency updates
- [ ] Code refactoring if needed
- [ ] Design system updates

---

## Rollback Plan

If deployment has critical issues:

### Quick Rollback
```bash
# If using Vercel CLI
vercel rollback <deployment-id>

# If using Vercel Dashboard
# Go to Deployments → Select previous successful deployment → Click "Promote to Production"
```

### Revert Code Changes
```bash
# Revert to previous commit
git revert HEAD

# Or checkout previous commit
git checkout <previous-commit-hash>

# Rebuild and redeploy
npm run build:production
npm run deploy
```

---

## Deployment Status Log

| Date | Version | Environment | Status | Notes |
|-------|---------|--------------|--------|--------|
| 2025-12-26 | 0.97.0 | Production | ✅ Complete | Redesign with new design system |

---

## Emergency Contacts

- **Developer:** [Contact Information]
- **System Admin:** [Contact Information]
- **Vercel Support:** https://vercel.com/support

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/build.html)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Web.dev Performance](https://web.dev/performance/)

---

**Last Updated:** December 26, 2025
**Document Version:** 1.0
