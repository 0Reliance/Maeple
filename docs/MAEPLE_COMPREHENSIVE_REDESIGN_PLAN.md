# MAEPLE Comprehensive Redesign Plan

**Date**: December 26, 2025  
**Status**: Planning Phase  
**Objective**: Transform MAEPLE from a functional prototype into a beautiful, inclusive, production-ready application

---

## Executive Summary

MAEPLE has excellent technical foundations, but the current design suffers from visual inconsistency, poor typography hierarchy, cognitive overload, and exclusive language patterns. This plan outlines a complete visual and experiential overhaul that will:

1. **Embrace inclusivity** - Shift from "neurodivergent-only" to "human-first" design
2. **Improve readability** - Establish clear visual hierarchy and accessible typography
3. **Reduce cognitive load** - Simplify interfaces while maintaining functionality
4. **Create emotional connection** - Design for comfort, trust, and engagement
5. **Build a cohesive design system** - Unified colors, spacing, typography, and components

---

## Critical Design Issues Identified

### 1. Language & Inclusivity Problems

**Current Exclusive Language:**
- ❌ "Context-aware intelligence for **neurodivergent minds**"
- ❌ "Help you navigate a world **not built for you**"
- ❌ "**Spoon** theory references (not universally understood)"
- ❌ "**Masking** terminology (specific to certain communities)"
- ❌ "Spoons, sensory load, and **flow states**" (jargon-heavy)

**Impact:**
- Alienates users who don't identify as neurodivergent
- Creates "us vs them" dynamic
- Deficit-focused framing
- Assumes specific knowledge and terminology
- Limits market to narrow audience

**Recommended Inclusive Language:**
- ✅ "Understand your **patterns** to live a healthier life"
- ✅ "Science-backed insights for **everyone**"
- ✅ "**Energy capacity**" instead of "spoons"
- ✅ "**Social energy**" instead of "masking"
- ✅ "**Personal rhythm**" instead of "flow states"

---

### 2. Visual Design Issues

#### Color Scheme Problems
- **Too many accent colors**: 8+ accent colors (teal, indigo, pink, purple, cyan, rose, orange, yellow) creating visual noise
- **Poor contrast ratios**: Some text-foreground combinations fail WCAG AA
- **Over-reliance on slate**: Excessive gray tones create fatigue
- **Inconsistent color usage**: Same color means different things in different contexts
- **Dark mode issues**: Some UI elements don't adapt properly

#### Typography Issues
- **Generic font families**: System fonts lack character
- **Poor hierarchy**: Headings don't clearly distinguish from body
- **Overuse of text-xs**: 12px text throughout (hard to read)
- **Inconsistent sizing**: Multiple similar sizes with no clear purpose
- **Line spacing**: Often too tight for comfortable reading

#### Layout & Spacing Issues
- **Insufficient whitespace**: Interfaces feel cramped
- **Inconsistent padding**: No clear spacing scale
- **Information density**: Dashboard is overwhelming
- **Mobile-first but cluttered**: Even desktop views feel cramped
- **Poor visual flow**: No clear reading path

#### Component Issues
- **Generic card designs**: All cards look the same
- **Inconsistent borders**: Some have borders, some don't
- **Hover states weak**: Not enough feedback on interaction
- **Empty states uninspiring**: "No data available" is boring
- **Charts difficult to read**: Color choices and legends unclear

---

### 3. Functional Design Issues

#### Information Architecture
- **Feature overwhelm**: Too many visible features at once
- **Poor progressive disclosure**: Everything shown upfront
- **Dashboard complexity**: Too many widgets competing for attention
- **Onboarding gaps**: No guidance for new users

#### Interaction Design
- **Discovery problems**: Features hidden behind menus
- **No clear primary actions**: Multiple competing CTAs
- **State feedback weak**: Processing states not reassuring
- **Error handling harsh**: Alert dialogs instead of inline messages

---

## Redesign Principles

### 1. Inclusivity First
- **Universal language**: Terminology everyone can understand
- **Identity-neutral**: Design that works for anyone
- **Cultural sensitivity**: Avoid assumptions about backgrounds
- **Accessibility**: WCAG AA+ compliance throughout

### 2. Clarity Over Density
- **Progressive disclosure**: Show what's needed, hide what's not
- **Visual hierarchy**: Clear importance levels
- **Sufficient whitespace**: Room to breathe and think
- **Focused interfaces**: One primary action per screen

### 3. Warm & Trustworthy
- **Human-centered design**: Not clinical or sterile
- **Emotional connection**: Create positive associations
- **Approachable aesthetics**: Friendly, not intimidating
- **Confidence-inspiring**: Professional but not cold

### 4. Delightful Details
- **Micro-interactions**: Joy in small moments
- **Smooth animations**: Purposeful, not flashy
- **Thoughtful feedback**: Response to every action
- **Personality**: Distinctive character

---

## Proposed Design System

### Color Palette

#### Primary Colors (Warm, Trustworthy, Calming)
```css
--primary: #2D4A5A; /* Deep slate-blue - trustworthy, calming */
--primary-light: #4A6B7D;
--primary-dark: #1E3240;
```

#### Accent Colors (Purposeful, Not Decorative)
```css
--accent-positive: #3B8B7E; /* Sage green - growth, balance */
--accent-attention: #E8A538; /* Warm amber - energy, insight */
--accent-alert: #D4756A; /* Muted rose - gentle warning */
--accent-action: #5B8A9C; /* Soft teal-blue - action */
```

#### Neutral Scale (Warm Gray, Not Cold)
```css
--bg-primary: #F8F6F3; /* Warm off-white, not sterile white */
--bg-secondary: #EDEAE6;
--bg-card: #FFFFFF;
--text-primary: #2D3436;
--text-secondary: #636E72;
--text-tertiary: #B2BEC3;
```

#### Dark Mode (Deep, Rich, Not Pitch Black)
```css
--bg-primary-dark: #1A1E23;
--bg-secondary-dark: #242930;
--bg-card-dark: #2D3436;
--text-primary-dark: #F8F6F3;
--text-secondary-dark: #B2BEC3;
```

#### Why This Palette Works
- **Warm undertones** feel human, not clinical
- **Limited accents** reduce cognitive load
- **High contrast ratios** for accessibility
- **Psychological colors**: Sage for growth, amber for insight, rose for gentle alerts
- **Distinct from competitors**: Avoids the purple/blue gradient trend

---

### Typography System

#### Font Pairing
- **Display Font**: "Outfit" - Modern, warm, distinctive
- **Body Font**: "Inter" - Highly readable, professional
- **Mono Font**: "JetBrains Mono" - For data/code

#### Type Scale
```css
--font-display: {
  "hero": "48px/1.1 - Bold",
  "h1": "36px/1.2 - Semibold",
  "h2": "28px/1.3 - Semibold",
  "h3": "22px/1.4 - Medium",
  "h4": "18px/1.5 - Medium",
}
--font-body: {
  "large": "18px/1.6 - Regular",
  "body": "16px/1.6 - Regular",
  "small": "14px/1.5 - Regular",
  "caption": "13px/1.4 - Regular",
}
--font-label: {
  "label": "12px/1.3 - Semibold", /* Only for badges, tags */
  "micro": "11px/1.3 - Semibold", /* Very sparing use */
}
```

#### Typography Rules
- **Never use text-xs** (12px) for body content
- **Line-height minimum 1.5** for body text
- **Maximum 65 characters per line** for optimal reading
- **Distinct weight hierarchy**: Bold headings, regular body
- **Letter-spacing**: 0.02em for uppercase labels only

---

### Spacing System

#### 8pt Grid
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

#### Component Spacing Rules
- **Card padding**: 24px (lg) minimum
- **Section padding**: 48px (2xl) between major sections
- **Element spacing**: 16px (md) within cards
- **Button padding**: 12px vertical, 24px horizontal
- **List item padding**: 12px (md) vertical

---

### Component Design Standards

#### Cards
```css
.card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid var(--bg-secondary);
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}
```

#### Buttons
```css
.btn-primary {
  background: var(--primary);
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  transition: all 0.2s ease;
}
.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}
.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  border-radius: 12px;
  padding: 10px 22px; /* Account for border */
}
```

#### Inputs
```css
.input {
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  transition: all 0.2s ease;
}
.input:focus {
  border-color: var(--accent-action);
  outline: none;
  box-shadow: 0 0 0 3px rgba(91, 138, 156, 0.1);
}
```

---

## Proposed UI Overhauls

### 1. Landing Page Redesign

**Current Issues:**
- Hero text gradient is hard to read
- "Neurodivergent minds" is exclusive
- Feature cards are generic
- Poor emotional connection

**New Design:**

#### Hero Section
```
┌─────────────────────────────────────────────────────────┐
│  [Logo] MAEPLE                          Sign In  Get Started│
├─────────────────────────────────────────────────────────┤
│                                                         │
│           Understand Your Patterns                      │
│                                                         │
│      Live a healthier, more informed life             │
│                                                         │
│    Science-backed insights that help everyone          │
│    recognize their emotional patterns, make better     │
│    decisions, and find balance in daily life.          │
│                                                         │
│    [Start Understanding]  [Learn More]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Copy Changes:
- **Old**: "Context-aware intelligence for neurodivergent minds."
- **New**: "Understand your patterns to live a healthier life."

- **Old**: "Maeple isn't just a tracker. It's a companion that understands your spoons, sensory load, and flow states to help you navigate a world not built for you."
- **New**: "Maeple is your companion for self-understanding. Track your energy, notice your patterns, and make informed decisions that help you feel more balanced every day."

#### Feature Cards (Redesigned)
- **Simpler, larger icons**
- **Clear benefit statements**
- **Warm, inviting colors**
- **Consistent card design**

---

### 2. Dashboard Redesign

**Current Issues:**
- Too many widgets visible at once
- "Spoon" terminology throughout
- Cluttered information density
- Poor visual hierarchy

**New Design Principles:**

#### Progressive Disclosure
- **Start simple**: Show only 3 key metrics
- **Expand on demand**: User chooses what to see
- **Smart defaults**: Personalized based on usage

#### Redesigned Layout
```
┌─────────────────────────────────────────────────────────┐
│  Pattern Dashboard                              [Filter] │
│  Tracking 14 patterns · Last updated 2h ago             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Today's   │  │    This     │  │   Your     │    │
│  │  Energy     │  │   Week's    │  │  Top        │    │
│  │             │  │   Trend     │  │  Insight    │    │
│  │    7/10     │  │   ↗ +12%    │  │  "You're    │    │
│  │    ●●●●●●●● │  │  (stable)   │  │   most      │    │
│  │             │  │             │  │   focused   │    │
│  │   on days   │  │             │  │   in the   │    │
│  │   with      │  │             │  │   morning  │    │
│  │   less      │  │             │  │             │    │
│  │   social    │  │             │  │   [View]   │    │
│  │   demand    │  │             │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  [Expand Details]                                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │   Today's Insight                             │   │
│  │   "Your energy peaks on days with fewer       │   │
│  │    social interactions. Consider protecting   │   │
│  │    your morning focus time."                   │   │
│  │                                                │   │
│  │   [Save to Favorites]  [Dismiss]              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │   14-Day Energy Trend                          │   │
│  │   [Chart visualization - clean, minimal]       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Terminology Changes:
- "Spoons" → "Energy Capacity"
- "Masking" → "Social Energy"
- "Flow state" → "Peak Focus"
- "Sensory load" → "Sensory Intensity"

---

### 3. Journal Entry Redesign

**Current Issues:**
- Capacity sliders hidden by default
- Too many modes confusing upfront
- "Capture Context" unclear instruction
- Poor visual hierarchy

**New Design:**

#### Simplified Entry Flow
```
┌─────────────────────────────────────────────────────────┐
│  How are you feeling right now?                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │  [Type or speak your thoughts...]              │   │
│  │                                                 │   │
│  │  [🎤] Optional: Add voice note                  │   │
│  │  [📸] Optional: Add photo                       │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  How's your energy today?                       │   │
│  │                                                 │   │
│  │  Deep Focus:    ●●●●●●●○○○ 7/10                 │   │
│  │  Social Energy: ●●●○○○○○○○ 3/10                  │   │
│  │  Physical:      ●●●●●●●○○○ 7/10                 │   │
│  │  Mental Clarity: ●●●●●○○○○○ 5/10                │   │
│  │                                                 │   │
│  │  [Add more dimensions +]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                   [Save Entry]                         │
└─────────────────────────────────────────────────────────┘
```

#### UX Improvements:
- **One primary input**: Text field is most important
- **Optional enhancements**: Voice/photo clearly marked as optional
- **Clear question**: "How's your energy today?" vs ambiguous "Daily Capacity Check-in"
- **Progressive complexity**: Show 4 key dimensions first, expand for more
- **Natural language**: Labels people understand

---

### 4. Empty States Redesign

**Current Issues:**
- Bland, clinical: "No data available"
- No encouragement
- No clear next steps

**New Empty States:**

#### Dashboard (No Data)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              🌱                                          │
│                                                         │
│        Your pattern garden is waiting                 │
│                                                         │
│   Start your first entry today to begin              │
│   understanding your unique energy patterns.          │
│                                                         │
│   Every entry helps you see yourself more clearly.     │
│                                                         │
│                  [Start First Entry]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Journal (No Entries)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              📝                                          │
│                                                         │
│        Ready to begin your journey?                    │
│                                                         │
│   Your first entry will be the seed that grows        │
│   into deeper self-understanding over time.            │
│                                                         │
│   There's no wrong way to start—just write            │
│   what feels true right now.                           │
│                                                         │
│                  [Write Your First Entry]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Charts & Data Visualization Redesign

**Current Issues:**
- Poor color choices (hard to distinguish)
- Confusing legends
- Too much information
- Cluttered axis labels

**New Design Standards:**

#### Chart Principles
- **Clean, minimal design**: Remove decorative elements
- **Clear color coding**: Use accessible color pairs
- **Simplified legends**: Only essential information
- **Responsive sizing**: Readable on all devices
- **Context labels**: Explain what users are seeing

#### Example: Energy Trend Chart
```
┌─────────────────────────────────────────────────────────┐
│  14-Day Energy Trend                             [●●●●]  │
│  Comparing your energy to sensory intensity              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     10 │                                              ╱│
│      8 │                                    ╱───────╱ │  Energy
│      6 │                       ╱───────╱               │
│      4 │          ╱───────╱                            │  ──── Sensory
│      2 │ ╱───────╱                                    │
│      0 └─────────────────────────────────────────     │
│        Mon Tue Wed Thu Fri Sat Sun Mon Tue Wed Thu     │
│                                                         │
│  Your energy tends to peak on days with lower          │
│  sensory intensity. Consider protecting your           │
│  morning focus time.                                    │
└─────────────────────────────────────────────────────────┘
```

#### Color Accessibilty
- Energy line: Sage green (#3B8B7E) vs Gray (#B2BEC3)
- Always include text patterns for colorblind users
- High contrast: 4.5:1 minimum ratio

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. **Design System Setup**
   - Install Outfit and Inter fonts
   - Create Tailwind configuration updates
   - Build color palette CSS variables
   - Establish spacing scale

2. **Global Styles**
   - Update index.css with new design tokens
   - Implement typography scale
   - Create utility classes
   - Set up animation library

3. **Component Library**
   - Create reusable Card component
   - Build Button variants
   - Design Input components
   - Implement Badge/Tag components

### Phase 2: Page Overhauls (Week 3-4)
1. **Landing Page**
   - Implement new hero section
   - Redesign feature cards
   - Update copy throughout
   - Improve empty states

2. **Dashboard**
   - Simplify initial view
   - Implement progressive disclosure
   - Update all terminology
   - Redesign charts

3. **Journal Entry**
   - Simplify input flow
   - Clear visual hierarchy
   - Optional enhancements
   - Better capacity sliders

### Phase 3: Polish & Testing (Week 5)
1. **Dark Mode Refinement**
   - Ensure all components work
   - Verify contrast ratios
   - Test color accessibility

2. **Responsive Design**
   - Test all breakpoints
   - Mobile optimization
   - Tablet layouts

3. **Accessibility Audit**
   - WCAG AA compliance
   - Screen reader testing
   - Keyboard navigation

4. **Performance**
   - Optimize fonts
   - Reduce bundle size
   - Improve load times

### Phase 4: Launch Preparation (Week 6)
1. **User Testing**
   - 5-10 user sessions
   - Gather feedback
   - Iterate on design

2. **Documentation**
   - Design system documentation
   - Component examples
   - Copy guidelines

3. **Final Polish**
   - Micro-interactions
   - Loading states
   - Error handling

---

## Success Metrics

### Design Quality
- ✅ WCAG AA accessibility compliance
- ✅ Consistent visual language across all pages
- ✅ Clear visual hierarchy on every screen
- ✅ Typography scale properly implemented
- ✅ No text-xs in body content

### User Experience
- ✅ Time to first entry under 60 seconds
- ✅ Dashboard clarity score > 8/10 in user testing
- ✅ Terminology confusion rate < 10%
- ✅ Empty state to first entry completion > 80%
- ✅ User satisfaction score > 4/5

### Business Impact
- ✅ Increased user engagement (30% target)
- ✅ Reduced bounce rate (20% target)
- ✅ Improved conversion from landing page (15% target)
- ✅ Higher retention rate (25% improvement target)

---

## Technical Requirements

### Font Loading
```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet">
```

### Tailwind Configuration Updates
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#2D4A5A',
          light: '#4A6B7D',
          dark: '#1E3240',
        },
        accent: {
          positive: '#3B8B7E',
          attention: '#E8A538',
          alert: '#D4756A',
          action: '#5B8A9C',
        },
        // ... full color system
      },
      spacing: {
        // 8pt grid system
      },
      fontSize: {
        // Type scale
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
      },
    },
  },
}
```

### Component Structure
```
src/
├── components/
│   ├── ui/
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ...
│   └── features/
│       ├── LandingPage.tsx (redesigned)
│       ├── Dashboard.tsx (redesigned)
│       └── JournalEntry.tsx (redesigned)
```

---

## Inclusive Language Guidelines

### Core Principles

1. **Universal Understanding**
   - Avoid community-specific jargon
   - Explain specialized terms if used
   - Use analogies that resonate broadly

2. **Identity-Neutral**
   - Don't assume diagnoses or identities
   - Let users self-identify
   - Respect all backgrounds

3. **Empowering Language**
   - Focus on strengths, not deficits
   - Use growth-oriented words
   - Celebrate differences as valuable

4. **Clinical vs. Conversational**
   - Prefer warm, conversational tone
   - Avoid medical terminology
   - Use human-centered descriptions

### Terminology Guide

| Old Term | New Term | Rationale |
|----------|----------|-----------|
| Neurodivergent | Everyone | Universal design |
| Spoons | Energy Capacity | Widely understood |
| Masking | Social Energy | Clearer concept |
| Flow state | Peak Focus | More accessible |
| Sensory load | Sensory Intensity | Better clarity |
| Burnout | Depletion | Less clinical |
| Meltdown | Overwhelm | Less stigmatizing |
| Executive dysfunction | Planning difficulty | Less pathologizing |

### Copy Testing Process

1. **Read Aloud Test** - Does it sound natural?
2. **Universal Understanding** - Would anyone understand this?
3. **Emotional Impact** - How does this make users feel?
4. **Clarity Check** - Is the meaning unambiguous?

---

## Conclusion

This redesign will transform MAEPLE from a technically solid but visually challenged prototype into a beautiful, inclusive, and accessible application that serves everyone seeking to understand their patterns and live a healthier life.

**Key Outcomes:**
- Universal design that welcomes all users
- Clear, beautiful interfaces that reduce cognitive load
- Inclusive language that builds trust and connection
- Cohesive design system for consistency and scalability
- Accessible design that meets WCAG AA standards

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1 implementation
3. Establish design review process
4. Schedule user testing sessions
5. Execute roadmap with regular check-ins

---

**Document Version**: 1.0  
**Created**: December 26, 2025  
**Status**: Ready for Implementation
