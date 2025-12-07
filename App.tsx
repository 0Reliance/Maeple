import React, { useState, useEffect, Suspense } from 'react';
import { LayoutDashboard, BookHeart, MessagesSquare, Search as SearchIcon, Image as ImageIcon, Menu, Settings as SettingsIcon, Compass, ShieldCheck, Map, FileText, Camera } from 'lucide-react';
import JournalEntry from './components/JournalEntry';
import HealthMetricsDashboard from './components/HealthMetricsDashboard';
import TimelineEntry from './components/TimelineEntry';
import SearchResources from './components/SearchResources';
import Guide from './components/Guide';
import Terms from './components/Terms';
import Roadmap from './components/Roadmap';
import MobileNav from './components/MobileNav';
import OnboardingWizard, { isOnboardingComplete } from './components/OnboardingWizard';

// Lazy load heavy components for better performance
const LiveCoach = React.lazy(() => import('./components/LiveCoach'));
const VisionBoard = React.lazy(() => import('./components/VisionBoard'));
const StateCheckWizard = React.lazy(() => import('./components/StateCheckWizard'));
const Settings = React.lazy(() => import('./components/Settings'));
const ClinicalReport = React.lazy(() => import('./components/ClinicalReport'));
import { getEntries, saveEntry } from './services/storageService';
import { HealthEntry, View, WearableDataPoint } from './types';
import { initializeAI } from './services/ai';
import { initNotificationService } from './services/notificationService';
import { initializeAuth } from './services/authService';
import { initializeSync, triggerPendingSync } from './services/syncService';
import swManager from './src/swRegistration.ts';

function App() {
  const [view, setView] = useState<View>(View.JOURNAL); // Default to Journal for Mobile-First capture
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [wearableData, setWearableData] = useState<WearableDataPoint[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiInitialized, setAiInitialized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingComplete());

  // Initialize AI services on app startup
  useEffect(() => {
    initializeAI()
      .then(() => setAiInitialized(true))
      .catch((error) => {
        console.warn('AI initialization failed (non-critical):', error);
        setAiInitialized(true); // Still mark as initialized - app works without AI
      });
    
    // Initialize notification service
    initNotificationService();
    
    // Initialize auth and sync services
    initializeAuth()
      .then(() => {
        initializeSync();
        // Trigger sync of any pending changes
        triggerPendingSync();
      })
      .catch((error) => {
        console.warn('Auth initialization failed (non-critical):', error);
      });
  }, []);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  const handleEntryAdded = (entry: HealthEntry) => {
    const updated = saveEntry(entry);
    setEntries(updated);
  };

  const handleWearableSync = (data: WearableDataPoint[]) => {
      // Merge new data with existing
      // Simple dedup by ID
      const newSet = [...wearableData];
      data.forEach(d => {
          if (!newSet.find(existing => existing.id === d.id)) {
              newSet.push(d);
          }
      });
      setWearableData(newSet);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
    setMobileMenuOpen(false);
  };

  const NavButton = ({ targetView, icon: Icon, label }: { targetView: View; icon: React.ComponentType; label: string }) => (
    <button
      onClick={() => handleViewChange(targetView)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        view === targetView
          ? 'bg-teal-50 text-teal-700 font-medium'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Top Header (Branding Only) */}
      <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-slate-100 p-4 flex justify-center items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-teal-200 shadow-lg">M</div>
          <span className="font-bold text-slate-800 tracking-tight">MAEPLE</span>
        </div>
      </div>

      {/* Sidebar Navigation (Desktop & Mobile Menu) */}
      {/* Increased Z-Index to 60 to sit above BottomNav (z-50) when open on mobile */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-slate-100 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) md:translate-x-0 md:static md:h-screen flex flex-col print:hidden ${
        mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}>
        <div className="p-8 hidden md:flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-teal-100 text-lg">M</div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">MAEPLE</span>
        </div>

        <nav className="px-4 space-y-1.5 mt-16 md:mt-4 flex-1 overflow-y-auto no-scrollbar">
           {/* Mobile Menu Header */}
           <div className="md:hidden px-4 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Navigation
           </div>

          <NavButton targetView={View.JOURNAL} icon={BookHeart} label="Smart Journal" />
          <NavButton targetView={View.DASHBOARD} icon={LayoutDashboard} label="Pattern Dashboard" />
          <NavButton targetView={View.BIO_MIRROR} icon={Camera} label="Bio-Mirror (State Check)" />
          <NavButton targetView={View.LIVE_COACH} icon={MessagesSquare} label="Mae Live" />
          <NavButton targetView={View.VISION} icon={ImageIcon} label="Visual Therapy" />
          <NavButton targetView={View.CLINICAL} icon={FileText} label="Clinical Report" />
          <NavButton targetView={View.GUIDE} icon={Compass} label="Guide & Vision" />
          
          <div className="pt-4 mt-4 border-t border-slate-100">
             <div className="md:hidden px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tools & Settings
             </div>
            <NavButton targetView={View.SEARCH} icon={SearchIcon} label="Resources" />
            <NavButton targetView={View.ROADMAP} icon={Map} label="Future Roadmap" />
            <NavButton targetView={View.SETTINGS} icon={SettingsIcon} label="Settings" />
            <NavButton targetView={View.TERMS} icon={ShieldCheck} label="Terms & Legal" />
          </div>
        </nav>

        <div className="p-6 mt-auto">
           <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
              <h4 className="font-bold text-indigo-900 text-sm mb-1">Powered by Poziverse</h4>
              <p className="text-xs text-indigo-600/80 leading-relaxed">Context-aware intelligence for neurodivergent minds.</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-auto md:h-screen scroll-smooth print:h-auto print:overflow-visible pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          
          <header className="mb-4 md:mb-8 print:hidden">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {view === View.DASHBOARD && "Pattern Dashboard"}
              {view === View.JOURNAL && "MAEPLE Journal"}
              {view === View.BIO_MIRROR && "Bio-Mirror Check"}
              {view === View.LIVE_COACH && "Mae Live Companion"}
              {view === View.VISION && "Visual Therapy"}
              {view === View.SEARCH && "Health Resources"}
              {view === View.SETTINGS && "Settings & Devices"}
              {view === View.GUIDE && "Welcome to MAEPLE"}
              {view === View.TERMS && "Terms & Conditions"}
              {view === View.ROADMAP && "Product Roadmap"}
              {view === View.CLINICAL && "Clinical Tools"}
            </h1>
            <p className="text-slate-500 mt-2 text-base md:text-lg hidden md:block">
              {view === View.DASHBOARD && `Tracking ${entries.length} patterns. Identifying gaps between capacity and demand.`}
              {view === View.JOURNAL && "Capture your context. Track spoons, sensory load, and flow states."}
              {view === View.BIO_MIRROR && "Objectively analyze your physical signs of stress and masking."}
              {view === View.LIVE_COACH && "Real-time, voice-first reflection with Mae, your neuro-affirming companion."}
              {view === View.VISION && "Visualize your state of mind with generative art."}
              {view === View.SEARCH && "Grounded knowledge base for health queries."}
              {view === View.SETTINGS && "Configure your biological context and wearable integrations."}
              {view === View.GUIDE && "Understanding the MAEPLE method."}
              {view === View.TERMS && "Legal information and privacy policy."}
              {view === View.ROADMAP && "The evolution of MAEPLE to transform tracking."}
              {view === View.CLINICAL && "Generate professional reports for your healthcare team."}
            </p>
          </header>

          <div className="animate-fadeIn">
            {view === View.DASHBOARD && <HealthMetricsDashboard entries={entries} wearableData={wearableData} />}
            
            {view === View.JOURNAL && (
              <div className="space-y-6 md:space-y-8">
                <JournalEntry onEntryAdded={handleEntryAdded} />
                
                {entries.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 pl-1">Recent Context</h3>
                    <div className="space-y-4">
                      {entries.slice(0, 10).map(entry => (
                        <TimelineEntry key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {view === View.BIO_MIRROR && (
              <Suspense fallback={<div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>}>
                <StateCheckWizard />
              </Suspense>
            )}
            {view === View.LIVE_COACH && (
              <Suspense fallback={<div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>}>
                <LiveCoach />
              </Suspense>
            )}
            {view === View.VISION && (
              <Suspense fallback={<div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>}>
                <VisionBoard />
              </Suspense>
            )}
            {view === View.SEARCH && <SearchResources />}
            {view === View.SETTINGS && (
              <Suspense fallback={<div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>}>
                <Settings onDataSynced={handleWearableSync} />
              </Suspense>
            )}
            {view === View.GUIDE && <Guide />}
            {view === View.TERMS && <Terms />}
            {view === View.ROADMAP && <Roadmap />}
            {view === View.CLINICAL && (
              <Suspense fallback={<div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>}>
                <ClinicalReport entries={entries} wearableData={wearableData} />
              </Suspense>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav 
        currentView={view} 
        onNavigate={handleViewChange} 
        onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMenuOpen={mobileMenuOpen}
      />

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 md:hidden print:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

export default App;
