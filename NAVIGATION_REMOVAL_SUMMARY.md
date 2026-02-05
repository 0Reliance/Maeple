# Navigation Architecture - Current State (February 2026)

## Overview
MAEPLE uses a simplified, mobile-first navigation architecture with no top navigation header. All navigation is consolidated to the bottom bar for a clean, content-focused experience.

## Navigation Model

### Primary Navigation
- **Single Navigation Bar**: Bottom bar (MobileNav component)
- **No Top Navigation**: Removed decorative header
- **Floating Brand Identification**: Subtle MAEPLE logo above navigation
- **User Access**: Settings accessible via User Menu dropdown

### Navigation Items (Bottom Bar)

| Item | Destination | Icon |
|------|-------------|--------|
| Patterns | Dashboard | Chart/Analytics |
| Reflect | Bio-Mirror | Camera |
| Capture (center, floating) | Journal | Plus/Add |
| Guide | Live Coach | Message/Circle |
| User (avatar) | Settings | User |

### User Menu Dropdown
Opens upward from bottom navigation bar when User avatar is clicked.

#### Account Section
- Email display
- User avatar

#### Primary Actions
- **Settings** → `/settings`
- **MAEPLE Report** → `/clinical`
- **Wellness Assistant** → `/coach`

#### Secondary Actions
- **Guide & Vision** → `/vision`
- **Terms & Legal** → `/terms`
- **Beta Dashboard** → `/beta-dashboard`

#### Account Actions
- **Sign Out** → Logs out and redirects to Landing Page

## Special Features

### Floating Brand Label
```tsx
<div className="absolute -top-6 left-0 right-0 flex justify-center">
  <div className="flex items-center gap-1.5 px-3 py-1 bg-bg-card ... rounded-full shadow-sm">
    <div className="w-4 h-4 bg-gradient-to-br from-primary to-accent-action rounded-sm ...">
      M
    </div>
    <span className="text-[10px] font-bold ... tracking-wider">
      MAEPLE
    </span>
  </div>
</div>
```

**Characteristics**:
- Positioned at `-top-6` (24px above navigation bar)
- Pill-shaped design (`rounded-full`)
- Gradient "M" icon (`from-primary to-accent-action`)
- Subtle shadow (`shadow-sm`)
- Small, refined text (`text-[10px]`, `tracking-wider`)
- Non-intrusive brand presence

### PWA Installation

**Location**: Settings page
**Section**: "Install MAEPLE"
**Design**: Emerald/teal gradient card
**Condition**: Only renders when `isInstallable` is true

**Features**:
- Clear description of PWA benefits
- Prominent "Install App" button
- Download icon (`Download` from lucide-react)
- Positioned between Appearance and AI Provider Configuration

## Content Layout

### Main Container
```tsx
<main className="flex-1 px-4 pb-4 md:px-8 md:pb-8 overflow-y-auto ... pb-24">
  {/* Content */}
</main>
```

**Spacing Strategy**:
- **Horizontal Padding**: `px-4` mobile, `md:px-8` desktop
- **Bottom Padding**: `pb-4` mobile, `md:pb-8` desktop
- **No Top Padding**: Maximizes vertical content space
- **Bottom Clearance**: `pb-24` for navigation bar

### Vertical Space Gained
- **Previous**: Top header (~40px) + top padding (~16px) = ~56px
- **Current**: No top header, no top padding = 0px
- **Gained**: ~56px of vertical space for content

## Design Rationale

### Content-First Approach
- Eliminated decorative top header (provided no functional value)
- Focused interface on content (journal entries, dashboards, forms)
- Reduced visual noise and cognitive load

### Vertical Space Optimization
- Critical vertical space for mobile devices
- Less scrolling required for content consumption
- More content visible above the fold

### Logical Organization
- PWA install naturally belongs in Settings
- All navigation consolidated to single location
- Consistent navigation patterns across app

### Brand Presence Without Clutter
- Subtle floating logo provides brand context
- Non-intrusive positioning (above nav, not in content)
- Modern, refined aesthetic matching design system

### Mobile-Optimized Navigation
- Single navigation bar for thumb-friendly access
- Consistent patterns across all devices
- Touch-friendly interaction zones

## Technical Implementation

### Component Hierarchy
```
App
├── ErrorBoundary
│   └── BrowserRouter
│       └── AppContent
│           ├── <main> (content area)
│           └── MobileNav (bottom navigation)
│               ├── Floating Brand Label (-top-6)
│               └── Navigation Items (5)
│                   └── User Menu Dropdown
```

### Files Modified
1. **src/App.tsx**
   - Removed top navigation header
   - Adjusted main content spacing
   - Removed `usePWAInstall` hook
   - Cleaned up unused imports

2. **src/components/MobileNav.tsx**
   - Added floating brand label
   - Positioned at `-top-6`
   - Pill-shaped design with gradient icon

3. **src/components/Settings.tsx**
   - Added PWA install section
   - Imported `usePWAInstall` hook
   - Emerald/teal gradient design
   - Conditional rendering

### Removed Elements
- **Top Header**: Entire decorative header removed
- **PWA Install Button**: Removed from top nav
- **MAEPLE Logo**: Removed from header position
- **Top Padding**: Removed from main content container

## Testing

### Test Coverage
All tests updated to reflect new navigation architecture:

1. **App.test.tsx**
   - Verifies absence of top navigation
   - Tests main content spacing (`px-4 pb-4 md:px-8 md:pb-8`)
   - No tests for header or top nav elements

2. **MobileNav.test.tsx**
   - Tests floating MAEPLE brand label
   - Verifies logo positioning (`-top-6`)
   - Tests pill-shaped styling (`rounded-full`, `shadow-sm`)
   - Verifies gradient logo icon presence

3. **Settings.test.tsx**
   - Tests PWA install section rendering
   - Conditional rendering (installable vs. not installable)
   - Verifies emerald/teal gradient styling
   - Tests install button functionality

### Manual Verification Checklist
- [x] No top navigation header appears
- [x] Floating MAEPLE logo visible above bottom nav
- [x] PWA install appears in Settings (when installable)
- [x] All navigation flows via bottom bar
- [x] Content has correct padding (horizontal + bottom only)
- [x] User Menu dropdown opens correctly
- [x] Bottom clearance for navigation bar (pb-24)

## Comparison: Before vs. After

### Before (v0.97.8)
```
┌─────────────────────────────────────┐
│ [MAEPLE]          [Install]    │ ← Top Header
├─────────────────────────────────────┤
│                                 │
│  Content                       │
│                                 │
└─────────────────────────────────────┘
[Patterns] [Reflect] [Capture] [Guide] [User] ← Bottom Nav
```

### After (v0.97.9)
```
┌─────────────────────────────────────┐
│                                 │
│  Content                       │
│                                 │
└─────────────────────────────────────┘
        [MAEPLE]                    ← Floating Brand Label (-top-6)
[Patterns] [Reflect] [Capture] [Guide] [User] ← Bottom Nav
```

## Migration Notes

### For Developers
- No API changes required
- No database migrations needed
- Component props unchanged (except App.tsx cleanup)
- Routing unchanged
- State management unchanged

### For Designers
- Layout has no top header
- Floating brand label above bottom nav
- PWA install is emerald/teal gradient card in Settings
- Content has more vertical space

### For QA
- Top navigation should not appear anywhere in app
- Floating logo should be visible above bottom nav
- PWA install appears in Settings (when installable)
- All navigation flows via bottom bar
- Content padding should be horizontal + bottom only
- User Menu dropdown opens above navigation

## Related Documentation
- **NAVIGATION_REFACTOR_2026-02-05.md**: Comprehensive refactoring documentation
- **specifications/MASTER_PLAN.md**: Updated architecture overview (v0.97.9)
- **specifications/UI_UX_GUIDELINES.md**: Updated navigation section
- **specifications/CHANGELOG.md**: Version 0.97.9 changelog entry

## Version History
- **v0.97.9 (February 5, 2026)**: Navigation refactoring complete
- **v0.97.8 (February 2, 2026)**: Previous version with top header

## Support
For questions or issues, refer to:
- **NAVIGATION_REFACTOR_2026-02-05.md** for detailed implementation
- **specifications/UI_UX_GUIDELINES.md** for design guidelines
- **specifications/MASTER_PLAN.md** for architecture overview