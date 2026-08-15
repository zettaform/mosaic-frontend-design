import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import whatsappService from '../../services/whatsappService';
import { toast } from 'react-hot-toast';

function WhatsAppDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    templates: 0,
    contacts: 0,
    campaigns: 0,
    conversations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Test connection and fetch templates
        const connTest = await whatsappService.testConnection();
        setConnectionStatus(connTest.success ? 'connected' : 'error');
        
        if (connTest.success) {
          const templatesRes = await whatsappService.campaigns.getTemplates();
          const templates = Array.isArray(templatesRes.data) ? templatesRes.data.length : 0;
          
          setStats({
            templates,
            contacts: 1243, // Mock for now
            campaigns: 87,
            conversations: 456,
          });
          
          toast.success('Connected to WhatsApp Business API');
        } else {
          toast.error(connTest.message || 'Failed to connect to WhatsApp API');
        }
      } catch (error) {
        console.error('Dashboard data fetch failed:', error);
        toast.error('Failed to load dashboard data');
        setConnectionStatus('error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    { label: 'New Campaign', icon: '📢', action: () => navigate('/whatsapp/campaigns') },
    { label: 'Import Contacts', icon: '👥', action: () => navigate('/whatsapp/contacts') },
    { label: 'View Templates', icon: '📋', action: () => navigate('/whatsapp/templates') },
    { label: 'Open Inbox', icon: '💬', action: () => navigate('/whatsapp/conversations') },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp API Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage campaigns, contacts, and conversations</p>
              </div>
              
              <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key}</div>
                      <div className="text-4xl font-semibold text-gray-900 dark:text-white mt-2">{value.toLocaleString()}</div>
                      <div className="text-xs text-emerald-600 mt-4 flex items-center gap-1">
                        ↑12% from last month
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className="group flex flex-col items-center justify-center p-8 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 rounded-2xl transition-all hover:shadow-md bg-white dark:bg-gray-800"
                      >
                        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{action.icon}</div>
                        <div className="font-medium text-gray-900 dark:text-white">{action.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 text-xs text-gray-400 text-center">
                  Powered by Nosnia WhatsApp Business API • API Key configured from .env
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default WhatsAppDashboard;
