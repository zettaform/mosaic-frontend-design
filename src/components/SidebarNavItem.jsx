import React from 'react';
import { NavLink } from 'react-router-dom';

const SidebarNavItem = ({ to, label, end = false, icon, isActive }) => {
  return (
    <NavLink
      end={end}
      to={to}
      className={({ isActive: linkIsActive }) =>
        `sidebar-nav-item group flex items-center px-2 py-1.5 rounded-md transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
          linkIsActive || isActive
            ? 'sidebar-nav-item-active bg-black/[0.04] text-slate-900 dark:bg-white/[0.06] dark:text-white'
            : 'text-slate-500 hover:bg-black/[0.02] hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/[0.03] dark:hover:text-slate-200'
        }`
      }
    >
      {icon}
      <span className="text-[13px] font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 truncate tracking-tight">
        {label}
      </span>
    </NavLink>
  );
};

export default SidebarNavItem;