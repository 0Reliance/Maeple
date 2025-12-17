import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  User, 
  BookOpen, 
  Map, 
  Shield, 
  Search,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../stores';
import { View } from '../types';
import { viewToPath } from '../routes';

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
            ? 'bg-teal-50 text-teal-700 font-medium dark:bg-teal-900/20 dark:text-teal-300' 
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
        className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
          {user?.email?.[0].toUpperCase() || <User size={16} />}
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fadeIn origin-top-right">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{user?.email}</p>
          </div>

          <div className="py-1">
            <MenuItem to={viewToPath[View.SETTINGS]} icon={Settings} label="Settings" />
            <MenuItem to={viewToPath[View.SEARCH]} icon={Search} label="Resources" />
            <MenuItem to={viewToPath[View.GUIDE]} icon={BookOpen} label="Guide & Vision" />
            <MenuItem to={viewToPath[View.ROADMAP]} icon={Map} label="Roadmap" />
            <MenuItem to={viewToPath[View.TERMS]} icon={Shield} label="Terms & Legal" />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-left"
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
