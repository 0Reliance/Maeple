import {
  BookHeart,
  Camera,
  LayoutDashboard,
  LucideIcon,
  Menu,
  MessagesSquare,
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";
import { viewToPath } from "../routes";
import { View } from "../types";

interface Props {
  currentView: View;
}

const MobileNav: React.FC<Props> = ({
  currentView,
}) => {
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

  return (
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
        <NavItem view={View.BIO_MIRROR} icon={Camera} label="Reflect" />

        {/* Central Action Button */}
        <NavItem
          view={View.JOURNAL}
          icon={BookHeart}
          label="Capture"
          isAction
        />

        <NavItem view={View.LIVE_COACH} icon={MessagesSquare} label="Guide" />
        <NavItem view={View.SETTINGS} icon={Menu} label="Menu" />
      </div>
    </div>
  );
};

export default MobileNav;
