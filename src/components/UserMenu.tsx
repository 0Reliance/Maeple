import {
  BookOpen,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  LogOut,
  Search,
  Settings,
  Shield,
  User,
  Terminal
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { viewToPath } from '../routes';
import { useAuthStore } from '../stores';
import { View } from '../types';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/'); // Redirect to landing/login
  };

  const MenuItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
          isActive 
            ? 'bg-primary/10 text-primary font-medium dark:bg-primary/20 dark:text-primary-light' 
            : 'text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary'
        }`
      }
      onClick={() => setIsOpen(false)}
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors border border-transparent hover:border-bg-secondary dark:hover:border-dark-bg-secondary"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent-action rounded-full flex items-center justify-center text-white font-bold shadow-sm">
          {user?.email?.[0].toUpperCase() || <User size={16} />}
        </div>
        <ChevronDown size={14} className={`text-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-bg-card dark:bg-dark-bg-card rounded-xl shadow-card-hover border border-bg-secondary dark:border-dark-bg-secondary py-2 z-50 animate-fadeIn origin-top-right">
          <div className="px-4 py-2 border-b border-bg-secondary dark:border-dark-bg-secondary mb-1">
            <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary">Account</p>
            <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary truncate">{user?.email}</p>
          </div>

          <div className="py-1">
            <MenuItem to={viewToPath[View.SETTINGS]} icon={Settings} label="Settings" />
          </div>
          
          <div className="border-t border-bg-secondary dark:border-dark-bg-secondary my-1"></div>
          
          <div className="py-1">
            <MenuItem to={viewToPath[View.SEARCH]} icon={Search} label="Wellness Assistant" />
            <MenuItem to={viewToPath[View.GUIDE]} icon={BookOpen} label="Guide" />
            <MenuItem to={viewToPath[View.TERMS]} icon={Shield} label="Terms & Legal" />
            <MenuItem to={viewToPath[View.BETA_DASHBOARD]} icon={Terminal} label="Beta Dashboard" />
          </div>

          <div className="border-t border-bg-secondary dark:border-dark-bg-secondary mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-alert dark:text-accent-alert hover:bg-accent-alert/10 dark:hover:bg-accent-alert/20 transition-colors text-left"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
