import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { RefreshCw, Search, Link2, BarChart3, X, ChevronLeft, ChevronRight, Eye, FileText, MessageSquare, Image, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import AdvancedDataTable from '../../components/AdvancedDataTable';
import { useAuth } from '../../contexts/AuthContext';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import adminApiService from '../../services/adminApiService';
import promptTemplatesService from '../../services/promptTemplatesService';

const CampaignStats = () => {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Campaign records modal state
  const [showCampaignRecordsModal, setShowCampaignRecordsModal] = useState(false);
  const [campaignRecordsCampaignId, setCampaignRecordsCampaignId] = useState(null);
  const [campaignRecordsCampaignName, setCampaignRecordsCampaignName] = useState(null);
  const [campaignRecords, setCampaignRecords] = useState([]);
  const [campaignRecordsLoading, setCampaignRecordsLoading] = useState(false);
  const [campaignRecordsError, setCampaignRecordsError] = useState(null);
  const [campaignRecordsPages, setCampaignRecordsPages] = useState([]);
  const [campaignRecordsPageNextTokens, setCampaignRecordsPageNextTokens] = useState([]);
  const [campaignRecordsCurrentPage, setCampaignRecordsCurrentPage] = useState(1);
  const [campaignRecordsTotal, setCampaignRecordsTotal] = useState(0);
  
  const campaignRecordsFetchingRef = useRef(false);
  const campaignRecordsAbortControllerRef = useRef(null);

  // Generated Text Detail Modal state
  const [showGeneratedTextModal, setShowGeneratedTextModal] = useState(false);
  const [generatedTextData, setGeneratedTextData] = useState(null);
  const [promptTemplate, setPromptTemplate] = useState(null);
  const [promptTemplateLoading, setPromptTemplateLoading] = useState(false);
  const [promptTemplateError, setPromptTemplateError] = useState(null);

  const formatGeneratedText = useCallback((value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Temporarily create mock user for testing the UI fix
  const mockUser = { role: 'admin', permissions: ['admin'] };
  const effectiveUser = user || mockUser;

  const fetchCampaignStats = async (overrides = {}) => {
    const nextSortBy = overrides.sortBy ?? sortBy;
    const nextSortOrder = overrides.sortOrder ?? sortOrder;
    const nextSearch = overrides.search ?? debouncedSearch;

    try {
      setLoading(true);
      setError(null);

      const response = await adminApiService.getCampaignStats({
        search: nextSearch,
        sortBy: nextSortBy,
        sortOrder: nextSortOrder,
        tenantEmail: user?.email,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to load campaign stats');
      }

      setRecords(response.items || []);
      setSortBy(nextSortBy);
      setSortOrder(nextSortOrder);
    } catch (fetchError) {
      console.error('[CampaignStats] Error fetching campaign stats:', fetchError);
      setError(fetchError.message || 'Failed to load campaign stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignStats({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleSortChange = (columnId, order) => {
    fetchCampaignStats({ sortBy: columnId, sortOrder: order });
  };

  const openCampaignRecordsModal = (campaignId, campaignName, e) => {
    e?.stopPropagation?.();
    
    // Cancel any ongoing fetch
    if (campaignRecordsAbortControllerRef.current) {
      campaignRecordsAbortControllerRef.current.abort();
      campaignRecordsAbortControllerRef.current = null;
    }
    
    // Reset all state
    setCampaignRecordsError(null);
    setCampaignRecords([]);
    setCampaignRecordsPages([]);
    setCampaignRecordsPageNextTokens([]);
    setCampaignRecordsCurrentPage(1);
    setCampaignRecordsLoading(false);
    setCampaignRecordsTotal(0);
    campaignRecordsFetchingRef.current = false;
    
    // Set campaign ID and name, then open modal
    setCampaignRecordsCampaignId(campaignId);
    setCampaignRecordsCampaignName(campaignName);
    setShowCampaignRecordsModal(true);
  };

  const closeCampaignRecordsModal = useCallback(() => {
    // Cancel any ongoing fetch
    if (campaignRecordsAbortControllerRef.current) {
      campaignRecordsAbortControllerRef.current.abort();
      campaignRecordsAbortControllerRef.current = null;
    }
    
    setShowCampaignRecordsModal(false);
    setCampaignRecordsCampaignId(null);
    setCampaignRecordsCampaignName(null);
    campaignRecordsFetchingRef.current = false;
  }, []);

  const fetchCampaignRecords = useCallback(
    async ({ page = 1, continuationToken = null } = {}) => {
      if (!campaignRecordsCampaignId || campaignRecordsFetchingRef.current) return;
      
      // Prevent concurrent fetches
      campaignRecordsFetchingRef.current = true;

      // Create abort controller for this fetch
      const abortController = new AbortController();
      campaignRecordsAbortControllerRef.current = abortController;

      setCampaignRecordsLoading(true);
      // Only clear error when starting a new fetch (not during pagination)
      if (page === 1 && !continuationToken) {
        setCampaignRecordsError(null);
      }

      try {
        const response = await adminApiService.getCampaignRecords(campaignRecordsCampaignId, {
          page,
          pageSize: 100,
          continuationToken,
        });

        if (!response?.success) {
          throw new Error(response?.error || response?.message || 'Failed to load campaign records');
        }

        const nextItems = response.items || [];
        setCampaignRecordsPages((prev) => {
          const next = [...prev];
          next[page - 1] = nextItems;
          return next;
        });
        setCampaignRecords(nextItems);
        setCampaignRecordsCurrentPage(page);
        setCampaignRecordsTotal(response.total || 0);
        setCampaignRecordsPageNextTokens((prev) => {
          const next = [...prev];
          next[page - 1] = response.continuationToken || null;
          return next;
        });
      } catch (err) {
        console.error('❌ Error fetching campaign records:', err);
        if (err.name !== 'AbortError') {
          setCampaignRecordsError(err.message || 'Failed to load campaign records');
        }
      } finally {
        setCampaignRecordsLoading(false);
        campaignRecordsFetchingRef.current = false;
      }
    },
    [campaignRecordsCampaignId]
  );

  useEffect(() => {
    if (showCampaignRecordsModal && campaignRecordsCampaignId) {
      fetchCampaignRecords({ page: 1, continuationToken: null });
    }
  }, [showCampaignRecordsModal, campaignRecordsCampaignId, fetchCampaignRecords]);

  const handlePrevCampaignRecordsPage = () => {
    if (campaignRecordsCurrentPage <= 1) return;
    const prevPage = campaignRecordsCurrentPage - 1;
    const cached = campaignRecordsPages[prevPage - 1];
    if (cached) {
      setCampaignRecords(cached);
      setCampaignRecordsCurrentPage(prevPage);
    }
  };

  const handleNextCampaignRecordsPage = () => {
    const currentIndex = campaignRecordsCurrentPage - 1;
    const nextPage = campaignRecordsCurrentPage + 1;
    const cached = campaignRecordsPages[nextPage - 1];
    if (cached) {
      setCampaignRecords(cached);
      setCampaignRecordsCurrentPage(nextPage);
      return;
    }

    const token = campaignRecordsPageNextTokens[currentIndex];
    if (!token) return;
    fetchCampaignRecords({ page: nextPage, continuationToken: token });
  };

  const campaignRecordsHasNextPage = Boolean(campaignRecordsPageNextTokens[campaignRecordsCurrentPage - 1]);
  const campaignRecordsHasPrevPage = campaignRecordsCurrentPage > 1;

  // Open Generated Text Detail Modal
  const openGeneratedTextModal = useCallback((row) => {
    const generatedText = formatGeneratedText(row.openai_results?.generated_text);
    const promptTemplateId = row.prompt_template?.id || null;
    const recentPosts = row.recent_posts || [];
    const userid = row.userid || '';

    setGeneratedTextData({
      generatedText,
      recentPosts,
      userid,
      login: row.login || '',
      name: row.name || '',
    });
    setPromptTemplate(null);
    setPromptTemplateError(null);
    setShowGeneratedTextModal(true);

    // Fetch prompt template if ID is available
    if (promptTemplateId) {
      setPromptTemplateLoading(true);
      promptTemplatesService.getTemplate(promptTemplateId)
        .then((result) => {
          if (result.success) {
            setPromptTemplate(result.template);
          } else {
            setPromptTemplateError(result.message || 'Failed to load prompt template');
          }
        })
        .catch((error) => {
          console.error('Error fetching prompt template:', error);
          setPromptTemplateError('Failed to load prompt template');
        })
        .finally(() => {
          setPromptTemplateLoading(false);
        });
    } else {
      setPromptTemplateError('No prompt template ID found');
    }
  }, [formatGeneratedText]);

  // Close Generated Text Detail Modal
  const closeGeneratedTextModal = useCallback(() => {
    setShowGeneratedTextModal(false);
    setGeneratedTextData(null);
    setPromptTemplate(null);
    setPromptTemplateError(null);
    setPromptTemplateLoading(false);
  }, []);

  // Download campaign records as XLSX
  const downloadCampaignRecords = useCallback(async (campaignId, campaignName, e) => {
    e?.stopPropagation?.();
    
    try {
      // Show loading state (you could add a toast notification here)
      const allRecords = [];
      let continuationToken = null;
      let page = 1;
      let hasMore = true;

      // Fetch all pages of records
      while (hasMore) {
        const response = await adminApiService.getCampaignRecords(campaignId, {
          page,
          pageSize: 100,
          continuationToken,
        });

        if (!response?.success) {
          throw new Error(response?.error || response?.message || 'Failed to fetch campaign records');
        }

        const items = response.items || [];
        allRecords.push(...items);

        continuationToken = response.continuationToken || null;
        hasMore = Boolean(continuationToken);
        page++;

        // Safety limit to prevent infinite loops
        if (page > 10000) {
          console.warn('Reached maximum page limit for download');
          break;
        }
      }

      // Format data to match modal columns
      const formattedData = allRecords.map((row) => ({
        'User ID': row.userid || '',
        'Login': row.login || '',
        'Name': row.name || '',
        'Public Email': row.public_email || '',
        'Followers': typeof row.fol_cnt === 'number' ? row.fol_cnt : '',
        'Has Posts': (row.recent_posts && Array.isArray(row.recent_posts) && row.recent_posts.length > 0) ? 'Yes' : 'No',
        'Has OpenAI Results': row.openai_results ? 'Yes' : 'No',
        'Generated Text': formatGeneratedText(row.openai_results?.generated_text),
        'Updated At': row.updated_at ? new Date(row.updated_at).toLocaleString(undefined, { hour12: false }) : '',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 20 }, // User ID
        { wch: 20 }, // Login
        { wch: 25 }, // Name
        { wch: 30 }, // Public Email
        { wch: 12 }, // Followers
        { wch: 12 }, // Has Posts
        { wch: 18 }, // Has OpenAI Results
        { wch: 50 }, // Generated Text
        { wch: 25 }, // Updated At
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Campaign Records');

      // Generate filename
      const sanitizedCampaignName = (campaignName || 'campaign').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `${sanitizedCampaignName}_${campaignId}_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error downloading campaign records:', error);
      alert(`Failed to download campaign records: ${error.message}`);
    }
  }, []);

  const tableColumns = useMemo(
    () => [
      {
        id: 'campaign_name',
        header: 'Campaign',
        sortable: true,
        minWidth: 220,
        accessor: (row) => row.campaign_name,
        render: (_value, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 dark:text-slate-50">{row.campaign_name || 'Untitled Campaign'}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{row.campaign_id}</span>
          </div>
        ),
      },
      {
        id: 'instance_id',
        header: 'Instance ID',
        sortable: false,
        minWidth: 200,
        accessor: (row) => row.instance_id,
        render: (value) => (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{value || '—'}</span>
        ),
      },
      {
        id: 'total_users',
        header: 'Total Users',
        sortable: true,
        align: 'right',
        minWidth: 120,
        accessor: (row) => row.total_users,
        render: (value) => (typeof value === 'number' ? value.toLocaleString() : '—'),
      },
      {
        id: 'batches_processed',
        header: 'Batches',
        sortable: true,
        align: 'right',
        minWidth: 110,
        accessor: (row) => row.batches_processed,
        render: (value, row) => (
          <div className="flex flex-col items-end">
            <span>{typeof value === 'number' ? value.toLocaleString() : '—'}</span>
            {typeof row.batches_failed === 'number' && (
              <span className="text-[11px] text-rose-500 dark:text-rose-300">
                {row.batches_failed} failed
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'runtime_status',
        header: 'Runtime Status',
        sortable: true,
        minWidth: 150,
        accessor: (row) => row.runtime_status,
        render: (value) => (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              value?.toLowerCase() === 'completed'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                : value?.toLowerCase() === 'running'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {value || 'Unknown'}
          </span>
        ),
      },
      {
        id: 'status_link',
        header: 'Status Link',
        sortable: false,
        minWidth: 180,
        accessor: (row) => row.status_link,
        render: (value) =>
          value ? (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500 dark:text-indigo-300 text-sm"
            >
              <Link2 className="w-4 h-4" />
              Open status
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        id: 'updated_at',
        header: 'Last Updated',
        sortable: true,
        minWidth: 180,
        accessor: (row) => row.updated_at || row.last_status_refresh,
        render: (value) =>
          value ? new Date(value).toLocaleString(undefined, { hour12: false }) : '—',
      },
      {
        id: 'actions',
        header: 'Actions',
        sortable: false,
        minWidth: 200,
        accessor: () => null,
        render: (_value, row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => openCampaignRecordsModal(row.campaign_id, row.campaign_name, e)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md"
              title={`View records for campaign ${row.campaign_id}`}
            >
              <Eye className="w-3 h-3" />
              <span>View Campaign</span>
            </button>
            <button
              onClick={(e) => downloadCampaignRecords(row.campaign_id, row.campaign_name, e)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors duration-200 flex items-center space-x-1 shadow-sm hover:shadow-md"
              title={`Download records for campaign ${row.campaign_id}`}
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-700/60 mb-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-300 mr-1.5" />
                  <span className="text-xs font-medium text-indigo-700 dark:text-indigo-200">
                    Admin • Campaign Stats
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
                  Campaign Statistics
                </h1>
              </div>
              <button
                type="button"
                onClick={() => fetchCampaignStats({})}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="mb-5">
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 sm:px-5 py-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="search"
                        placeholder="Search by campaign name, ID, or instance…"
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Sorting by{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {sortBy.replace(/_/g, ' ')} ({sortOrder})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">Unable to load campaign stats</p>
                <p className="mt-1 text-xs opacity-90">{error}</p>
              </div>
            )}

            <AdvancedDataTable
              columns={tableColumns}
              data={records}
              loading={loading}
              density="comfortable"
              emptyMessage="No campaigns recorded in campaignstats yet."
              onSortChange={handleSortChange}
            />
          </div>
        </main>
      </div>

      {/* Campaign Records Modal */}
      {showCampaignRecordsModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-6"
          onClick={closeCampaignRecordsModal}
        >
          <div
            className="relative w-full"
            style={{ width: '90vw', height: '90vh', maxWidth: '1600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
              <div className="flex flex-col gap-4 px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                  <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto pb-1 lg:pb-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 text-indigo-600 dark:text-indigo-300 text-xs font-semibold tracking-wide uppercase flex-shrink-0">
                      <Eye className="w-4 h-4" />
                      <span>Campaign Records</span>
                    </div>
                    {campaignRecordsCampaignId && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                        <span>
                          Campaign ID ={' '}
                          <span className="text-slate-900 dark:text-slate-100">
                            {campaignRecordsCampaignId}
                          </span>
                        </span>
                      </div>
                    )}
                    {campaignRecordsCampaignName && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                        <span>
                          Campaign Name ={' '}
                          <span className="text-slate-900 dark:text-slate-100">
                            {campaignRecordsCampaignName}
                          </span>
                        </span>
                      </div>
                    )}
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap flex-shrink-0">
                      <span>
                        Total records ={' '}
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {campaignRecordsTotal > 0 ? campaignRecordsTotal.toLocaleString() : '-'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrevCampaignRecordsPage}
                        disabled={!campaignRecordsHasPrevPage || campaignRecordsLoading}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[3rem] text-center">
                        Page {campaignRecordsCurrentPage}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextCampaignRecordsPage}
                        disabled={!campaignRecordsHasNextPage || campaignRecordsLoading}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeCampaignRecordsModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex-shrink-0"
                  >
                    <span className="sr-only">Close modal</span>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60">
                {campaignRecordsError && !campaignRecordsLoading && (
                  <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs font-medium text-red-700 dark:text-red-200 break-words">
                        {campaignRecordsError}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCampaignRecordsError(null)}
                      className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-hidden px-6 py-4 bg-gradient-to-b from-white via-white/90 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                <AdvancedDataTable
                  columns={[
                    {
                      id: 'userid',
                      header: 'User ID',
                      sortable: false,
                      minWidth: 150,
                      accessor: (row) => row.userid,
                      render: (value) => (
                        <span className="text-xs font-mono text-slate-900 dark:text-slate-50">{value || '—'}</span>
                      ),
                    },
                    {
                      id: 'login',
                      header: 'Login',
                      sortable: false,
                      minWidth: 150,
                      accessor: (row) => row.login,
                      render: (value) => (
                        <span className="text-slate-900 dark:text-slate-50">{value || '—'}</span>
                      ),
                    },
                    {
                      id: 'name',
                      header: 'Name',
                      sortable: false,
                      minWidth: 150,
                      accessor: (row) => row.name,
                      render: (value) => (
                        <span className="text-slate-900 dark:text-slate-50">{value || '—'}</span>
                      ),
                    },
                    {
                      id: 'public_email',
                      header: 'Public Email',
                      sortable: false,
                      minWidth: 200,
                      accessor: (row) => row.public_email,
                      render: (value) => (
                        <span className="text-slate-600 dark:text-slate-400">{value || '—'}</span>
                      ),
                    },
                    {
                      id: 'fol_cnt',
                      header: 'Followers',
                      sortable: false,
                      align: 'right',
                      minWidth: 100,
                      accessor: (row) => row.fol_cnt,
                      render: (value) => (
                        <span className="text-slate-900 dark:text-slate-50">
                          {typeof value === 'number' ? value.toLocaleString() : '—'}
                        </span>
                      ),
                    },
                    {
                      id: 'has_recent_posts',
                      header: 'Has Posts',
                      sortable: false,
                      minWidth: 100,
                      accessor: (row) => row.recent_posts,
                      render: (value) => (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          (value && Array.isArray(value) && value.length > 0)
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                        }`}>
                          {(value && Array.isArray(value) && value.length > 0) ? 'Yes' : 'No'}
                        </span>
                      ),
                    },
                    {
                      id: 'has_openai_results',
                      header: 'Has OpenAI Results',
                      sortable: false,
                      minWidth: 150,
                      accessor: (row) => row.openai_results,
                      render: (value) => (
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          value
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                        }`}>
                          {value ? 'Yes' : 'No'}
                        </span>
                      ),
                    },
                    {
                      id: 'generated_text',
                      header: 'Generated Text',
                      sortable: false,
                      minWidth: 250,
                      maxWidth: 300,
                      accessor: (row) => row.openai_results?.generated_text,
                      render: (value, row) => (
                        <div className="w-full max-w-[280px] overflow-hidden">
                          {value ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openGeneratedTextModal(row);
                              }}
                              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 line-clamp-3 text-left cursor-pointer hover:underline transition-colors w-full text-ellipsis overflow-hidden block"
                              title="Click to view full details"
                            >
                              {formatGeneratedText(value)}
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                      ),
                    },
                    {
                      id: 'updated_at',
                      header: 'Updated At',
                      sortable: false,
                      minWidth: 160,
                      maxWidth: 180,
                      accessor: (row) => row.updated_at,
                      render: (value) => (
                        <div className="whitespace-nowrap">
                          {value ? new Date(value).toLocaleString(undefined, { hour12: false }) : '—'}
                        </div>
                      ),
                    },
                  ]}
                  data={campaignRecords}
                  loading={campaignRecordsLoading}
                  emptyMessage="No records found for this campaign."
                  density="compact"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Text Detail Modal */}
      {showGeneratedTextModal && generatedTextData && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-6"
          onClick={closeGeneratedTextModal}
        >
          <div
            className="relative w-full"
            style={{ width: '90vw', height: '90vh', maxWidth: '1400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex flex-col gap-4 px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/70 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-100 text-indigo-600 dark:text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                      <FileText className="w-4 h-4" />
                      <span>Generated Text Details</span>
                    </div>
                    {generatedTextData.userid && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span>
                          User: <span className="text-slate-900 dark:text-slate-100 font-mono">{generatedTextData.userid}</span>
                        </span>
                      </div>
                    )}
                    {generatedTextData.login && (
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span>
                          @{generatedTextData.login}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={closeGeneratedTextModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex-shrink-0"
                  >
                    <span className="sr-only">Close modal</span>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content - Three Sections */}
              <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-b from-white via-white/90 to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                <div className="flex flex-col gap-6">
                  {/* Section 1: Generated Text */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Generated Text</h3>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      {generatedTextData.generatedText ? (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                            {generatedTextData.generatedText}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No generated text available</p>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Prompt Template */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Prompt Template</h3>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      {promptTemplateLoading ? (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Loading prompt template...</span>
                        </div>
                      ) : promptTemplateError ? (
                        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
                          <p className="text-sm text-red-700 dark:text-red-200">{promptTemplateError}</p>
                        </div>
                      ) : promptTemplate ? (
                        <div className="space-y-4">
                          {promptTemplate.name && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Template Name</p>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{promptTemplate.name}</p>
                            </div>
                          )}
                          {promptTemplate.content && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Template Content</p>
                              <div className="prose prose-slate dark:prose-invert max-w-none">
                                <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                                  {promptTemplate.content}
                                </pre>
                              </div>
                            </div>
                          )}
                          {promptTemplate.description && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Description</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{promptTemplate.description}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No prompt template available</p>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Recent Posts */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Image className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent Posts</h3>
                        </div>
                        {generatedTextData.recentPosts && Array.isArray(generatedTextData.recentPosts) && (
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {generatedTextData.recentPosts.length} post{generatedTextData.recentPosts.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      {generatedTextData.recentPosts && Array.isArray(generatedTextData.recentPosts) && generatedTextData.recentPosts.length > 0 ? (
                        <div className="space-y-4">
                          {generatedTextData.recentPosts.map((post, index) => (
                            <div
                              key={index}
                              className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50"
                            >
                              <div className="flex flex-col gap-3">
                                {post.shortcode && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Post ID:</span>
                                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{post.shortcode}</span>
                                  </div>
                                )}
                                {post.caption && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Caption</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words line-clamp-4">
                                      {post.caption}
                                    </p>
                                  </div>
                                )}
                                {post.likes_count !== undefined && (
                                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                    <span>❤️ {post.likes_count || 0} likes</span>
                                    {post.comments_count !== undefined && (
                                      <span>💬 {post.comments_count || 0} comments</span>
                                    )}
                                  </div>
                                )}
                                {post.taken_at && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Posted: {new Date(post.taken_at * 1000).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No recent posts available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignStats;


