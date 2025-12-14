import React from "react";
import {
  BookHeart,
  LayoutDashboard,
  Camera,
  MessagesSquare,
  ShieldCheck,
  Zap,
  Brain,
  Activity,
} from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20">
                M
              </div>
              <span className="font-bold text-xl tracking-tight">MAEPLE</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onLogin}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={onRegister}
                className="text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-lg shadow-slate-500/20"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wide mb-8 border border-teal-100 dark:border-teal-800">
          <Zap size={14} />
          <span>Now with Gemini 1.5 Pro Intelligence</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-teal-800 to-indigo-900 dark:from-white dark:via-teal-200 dark:to-indigo-200 pb-2">
          Context-aware intelligence for <br className="hidden md:block" />
          <span className="text-teal-600 dark:text-teal-400">
            neurodivergent minds.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Maeple isn't just a tracker. It's a companion that understands your
          spoons, sensory load, and flow states to help you navigate a world not
          built for you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onRegister}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-teal-500/20 hover:shadow-2xl hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all"
          >
            Start Your Journey
          </button>
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={BookHeart}
              title="Smart Journal"
              description="Capture your context effortlessly. Track energy levels, sensory input, and emotional states with minimal friction."
              color="text-pink-500"
              bg="bg-pink-50 dark:bg-pink-900/20"
            />
            <FeatureCard
              icon={LayoutDashboard}
              title="Pattern Recognition"
              description="Identify gaps between your capacity and demand. Visualize trends in your energy and stress over time."
              color="text-indigo-500"
              bg="bg-indigo-50 dark:bg-indigo-900/20"
            />
            <FeatureCard
              icon={Camera}
              title="Bio-Mirror"
              description="Objectively analyze physical signs of stress and masking using computer vision technology."
              color="text-teal-500"
              bg="bg-teal-50 dark:bg-teal-900/20"
            />
            <FeatureCard
              icon={MessagesSquare}
              title="Mae Live Companion"
              description="Real-time, voice-first reflection with Mae, your neuro-affirming AI companion."
              color="text-blue-500"
              bg="bg-blue-50 dark:bg-blue-900/20"
            />
            <FeatureCard
              icon={Brain}
              title="Executive Function"
              description="Tools to help with planning, initiation, and maintaining focus without the overwhelm."
              color="text-violet-500"
              bg="bg-violet-50 dark:bg-violet-900/20"
            />
            <FeatureCard
              icon={Activity}
              title="Physiological Sync"
              description="Connect your wearables to correlate biological data with your subjective experience."
              color="text-emerald-500"
              bg="bg-emerald-50 dark:bg-emerald-900/20"
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Private by Design</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Your data is yours. We use industry-standard encryption and give you
          full control over what you share and with whom. Designed with
          privacy-first principles for peace of mind.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            End-to-End Encryption
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Local-First Data
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            GDPR Compliant
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded flex items-center justify-center text-xs font-bold text-slate-500">
              M
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              MAEPLE
            </span>
          </div>
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} Poziverse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, color, bg }: any) => (
  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-teal-500/30 transition-colors">
    <div
      className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mb-4`}
    >
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
      {title}
    </h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
      {description}
    </p>
  </div>
);

export default LandingPage;
