// Navigation configuration for the sidebar
// This consolidates all navigation items into a data-driven structure

export const sidebarNavigation = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    section: 'Dashboard',
    items: [
      {
        id: 'dashboard-main',
        route: '/dashboard',
        label: 'Main',
        page: 'Main',
        end: true,
        icon: (
          <svg className="shrink-0 h-5 w-5 mr-3" viewBox="0 0 24 24">
            <path
              className="fill-current"
              d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0z"
            />
            <path
              className="fill-current text-slate-600"
              d="M12 3c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9z"
            />
            <path
              className="fill-current text-slate-400"
              d="M12 15c-1.654 0-3-1.346-3-3 0-.462.113-.894.3-1.285L6 6l4.714 3.301A2.973 2.973 0 0112 9c1.654 0 3 1.346 3 3s-1.346 3-3 3z"
            />
          </svg>
        )
      },
      {
        id: 'dashboard-analytics',
        route: '/dashboard/analytics',
        label: 'Analytics',
        page: 'Analytics',
        end: true,
        icon: (
          <svg className="shrink-0 h-5 w-5 mr-3" viewBox="0 0 24 24">
            <path
              className="fill-current"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
            />
            <path
              className="fill-current text-slate-600"
              d="M13 7h-2v6h6v-2h-4V7z"
            />
            <rect
              className="fill-current text-slate-400"
              x="6"
              y="4"
              width="12"
              height="2"
            />
            <rect
              className="fill-current text-slate-400"
              x="6"
              y="8"
              width="8"
              height="2"
            />
            <rect
              className="fill-current text-slate-400"
              x="6"
              y="12"
              width="10"
              height="2"
            />
            <rect
              className="fill-current text-slate-400"
              x="6"
              y="16"
              width="6"
              height="2"
            />
          </svg>
        )
      },
      {
        id: 'dashboard-fintech',
        route: '/dashboard/fintech',
        label: 'Fintech',
        page: 'Fintech',
        end: true,
        icon: (
          <svg className="shrink-0 h-5 w-5 mr-3" viewBox="0 0 24 24">
            <path
              className="fill-current"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
            />
            <path
              className="fill-current text-slate-600"
              d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
            />
            <path
              className="fill-current text-slate-400"
              d="M7 18c0-2.21 1.79-4 4-4s4 1.79 4 4H7z"
            />
            <rect
              className="fill-current text-slate-400"
              x="10"
              y="10"
              width="4"
              height="6"
            />
          </svg>
        )
      }
    ]
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    section: 'Ecommerce',
    items: [
      {
        id: 'ecommerce-users',
        route: '/ecommerce/users',
        label: 'Users',
        page: 'Users',
        end: false,
        icon: (
          <svg className="shrink-0 h-5 w-5 mr-3" viewBox="0 0 24 24">
            <path
              className="fill-current"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
            />
            <path
              className="fill-current text-slate-600"
              d="M12 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
            />
            <path
              className="fill-current text-slate-400"
              d="M7 18c0-2.21 1.79-4 4-4s4 1.79 4 4H7z"
            />
          </svg>
        )
      }
    ]
  }
  // TODO: Add more sections here (Design, Crypto, Settings, etc.)
];

// Helper function to get navigation sections that user has access to
export const getAccessibleSections = (canAccessSection, canAccessRoute) => {
  return sidebarNavigation.filter(section =>
    section.items.some(item => canAccessRoute(section.section, item.page))
  );
};