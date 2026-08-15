import React, { useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';

function WhatsAppContacts() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contacts / Audience</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your WhatsApp contact lists and audience segments</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-dashed border-gray-300 dark:border-gray-700">
              <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center text-4xl mb-6">
                👥
              </div>
              <h3 className="text-xl font-semibold mb-3">Contact Management</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                Import contacts via CSV, sync from API, add tags, and create dynamic segments.
                This feature is ready for implementation.
              </p>
              <button 
                onClick={() => alert('Contact import feature coming soon')}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium transition-colors"
              >
                Import Contacts (CSV)
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default WhatsAppContacts;
