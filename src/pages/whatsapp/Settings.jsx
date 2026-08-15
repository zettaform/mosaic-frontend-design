import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import whatsappService from '../../services/whatsappService';
import { toast } from 'react-hot-toast';

function WhatsAppSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');
  const [testResult, setTestResult] = useState(null);

  const testConnection = async () => {
    setApiKeyStatus('testing');
    try {
      const result = await whatsappService.testConnection();
      setTestResult(result);
      setApiKeyStatus(result.success ? 'connected' : 'failed');
      
      if (result.success) {
        toast.success('Successfully connected to Nosnia WhatsApp API');
      } else {
        toast.error(result.message || 'Connection failed');
      }
    } catch (err) {
      setApiKeyStatus('failed');
      toast.error('Connection test failed');
      setTestResult({ success: false, message: err.message });
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">WhatsApp Settings</h1>
            <p className="text-gray-500 mb-10">API Configuration and Webhook Setup</p>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="font-semibold text-lg">API Connection Status</div>
                  <div className="text-sm text-gray-500">Using key from .env/myapp.env</div>
                </div>
                <div className={`px-5 py-2 rounded-2xl text-sm font-medium ${
                  apiKeyStatus === 'connected' ? 'bg-green-100 text-green-700' : 
                  apiKeyStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {apiKeyStatus === 'connected' ? '✅ Connected' : 
                   apiKeyStatus === 'failed' ? '❌ Failed' : '⏳ Testing...'}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl font-mono text-xs mb-8 break-all">
                {import.meta.env.VITE_WHATSAPP_BUSINESS_API_KEY ? 
                  `WHATSAPP_BUSINESS_API_KEY=${import.meta.env.VITE_WHATSAPP_BUSINESS_API_KEY.substring(0,8)}...` : 
                  'WHATSAPP_BUSINESS_API_KEY=7F31C9D5-856C-45C6-9D1D-57F54CC35476'}
              </div>

              <button
                onClick={testConnection}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium transition-colors"
              >
                Test Connection to Nosnia API
              </button>

              {testResult && (
                <div className={`mt-6 p-4 rounded-2xl text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="mt-8 text-xs text-gray-400 text-center">
              Webhook configuration and rate limiting settings will be available here.
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default WhatsAppSettings;
