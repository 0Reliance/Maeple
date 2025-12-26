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

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-lg md:px-xl max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-positive/10 text-accent-positive text-label font-semibold uppercase tracking-wider mb-8 border border-accent-positive/20">
          <Sparkles size={14} />
          <span>Now with AI-Powered Pattern Recognition</span>
        </div>

        <h1 className="text-hero md:text-[56px] font-display font-bold leading-tight mb-6 max-w-4xl mx-auto">
          Understand Your Patterns<br />
          <span className="text-primary">Live a Healthier Life</span>
        </h1>

        <p className="text-large md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          MAEPLE is your companion for self-understanding. Track your energy, notice your
          patterns, and make informed decisions that help you feel more balanced
          every day.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" onClick={onRegister}>
            Start Understanding
          </Button>
          <Button variant="secondary" size="lg" onClick={onLogin}>
            Log In
          </Button>
        </div>

        <p className="mt-8 text-small text-text-tertiary">
          Science-backed insights for everyone • No judgment • Your data stays yours
        </p>
      </section>

      {/* Features Section */}
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-lg">
            <FeatureCard
              icon={BookHeart}
              title="Thoughtful Journal"
              description="Capture your thoughts and experiences with ease. Track energy levels, moments of clarity, and what matters to you."
              color="text-accent-positive"
              bg="bg-accent-positive/10"
            />
            <FeatureCard
              icon={LayoutDashboard}
              title="Pattern Insights"
              description="Discover connections between your energy, activities, and well-being. Visualize trends and understand what works for you."
              color="text-primary"
              bg="bg-primary/10"
            />
            <FeatureCard
              icon={Camera}
              title="Self-Reflection"
              description="Optional tools to help you understand how you're feeling. Always your choice, always under your control."
              color="text-accent-attention"
              bg="bg-accent-attention/10"
            />
            <FeatureCard
              icon={MessageSquare}
              title="Gentle Guidance"
              description="AI-powered insights that respect your autonomy. Optional prompts when you want them, never intrusive."
              color="text-accent-action"
              bg="bg-accent-action/10"
            />
            <FeatureCard
              icon={Brain}
              title="Focus Support"
              description="Tools to help with planning and staying on track without feeling overwhelmed. Simple, flexible approaches."
              color="text-purple-600"
              bg="bg-purple-50 dark:bg-purple-900/20"
            />
            <FeatureCard
              icon={Activity}
              title="Life Integration"
              description="Connect your wellness data to see the bigger picture. Correlate activity, rest, and how you feel."
              color="text-emerald-600"
              bg="bg-emerald-50 dark:bg-emerald-900/20"
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-lg md:px-xl max-w-4xl mx-auto text-center">
        <div className="w-16 h-16 bg-accent-positive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="text-accent-positive" size={32} />
        </div>
        <h2 className="text-h2 font-display font-semibold text-text-primary mb-4">
          Your Data, Your Control
        </h2>
        <p className="text-base text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
          Your data belongs to you. We use industry-standard encryption and give
          you full control over what you share and with whom. Designed with
          privacy-first principles for your peace of mind.
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-small text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-positive rounded-full"></div>
            <span>End-to-End Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-positive rounded-full"></div>
            <span>Local-First Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-positive rounded-full"></div>
            <span>No Data Selling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-positive rounded-full"></div>
            <span>GDPR Compliant</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-lg md:px-xl bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-h2 font-display font-semibold text-white mb-4">
            Ready to Understand Yourself Better?
          </h2>
          <p className="text-large text-white/80 mb-8">
            Join thousands of people discovering their patterns and living more
            intentional lives. Your journey starts with a single entry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="secondary" size="lg" onClick={onRegister} className="bg-white text-primary hover:bg-bg-secondary hover:text-primary">
              Start Your Journey
            </Button>
          </div>
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
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  color,
  bg,
}) => (
  <Card className="hoverable" hoverable={true}>
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center mb-4`}>
      <Icon size={28} />
    </div>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <p className="text-base text-text-secondary leading-relaxed">
      {description}
    </p>
  </Card>
);

export default LandingPage;
