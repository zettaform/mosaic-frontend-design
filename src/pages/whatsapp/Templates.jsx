import React, { useState, useEffect } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import whatsappService, { normalizeTemplatesResponse } from '../../services/whatsappService';
import { toast } from 'react-hot-toast';

function WhatsAppTemplates() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await whatsappService.campaigns.getTemplates();
      console.log('[Templates API Response]', response.data);

      const templatesData = normalizeTemplatesResponse(response.data);

      setTemplates(templatesData);
      toast.success(`Loaded ${templatesData.length} templates from Nosnia API`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Message Templates</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage approved WhatsApp templates</p>
              </div>
              <button
                onClick={fetchTemplates}
                disabled={loading}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl hover:bg-gray-50 text-sm font-medium"
              >
                {loading ? 'Refreshing...' : 'Refresh Templates'}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              {templates.length > 0 ? (
                <div className="divide-y dark:divide-gray-700">
                  {templates.map((template, index) => (
                    <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div>
                        <div className="font-medium">{template.templateName || template.name || `Template ${index + 1}`}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {template.mediaType || 'TEXT'} • Status: {template.templateStatus || 'Approved'}
                        </div>
                        {template.msgText && (
                          <div className="text-xs text-gray-400 mt-2 line-clamp-2 font-mono">
                            {template.msgText}
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        Approved
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-gray-500">No templates found or failed to load from API</p>
                  <button 
                    onClick={fetchTemplates}
                    className="mt-6 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default WhatsAppTemplates;
