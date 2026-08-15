import React from 'react';
import SidebarNavItem from './SidebarNavItem';

const SidebarSection = ({ title, items, canAccessRoute, section }) => {
  // Only render if user has access to at least one item in this section
  const accessibleItems = items.filter(item => canAccessRoute(section, item.page));

  if (accessibleItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="text-[11px] font-medium text-slate-400/80 dark:text-slate-500/90 uppercase tracking-[0.04em] mb-2 px-2 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 truncate">
        {title}
      </div>

      {/* Section Items */}
      <div className="space-y-0.5">
        {accessibleItems.map(item => (
          <SidebarNavItem
            key={item.id}
            to={item.route}
            label={item.label}
            end={item.end}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default SidebarSection;