
import React from 'react';
import { LayoutDashboard, BookHeart, MessagesSquare, Camera, Menu, LucideIcon } from 'lucide-react';
import { View } from '../types';

interface Props {
  currentView: View;
  onNavigate: (view: View) => void;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
}

const MobileNav: React.FC<Props> = ({ currentView, onNavigate, onToggleMenu, isMenuOpen }) => {
  
  const NavItem = ({ view, icon: Icon, label, isAction = false }: { view?: View, icon: LucideIcon, label: string, isAction?: boolean }) => {
    const isActive = view === currentView;
    const isMenuTrigger = !view;
    
    const handleClick = () => {
      if (isMenuTrigger) {
        onToggleMenu();
      } else if (view) {
        onNavigate(view);
      }
    };

    const activeColor = isMenuTrigger && isMenuOpen ? 'text-indigo-600' : isActive ? 'text-teal-600' : 'text-slate-400';

    return (
      <button 
        onClick={handleClick}
        className={`flex flex-col items-center justify-center w-full py-2 transition-colors relative ${activeColor}`}
      >
        {isAction ? (
           <div className={`p-3 rounded-2xl -mt-10 shadow-lg border-4 border-slate-50 ${isActive ? 'bg-teal-600 text-white' : 'bg-slate-900 text-white'}`}>
             <Icon size={24} />
           </div>
        ) : (
           <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        )}
        <span className={`text-[10px] font-medium mt-1 ${isAction ? 'mt-1' : ''}`}>{label}</span>
        
        {isActive && !isAction && (
            <span className="absolute bottom-0 w-8 h-1 bg-teal-600 rounded-t-full"></span>
        )}
      </button>
    );
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
    >
      <div className="flex justify-around items-end h-16 pb-1">
        <NavItem view={View.DASHBOARD} icon={LayoutDashboard} label="Patterns" />
        <NavItem view={View.BIO_MIRROR} icon={Camera} label="Bio-Mirror" />
        
        {/* Central Action Button */}
        <NavItem view={View.JOURNAL} icon={BookHeart} label="Capture" isAction />
        
        <NavItem view={View.LIVE_COACH} icon={MessagesSquare} label="Coach" />
        <NavItem icon={Menu} label="Menu" />
      </div>
    </div>
  );
};

export default MobileNav;
