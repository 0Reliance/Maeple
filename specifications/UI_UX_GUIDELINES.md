# MAEPLE UI/UX Guidelines

**Version**: 2.1.0  
**Last Updated**: January 20, 2026

## 1. Design Philosophy

- **Neuro-Affirming**: Interfaces should be calm, clear, and avoid sensory overwhelm.
- **Mobile-First**: All features must work seamlessly on mobile devices.
- **Context-Aware**: The UI adapts to the user's state (e.g., simplified views during high sensory load).

## 2. Theming & Dark Mode

MAEPLE uses Tailwind CSS with the `class` strategy for dark mode.

### 2.1 Implementation

- **Store**: `appStore.userSettings.theme` controls the state.
- **Root**: The `.dark` class is applied to the `<html>` element.
- **Colors**:
  - Backgrounds: `bg-slate-50` (Light) -> `dark:bg-slate-950` (Dark)
  - Cards: `bg-white` -> `dark:bg-slate-800`
  - Text: `text-slate-900` -> `dark:text-slate-100`
  - Accents: `teal-500`, `indigo-500` (Adjust opacity for dark mode if needed).

### 2.2 Usage

```tsx
<div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
  Content
</div>
```

## 3. Core Components

### 3.1 Navigation

#### Navigation Architecture
- **No Top Header**: Removed for cleaner, content-focused interface
- **Floating Brand Label**: MAEPLE logo positioned as subtle pill above bottom navigation
- **PWA Install**: Available in Settings page (emerald/teal gradient section)
- Single navigation bar (bottom) for all devices - maximizes content space

#### Bottom Navigation (MobileNav)
- **5-item bottom bar** visible on all devices:
  - **Patterns** → Dashboard
  - **Reflect** → Bio-Mirror
  - **Capture** (center action, floating) → Journal
  - **Guide** → Live Coach
  - **User** (avatar) → User menu dropdown
- **User Menu Dropdown**: Opens upward from bottom nav with:
  - Account section (email display)
  - Settings
  - MAEPLE Report
  - Wellness Assistant
  - Guide & Vision
  - Terms & Legal
  - Beta Dashboard
  - Sign Out
- **Design Principles**:
  - All primary navigation in bottom bar for thumb-friendly access
  - User profile/settings accessible from bottom right
  - Floating action button (Capture) remains prominent in center
  - Dropdown menu opens above nav bar to avoid covering content

### 3.2 Dashboard & Cards

- **Card Base Class**: Uses `position: relative` for proper absolute child positioning
- **Card Hover**: Default cards only show shadow/border changes on hover (no transform)
- **Card Hoverable**: Use `.card-hoverable` class or `hoverable={true}` prop for scale-on-hover behavior
- **Clean Design**: Cards should not have redundant internal headers if the page title already provides context.
- **Capacity Check-in**: Uses gradient sliders and card layout for clear, calm input.
- **Context Cards**: Grid layout with pastel color coding based on capacity levels (Blue/Purple/Pink).
- **Visual Hierarchy**: Primary actions (Capture) are prominent; secondary details are subtle.

**Card Component Props**:
```tsx
<Card hoverable={false}>  {/* Default: shadow/border hover only */}
  <form>...</form>
</Card>

<Card hoverable={true}>   {/* Scales on hover for clickable cards */}
  <div onClick={handleClick}>...</div>
</Card>
```

### 3.3 Feedback

- **AILoadingState**: Full-screen or card overlay for long-running AI tasks.
  - _Props_: `message`, `steps` (array of strings).

### 3.4 Empty States (Cold Start)

- **Principle**: Never show a broken chart or "0" data without context.
- **Implementation**:
  - **Charts**: Use an overlay with a relevant icon (e.g., `Activity`, `Brain`) and text "Waiting for Data".
  - **Widgets**: Show a neutral state (e.g., Slate-50 background) with "PENDING" text.
  - **Guidance**: Provide a clear next step (e.g., "Log your first entry to see this").
- **Example**:
  ```tsx
  if (entries.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50">
        <p>Waiting for Data</p>
      </div>
    );
  }
  ```
- **TypingIndicator**: Bouncing dots for chat interfaces.
  - _Usage_: `<TypingIndicator />`

### 3.3 Icons

- **Library**: Lucide React (`lucide-react`).
- **Style**: Consistent stroke width (default 2px).

## 4. Accessibility

- **ARIA**: Use `aria-label` for icon-only buttons.
- **Live Regions**: Use `aria-live="polite"` for dynamic content updates (AI responses).
- **Contrast**: Ensure text meets WCAG AA standards in both light and dark modes.
