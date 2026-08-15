import React, { useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import whatsappService from '../../services/whatsappService';
import { toast } from 'react-hot-toast';

function WhatsAppCampaigns() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [contacts, setContacts] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await whatsappService.campaigns.getTemplates();
      setTemplates(Array.isArray(res.data) ? res.data : []);
      toast.success('Templates loaded');
    } catch (err) {
      toast.error('Failed to load templates');
      console.error(err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!campaignName || !templateId || !contacts) {
      toast.error('Please fill all fields');
      return;
    }

    setIsSending(true);
    
    try {
      const contactList = contacts.split('\n').filter(Boolean).map(phone => ({
        contactNo: phone.trim(),
        contactName: 'Customer',
        extraParams: JSON.stringify({ campaign: campaignName })
      }));

      const response = await whatsappService.campaigns.sendCampaign(
        parseInt(templateId), 
        contactList
      );
      
      toast.success(`Campaign "${campaignName}" started successfully!`);
      console.log('Campaign response:', response.data);
      
      // Reset form
      setCampaignName('');
      setContacts('');
    } catch (error) {
      toast.error('Failed to send campaign: ' + (error.message || 'Unknown error'));
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp Campaigns</h1>
              <p className="text-gray-500">Create and manage bulk WhatsApp messaging campaigns</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Create Campaign Form */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-3xl shadow p-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                  <span className="text-2xl">🚀</span> Create New Campaign
                </h2>
                
                <form onSubmit={handleSendCampaign} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campaign Name</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Summer Sale Promotion"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Template ID</label>
                      <button 
                        type="button" 
                        onClick={loadTemplates}
                        disabled={loadingTemplates}
                        className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                      >
                        {loadingTemplates ? 'Loading...' : 'Load Templates'}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter template ID (e.g. 12)"
                      required
                    />
                    {templates.length > 0 && (
                      <div className="mt-3 text-xs text-gray-500">
                        Available: {templates.map(t => t.name || t.id).join(', ')}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Numbers (one per line)
                    </label>
                    <textarea
                      value={contacts}
                      onChange={(e) => setContacts(e.target.value)}
                      className="w-full h-48 px-4 py-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                      placeholder="919876543210&#10;918765432109"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-2">International format without + sign</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium rounded-3xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                  >
                    {isSending ? (
                      <>Sending Campaign...</>
                    ) : (
                      <>Send Campaign Now</>
                    )}
                  </button>
                </form>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700">
                  <div className="font-semibold mb-4 text-lg">Campaign Tips</div>
                  <ul className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>Use approved templates only</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>Personalize with variables for higher engagement</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>Track delivery and read status in Analytics</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 text-sm">
                  <div className="font-medium text-amber-800 dark:text-amber-200">Rate Limits Apply</div>
                  <div className="text-amber-600 dark:text-amber-400 mt-1 text-xs">WhatsApp has daily message limits. Use responsibly.</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default WhatsAppCampaigns;
