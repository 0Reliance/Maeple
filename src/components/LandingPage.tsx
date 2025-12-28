import {
  Activity,
  BookHeart,
  Brain,
  Camera,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import React from 'react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle } from './ui/Card';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-body">
      {/* Navigation */}
      <nav className="fixed w-full glass border-b border-bg-secondary z-50">
        <div className="max-w-7xl mx-auto px-lg md:px-xl">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent-positive rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
                M
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                MAEPLE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="md" onClick={onLogin}>
                Sign In
              </Button>
              <Button variant="primary" size="md" onClick={onRegister}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Redesigned with Asymmetric Layout */}
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
              <Button variant="primary" size="lg" onClick={onRegister} className="min-w-[180px]">
                Start Free
              </Button>
              <Button variant="secondary" size="lg" onClick={onLogin} className="min-w-[180px]">
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

      {/* Features Section - Broken Grid with Asymmetric Layout */}
      <section className="py-20 bg-bg-card border-y border-bg-secondary">
        <div className="max-w-7xl mx-auto px-lg md:px-xl">
          <div className="text-center mb-16">
            <h2 className="text-h2 font-display font-semibold text-text-primary mb-4">
              Built for Everyone
            </h2>
            <p className="text-base text-text-secondary max-w-2xl mx-auto">
              MAEPLE helps anyone discover their unique patterns—no diagnosis or prior
              knowledge required.
            </p>
          </div>

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
        </div>
      </section>

      {/* Trust Section - Enhanced with Emojis */}
      <section className="py-20 px-lg md:px-xl max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-accent-positive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="text-accent-positive" size={32} />
          </div>
          <h2 className="text-h1 font-display font-bold text-text-primary mb-4">
            Your Data, Your Control
          </h2>
          <p className="text-large text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Your data belongs to you. We use industry-standard encryption and give
            you full control over what you share and with whom.
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

      {/* CTA Section - Enhanced with Background Pattern */}
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
            <Button variant="secondary" size="lg" onClick={onRegister} className="bg-white text-primary hover:bg-bg-secondary hover:text-primary min-w-[200px]">
              Start Your Journey
            </Button>
          </div>
          
          <p className="mt-8 text-small text-white/70">
            Free to start • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-bg-secondary bg-bg-primary">
        <div className="max-w-7xl mx-auto px-lg md:px-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bg-secondary rounded-lg flex items-center justify-center text-xs font-bold text-text-tertiary">
              M
            </div>
            <span className="font-display font-semibold text-text-primary">
              MAEPLE
            </span>
          </div>
          <div className="text-small text-text-secondary">
            © {new Date().getFullYear()} Poziverse. Made with care for everyone.
          </div>
        </div>
      </footer>
    </div>
  );
};

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
  <Card className="hoverable" hoverable={true}>
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

export default LandingPage;