// Comprehensive mock data repository for frontend design preview

export const mockUsers = [
  {
    id: 1,
    username: 'demo_user',
    email: 'designer@demo.com',
    full_name: 'UI/UX Designer',
    role: 'admin',
    avatar: 'avatar1.png',
    status: 'active',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 2,
    username: 'alex_m',
    email: 'alex@demo.com',
    full_name: 'Alex Morgan',
    role: 'user',
    avatar: 'avatar2.png',
    status: 'active',
    created_at: '2026-01-15T14:30:00Z',
  },
  {
    id: 3,
    username: 'sarah_c',
    email: 'sarah@demo.com',
    full_name: 'Sarah Connor',
    role: 'user',
    avatar: 'avatar3.png',
    status: 'active',
    created_at: '2026-02-01T09:15:00Z',
  },
];

export const mockTasks = [
  {
    id: 'task-1',
    title: 'Redesign Navigation Bar',
    description: 'Implement dark mode glassmorphism navbar for desktop and mobile layouts.',
    status: 'in_progress',
    category: 'Design System',
    assignee: 'UI/UX Designer',
    dueDate: '2026-08-20',
  },
  {
    id: 'task-2',
    title: 'Audit Contrast Accessibility',
    description: 'Ensure color contrast meets WCAG 2.1 AA standards across all panels.',
    status: 'todo',
    category: 'Accessibility',
    assignee: 'Alex Morgan',
    dueDate: '2026-08-25',
  },
  {
    id: 'task-3',
    title: 'Create Dashboard Micro-animations',
    description: 'Add subtle hover transitions and chart entry animations.',
    status: 'completed',
    category: 'Interactions',
    assignee: 'Sarah Connor',
    dueDate: '2026-08-12',
  },
];

export const mockAnalytics = {
  totalUsers: 12480,
  activeCampaigns: 42,
  conversionRate: '18.4%',
  revenueMonth: '$48,250',
  chartData: [
    { month: 'Jan', sales: 4000, users: 2400 },
    { month: 'Feb', sales: 3000, users: 1398 },
    { month: 'Mar', sales: 2000, users: 9800 },
    { month: 'Apr', sales: 2780, users: 3908 },
    { month: 'May', sales: 1890, users: 4800 },
    { month: 'Jun', sales: 2390, users: 3800 },
    { month: 'Jul', sales: 3490, users: 4300 },
  ],
};

export const mockPromptTemplates = [
  {
    id: 'tpl-1',
    name: 'Customer Support Assistant',
    description: 'Empathetic response generator for inbound customer support inquiries.',
    category: 'Support',
    template: 'Hello {name}, thank you for reaching out. I would be happy to help you with {issue}.',
  },
  {
    id: 'tpl-2',
    name: 'Product Feature Pitch',
    description: 'Generate concise value-props for new product features.',
    category: 'Marketing',
    template: 'Introducing {feature}! Designed to give you {benefit} with zero setup time.',
  },
];
