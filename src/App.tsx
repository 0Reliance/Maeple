import {
  Download,
} from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
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

import { ErrorBoundary } from "./components/ErrorBoundary";
import ToastNotification from "./components/ToastNotification";
import UserMenu from "./components/UserMenu";
import { DependencyProvider } from "./contexts/DependencyContext";
import { ObservationProvider } from "./contexts/ObservationContext";
import { getDependencies } from "./factories/dependencyFactory";

// Lazy load heavy components for better performance
const HealthMetricsDashboard = React.lazy(() => import("./components/HealthMetricsDashboard"));
const LiveCoach = React.lazy(() => import("./components/LiveCoach"));
const VisionBoard = React.lazy(() => import("./components/VisionBoard"));
const StateCheckWizard = React.lazy(() => import("./components/StateCheckWizard"));
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
    showOnboarding,
    setView,
    addEntry,
    mergeWearableData,
    completeOnboarding,
    initializeApp,
  } = useAppStore();

  const { initializeAuth, isAuthenticated, isInitialized } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isInstallable, install } = usePWAInstall();

  // Determine current view from path
  const currentPath = location.pathname === "/" ? "/journal" : location.pathname;
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
            MAEPLE <span className="text-xs text-primary font-normal">v0.97.7</span>
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

      {/* Sidebar Navigation REMOVED - All navigation via bottom bar and UserMenu */}

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
                    <HealthMetricsDashboard entries={entries} wearableData={wearableData} />
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
                    <ClinicalReport entries={entries} wearableData={wearableData} />
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
      />

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard onComplete={completeOnboarding} onSkip={() => setView(view)} />
      )}
    </div>
  );
}

function App() {
  const dependencies = getDependencies();

  return (
    <DependencyProvider dependencies={dependencies}>
      <ObservationProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AppContent />
            <ToastNotification />
          </BrowserRouter>
        </ErrorBoundary>
      </ObservationProvider>
    </DependencyProvider>
  );
}

export default App;
