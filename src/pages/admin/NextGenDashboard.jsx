import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Command, 
  Search, 
  Settings, 
  Bell, 
  User, 
  Menu, 
  X,
  BarChart3,
  Users,
  Zap,
  Shield,
  Palette,
  MessageSquare,
  FileText,
  Grid,
  Layout,
  Sparkles
} from 'lucide-react';

// Import all our advanced components
import CommandPalette from '../../components/ui/CommandPalette';
import GlassmorphismCard from '../../components/ui/GlassmorphismCard';
import NeumorphicCard from '../../components/ui/NeumorphicCard';
import TiltCard from '../../components/ui/TiltCard';
import AnimatedGrid from '../../components/ui/AnimatedGrid';
import SplitPane from '../../components/ui/SplitPane';

import AnimatedChart from '../../components/charts/AnimatedChart';
import Heatmap from '../../components/charts/Heatmap';
import KanbanBoard from '../../components/kanban/KanbanBoard';

import AIAutocomplete from '../../components/ai/AIAutocomplete';
import ChatInterface from '../../components/ai/ChatInterface';
import MarkdownEditor from '../../components/editor/MarkdownEditor';

import PricingTable from '../../components/saas/PricingTable';
import OnboardingTour from '../../components/saas/OnboardingTour';
import ThemeGenerator from '../../components/saas/ThemeGenerator';

import OptimisticUI from '../../components/future/OptimisticUI';
import CollaborativeEditor from '../../components/future/CollaborativeEditor';

const NextGenDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [theme, setTheme] = useState('light');
  const [isOnline, setIsOnline] = useState(true);

  // Sample data for charts and components
  const chartData = [
    { name: 'Jan', value: 400, users: 240, revenue: 2400 },
    { name: 'Feb', value: 300, users: 139, revenue: 2210 },
    { name: 'Mar', value: 200, users: 980, revenue: 2290 },
    { name: 'Apr', value: 278, users: 390, revenue: 2000 },
    { name: 'May', value: 189, users: 480, revenue: 2181 },
    { name: 'Jun', value: 239, users: 380, revenue: 2500 },
  ];

  const heatmapData = [
    { x: 'Mon', y: 'Morning', value: 65 },
    { x: 'Mon', y: 'Afternoon', value: 45 },
    { x: 'Mon', y: 'Evening', value: 30 },
    { x: 'Tue', y: 'Morning', value: 80 },
    { x: 'Tue', y: 'Afternoon', value: 70 },
    { x: 'Tue', y: 'Evening', value: 55 },
    { x: 'Wed', y: 'Morning', value: 90 },
    { x: 'Wed', y: 'Afternoon', value: 85 },
    { x: 'Wed', y: 'Evening', value: 75 },
  ];

  const kanbanData = [
    {
      id: 'todo',
      title: 'To Do',
      cards: [
        { id: '1', title: 'Design new dashboard', description: 'Create wireframes and mockups', priority: 'high', assignee: 'Alice', dueDate: '2024-01-15', tags: ['design', 'ui'] },
        { id: '2', title: 'Implement API', description: 'Build REST endpoints', priority: 'medium', assignee: 'Bob', dueDate: '2024-01-20', tags: ['backend', 'api'] },
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      cards: [
        { id: '3', title: 'Database migration', description: 'Update schema for new features', priority: 'high', assignee: 'Carol', dueDate: '2024-01-18', tags: ['database', 'migration'] },
      ]
    },
    {
      id: 'done',
      title: 'Done',
      cards: [
        { id: '4', title: 'Setup CI/CD', description: 'Configure automated deployment', priority: 'low', assignee: 'Dave', dueDate: '2024-01-10', tags: ['devops', 'ci-cd'] },
      ]
    }
  ];

  const pricingPlans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individuals and small teams',
      monthlyPrice: 9,
      yearlyPrice: 90,
      features: [
        { text: 'Up to 5 projects', included: true },
        { text: '10GB storage', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Email support', included: true },
        { text: 'Advanced features', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Best for growing businesses',
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        { text: 'Unlimited projects', included: true },
        { text: '100GB storage', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority support', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'API access', included: true },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Unlimited storage', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'SSO & security', included: true },
        { text: 'Custom branding', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const tourSteps = [
    {
      type: 'welcome',
      title: 'Welcome to NextGen Dashboard',
      description: 'This is your new AI-powered dashboard with cutting-edge features and modern UI components.',
      features: ['Glassmorphism effects', 'Neumorphic design', '3D interactions', 'AI-powered tools'],
    },
    {
      type: 'features',
      title: 'Advanced Features',
      description: 'Explore our comprehensive set of modern UI components and data visualization tools.',
      features: ['Interactive charts', 'Kanban boards', 'Real-time collaboration', 'Command palette'],
    },
    {
      type: 'ai',
      title: 'AI Integration',
      description: 'Leverage AI-powered tools for enhanced productivity and intelligent automation.',
      features: ['Smart autocomplete', 'AI chat interface', 'Intelligent suggestions', 'Automated insights'],
    },
  ];

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Grid },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'ai-tools', label: 'AI Tools', icon: Zap },
    { id: 'design', label: 'Design System', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
              <div className="relative p-8 text-white">
                <h1 className="text-4xl font-bold mb-4">NextGen Dashboard</h1>
                <p className="text-xl opacity-90 mb-6">
                  Experience the future of web applications with cutting-edge UI components and AI integration.
                </p>
                <div className="flex items-center space-x-4">
                  <OptimisticUI.ConnectionStatus isOnline={isOnline} />
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>AI-Powered</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <AnimatedGrid columns={4} gap={6}>
              <GlassmorphismCard intensity="medium" className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">1,234</div>
                <div className="text-gray-600 dark:text-gray-400">Active Users</div>
              </GlassmorphismCard>
              <GlassmorphismCard intensity="medium" className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">98.5%</div>
                <div className="text-gray-600 dark:text-gray-400">Uptime</div>
              </GlassmorphismCard>
              <GlassmorphismCard intensity="medium" className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">$12.5K</div>
                <div className="text-gray-600 dark:text-gray-400">Revenue</div>
              </GlassmorphismCard>
              <GlassmorphismCard intensity="medium" className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">45</div>
                <div className="text-gray-600 dark:text-gray-400">Projects</div>
              </GlassmorphismCard>
            </AnimatedGrid>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassmorphismCard>
                <h3 className="text-lg font-semibold mb-4">Revenue Analytics</h3>
                <AnimatedChart type="line" data={chartData} height={300} />
              </GlassmorphismCard>
              <GlassmorphismCard>
                <h3 className="text-lg font-semibold mb-4">User Activity Heatmap</h3>
                <Heatmap data={heatmapData} height={300} />
              </GlassmorphismCard>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AnimatedChart type="bar" data={chartData} height={400} />
              <AnimatedChart type="area" data={chartData} height={400} />
              <AnimatedChart type="pie" data={[
                { name: 'Desktop', value: 400 },
                { name: 'Mobile', value: 300 },
                { name: 'Tablet', value: 200 },
              ]} height={400} />
            </div>
          </div>
        );

      case 'collaboration':
        return (
          <div className="h-full">
            <SplitPane direction="horizontal" defaultSize={400}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Project Board</h3>
                <KanbanBoard 
                  initialColumns={kanbanData}
                  onUpdateColumns={(columns) => console.log('Updated columns:', columns)}
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Collaborative Editor</h3>
                <CollaborativeEditor
                  documentId="demo-doc"
                  initialContent="# Collaborative Document\n\nThis is a real-time collaborative editor. Multiple users can edit simultaneously with live cursors and presence indicators.\n\nTry typing something!"
                  onContentChange={(content) => console.log('Content changed:', content)}
                  onSave={(content) => console.log('Saving:', content)}
                />
              </div>
            </SplitPane>
          </div>
        );

      case 'ai-tools':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassmorphismCard>
                <h3 className="text-lg font-semibold mb-4">AI Chat Assistant</h3>
                <ChatInterface
                  messages={[
                    {
                      id: 1,
                      text: "Hello! I'm your AI assistant. How can I help you today?",
                      isUser: false,
                      timestamp: "10:30 AM"
                    }
                  ]}
                  onSendMessage={(message) => console.log('New message:', message)}
                  onRegenerateMessage={(id) => console.log('Regenerate:', id)}
                  onFeedback={(id, type) => console.log('Feedback:', id, type)}
                />
              </GlassmorphismCard>
              <GlassmorphismCard>
                <h3 className="text-lg font-semibold mb-4">Smart Autocomplete</h3>
                <div className="space-y-4">
                  <AIAutocomplete
                    placeholder="Ask AI anything..."
                    suggestions={[
                      { id: 1, text: 'Create a new project', description: 'Start a new project with AI assistance', type: 'ai' },
                      { id: 2, text: 'Generate report', description: 'Generate analytics report', type: 'ai' },
                      { id: 3, text: 'Schedule meeting', description: 'Schedule team meeting', type: 'recent' },
                    ]}
                    onSelect={(suggestion) => console.log('Selected:', suggestion)}
                    onSearch={(query) => console.log('Searching:', query)}
                  />
                </div>
              </GlassmorphismCard>
            </div>
            <GlassmorphismCard>
              <h3 className="text-lg font-semibold mb-4">Markdown Editor</h3>
              <MarkdownEditor
                value="# AI-Powered Markdown Editor\n\nThis editor supports **bold**, *italic*, and `code` formatting.\n\n- Lists\n- Tables\n- Code blocks\n\n```javascript\nconst hello = 'world';\nconsole.log(hello);\n```"
                onChange={(content) => console.log('Content changed:', content)}
                onSave={(content) => console.log('Saving:', content)}
                showPreview={true}
                autoSave={true}
              />
            </GlassmorphismCard>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-6">
            <ThemeGenerator
              onThemeChange={(theme) => console.log('Theme changed:', theme)}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassmorphismCard>
                <h3 className="text-lg font-semibold mb-4">Pricing Plans</h3>
                <PricingTable
                  plans={pricingPlans}
                  onPlanSelect={(plan) => console.log('Plan selected:', plan)}
                  onBillingChange={(billing) => console.log('Billing changed:', billing)}
                />
              </GlassmorphismCard>
              <GlassmorphismCard>
                <h3 className="text-lg font-semibold mb-4">Onboarding Tour</h3>
                <OnboardingTour
                  steps={tourSteps}
                  onComplete={() => console.log('Tour completed')}
                  onSkip={() => console.log('Tour skipped')}
                />
              </GlassmorphismCard>
            </div>
          </div>
        );

      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        initial={{ x: -256 }}
        animate={{ x: sidebarOpen ? 0 : -256 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">NextGen</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <AIAutocomplete
                placeholder="Search or ask AI..."
                suggestions={[
                  { id: 1, text: 'Show analytics dashboard', type: 'ai' },
                  { id: 2, text: 'Create new project', type: 'ai' },
                  { id: 3, text: 'Generate report', type: 'ai' },
                ]}
                onSelect={(suggestion) => console.log('Selected:', suggestion)}
                className="w-96"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Command Palette (⌘K)"
              >
                <Command className="w-5 h-5" />
              </button>

              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="w-5 h-5" />
              </button>

              <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={[
          {
            id: 'analytics',
            title: 'Open Analytics',
            description: 'View detailed analytics dashboard',
            icon: BarChart3,
            action: () => setActiveView('analytics'),
          },
          {
            id: 'collaboration',
            title: 'Open Collaboration',
            description: 'Access team collaboration tools',
            icon: Users,
            action: () => setActiveView('collaboration'),
          },
          {
            id: 'ai-tools',
            title: 'AI Tools',
            description: 'Open AI-powered tools and assistants',
            icon: Zap,
            action: () => setActiveView('ai-tools'),
          },
          {
            id: 'design',
            title: 'Design System',
            description: 'Access design system and theming tools',
            icon: Palette,
            action: () => setActiveView('design'),
          },
        ]}
      />
    </div>
  );
};

export default NextGenDashboard;
