import {
  BookHeart,
  Camera,
  Compass,
  Download,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LucideIcon,
  MessagesSquare
} from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AuthModal from "./components/AuthModal";
import Guide from "./components/Guide";
import JournalView from "./components/JournalView";
import LandingPage from "./components/LandingPage";
import MobileNav from "./components/MobileNav";
import OnboardingWizard from "./components/OnboardingWizard";
import Roadmap from "./components/Roadmap";
import SearchResources from "./components/SearchResources";
import SyncIndicator from "./components/SyncIndicator";
import Terms from "./components/Terms";
import { usePWAInstall } from "./hooks/usePWAInstall";

import { Github } from "lucide-react";
import UserMenu from "./components/UserMenu";

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

import { pathToView, viewToPath } from "./routes";
import { initBackgroundSync } from "./services/backgroundSync";
import { initNotificationService } from "./services/notificationService";
import { HealthEntry, View, WearableDataPoint } from "./types";

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

  const { initializeAuth, isAuthenticated, isInitialized } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isInstallable, install } = usePWAInstall();

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

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary dark:bg-dark-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onLogin={() => setIsAuthModalOpen(true)}
          onRegister={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

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
            ? "bg-primary/10 text-primary font-medium dark:bg-primary/20 dark:text-primary-light"
            : "text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary hover:text-text-primary dark:hover:text-dark-text-primary"
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-dark-bg-primary flex flex-col font-sans text-text-primary dark:text-dark-text-primary">
      {/* Top Header (Branding & Sync) */}
      <div className="bg-bg-card/90 dark:bg-dark-bg-card/90 backdrop-blur-md border-b border-bg-secondary dark:border-dark-bg-secondary p-4 flex justify-between items-center sticky top-0 z-30 shadow-card">
        <div className="w-8"></div> {/* Spacer */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent-action rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
            M
          </div>
          <span className="font-bold text-text-primary dark:text-dark-text-primary tracking-tight">
            MAEPLE <span className="text-xs text-primary font-normal">v0.95</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isInstallable && (
            <button
              onClick={install}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-positive/10 dark:bg-accent-positive/20 text-accent-positive dark:text-accent-positive rounded-lg text-sm font-medium hover:bg-accent-positive/20 dark:hover:bg-accent-positive/30 transition-colors"
            >
              <Download size={16} />
              <span>Install App</span>
            </button>
          )}
          <SyncIndicator />
          <UserMenu />
        </div>
      </div>

      {/* Sidebar Navigation REMOVED for Mobile-First Desktop Experience */}
      {/* 
         Previous sidebar code removed to simplify desktop view.
         We now use the bottom navigation on all devices.
      */}

      {/* Mobile Menu Drawer (triggered by bottom nav menu button) */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-72 bg-bg-card dark:bg-dark-bg-card border-r border-bg-secondary dark:border-dark-bg-secondary transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col print:hidden ${
          mobileMenuOpen ? "translate-x-0 shadow-card-hover" : "-translate-x-full"
        }`}
      >
        <div className="p-8 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent-action rounded-xl flex items-center justify-center text-white font-bold shadow-lg text-lg">
            M
          </div>
          <span className="text-2xl font-bold text-text-primary dark:text-dark-text-primary tracking-tight">
            MAEPLE
          </span>
        </div>

        <nav className="px-4 space-y-1.5 mt-4 flex-1 overflow-y-auto no-scrollbar">
          <div className="px-4 mb-4 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Navigation
          </div>

          <NavButton
            targetView={View.JOURNAL}
            icon={BookHeart}
            label="Thoughtful Journal"
          />
          <NavButton
            targetView={View.DASHBOARD}
            icon={LayoutDashboard}
            label="Pattern Dashboard"
          />
          <NavButton
            targetView={View.BIO_MIRROR}
            icon={Camera}
            label="Self-Reflection"
          />
          <NavButton
            targetView={View.LIVE_COACH}
            icon={MessagesSquare}
            label="Gentle Guidance"
          />
          <NavButton
            targetView={View.VISION}
            icon={ImageIcon}
            label="Vision Board"
          />
          <NavButton
            targetView={View.CLINICAL}
            icon={FileText}
            label="Clinical Report"
          />
          <NavButton
            targetView={View.GUIDE}
            icon={Compass}
            label="Guide"
          />
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-r from-primary/10 to-accent-positive/10 dark:from-primary/20 dark:to-accent-positive/20 rounded-2xl p-5 border border-primary/20 dark:border-primary/30 mb-4">
            <h4 className="font-bold text-primary dark:text-primary-light text-sm mb-1">
              Powered by Poziverse
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Understand your patterns to live a healthier life.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-3">
             <a href="https://github.com/poziverse/maeple" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-secondary dark:hover:text-dark-text-secondary transition-colors">
                <Github size={20} />
             </a>
             <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                PART OF THE POZIVERSE
             </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 p-4 md:p-8 overflow-y-auto h-auto scroll-smooth print:h-auto print:overflow-visible pb-24"
      >
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          
          <div className="animate-fadeIn">
            <Routes>
              <Route path="/" element={<Navigate to="/journal" replace />} />
              <Route path="/journal" element={<JournalView />} />
              <Route
                path="/dashboard"
                element={
                  <Suspense
                    fallback={
                      <div className="animate-pulse bg-bg-secondary h-64 rounded-card"></div>
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
                      <div className="animate-pulse bg-bg-secondary h-64 rounded-card"></div>
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
                      <div className="animate-pulse bg-bg-secondary h-64 rounded-card"></div>
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
                      <div className="animate-pulse bg-bg-secondary h-64 rounded-card"></div>
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
                      <div className="animate-pulse bg-bg-secondary h-64 rounded-card"></div>
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
                      <div className="animate-pulse bg-bg-secondary h-64 rounded-card"></div>
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
          className="fixed inset-0 bg-dark-bg-primary/20 backdrop-blur-sm z-50 md:hidden print:hidden"
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
