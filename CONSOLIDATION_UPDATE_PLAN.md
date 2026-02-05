# Consolidation Update Plan
## PATTERNS + MAEPLE Report Integration

### Changes Made
1. **Consolidated Dashboard**: Merged PATTERNS and MAEPLE Report into single `HealthMetricsDashboard` with tab navigation
2. **Removed Navigation**: Removed "MAEPLE Report" from UserMenu and MobileNav
3. **Removed Route**: Removed `/clinical` route from App.tsx
4. **Removed Type**: Removed `View.CLINICAL` from types.ts
5. **Updated Labels**: Changed "Guide & Vision" to just "Guide"

---

## 1. Documentation Updates

### docs/FEATURES.md
- [ ] Update "Health Metrics Dashboard" section to reflect tabbed interface
- [ ] Update "Capacity Reports" section to mention it's now part of Patterns view
- [ ] Add note about tab-based navigation in dashboard

### docs/INDEX.md
- [ ] Check for references to MAEPLE Report or clinical routes
- [ ] Update navigation structure documentation

### docs/QUICK_REFERENCE.md
- [ ] Remove any references to `/clinical` route
- [ ] Update dashboard navigation instructions

### docs/TESTING_GUIDE.md
- [ ] Update test cases to reflect consolidated dashboard
- [ ] Remove tests for standalone clinical report navigation

### docs/VERCEL_DEPLOYMENT_GUIDE.md
- [ ] Verify deployment steps still valid (no clinical route to deploy)

---

## 2. Specification Updates

### specifications/COMPLETE_SPECIFICATIONS.md
- [ ] Update UI Components section for HealthMetricsDashboard
- [ ] Remove ClinicalReport component specification
- [ ] Update navigation structure (remove clinical menu item)
- [ ] Update View enum documentation

### specifications/MASTER_PLAN.md
- [ ] Update any planned features that reference clinical report
- [ ] Reflect completed consolidation work

### specifications/ROADMAP.md
- [ ] Mark consolidation as complete if listed
- [ ] Update future items to reflect unified dashboard

### specifications/UI_UX_GUIDELINES.md
- [ ] Update navigation guidelines (user menu items)
- [ ] Document tab-based dashboard pattern

### specifications/SYSTEM_ARCHITECTURE.md
- [ ] Update routing diagram (remove /clinical)
- [ ] Update component hierarchy

### specifications/API_REFERENCE.md
- [ ] Check for any API endpoints related to clinical report
- [ ] Update if necessary

---

## 3. Test Updates

### Unit Tests

#### tests/components/HealthMetricsDashboard.test.tsx
- [ ] Add tests for tab switching (daily vs clinical)
- [ ] Add tests for "Daily Patterns" tab content
- [ ] Add tests for "Clinical Report" tab content
- [ ] Add tests for "Print to PDF" button functionality
- [ ] Remove any tests that assume separate ClinicalReport component

#### tests/components/App.test.tsx
- [ ] Remove tests for `/clinical` route
- [ ] Remove tests for ClinicalReport lazy loading
- [ ] Add test to verify `/clinical` redirects appropriately (404 or redirect to dashboard)
- [ ] Verify navigation works without CLINICAL View

#### tests/components/MobileNav.test.tsx
- [ ] Remove tests for "MAEPLE Report" menu item
- [ ] Update tests to verify menu shows "Guide" (not "Guide & Vision")
- [ ] Verify user menu closes correctly

### Integration Tests

#### tests/integration/services-integration.test.ts
- [ ] Update if any tests reference clinical report generation
- [ ] Ensure analytics still works with consolidated dashboard

### E2E Tests

#### tests/e2e/mobile-navigation.spec.ts
- [ ] Update test to navigate to Patterns view
- [ ] Test tab switching (Daily Patterns ↔ Clinical Report)
- [ ] Verify "MAEPLE Report" is not in navigation menu
- [ ] Verify "Guide" label is correct

#### tests/e2e/bio-mirror.spec.ts
- [ ] Check if any tests reference clinical report viewing
- [ ] Update if needed

### Visual Tests

#### tests/visual/baseline-capture.spec.ts
- [ ] Capture new baseline for Patterns view with tabs
- [ ] Capture baseline for Clinical Report tab content
- [ ] Remove old baseline for standalone clinical page

#### tests/visual/regression.spec.ts
- [ ] Add regression tests for tab switching animation
- [ ] Test clinical report print view styling

#### tests/visual/screenshot-validation.spec.ts
- [ ] Add validation for tab navigation visual state
- [ ] Validate clinical report layout within dashboard

---

## 4. Build & Deployment

### Build Application
```bash
npm run build
```
- [ ] Verify build completes successfully
- [ ] Check for any TypeScript errors related to removed View.CLINICAL
- [ ] Verify production bundle size

### Local Testing
```bash
npm run preview --port 80
```
- [ ] Test on port 80 locally
- [ ] Verify tab switching works
- [ ] Verify "MAEPLE Report" not in navigation
- [ ] Verify "Guide" label is correct
- [ ] Test Print to PDF functionality
- [ ] Test responsive behavior on mobile

---

## 5. Git Operations

### Commit Changes
```bash
git add .
git commit -m "feat: consolidate PATTERNS and MAEPLE Report into unified dashboard

- Add tab-based navigation to HealthMetricsDashboard
- Remove MAEPLE Report from navigation (UserMenu & MobileNav)
- Remove /clinical route and View.CLINICAL type
- Update 'Guide & Vision' label to 'Guide'
- Update all documentation and specifications
- Update all tests for consolidated interface

BREAKING CHANGE: MAEPLE Report now accessible via Clinical Report tab in Patterns view"
```

### Push to GitHub
```bash
git push origin main
```
- [ ] Verify push completes
- [ ] Check GitHub Actions (if any) pass

---

## 6. Verification Checklist

### Documentation
- [ ] All docs reference Patterns view, not separate clinical page
- [ ] No broken links to /clinical route
- [ ] Tab navigation clearly documented

### Specifications
- [ ] Architecture reflects consolidated structure
- [ ] No references to removed View.CLINICAL
- [ ] Future plans account for unified dashboard

### Tests
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Visual baselines updated

### Build & Deploy
- [ ] Production build succeeds
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console
- [ ] Application accessible on port 80

### User Experience
- [ ] Tab switching is smooth and intuitive
- [ ] Clinical Report content displays correctly
- [ ] Print to PDF works
- [ ] Navigation menu no longer shows "MAEPLE Report"
- [ ] "Guide" label is displayed correctly

---

## Priority Order

1. **High Priority**: Update tests (blocks deployment)
2. **High Priority**: Build and verify (check for errors)
3. **Medium Priority**: Update key documentation (FEATURES.md, COMPLETE_SPECIFICATIONS.md)
4. **Medium Priority**: Update specifications (MASTER_PLAN.md, UI_UX_GUIDELINES.md)
5. **Low Priority**: Update other docs and run full test suite

---

## Estimated Time

- Test updates: 45-60 minutes
- Build & local verification: 15 minutes
- Documentation updates: 30-45 minutes
- Specification updates: 30 minutes
- Git operations: 5 minutes
- **Total**: ~2.5 - 3 hours