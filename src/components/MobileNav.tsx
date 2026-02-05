import {
  BookHeart,
  Camera,
  LayoutDashboard,
  LucideIcon,
  MessagesSquare,
  User,
  Settings,
  FileText,
  Search,
  BookOpen,
  Shield,
  Terminal,
  LogOut,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { viewToPath } from "../routes";
import { useAuthStore } from "../stores";
import { View } from "../types";

interface Props {
  currentView: View;
}

const MobileNav: React.FC<Props> = ({
  currentView,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const NavItem = ({
    view,
    icon: Icon,
    label,
    isAction = false,
  }: {
    view: View;
    icon: LucideIcon;
    label: string;
    isAction?: boolean;
  }) => {
    const renderContent = (isActive: boolean) => (
      <>
        {isAction ? (
          <div
            className={`p-3 rounded-2xl -mt-10 shadow-lg border-4 border-bg-primary dark:border-dark-bg-primary ${
              isActive
                ? "bg-primary text-white"
                : "bg-slate-900 dark:bg-dark-bg-secondary text-white"
            }`}
          >
            <Icon size={24} />
          </div>
        ) : (
          <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        )}
        <span
          className={`text-[10px] font-medium mt-1 ${isAction ? "mt-1" : ""}`}
        >
          {label}
        </span>

        {isActive && !isAction && (
          <span className="absolute bottom-0 w-8 h-1 bg-primary dark:bg-primary-light rounded-t-full"></span>
        )}
      </>
    );

    return (
      <NavLink
        to={viewToPath[view]}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-full py-2 transition-colors relative ${
            isActive
              ? "text-primary dark:text-primary-light"
              : "text-text-tertiary dark:text-dark-text-secondary"
          }`
        }
      >
        {({ isActive }) => renderContent(isActive)}
      </NavLink>
    );
  };

  const UserMenuItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
          isActive 
            ? 'bg-primary/10 text-primary font-medium dark:bg-primary/20 dark:text-primary-light' 
            : 'text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary'
        }`
      }
      onClick={() => setIsUserMenuOpen(false)}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 bg-bg-card dark:bg-dark-bg-card border-t border-bg-secondary dark:border-dark-bg-secondary shadow-card z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        <div className="flex justify-around items-end h-16 pb-1 max-w-md mx-auto md:max-w-2xl">
          <NavItem
            view={View.DASHBOARD}
            icon={LayoutDashboard}
            label="Patterns"
          />
          <NavItem view={View.BIO_MIRROR} icon={Camera} label="Snap" isAction />

          {/* Central Action Button */}
          <NavItem
            view={View.JOURNAL}
            icon={BookHeart}
            label="Capture"
            isAction
          />

          <NavItem view={View.LIVE_COACH} icon={MessagesSquare} label="Journal" isAction />

          {/* User Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex flex-col items-center justify-center w-full py-2 transition-colors relative ${
                isUserMenuOpen
                  ? "text-primary dark:text-primary-light"
                  : "text-text-tertiary dark:text-dark-text-secondary"
              }`}
            >
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm transition-colors ${
                  isUserMenuOpen 
                    ? "bg-primary" 
                    : "bg-gradient-to-br from-primary to-accent-action"
                }`}
              >
                {user?.email?.[0].toUpperCase() || <User size={14} />}
              </div>
              <span className="text-[10px] font-medium mt-1">
                {user?.email?.split('@')[0] || "Menu"}
              </span>
              {isUserMenuOpen && (
                <span className="absolute bottom-0 w-8 h-1 bg-primary dark:bg-primary-light rounded-t-full"></span>
              )}
            </button>

            {/* User Menu Dropdown - positioned above the nav bar */}
            {isUserMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-56 bg-bg-card dark:bg-dark-bg-card rounded-xl shadow-card-hover border border-bg-secondary dark:border-dark-bg-secondary py-2 z-50 animate-fadeIn origin-bottom-right">
                <div className="px-4 py-2 border-b border-bg-secondary dark:border-dark-bg-secondary mb-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Account</p>
                  <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <UserMenuItem to={viewToPath[View.SETTINGS]} icon={Settings} label="Settings" />
                  <UserMenuItem to={viewToPath[View.CLINICAL]} icon={FileText} label="MAEPLE Report" />
                </div>
                
                <div className="border-t border-bg-secondary dark:border-dark-bg-secondary my-1"></div>
                
                <div className="py-1">
                  <UserMenuItem to={viewToPath[View.SEARCH]} icon={Search} label="Wellness Assistant" />
                  <UserMenuItem to={viewToPath[View.GUIDE]} icon={BookOpen} label="Guide & Vision" />
                  <UserMenuItem to={viewToPath[View.TERMS]} icon={Shield} label="Terms & Legal" />
                  <UserMenuItem to={viewToPath[View.BETA_DASHBOARD]} icon={Terminal} label="Beta Dashboard" />
                </div>

                <div className="border-t border-bg-secondary dark:border-dark-bg-secondary mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-accent-alert dark:text-accent-alert hover:bg-accent-alert/10 dark:hover:bg-accent-alert/20 transition-colors text-left"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for closing menu */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </>
  );
};

export default MobileNav;
