import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  AtSymbolIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// SMTP API function - calls backend endpoint that handles SMTP
const sendEmail = async (to, subject, body) => {
  try {
    const response = await fetch('/api/email/smtp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `SMTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, message: data.message || 'Email sent successfully!' };
  } catch (error) {
    console.error('SMTP Error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center py-12"
  >
    <div className="relative">
      <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
  </motion.div>
);

const SMTP = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.to.trim()) {
      toast.error('Recipient email is required');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    if (!formData.body.trim()) {
      toast.error('Email body is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.to.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendEmail(formData.to.trim(), formData.subject.trim(), formData.body.trim());
      toast.success(result.message);

      // Clear form on success
      setFormData({
        to: '',
        subject: '',
        body: ''
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-4xl mx-auto">
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">SMTP Email Sender</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Send emails via Mailtrap SMTP server</p>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-8">
              {/* Email Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <EnvelopeIcon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold">Compose Email</h2>
                  </div>
                  <p className="text-indigo-100 mt-2">Emails will be sent from <strong>dan@mymailgram.com</strong></p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* To Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <AtSymbolIcon className="h-4 w-4" />
                      To
                    </label>
                    <input
                      type="email"
                      value={formData.to}
                      onChange={(e) => handleInputChange('to', e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                      disabled={isSending}
                    />
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <DocumentTextIcon className="h-4 w-4" />
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Enter email subject"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100"
                      disabled={isSending}
                    />
                  </div>

                  {/* Body Field */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <DocumentTextIcon className="h-4 w-4" />
                      Message
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => handleInputChange('body', e.target.value)}
                      placeholder="Enter your email message here..."
                      rows={8}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-slate-100 resize-vertical"
                      disabled={isSending}
                    />
                  </div>

                  {/* Send Button */}
                  <motion.button
                    whileHover={{ scale: isSending ? 1 : 1.02 }}
                    whileTap={{ scale: isSending ? 1 : 0.98 }}
                    type="submit"
                    disabled={isSending}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                  >
                    {isSending ? (
                      <>
                        <LoadingSpinner />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-5 w-5" />
                        <span>Send Email</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>

              {/* Info Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Important Information</h3>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• Emails are sent via Mailtrap SMTP server for testing purposes</li>
                      <li>• All emails will appear to come from <strong>dan@mymailgram.com</strong></li>
                      <li>• This is a sandbox environment - emails won't reach real inboxes</li>
                      <li>• Check your Mailtrap inbox to see sent emails</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SMTP;