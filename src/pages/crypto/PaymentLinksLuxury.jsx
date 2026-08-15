import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import paymentLinksService from '../../services/paymentLinksService';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';

// Enhanced UI Components
const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center py-12"
  >
    <div className="relative">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-indigo-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
  </motion.div>
);

const StatusBadge = ({ status, className = "" }) => {
  const statusConfig = {
    active: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: '✓'
    },
    inactive: { 
      bg: 'bg-gray-100 dark:bg-gray-900/30', 
      text: 'text-gray-800 dark:text-gray-300',
      icon: '⏸'
    },
    expired: { 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      text: 'text-red-800 dark:text-red-300',
      icon: '⏰'
    },
    paid: { 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-800 dark:text-green-300',
      icon: '💰'
    }
  };
  
  const config = statusConfig[status] || statusConfig.active;
  
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      <span className="text-xs">{config.icon}</span>
      {status}
    </motion.span>
  );
};

const PaymentLinkCard = ({ paymentLink, onStatusToggle, onDelete, onCopy, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
  useEffect(() => {
    // Check if payment is complete
    const currentBalance = parseFloat(paymentLink.totalAmount || 0);
    const expectedAmount = parseFloat(paymentLink.amount || 0);
    setIsPaid(currentBalance >= expectedAmount);
  }, [paymentLink]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-slate-600 dark:text-slate-400 text-lg">💳</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {paymentLink.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {paymentLink.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={isPaid ? 'paid' : paymentLink.status} />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCopy}
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </motion.button>
        </div>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Payment Link ID</span>
          <code className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded font-mono">
            {paymentLink.linkId}
          </code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Assigned Address</span>
          <code className="text-xs font-mono text-slate-900 dark:text-slate-100 break-all">
            {paymentLink.assignedAddress || 'Not assigned'}
          </code>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Amount:</span>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {paymentLink.amount} {paymentLink.currency}
          </p>
        </div>
        <div>
          <span className="text-sm text-slate-500 dark:text-slate-400">Received:</span>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {paymentLink.totalAmount || '0.00000000'} {paymentLink.currency}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Created: {new Date(paymentLink.createdAt).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(paymentLink)}
            className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg transition-colors"
          >
            Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onStatusToggle(paymentLink.linkId)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              paymentLink.status === 'active'
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
            }`}
          >
            {paymentLink.status === 'active' ? 'Deactivate' : 'Activate'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(paymentLink.linkId)}
            className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 rounded-lg transition-colors"
          >
            Delete
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const StatsCard = ({ title, value, subtitle, icon, trend, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <span className="text-indigo-600 dark:text-indigo-400 text-lg">{icon}</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </motion.div>
  );
};

const PaymentLinksLuxury = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPaymentLink, setEditingPaymentLink] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stats, setStats] = useState({
    totalLinks: 0,
    activeLinks: 0,
    totalRevenue: '0.00000000',
    totalPayments: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'BTC',
    expiresAt: '',
    webhookUrl: '',
    redirectUrl: '',
    assignedAddress: '' // Custom address selection
  });
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // RBAC: Check permissions instead of role
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  const routeInfo = ROUTE_TO_SECTION[currentPath];
  if (routeInfo) {
    const { section, page } = routeInfo;
    if (!hasAccess(user, section, page)) {
      console.log(`❌ Access denied: User ${user.email || user.user_id} (role: ${user.role}) attempted to access ${currentPath} (${section}/${page})`);
      return <Navigate to="/unauthorized" replace />;
    }
  } else {
    // Route not in ROUTE_TO_SECTION - deny access
    console.log(`❌ Access denied: Route ${currentPath} is not in ROUTE_TO_SECTION`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Load payment links from the database
  const loadPaymentLinks = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await paymentLinksService.getPaymentLinks(page, pagination.limit);
      
      if (response.success && response.data) {
        const paymentLinks = response.data.paymentLinks || [];
        const paginationData = response.data.pagination || {};
        
        setPaymentLinks(paymentLinks);
        setPagination({
          page: paginationData.page || 1,
          limit: paginationData.limit || pagination.limit,
          total: paginationData.total || 0,
          totalPages: paginationData.totalPages || 0,
          hasNext: paginationData.hasNext || false,
          hasPrev: paginationData.hasPrev || false
        });
        
        // Calculate stats
        const totalLinks = paymentLinks.length;
        const activeLinks = paymentLinks.filter(link => link.status === 'active').length;
        const totalRevenue = paymentLinks.reduce((sum, link) => sum + parseFloat(link.totalAmount || 0), 0).toFixed(8);
        const totalPayments = paymentLinks.reduce((sum, link) => sum + (link.totalPayments || 0), 0);
        
        setStats({
          totalLinks,
          activeLinks,
          totalRevenue,
          totalPayments
        });
      } else {
        setError(response.error || 'Failed to load payment links');
      }
    } catch (error) {
      console.error('Error loading payment links:', error);
      setError('Failed to load payment links: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new payment link
  const handleCreatePaymentLink = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError('');
      
      const response = await paymentLinksService.createPaymentLink(formData);
      
      if (response.success) {
        setSuccess('Payment link created successfully!');
        setFormData({
          name: '',
          description: '',
          amount: '',
          currency: 'BTC',
          expiresAt: '',
          webhookUrl: '',
          redirectUrl: '',
          assignedAddress: ''
        });
        setSelectedAddressData(null);
        setShowCreateModal(false);
        await loadPaymentLinks(pagination.page);
      } else {
        setError(response.error || 'Failed to create payment link');
      }
    } catch (error) {
      console.error('Error creating payment link:', error);
      setError('Failed to create payment link: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Toggle payment link status
  const handleStatusToggle = async (linkId) => {
    try {
      const link = paymentLinks.find(l => l.linkId === linkId);
      if (!link) return;
      
      const newStatus = link.status === 'active' ? 'inactive' : 'active';
      const response = await paymentLinksService.updatePaymentLinkStatus(linkId, newStatus);
      
      if (response.success) {
        setSuccess(`Payment link ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        await loadPaymentLinks(pagination.page);
      } else {
        setError(response.error || 'Failed to update payment link status');
      }
    } catch (error) {
      console.error('Error updating payment link status:', error);
      setError('Failed to update payment link status: ' + error.message);
    }
  };

  // Delete payment link
  const handleDelete = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this payment link? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await paymentLinksService.deletePaymentLink(linkId);
      
      if (response.success) {
        setSuccess('Payment link deleted successfully!');
        await loadPaymentLinks(pagination.page);
      } else {
        setError(response.error || 'Failed to delete payment link');
      }
    } catch (error) {
      console.error('Error deleting payment link:', error);
      setError('Failed to delete payment link: ' + error.message);
    }
  };

  // Handle opening edit modal
  const handleEditClick = (paymentLink) => {
    setEditingPaymentLink(paymentLink);
    setFormData({
      name: paymentLink.name || '',
      description: paymentLink.description || '',
      amount: paymentLink.amount || '',
      currency: paymentLink.currency || 'BTC',
      expiresAt: paymentLink.expiresAt ? new Date(paymentLink.expiresAt).toISOString().slice(0, 16) : '',
      webhookUrl: paymentLink.webhookUrl || '',
      redirectUrl: paymentLink.redirectUrl || '',
      assignedAddress: paymentLink.assignedAddress || ''
    });
    setShowEditModal(true);
  };

  // Edit payment link
  const handleEditPaymentLink = async (e) => {
    e.preventDefault();
    try {
      setEditing(true);
      setError('');

      const response = await paymentLinksService.updatePaymentLink(editingPaymentLink.linkId, formData);

      if (response.success) {
        setSuccess('Payment link updated successfully!');
        setFormData({
          name: '',
          description: '',
          amount: '',
          currency: 'BTC',
          expiresAt: '',
          webhookUrl: '',
          redirectUrl: '',
          assignedAddress: ''
        });
        setEditingPaymentLink(null);
        setShowEditModal(false);
        await loadPaymentLinks(pagination.page);
      } else {
        setError(response.error || 'Failed to update payment link');
      }
    } catch (error) {
      console.error('Error updating payment link:', error);
      setError('Failed to update payment link: ' + error.message);
    } finally {
      setEditing(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    loadPaymentLinks(newPage);
  };

  useEffect(() => {
    loadPaymentLinks();

    // Check for selected address from generated addresses page
    const selectedAddress = localStorage.getItem('selectedPaymentAddress');
    if (selectedAddress) {
      try {
        const addressData = JSON.parse(selectedAddress);
        setSelectedAddressData(addressData);
        setFormData(prev => ({
          ...prev,
          assignedAddress: addressData.address
        }));

        // Clear the stored address after using it
        localStorage.removeItem('selectedPaymentAddress');

        // Show success message
        setSuccess(`Selected address: ${addressData.address.substring(0, 20)}...`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error parsing selected address:', error);
      }
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="sidebar-shell-main">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Payment Gateway Links</h1>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">Create and manage Bitcoin payment links with automatic address assignment</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/crypto/generated-addresses"
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    View Addresses
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Create Payment Link
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Error/Success messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatsCard
                title="Total Links"
                value={stats.totalLinks}
                subtitle="All payment links"
                icon="🔗"
              />
              <StatsCard
                title="Active Links"
                value={stats.activeLinks}
                subtitle="Currently active"
                icon="⚡"
              />
              <StatsCard
                title="Total Revenue"
                value={`${stats.totalRevenue} BTC`}
                subtitle="Total received"
                icon="💰"
              />
              <StatsCard
                title="Total Payments"
                value={stats.totalPayments}
                subtitle="Successful payments"
                icon="✅"
              />
            </motion.div>

            {/* Payment Links Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Payment Links</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Showing {paymentLinks.length} of {pagination.total} payment links
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    {viewMode === 'grid' ? 'Table View' : 'Grid View'}
                  </motion.button>
                </div>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : paymentLinks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-400 dark:text-slate-500 text-6xl mb-4">💳</div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No payment links found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first payment link to get started</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Create Payment Link
                  </motion.button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paymentLinks.map((paymentLink) => (
                    <PaymentLinkCard
                      key={paymentLink.linkId}
                      paymentLink={paymentLink}
                      onStatusToggle={handleStatusToggle}
                      onDelete={handleDelete}
                      onCopy={() => copyToClipboard(paymentLink.url)}
                      onEdit={handleEditClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Payment Link
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {paymentLinks.map((paymentLink) => (
                        <motion.tr
                          key={paymentLink.linkId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {paymentLink.name}
                              </div>
                              <div className="text-sm text-slate-500 dark:text-slate-400">
                                {paymentLink.linkId}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {paymentLink.amount} {paymentLink.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={paymentLink.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900 dark:text-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-xs">{paymentLink.assignedAddress || 'Not assigned'}</span>
                              {paymentLink.assignedAddress && (
                                <button
                                  onClick={() => copyToClipboard(paymentLink.assignedAddress)}
                                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {paymentLink.totalAmount || '0.00000000'} {paymentLink.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                            {new Date(paymentLink.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditClick(paymentLink)}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 rounded transition-colors"
                              >
                                Edit
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleStatusToggle(paymentLink.linkId)}
                                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                  paymentLink.status === 'active'
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                                }`}
                              >
                                {paymentLink.status === 'active' ? 'Deactivate' : 'Activate'}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDelete(paymentLink.linkId)}
                                className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 rounded transition-colors"
                              >
                                Delete
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </motion.button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <motion.button
                            key={pageNum}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              pageNum === pagination.page
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            {pageNum}
                          </motion.button>
                        );
                      })}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Create Payment Link Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create Payment Link</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  A Bitcoin address will be automatically assigned to this payment link
                </p>
              </div>
              
              <form onSubmit={handleCreatePaymentLink} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Link Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="e.g., Premium Subscription"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Optional description for this payment link"
                      rows="3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                        placeholder="0.001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      >
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="USDT">USDT</option>
                        <option value="LTC">LTC</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Custom Address
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        (Optional - leave empty for auto-assignment)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.assignedAddress}
                        onChange={(e) => setFormData({...formData, assignedAddress: e.target.value})}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 font-mono text-sm"
                        placeholder="Enter custom Bitcoin address or leave empty for auto-assignment"
                      />
                      <Link
                        to="/crypto/generated-addresses"
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Browse Addresses
                      </Link>
                    </div>
                    {selectedAddressData && (
                      <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <span>Selected: Index {selectedAddressData.index} • {selectedAddressData.balance} BTC • {selectedAddressData.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Expires At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({...formData, webhookUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="https://api.example.com/webhooks/payment"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Redirect URL
                    </label>
                    <input
                      type="url"
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({...formData, redirectUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="https://app.example.com/success"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Link'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Payment Link Modal */}
      <AnimatePresence>
        {showEditModal && editingPaymentLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit Payment Link</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Update payment link details
                </p>
              </div>

              <form onSubmit={handleEditPaymentLink} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Link Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="e.g., Premium Subscription"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Optional description for this payment link"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                        placeholder="0.001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      >
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="USDT">USDT</option>
                        <option value="LTC">LTC</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Custom Address
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        (Optional - leave empty for auto-assignment)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.assignedAddress}
                        onChange={(e) => setFormData({...formData, assignedAddress: e.target.value})}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100 font-mono text-sm"
                        placeholder="Enter custom Bitcoin address or leave empty for auto-assignment"
                      />
                      <Link
                        to="/crypto/generated-addresses"
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Browse Addresses
                      </Link>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Expires At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={formData.webhookUrl}
                      onChange={(e) => setFormData({...formData, webhookUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="https://api.example.com/webhooks/payment"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Redirect URL
                    </label>
                    <input
                      type="url"
                      value={formData.redirectUrl}
                      onChange={(e) => setFormData({...formData, redirectUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="https://app.example.com/success"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPaymentLink(null);
                      setFormData({
                        name: '',
                        description: '',
                        amount: '',
                        currency: 'BTC',
                        expiresAt: '',
                        webhookUrl: '',
                        redirectUrl: '',
                        assignedAddress: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editing}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editing ? 'Updating...' : 'Update Link'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentLinksLuxury;
