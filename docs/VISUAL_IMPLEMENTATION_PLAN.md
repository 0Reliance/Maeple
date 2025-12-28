# MAEPLE Visual Design Implementation Plan

## Vision: "Gentle Clarity"
**A monochromatic base with strategic accent use, typography-driven design, generous whitespace, and delicate, refined details.**

---

## COMPLETE FILE CHANGE MAP

### Overview
This plan documents every file modification needed to transform MAEPLE from generic to distinctive. All changes will be implemented in dependency order to prevent breakage.

---

## 📋 FILE 1: tailwind.config.js

### Purpose
Update color palette to bolder, more saturated version and add new utilities.

### Changes:
```js
// BEFORE:
primary: {
  DEFAULT: '#2D4A5A',  // Deep slate-blue
  light: '#4A6B7D',
  dark: '#1E3240',
},

// AFTER:
primary: {
  DEFAULT: '#1A4D5E',  // Deeper, more saturated teal
  light: '#2D6B7D',
  dark: '#0F2D3D',
},

accent: {
  positive: '#2D7A6E',  // Stronger sage
  attention: '#C7882E',  // Richer amber
  alert: '#B85A6E',     // Deeper rose
  action: '#4A9CAC',    // Stronger teal-blue
}

// ADD NEW ANIMATIONS:
animation: {
  'stagger': 'staggerIn 0.6s ease-out forwards',
  'breathe': 'breathe 4s ease-in-out infinite',
  'float': 'float 6s ease-in-out infinite',
  'magnetic': 'magnetic 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
},

// ADD NEW KEYFRAMES:
keyframes: {
  staggerIn: {
    '0%': { opacity: '0', transform: 'translateY(20px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  breathe: {
    '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
    '50%': { transform: 'scale(1.05)', opacity: '1' },
  },
  float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-10px)' },
  },
},

// ADD DELAY UTILITIES:
staggerDelay: {
  '1': '0.1s',
  '2': '0.2s',
  '3': '0.3s',
  '4': '0.4s',
  '5': '0.5s',
  '6': '0.6s',
},
```

### Impact:
- Stronger brand identity
- Bolder accent colors create better visual hierarchy
- New animation utilities enable staggered reveals and motion design

---

## 📋 FILE 2: src/index.css

### Purpose
Update component styles with new button treatments, animations, and refined interactions.

### Changes:

### 2.1 Update Primary Button
```css
/* BEFORE */
.btn-primary {
  @apply bg-primary text-white;
}
.btn-primary:hover {
  @apply bg-primary-dark;
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0);
}

/* AFTER */
.btn-primary {
  @apply inline-flex items-center justify-center font-semibold;
  padding: 14px 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1A4D5E 0%, #2D6B7D 100%);
  box-shadow: 0 4px 0 #0F2D3D, 0 6px 20px rgba(26, 77, 94, 0.3);
  transform: translateY(0);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #0F2D3D, 0 12px 30px rgba(26, 77, 94, 0.4);
}

.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #0F2D3D, 0 4px 10px rgba(26, 77, 94, 0.3);
}
```

### 2.2 Update Secondary/Ghost Button with Underline
```css
/* BEFORE */
.btn-secondary {
  @apply bg-transparent text-primary border-2 border-primary;
  padding: 10px 22px;
}
.btn-secondary:hover {
  @apply bg-bg-secondary;
}

/* AFTER */
.btn-secondary {
  @apply inline-flex items-center justify-center font-semibold;
  padding: 14px 28px;
  border-radius: 8px;
  border: 2px solid #1A4D5E;
  background: transparent;
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}

.btn-secondary::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 0;
  height: 2px;
  background: #2D7A6E;
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.btn-secondary:hover {
  background: #EDEAE6;
}

.btn-secondary:hover::after {
  width: 80%;
}
```

### 2.3 Update Accent Button
```css
/* BEFORE */
.btn-accent {
  @apply bg-accent-action text-white;
}
.btn-accent:hover {
  @apply opacity-90;
  transform: translateY(-1px);
}

/* AFTER */
.btn-accent {
  @apply inline-flex items-center justify-center font-semibold;
  padding: 14px 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4A9CAC 0%, #2D6B7D 100%);
  color: white;
  box-shadow: 0 4px 0 #1A4D5E, 0 6px 20px rgba(74, 156, 172, 0.3);
  transform: translateY(0);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-accent:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #1A4D5E, 0 12px 30px rgba(74, 156, 172, 0.4);
}
```

### 2.4 Add Magnetic Hover Effect Utility
```css
.btn-magnetic {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.btn-magnetic:hover {
  transform: scale(1.05);
}
```

### 2.5 Update Card Hover
```css
/* BEFORE */
.card:hover {
  @apply shadow-card-hover;
  transform: translateY(-2px);
}

/* AFTER */
.card {
  @apply bg-bg-card rounded-card shadow-card border border-bg-secondary;
  padding: var(--space-lg);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card:hover {
  @apply shadow-card-hover;
  transform: translateY(-4px) scale(1.01);
  border-color: #2D7A6E/20;
}
```

### 2.6 Add Stagger Delay Classes
```css
.stagger-delay-1 { animation-delay: 0.1s; }
.stagger-delay-2 { animation-delay: 0.2s; }
.stagger-delay-3 { animation-delay: 0.3s; }
.stagger-delay-4 { animation-delay: 0.4s; }
.stagger-delay-5 { animation-delay: 0.5s; }
.stagger-delay-6 { animation-delay: 0.6s; }
```

### 2.7 Update Input Focus State
```css
/* BEFORE */
.input:focus {
  @apply border-accent-action outline-none shadow-glow;
}

/* AFTER */
.input:focus {
  border-color: #2D7A6E;
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 122, 110, 0.15), 0 0 0 1px #2D7A6E;
}
```

### Impact:
- Buttons have distinctive character with offset shadows
- Underline reveal creates memorable interaction
- Cards have more expressive hover states
- Improved focus states for accessibility

---

## 📋 FILE 3: src/components/LandingPage.tsx

### Purpose
Redesign hero section with asymmetric layout and break feature grid for visual rhythm.

### Changes:

### 3.1 Redesign Hero Section (Complete Replacement)
```tsx
/* BEFORE */
<section className="pt-40 pb-20 px-lg md:px-xl max-w-7xl mx-auto text-center">
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-positive/10 text-accent-positive text-label font-semibold uppercase tracking-wider mb-8 border border-accent-positive/20">
    <Sparkles size={14} />
    <span>Now with AI-Powered Pattern Recognition</span>
  </div>

  <h1 className="text-hero md:text-[56px] font-display font-bold leading-tight mb-6 max-w-4xl mx-auto">
    Understand Your Patterns<br />
    <span className="text-primary">Live a Healthier Life</span>
  </h1>
  {/* ... */}
</section>

/* AFTER */
<section className="pt-24 pb-20 px-lg md:px-xl max-w-7xl mx-auto">
  <div className="grid lg:grid-cols-12 gap-xl items-center">
    {/* Left: Text Content */}
    <div className="lg:col-span-7 space-y-8">
      {/* Version Badge - Minimal */}
      <div className="inline-flex items-center">
        <span className="text-label font-bold uppercase tracking-widest text-accent-positive">
          v1.0
        </span>
        <span className="mx-3 text-text-tertiary">•</span>
        <span className="text-small text-text-secondary">
          Privacy-first health insights
        </span>
      </div>
      
      {/* Hero Headline - Asymmetric, Bold */}
      <h1 className="text-[48px] md:text-[62px] lg:text-[68px] font-display font-bold text-text-primary leading-[1.1]">
        Notice your patterns.<br />
        <span className="relative inline-block">
          Change your life.
          <svg className="absolute -bottom-1.5 left-0 w-full h-2.5 bg-accent-positive/30 -z-10" viewBox="0 0 200 8">
            <path d="M0 4 Q50 0 100 4 T200 4" stroke="none" fill="none" />
          </svg>
        </span>
      </h1>
      
      {/* Description - More Direct */}
      <p className="text-large md:text-xl text-text-secondary max-w-xl leading-relaxed">
        MAEPLE is not a journal. It's a mirror that helps you see what you're actually doing—so you can choose what you want to do.
      </p>
      
      {/* CTAs - Horizontal */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button variant="primary" size="lg" className="min-w-[180px]">
          Start Free
        </Button>
        <Button variant="secondary" size="lg" className="min-w-[180px]">
          See How It Works
        </Button>
      </div>
      
      {/* Trust Indicators */}
      <div className="flex flex-wrap items-center gap-6 text-small text-text-secondary pt-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-accent-positive rounded-full"></div>
          <span>Your data stays yours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-accent-positive rounded-full"></div>
          <span>No judgment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-accent-positive rounded-full"></div>
          <span>Science-backed</span>
        </div>
      </div>
    </div>
    
    {/* Right: Visual Element */}
    <div className="lg:col-span-5 relative pt-8 lg:pt-0">
      <div className="relative animate-float">
        {/* Glow Effect */}
        <div className="absolute -inset-6 bg-gradient-to-br from-accent-positive/20 to-accent-attention/20 blur-3xl rounded-3xl animate-breathe" />
        
        {/* Dashboard Preview Card */}
        <div className="relative bg-bg-card rounded-2xl p-6 shadow-2xl border border-bg-secondary">
          {/* Mini dashboard preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-positive to-primary rounded-xl flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <div className="text-small font-bold text-text-primary">Today's Energy</div>
                  <div className="text-caption text-text-tertiary">8.2 / 10</div>
                </div>
              </div>
              <div className="px-3 py-1 bg-accent-positive/10 text-accent-positive text-label font-semibold rounded-full">
                +12%
              </div>
            </div>
            
            {/* Mini chart visual */}
            <div className="h-32 bg-bg-secondary rounded-xl overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D7A6E" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2D7A6E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0 100 Q50 60 100 80 T200 50 T300 70 V120 H0 Z" 
                  fill="url(#chartGradient)" 
                />
                <path 
                  d="M0 100 Q50 60 100 80 T200 50 T300 70" 
                  stroke="#2D7A6E" 
                  strokeWidth="3" 
                  fill="none"
                />
              </svg>
            </div>
            
            {/* Insights Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-secondary/50 p-3 rounded-lg">
                <div className="text-caption text-text-tertiary mb-1">Top Strength</div>
                <div className="text-small font-semibold text-text-primary">Focus</div>
              </div>
              <div className="bg-bg-secondary/50 p-3 rounded-lg">
                <div className="text-caption text-text-tertiary mb-1">Mood</div>
                <div className="text-small font-semibold text-text-primary">Calm</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 3.2 Break Feature Grid (12-Column Asymmetric)
```tsx
/* BEFORE */
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-lg">
  {features.map(f => <FeatureCard />)}
</div>

/* AFTER */
<div className="grid md:grid-cols-12 gap-lg auto-rows-min">
  {/* Featured Feature - Spans 8 columns */}
  <div className="md:col-span-8 lg:col-span-8 animate-stagger stagger-delay-1">
    <FeatureCard
      icon={LayoutDashboard}
      title="Pattern Insights"
      description="Discover connections between your energy, activities, and well-being. Visualize trends and understand what works for you with our unique Pattern Garden visualization."
      color="text-primary"
      bg="bg-primary/10"
      featured={true}
    />
  </div>
  
  {/* Compact Features - Spans 4 columns each */}
  <div className="md:col-span-4 lg:col-span-4 animate-stagger stagger-delay-2">
    <FeatureCard
      icon={BookHeart}
      title="Thoughtful Journal"
      description="Capture your thoughts and experiences with ease."
      color="text-accent-positive"
      bg="bg-accent-positive/10"
    />
  </div>
  
  <div className="md:col-span-4 lg:col-span-4 animate-stagger stagger-delay-3">
    <FeatureCard
      icon={MessageSquare}
      title="Gentle Guidance"
      description="AI-powered insights that respect your autonomy."
      color="text-accent-action"
      bg="bg-accent-action/10"
    />
  </div>
  
  {/* Another Featured Feature */}
  <div className="md:col-span-8 lg:col-span-8 animate-stagger stagger-delay-4">
    <FeatureCard
      icon={Camera}
      title="Self-Reflection"
      description="Optional tools to help you understand how you're feeling. Always your choice, always under your control. Our bio-mirror feature provides subtle visual feedback without pressure."
      color="text-accent-attention"
      bg="bg-accent-attention/10"
      featured={true}
    />
  </div>
  
  {/* More Compact Features */}
  <div className="md:col-span-4 lg:col-span-4 animate-stagger stagger-delay-5">
    <FeatureCard
      icon={Brain}
      title="Focus Support"
      description="Tools to help with planning and staying on track."
      color="text-purple-600"
      bg="bg-purple-50 dark:bg-purple-900/20"
    />
  </div>
  
  <div className="md:col-span-4 lg:col-span-4 animate-stagger stagger-delay-6">
    <FeatureCard
      icon={Activity}
      title="Life Integration"
      description="Connect your wellness data to see the bigger picture."
      color="text-emerald-600"
      bg="bg-emerald-50 dark:bg-emerald-900/20"
    />
  </div>
</div>
```

### 3.3 Update FeatureCard Component for Featured Variant
```tsx
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bg: string;
  featured?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  bg,
  featured = false,
}) => (
  <Card className={`hoverable ${featured ? 'md:col-span-2' : ''}`} hoverable={true}>
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center mb-4`}>
      <Icon size={28} />
    </div>
    <CardHeader>
      <CardTitle className={featured ? 'text-h2' : ''}>{title}</CardTitle>
    </CardHeader>
    <p className={`text-base text-text-secondary leading-relaxed ${featured ? 'text-large' : ''}`}>
      {description}
    </p>
  </Card>
);
```

### 3.4 Update Trust Section
```tsx
/* BEFORE */
<section className="py-20 px-lg md:px-xl max-w-4xl mx-auto text-center">
  {/* ... */}
</section>

/* AFTER */
<section className="py-20 px-lg md:px-xl max-w-5xl mx-auto">
  <div className="text-center mb-12">
    <div className="w-16 h-16 bg-accent-positive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <ShieldCheck className="text-accent-positive" size={32} />
    </div>
    <h2 className="text-h1 font-display font-bold text-text-primary mb-4">
      Your Data, Your Control
    </h2>
    <p className="text-large text-text-secondary max-w-2xl mx-auto leading-relaxed">
      Your data belongs to you. We use industry-standard encryption and give you full control over what you share and with whom.
    </p>
  </div>
  
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      { icon: '🔒', title: 'End-to-End Encryption', desc: 'Your data is encrypted at rest and in transit' },
      { icon: '💾', title: 'Local-First Storage', desc: 'Primary storage is on your device' },
      { icon: '🚫', title: 'No Data Selling', desc: 'We never sell your personal data' },
      { icon: '✅', title: 'GDPR Compliant', desc: 'Full compliance with privacy regulations' },
    ].map((item, i) => (
      <div key={i} className="text-center p-6 bg-bg-card rounded-xl border border-bg-secondary hover:border-accent-positive/30 transition-colors">
        <div className="text-4xl mb-4">{item.icon}</div>
        <div className="text-h4 font-semibold text-text-primary mb-2">{item.title}</div>
        <div className="text-small text-text-secondary">{item.desc}</div>
      </div>
    ))}
  </div>
</section>
```

### 3.5 Update CTA Section
```tsx
/* BEFORE */
<section className="py-20 px-lg md:px-xl bg-gradient-to-br from-primary to-primary-dark">
  {/* ... */}
</section>

/* AFTER */
<section className="py-20 px-lg md:px-xl bg-gradient-to-br from-primary via-primary to-accent-positive relative overflow-hidden">
  {/* Background Pattern */}
  <div className="absolute inset-0 opacity-5">
    <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
      <circle cx="100" cy="100" r="80" fill="none" stroke="#ffffff" strokeWidth="1" />
      <circle cx="300" cy="200" r="120" fill="none" stroke="#ffffff" strokeWidth="1" />
      <circle cx="200" cy="300" r="60" fill="none" stroke="#ffffff" strokeWidth="1" />
    </svg>
  </div>
  
  <div className="relative max-w-3xl mx-auto text-center">
    <div className="inline-block mb-6">
      <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
        <span className="text-small font-semibold text-white/90">Start your journey today</span>
      </div>
    </div>
    
    <h2 className="text-h1 font-display font-bold text-white mb-6">
      Ready to Understand Yourself Better?
    </h2>
    <p className="text-large text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
      Join thousands of people discovering their patterns and living more intentional lives. Your journey starts with a single entry.
    </p>
    
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-bg-secondary hover:text-primary min-w-[200px]">
        Start Your Journey
      </Button>
    </div>
    
    <p className="mt-8 text-small text-white/70">
      Free to start • No credit card required • Cancel anytime
    </p>
  </div>
</section>
```

### Impact:
- Hero section is now memorable with asymmetric layout
- Dashboard preview creates visual interest and context
- Feature grid breaks predictability with varied spans
- Trust section uses emojis for friendliness
- CTA section has background pattern for character

---

## 📋 FILE 4: src/components/HealthMetricsDashboard.tsx

### Purpose
Refresh empty state with distinctive "Pattern Garden" concept and add staggered animations.

### Changes:

### 4.1 Redesign Empty State
```tsx
/* BEFORE */
if (!entries || entries.length === 0) {
  return (
    <div className="bg-bg-card rounded-card p-12 text-center border-2 border-dashed border-bg-secondary">
      <div className="w-16 h-16 bg-accent-positive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Activity className="text-accent-positive" size={32} />
      </div>
      <h3 className="text-h2 font-display font-semibold text-text-primary mb-2">
        Your Pattern Garden
      </h3>
      <p className="text-base text-text-secondary max-w-sm mx-auto leading-relaxed">
        Start your first entry today to begin understanding your unique energy patterns and what helps you feel your best.
      </p>
      <Button variant="primary" size="md" className="mt-6">
        Start Your First Entry
      </Button>
    </div>
  );
}

/* AFTER */
if (!entries || entries.length === 0) {
  return (
    <div className="relative bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-card rounded-3xl p-16 overflow-hidden">
      {/* Abstract Garden Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
          {/* Organic shapes suggesting growth/patterns */}
          <circle cx="100" cy="100" r="60" fill="none" stroke="#2D7A6E" strokeWidth="1" />
          <circle cx="300" cy="250" r="40" fill="none" stroke="#2D7A6E" strokeWidth="1" />
          <circle cx="180" cy="320" r="50" fill="none" stroke="#2D7A6E" strokeWidth="1" />
          <path d="M50 200 Q150 100 250 200 T350 150" stroke="#2D7A6E" strokeWidth="1" fill="none" />
          <path d="M80 300 Q200 280 300 320" stroke="#2D7A6E" strokeWidth="1" fill="none" />
          
          {/* Subtle leaf shapes */}
          <path d="M150 180 Q160 160 170 180 Q160 200 150 180" fill="#2D7A6E" opacity="0.3" />
          <path d="M280 200 Q300 180 320 200 Q300 220 280 200" fill="#2D7A6E" opacity="0.3" />
          <path d="M200 250 Q220 230 240 250 Q220 270 200 250" fill="#2D7A6E" opacity="0.3" />
        </svg>
      </div>
      
      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* Custom Garden Illustration */}
        <div className="mb-8 animate-float">
          <svg className="w-28 h-28 mx-auto text-accent-positive" viewBox="0 0 100 100">
            {/* Stylized plant/pattern illustration */}
            <defs>
              <linearGradient id="stemGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D7A6E" />
                <stop offset="100%" stopColor="#1A4D5E" />
              </linearGradient>
              <linearGradient id="leafGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3B8B7E" />
                <stop offset="100%" stopColor="#2D7A6E" />
              </linearGradient>
            </defs>
            
            {/* Main stem */}
            <path d="M50 90 Q50 70 50 50" stroke="url(#stemGradient)" strokeWidth="3" fill="none" />
            
            {/* Left leaves */}
            <path d="M50 75 Q35 65 30 70 Q35 75 50 75" fill="url(#leafGradient)" opacity="0.8" />
            <path d="M50 60 Q30 50 25 55 Q30 62 50 60" fill="url(#leafGradient)" opacity="0.7" />
            
            {/* Right leaves */}
            <path d="M50 65 Q65 55 70 60 Q65 67 50 65" fill="url(#leafGradient)" opacity="0.8" />
            <path d="M50 50 Q70 40 75 45 Q70 52 50 50" fill="url(#leafGradient)" opacity="0.7" />
            
            {/* Top sprout */}
            <circle cx="50" cy="45" r="5" fill="#4A9CAC" opacity="0.6" />
            <circle cx="48" cy="42" r="3" fill="#4A9CAC" opacity="0.4" />
            <circle cx="53" cy="43" r="3" fill="#4A9CAC" opacity="0.4" />
          </svg>
        </div>
        
        <h3 className="text-h1 font-display font-bold text-text-primary mb-4 animate-stagger">
          Your pattern garden is waiting
        </h3>
        
        <p className="text-large text-text-secondary mb-8 leading-relaxed animate-stagger stagger-delay-1">
          Every pattern you notice is a seed. Over time, you'll grow to understand what truly nourishes you.
        </p>
        
        <Button variant="primary" size="lg" className="min-w-[220px] animate-stagger stagger-delay-2">
          Plant Your First Seed
        </Button>
        
        <p className="mt-8 text-small text-text-tertiary animate-stagger stagger-delay-3">
          One entry, one pattern, one step toward clarity.
        </p>
      </div>
    </div>
  );
}
```

### 4.2 Add Staggered Animations to Dashboard Header
```tsx
/* BEFORE */
<div className="space-y-xl animate-fadeIn">
  <div className="flex items-center justify-between">
    {/* ... */}
  </div>
</div>

/* AFTER */
<div className="space-y-xl">
  <div className="flex items-center justify-between animate-stagger">
    <div>
      <h2 className="text-h1 font-display font-bold text-text-primary">
        Pattern Dashboard
      </h2>
      <p className="text-base text-text-secondary">
        Tracking {entries.length} patterns • Last updated 2 hours ago
      </p>
    </div>
    <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)} className="btn-magnetic">
      {showDetails ? (
        <>
          <ChevronUp size={16} className="mr-2" />
          Show Less
        </>
      ) : (
        <>
          <ChevronDown size={16} className="mr-2" />
          Show Details
        </>
      )}
    </Button>
  </div>
</div>
```

### 4.3 Add Staggered Animations to Stats Cards
```tsx
/* BEFORE */
<div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
  <Card>
    {/* Today's Energy */}
  </Card>
  <Card>
    {/* Average Mood */}
  </Card>
  <Card>
    {/* Top Strength */}
  </Card>
</div>

/* AFTER */
<div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
  <Card className="animate-stagger stagger-delay-1">
    {/* Today's Energy */}
  </Card>
  <Card className="animate-stagger stagger-delay-2">
    {/* Average Mood */}
  </Card>
  <Card className="animate-stagger stagger-delay-3">
    {/* Top Strength */}
  </Card>
</div>
```

### 4.4 Add Staggered Animations to Insight Card
```tsx
/* BEFORE */
{strategies.length > 0 && (
  <Card className="bg-gradient-to-r from-primary to-primary-light text-white border-none">
    {/* ... */}
    <div className="grid md:grid-cols-3 gap-lg">
      {strategies.slice(0, 3).map((strat) => (
        <div key={strat.id}>
          {/* ... */}
        </div>
      ))}
    </div>
  </Card>
)}

/* AFTER */
{strategies.length > 0 && (
  <Card className="bg-gradient-to-r from-primary to-primary-light text-white border-none animate-stagger stagger-delay-2">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
        <Sparkles className="text-white" size={24} />
      </div>
      <div>
        <h3 className="text-h2 font-display font-semibold">Today's Insight</h3>
        <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-none">
          Personalized for you
        </Badge>
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-lg">
      {strategies.slice(0, 3).map((strat, i) => (
        <div
          key={strat.id}
          className="bg-white/10 border border-white/20 p-lg rounded-xl backdrop-blur-sm animate-stagger"
          style={{ animationDelay: `${0.3 + (i * 0.1)}s` }}
        >
          <p className="text-small font-semibold text-white mb-2">
            {strat.title}
          </p>
          <p className="text-base text-white/90 leading-relaxed">
            {strat.action}
          </p>
        </div>
      ))}
    </div>
  </Card>
)}
```

### Impact:
- Empty state is now distinctive and memorable
- Custom garden illustration brings concept to life
- Staggered animations create orchestrated, polished experience
- Better visual hierarchy through timing

---

## 📋 FILE 5: src/components/JournalEntry.tsx

### Purpose
Update button usage and add character to energy capacity sliders.

### Changes:

### 5.1 Update Action Bar Button
```tsx
/* BEFORE */
{text && (
  <div className="mt-4 flex justify-end animate-fadeIn">
    <Button
      onClick={handleSubmit}
      disabled={isProcessing}
      size="md"
      rightIcon={<Send size={16} />}
    >
      Save Entry
    </Button>
  </div>
)}

/* AFTER */
{text && (
  <div className="mt-4 flex justify-end animate-stagger stagger-delay-1">
    <Button
      onClick={handleSubmit}
      disabled={isProcessing}
      size="lg"
      rightIcon={<Send size={16} />}
      className="min-w-[160px] btn-magnetic"
    >
      Save Entry
    </Button>
  </div>
)}
```

### 5.2 Update Energy Capacity Sliders with More Character
```tsx
/* BEFORE */
const CapacitySlider = ({ label, icon: Icon, value, field, color, suggested }: any) => {
  const styles = colorStyles[color] || colorStyles.blue;
  const informedBy = getInformedByContext(field);
  const isSuggested = suggested !== undefined && value === suggested;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${styles.bg} ${styles.text}`}>
            <Icon size={14} />
          </div>
          <span className="text-sm font-medium text-text-primary">
            {label}
          </span>
          {isSuggested && (
            <span className="text-xs text-primary font-medium">
              (Suggested)
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-text-primary">
          {value}/10
        </span>
      </div>

      {informedBy && (
        <div className="mb-2 text-xs text-primary flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full">
          <span>💡</span>
          <span>{informedBy}</span>
        </div>
      )}

      <div className="relative h-3 bg-bg-secondary rounded-full overflow-hidden cursor-pointer group">
        <div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${styles.gradient} rounded-full transition-all duration-300`}
          style={{ width: `${value * 10}%` }}
        ></div>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => updateCapacity(field, parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
};

/* AFTER */
const CapacitySlider = ({ label, icon: Icon, value, field, color, suggested }: any) => {
  const styles = colorStyles[color] || colorStyles.blue;
  const informedBy = getInformedByContext(field);
  const isSuggested = suggested !== undefined && value === suggested;
  
  // Dynamic glow effect based on value
  const glowIntensity = Math.max(0, (value - 5) / 5); // 0 to 1 for values 5-10
  const glowColor = color === 'pink' || color === 'rose' 
    ? `rgba(212, 117, 106, ${glowIntensity * 0.15})`
    : `rgba(45, 122, 110, ${glowIntensity * 0.15})`;

  return (
    <div className="mb-5 group/slider">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div 
            className={`p-2 rounded-xl transition-all duration-300 ${
              isSuggested 
                ? `${styles.bg} ${styles.text} ring-2 ring-accent-positive/50` 
                : `${styles.bg} ${styles.text}`
            }`}
          >
            <Icon size={16} />
          </div>
          <span className="text-sm font-semibold text-text-primary">
            {label}
          </span>
          {isSuggested && (
            <span className="text-xs font-bold text-accent-positive bg-accent-positive/10 px-2 py-0.5 rounded-full">
              💡 Suggested
            </span>
          )}
        </div>
        <span className="text-lg font-bold text-text-primary tabular-nums">
          {value}<span className="text-sm font-normal text-text-tertiary">/10</span>
        </span>
      </div>

      {informedBy && (
        <div className="mb-3 text-xs font-medium text-primary flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/10 animate-stagger">
          <span className="text-base">💡</span>
          <span>{informedBy}</span>
        </div>
      )}

      <div className="relative group-hover/slider:scale-[1.02] transition-transform duration-300">
        {/* Track background */}
        <div className="h-4 bg-bg-secondary rounded-full overflow-hidden shadow-inner">
          {/* Fill with gradient */}
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${styles.gradient} rounded-full transition-all duration-300 ease-out`}
            style={{ 
              width: `${value * 10}%`,
              boxShadow: `0 0 ${10 + glowIntensity * 20}px ${glowColor}`
            }}
          ></div>
        </div>
        
        {/* Custom thumb indicator (visual only, input is transparent) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
          style={{ left: `calc(${value * 10}% - 8px)` }}
        >
          <div 
            className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform duration-200 ${
              value >= 7 ? 'scale-125' : ''
            }`}
            style={{ backgroundColor: isSuggested ? '#2D7A6E' : '#1A4D5E' }}
          />
        </div>
        
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => updateCapacity(field, parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
      
      {/* Value indicators */}
      <div className="flex justify-between mt-1.5 text-xs text-text-tertiary">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
};
```

### Impact:
- Buttons use new variants with character
- Sliders have glow effect based on value
- Thumb indicator scales for high values
- Better visual feedback for suggested values
- More refined spacing and typography

---

## 📋 FILE 6: src/components/ui/Button.tsx

### Purpose
Ensure Button component properly implements new variants and effects.

### Changes:

### 6.1 Update Button Variants
```tsx
/* BEFORE */
const variantStyles = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
};

/* AFTER */
const variantStyles = {
  primary: 'btn-primary',
  secondary: 'btn-secondary', // Now has underline effect
  accent: 'btn-accent',
  ghost: 'btn-ghost',
};
```

### 6.2 Add Magnetic Hover Support
```tsx
/* Add to component props */
interface ButtonProps {
  // ... existing props
  magnetic?: boolean;
}

/* Update component */
export const Button: React.FC<ButtonProps> = ({
  // ... existing props
  magnetic = false,
}) => {
  const baseClasses = 'btn';
  const variantClass = variantStyles[variant];
  const sizeClass = sizeStyles[size];
  
  return (
    <button
      className={cn(
        baseClasses,
        variantClass,
        sizeClass,
        magnetic && 'btn-magnetic',
        className
      )}
      // ... existing props
    >
      {/* ... */}
    </button>
  );
};
```

### Impact:
- Button component supports all new variants
- Magnetic hover effect available as prop
- Consistent implementation across app

---

## 🎯 IMPLEMENTATION ORDER

### Phase 1: Foundation (Do These First)
1. **tailwind.config.js** - Update colors and add utilities
2. **src/index.css** - Update component styles and add animations

### Phase 2: Component Updates (Dependent on Phase 1)
3. **src/components/ui/Button.tsx** - Update variant support
4. **src/components/LandingPage.tsx** - Redesign hero and features
5. **src/components/HealthMetricsDashboard.tsx** - Refresh empty state, add animations
6. **src/components/JournalEntry.tsx** - Update buttons and sliders

### Phase 3: Polish (After All Changes)
7. Test responsive behavior
8. Verify dark mode compatibility
9. Check accessibility with new styles
10. Performance check (animations)

---

## ✅ SUCCESS CRITERIA

After implementation, MAEPLE will have:

- ✅ Distinctive visual identity (not generic SaaS)
- ✅ Memorable hero section with asymmetric layout
- ✅ Buttons with character (offset shadows, underline reveals)
- ✅ Broken grid with visual rhythm
- ✅ Empty state that brings "Pattern Garden" to life
- ✅ Staggered animations for polished feel
- ✅ Bolder, more confident color palette
- ✅ Consistent motion design system

---

## 🚨 RISK MITIGATION

### Potential Issues:
1. **Animation Performance**: Staggered animations on mobile
   - Mitigation: Use `will-change` and test on low-end devices
2. **Button Shadow Visibility**: Dark mode contrast
   - Mitigation: Adjust shadow colors in dark mode CSS
3. **Feature Grid Breaking**: Responsive behavior
   - Mitigation: Test on all breakpoints before finalizing
4. **Empty State SVG**: Rendering inconsistencies
   - Mitigation: Use inline SVG with viewBox and preserveAspectRatio

### Rollback Strategy:
All changes are additive (no deletions). Original styles preserved as comments in CSS files for easy rollback if needed.

---

## 📊 METRICS TO TRACK

After implementation, measure:
- User engagement time on landing page
- CTA click-through rate
- Empty state completion rate
- Mobile scroll depth on features section
- User feedback on visual refresh

---

This plan provides a complete, dependency-ordered roadmap for transforming MAEPLE's visual design from generic to distinctive while maintaining accessibility and functionality.