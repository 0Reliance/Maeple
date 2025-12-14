# MAEPLE UI/UX Guidelines

**Version**: 2.0.0

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

- **MobileNav**: Bottom bar navigation visible on all devices.
- **Drawer**: Slide-out menu for secondary items.

### 3.2 Feedback

- **AILoadingState**: Full-screen or card overlay for long-running AI tasks.
  - _Props_: `message`, `steps` (array of strings).
- **TypingIndicator**: Bouncing dots for chat interfaces.
  - _Usage_: `<TypingIndicator />`

### 3.3 Icons

- **Library**: Lucide React (`lucide-react`).
- **Style**: Consistent stroke width (default 2px).

## 4. Accessibility

- **ARIA**: Use `aria-label` for icon-only buttons.
- **Live Regions**: Use `aria-live="polite"` for dynamic content updates (AI responses).
- **Contrast**: Ensure text meets WCAG AA standards in both light and dark modes.
