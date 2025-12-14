import React, { useEffect, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  NavLink,
} from "react-router-dom";
import {
  LayoutDashboard,
  BookHeart,
  MessagesSquare,
  Search as SearchIcon,
  Image as ImageIcon,
  Settings as SettingsIcon,
  Compass,
  ShieldCheck,
  Map,
  FileText,
  Camera,
  LucideIcon,
} from "lucide-react";
import JournalView from "./components/JournalView";
import SearchResources from "./components/SearchResources";
import Guide from "./components/Guide";
import Terms from "./components/Terms";
import Roadmap from "./components/Roadmap";
import MobileNav from "./components/MobileNav";
import OnboardingWizard from "./components/OnboardingWizard";
import SyncIndicator from "./components/SyncIndicator";

// Lazy load heavy components for better performance
const HealthMetricsDashboard = React.lazy(
  () => import("./components/HealthMetricsDashboard")
);
const LiveCoach = React.lazy(() => import("./components/LiveCoach"));
const VisionBoard = React.lazy(() => import("./components/VisionBoard"));
const StateCheckWizard = React.lazy(
  () => import("./components/StateCheckWizard")
);
const Settings = React.lazy(() => import("./components/Settings"));
const ClinicalReport = React.lazy(() => import("./components/ClinicalReport"));

import { HealthEntry, View, WearableDataPoint } from "./types";
import { viewToPath, pathToView } from "./routes";
import { initNotificationService } from "./services/notificationService";
import { initBackgroundSync } from "./services/backgroundSync";
import swManager from "./src/swRegistration.ts";

// Zustand stores
import { useAppStore, useAuthStore } from "./stores";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand store state
  const {
    entries,
    wearableData,
    mobileMenuOpen,
    showOnboarding,
    setView,
    setMobileMenuOpen,
    addEntry,
    mergeWearableData,
    completeOnboarding,
    initializeApp,
  } = useAppStore();

  const { initializeAuth } = useAuthStore();

  // Determine current view from path
  const currentPath =
    location.pathname === "/" ? "/journal" : location.pathname;
  const view = pathToView[currentPath] || View.JOURNAL;

  // Initialize app on startup
  useEffect(() => {
    initializeApp();
    initializeAuth();
    initNotificationService();
    initBackgroundSync();
  }, [initializeApp, initializeAuth]);

  // Sync store view with URL
  useEffect(() => {
    setView(view);
  }, [view, setView]);

  const handleEntryAdded = (entry: HealthEntry) => {
    addEntry(entry);
  };

  const handleWearableSync = (data: WearableDataPoint[]) => {
    mergeWearableData(data);
  };

  const NavButton = ({
    targetView,
    icon: Icon,
    label,
  }: {
    targetView: View;
    icon: LucideIcon;
    label: string;
  }) => (
    <NavLink
      to={viewToPath[targetView]}
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isActive
            ? "bg-teal-50 text-teal-700 font-medium dark:bg-teal-900/20 dark:text-teal-300"
            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100">
      {/* Top Header (Branding & Sync) */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="w-8"></div> {/* Spacer */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-teal-200 shadow-lg">
            M
          </div>
          <span className="font-bold text-slate-800 tracking-tight">
            MAEPLE
          </span>
        </div>
        <SyncIndicator />
      </div>

      {/* Sidebar Navigation REMOVED for Mobile-First Desktop Experience */}
      {/* 
         Previous sidebar code removed to simplify desktop view.
         We now use the bottom navigation on all devices.
      */}

      {/* Mobile Menu Drawer (triggered by bottom nav menu button) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col print:hidden ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="p-8 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-teal-100 text-lg">
            M
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">
            MAEPLE
          </span>
        </div>

        <nav className="px-4 space-y-1.5 mt-4 flex-1 overflow-y-auto no-scrollbar">
          <div className="px-4 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Navigation
          </div>

          <NavButton
            targetView={View.JOURNAL}
            icon={BookHeart}
            label="Smart Journal"
          />
          <NavButton
            targetView={View.DASHBOARD}
            icon={LayoutDashboard}
            label="Pattern Dashboard"
          />
          <NavButton
            targetView={View.BIO_MIRROR}
            icon={Camera}
            label="Bio-Mirror (State Check)"
          />
          <NavButton
            targetView={View.LIVE_COACH}
            icon={MessagesSquare}
            label="Mae Live"
          />
          <NavButton
            targetView={View.VISION}
            icon={ImageIcon}
            label="Visual Therapy"
          />
          <NavButton
            targetView={View.CLINICAL}
            icon={FileText}
            label="Clinical Report"
          />
          <NavButton
            targetView={View.GUIDE}
            icon={Compass}
            label="Guide & Vision"
          />

          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="md:hidden px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tools & Settings
            </div>
            <NavButton
              targetView={View.SEARCH}
              icon={SearchIcon}
              label="Resources"
            />
            <NavButton
              targetView={View.ROADMAP}
              icon={Map}
              label="Future Roadmap"
            />
            <NavButton
              targetView={View.SETTINGS}
              icon={SettingsIcon}
              label="Settings"
            />
            <NavButton
              targetView={View.TERMS}
              icon={ShieldCheck}
              label="Terms & Legal"
            />
          </div>
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
            <h4 className="font-bold text-indigo-900 text-sm mb-1">
              Powered by Poziverse
            </h4>
            <p className="text-xs text-indigo-600/80 leading-relaxed">
              Context-aware intelligence for neurodivergent minds.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 p-4 md:p-8 overflow-y-auto h-auto scroll-smooth print:h-auto print:overflow-visible pb-24"
      >
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          <header className="mb-4 md:mb-8 print:hidden">
            <div className="flex justify-between items-start">
              <div>
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
                  {view === View.DASHBOARD &&
                    `Tracking ${entries.length} patterns. Identifying gaps between capacity and demand.`}
                  {view === View.JOURNAL &&
                    "Capture your context. Track spoons, sensory load, and flow states."}
                  {view === View.BIO_MIRROR &&
                    "Objectively analyze your physical signs of stress and masking."}
                  {view === View.LIVE_COACH &&
                    "Real-time, voice-first reflection with Mae, your neuro-affirming companion."}
                  {view === View.VISION &&
                    "Visualize your state of mind with generative art."}
                  {view === View.SEARCH &&
                    "Grounded knowledge base for health queries."}
                  {view === View.SETTINGS &&
                    "Configure your biological context and wearable integrations."}
                  {view === View.GUIDE && "Understanding the MAEPLE method."}
                  {view === View.TERMS &&
                    "Legal information and privacy policy."}
                  {view === View.ROADMAP &&
                    "The evolution of MAEPLE to transform tracking."}
                  {view === View.CLINICAL &&
                    "Generate professional reports for your healthcare team."}
                </p>
              </div>
              <SyncIndicator className="hidden md:flex mt-2" />
            </div>
          </header>

          <div className="animate-fadeIn">
            <Routes>
              <Route path="/" element={<Navigate to="/journal" replace />} />
              <Route path="/journal" element={<JournalView />} />
              <Route
                path="/dashboard"
                element={
                  <Suspense
                    fallback={
                      <div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
                    }
                  >
                    <HealthMetricsDashboard
                      entries={entries}
                      wearableData={wearableData}
                    />
                  </Suspense>
                }
              />
              <Route
                path="/bio-mirror"
                element={
                  <Suspense
                    fallback={
                      <div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
                    }
                  >
                    <StateCheckWizard />
                  </Suspense>
                }
              />
              <Route
                path="/coach"
                element={
                  <Suspense
                    fallback={
                      <div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
                    }
                  >
                    <LiveCoach />
                  </Suspense>
                }
              />
              <Route
                path="/vision"
                element={
                  <Suspense
                    fallback={
                      <div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
                    }
                  >
                    <VisionBoard />
                  </Suspense>
                }
              />
              <Route path="/resources" element={<SearchResources />} />
              <Route
                path="/settings"
                element={
                  <Suspense
                    fallback={
                      <div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
                    }
                  >
                    <Settings onDataSynced={handleWearableSync} />
                  </Suspense>
                }
              />
              <Route path="/guide" element={<Guide />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route
                path="/clinical"
                element={
                  <Suspense
                    fallback={
                      <div className="animate-pulse bg-slate-200 h-64 rounded-lg"></div>
                    }
                  >
                    <ClinicalReport
                      entries={entries}
                      wearableData={wearableData}
                    />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to="/journal" replace />} />
            </Routes>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={view}
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
      {showOnboarding && <OnboardingWizard onComplete={completeOnboarding} />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
