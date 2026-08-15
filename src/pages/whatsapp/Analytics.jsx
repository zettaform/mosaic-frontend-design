import React, { useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';

function WhatsAppAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const metrics = [
    { label: 'Messages Sent', value: '2,847', change: '+18%' },
    { label: 'Delivered', value: '2,671', change: '+15%' },
    { label: 'Read', value: '2,134', change: '+22%' },
    { label: 'Replies', value: '387', change: '+9%' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">WhatsApp Analytics</h1>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {metrics.map((metric, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</div>
                  <div className="text-5xl font-semibold mt-3 mb-1">{metric.value}</div>
                  <div className="text-emerald-600 text-sm font-medium">{metric.change} this month</div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-xl font-semibold mb-2">Campaign &amp; Agent Performance</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Detailed analytics dashboard with campaign performance, delivery rates, 
                agent response times, and time-based trends.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default WhatsAppAnalytics;
