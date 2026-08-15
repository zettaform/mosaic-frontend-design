import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import backendAuthService from '../../services/backendAuthService';
import { getApiUrl } from '../../utils/getBackendUrl';
import toast from 'react-hot-toast';

import TopBar from '../../components/snowflake/TopBar';
import FilterBuilder from '../../components/snowflake/FilterBuilder';
import DataGrid from '../../components/snowflake/DataGrid';

import promptTemplatesService from '../../services/promptTemplatesService';
import { Play, Loader2, AlertTriangle } from 'lucide-react';

function escapeSqlIdentifierForUi(name) {
  return String(name || '').replace(/"/g, '""');
}

function parseTableIdForUi(tableId) {
  // Expected: db|schema|table (encoded in the route segment).
  const decoded = decodeURIComponent(String(tableId || ''));
  const parts = decoded.split('|');
  if (parts.length < 3) return null;
  const [dbRaw, schemaRaw, ...rest] = parts;
  const tableRaw = rest.join('|');
  return { db: dbRaw, schema: schemaRaw, table: tableRaw };
}

function sanitizeTemplateName(templateName) {
  const base =
    String(templateName || 'template')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'template';
  return base;
}

function makeTimestampPart(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(
    d.getMinutes()
  )}${pad(d.getSeconds())}`;
}

function extractTemplateVars(content) {
  const text = String(content ?? '');
  const varRegex = /{{\s*([A-Za-z0-9_]+)\s*}}/g;
  const out = [];
  let m;
  while ((m = varRegex.exec(text)) !== null) out.push(m[1]);
  return Array.from(new Set(out));
}

export default function AiTable() {
  const { user } = useAuth();
  const { tableId } = useParams();

  const basePath = '/ai-table';
  const routeInfo = ROUTE_TO_SECTION[basePath];
  const allowed =
    !!user &&
    (String(user.role || '').toLowerCase() === 'admin' ||
      (routeInfo && hasAccess(user, routeInfo.section, routeInfo.page)));

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [schemaLoading, setSchemaLoading] = useState(true);
  const [runningViewer, setRunningViewer] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(null);

  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const authHeaders = useCallback(() => {
    const token = backendAuthService.getSessionToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const tableParts = useMemo(() => parseTableIdForUi(tableId), [tableId]);
  const fqTable = useMemo(() => {
    if (!tableParts) return null;
    const db = String(tableParts.db || '').toUpperCase();
    const schema = String(tableParts.schema || '').toUpperCase();
    const tb = escapeSqlIdentifierForUi(tableParts.table);
    return { db, schema, tb, fq: `${db}.${schema}."${tb}"` };
  }, [tableParts]);

  const sqlRequest = useMemo(() => {
    if (!fqTable) return null;
    // Keep as pure SELECT; backend will apply LIMIT/OFFSET and execute safely.
    return `SELECT * FROM ${fqTable.fq}`;
  }, [fqTable]);

  // Field lists for the grid (derive from first page rows, so AI-added columns appear automatically).
  const fieldNames = useMemo(() => (rows?.[0] ? Object.keys(rows[0]) : []), [rows]);
  const gridFields = useMemo(() => fieldNames, [fieldNames]);

  // AI control panel state
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);
  const [templateIdSelected, setTemplateIdSelected] = useState(null);
  const selectedTemplate = useMemo(
    () => templates.find((t) => String(t.id) === String(templateIdSelected)) || null,
    [templates, templateIdSelected]
  );

  const requiredVars = useMemo(
    () => (selectedTemplate ? extractTemplateVars(selectedTemplate.content) : []),
    [selectedTemplate]
  );

  const [previewTimestamp, setPreviewTimestamp] = useState(() => new Date().toISOString());
  useEffect(() => {
    // Refresh preview name whenever template changes.
    setPreviewTimestamp(new Date().toISOString());
  }, [templateIdSelected]);

  const previewOutputColumnName = useMemo(() => {
    if (!selectedTemplate) return '';
    const d = new Date(previewTimestamp);
    const tsPart = makeTimestampPart(d);
    const base = sanitizeTemplateName(selectedTemplate.name);
    return `ai_${base}_${tsPart}`;
  }, [selectedTemplate, previewTimestamp]);

  const computeOutputColumnName = useCallback(
    (template, iso) => {
      if (!template) return '';
      const d = new Date(iso);
      const tsPart = makeTimestampPart(d);
      const base = sanitizeTemplateName(template.name);
      return `ai_${base}_${tsPart}`;
    },
    []
  );

  const availableColumns = useMemo(() => {
    // Exclude existing AI output columns from the inference selector.
    return fieldNames.filter((c) => !String(c).toLowerCase().startsWith('ai_'));
  }, [fieldNames]);

  const [selectedColumns, setSelectedColumns] = useState([]);

  // Load prompt templates for the current user.
  useEffect(() => {
    if (!user || !allowed) return;
    let cancelled = false;

    const load = async () => {
      setTemplatesLoading(true);
      setTemplatesError(null);
      try {
        const res = await promptTemplatesService.getTemplates(user.email);
        if (cancelled) return;
        if (!res?.success) throw new Error(res?.message || 'Failed to fetch templates');
        setTemplates(Array.isArray(res.templates) ? res.templates : []);
      } catch (e) {
        if (cancelled) return;
        setTemplatesError(e.message || String(e));
        setTemplates([]);
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [allowed, user]);

  // Default template selection (first available).
  useEffect(() => {
    if (templatesLoading) return;
    if (templateIdSelected) return;
    if (templates?.length) setTemplateIdSelected(templates[0].id);
  }, [templates, templatesLoading, templateIdSelected]);

  useEffect(() => {
    // Default select all columns required by the template (case-insensitive match).
    if (!selectedTemplate || !availableColumns.length) return;
    if (!requiredVars.length) {
      // Static template (no {{variable}} placeholders). We still need a column selected
      // for batch-key selection in the backend; choose the first available column.
      setSelectedColumns(availableColumns.slice(0, 1));
      return;
    }

    const availLower = new Map(availableColumns.map((c) => [String(c).toLowerCase(), c]));
    const next = requiredVars.map((v) => availLower.get(String(v).toLowerCase())).filter(Boolean);
    setSelectedColumns(next);
  }, [availableColumns, requiredVars, selectedTemplate]);

  const runViewerQueryImpl = useCallback(
    async (opts = {}) => {
      if (!sqlRequest || !fqTable) return;
      setError(null);

      const silent = opts.silent === true;
      try {
        if (!silent) toast.loading('Refreshing table…', { id: 'ai-view-refresh' });
        setRunningViewer(true);
        const res = await fetch(getApiUrl('/snowflake/query'), {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders(),
          body: JSON.stringify({
            mode: 'sql',
            sql: sqlRequest,
            page,
            pageSize
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || res.statusText);

        setRows(data.rows || []);
        setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : null);
      } catch (e) {
        setError(e.message);
        if (!silent) toast.error(e.message, { id: 'ai-view-refresh' });
      } finally {
        setRunningViewer(false);
        if (!silent) toast.dismiss('ai-view-refresh');
        setSchemaLoading(false);
      }
    },
    [authHeaders, fqTable, page, pageSize, sqlRequest]
  );

  const runViewerQueryRef = useRef(runViewerQueryImpl);
  runViewerQueryRef.current = runViewerQueryImpl;

  // Load health + initial view
  useEffect(() => {
    if (!user || !allowed) return;
    let cancelled = false;
    const boot = async () => {
      try {
        setHealthLoading(true);
        const res = await fetch(getApiUrl('/snowflake/health'), {
          credentials: 'include',
          headers: authHeaders()
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data?.success !== false) setHealth(data);
      } catch {
        if (!cancelled) setHealth({ success: false, error: 'Health check failed' });
      } finally {
        if (!cancelled) setHealthLoading(false);
      }
    };

    void boot();
    void runViewerQueryRef.current({ silent: true });
    return () => {
      cancelled = true;
    };
  }, [allowed, authHeaders, runViewerQueryRef, user]);

  useEffect(() => {
    if (!user || !allowed || schemaLoading) return;
    void runViewerQueryRef.current({ silent: true });
  }, [page, pageSize, user, allowed, schemaLoading]);

  // AI job state
  const [aiJob, setAiJob] = useState(null);
  const lastRefreshedProcessedRowsRef = useRef(0);

  // Model availability state (region/account scoped)
  const [modelAvailability, setModelAvailability] = useState(null);
  const [modelAvailabilityLoading, setModelAvailabilityLoading] = useState(false);
  const [modelAvailabilityError, setModelAvailabilityError] = useState(null);
  const [modelAvailabilityChecked, setModelAvailabilityChecked] = useState(false);
  const [enablingCrossRegion, setEnablingCrossRegion] = useState(false);
  const [enablingCrossRegionError, setEnablingCrossRegionError] = useState(null);

  const anyModelAvailable =
    !!modelAvailability?.models?.some((m) => Boolean(m?.available)) || false;

  const checkModelAvailability = useCallback(async () => {
    if (modelAvailabilityLoading) return;
    setModelAvailabilityLoading(true);
    setModelAvailabilityError(null);

    try {
      const res = await fetch(getApiUrl('/ai-table/models/availability'), {
        method: 'GET',
        credentials: 'include',
        headers: authHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || res.statusText);
      }

      setModelAvailability(data);
      setModelAvailabilityChecked(true);
    } catch (e) {
      setModelAvailability(null);
      setModelAvailabilityChecked(true);
      setModelAvailabilityError(e?.message || String(e));
    } finally {
      setModelAvailabilityLoading(false);
    }
  }, [authHeaders, modelAvailabilityLoading]);

  const enableCrossRegionInference = useCallback(async () => {
    if (enablingCrossRegion) return;
    setEnablingCrossRegion(true);
    setEnablingCrossRegionError(null);

    try {
      const res = await fetch(getApiUrl('/ai-table/enable-cross-region'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ value: 'ANY_REGION' })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || res.statusText);
      }

      toast.success('Cross-region inference enabled. Rechecking models…');
      await checkModelAvailability();
    } catch (e) {
      setEnablingCrossRegionError(e?.message || String(e));
      toast.error(e?.message || String(e));
    } finally {
      setEnablingCrossRegion(false);
    }
  }, [authHeaders, checkModelAvailability, enablingCrossRegion]);

  const startAiEnrichment = useCallback(async () => {
    if (!selectedTemplate) {
      toast.error('Select a prompt template first');
      return;
    }
    if (!selectedColumns.length) {
      toast.error('Select at least one inference column');
      return;
    }

    // Validate required vars are present in the selected columns.
    const selectedLower = new Set(selectedColumns.map((c) => String(c).toLowerCase()));
    for (const v of requiredVars) {
      if (!selectedLower.has(String(v).toLowerCase())) {
        toast.error(`Missing required column for template variable: {{${v}}}`);
        return;
      }
    }

    // Generate a fresh timestamp per run so each job appends into a new AI column.
    const runIso = new Date().toISOString();
    const outputColumnName = computeOutputColumnName(selectedTemplate, runIso);
    if (!outputColumnName) {
      toast.error('Could not generate output column name');
      return;
    }
    setPreviewTimestamp(runIso);

    if (aiJob?.status === 'running' || aiJob?.status === 'queued') {
      toast.error('AI job is already running');
      return;
    }

    setError(null);
    toast.dismiss();
    toast.loading('Starting AI enrichment…', { id: 'ai-start' });
    try {
      if (!tableId) throw new Error('Missing tableId');
      const res = await fetch(getApiUrl(`/ai-table/${encodeURIComponent(tableId)}/enrich`), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({
          promptTemplateId: String(selectedTemplate.id),
          selectedColumns: selectedColumns,
          outputColumnName,
          batchSize: 100
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || res.statusText);

      setAiJob({
        ...data,
        status: data.status || 'queued',
        processedRows: 0,
        completedRows: 0,
        errorRows: 0,
        totalRows: null,
        progressPercent: 0,
        errorKeys: [],
        outputColumnName
      });
      // Reset refresh trigger per new job.
      lastRefreshedProcessedRowsRef.current = 0;
      toast.success('AI enrichment started', { id: 'ai-start' });
    } catch (e) {
      toast.error(e.message || String(e), { id: 'ai-start' });
      setError(e.message || String(e));
    }
  }, [aiJob?.status, authHeaders, computeOutputColumnName, requiredVars, selectedColumns, selectedTemplate, tableId]);

  const pollAiJobAndRefresh = useCallback(async () => {
    if (!aiJob?.jobId) return;
    try {
      const res = await fetch(getApiUrl(`/ai-table/jobs/${encodeURIComponent(aiJob.jobId)}`), {
        credentials: 'include',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || res.statusText);

      const job = data.job;
      setAiJob(job);

      const processed = Number(job?.processedRows ?? 0);
      if (processed > lastRefreshedProcessedRowsRef.current) {
        lastRefreshedProcessedRowsRef.current = processed;
        await runViewerQueryRef.current({ silent: true });
      }
    } catch (e) {
      // Avoid spamming UI with polling failures; just surface once.
      setError((prev) => prev || e.message);
    }
  }, [aiJob?.jobId, authHeaders]);

  useEffect(() => {
    if (!aiJob?.jobId) return;
    if (aiJob.status !== 'queued' && aiJob.status !== 'running') return;

    const interval = setInterval(() => {
      void pollAiJobAndRefresh();
    }, 2000);

    return () => clearInterval(interval);
  }, [aiJob?.jobId, aiJob?.status, pollAiJobAndRefresh]);

  if (!user) return <Navigate to="/signin" replace />;
  if (!allowed) return <Navigate to="/unauthorized" replace />;

  const aiProgressPercent = Math.round(Number(aiJob?.progressPercent ?? 0));
  const aiRowsProcessed = Number(aiJob?.processedRows ?? 0);
  const aiTotalRows = Number(aiJob?.totalRows ?? 0);
  const aiErrorRows = Number(aiJob?.errorRows ?? 0);
  const aiErrorKeys = Array.isArray(aiJob?.errorKeys) ? aiJob.errorKeys : [];

  // We keep the viewer query in sync, but the primary CTA is Run AI Analysis.
  const queryPreview = useMemo(() => {
    const trimmed = String(sqlRequest || '').trim().replace(/;\s*$/i, '');
    if (!trimmed) return '-- Enter a SELECT statement to preview the executed query';
    const offset = Math.max(0, page - 1) * pageSize;
    return `SELECT * FROM (${trimmed}) AS _snowflake_ui_q LIMIT ${pageSize} OFFSET ${offset};`;
  }, [page, pageSize, sqlRequest]);

  const sortColumn = null;
  const sortDirection = 'asc';
  const activeFilterSummary = [];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TopBar
            tableMeta={fqTable ? { fullyQualifiedName: fqTable.fq } : null}
            healthLoading={healthLoading}
            health={health}
            running={runningViewer}
            exporting={false}
            savingTable={false}
            canRunQuery={false}
            canExportResults={false}
            canSaveTable={false}
            onRunQuery={() => {}}
            onExportResults={() => {}}
            onSaveTable={() => {}}
            user={user}
          />

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Panel (SQL preview + data grid) */}
            <div className="w-full md:w-[45%] lg:w-[40%] xl:w-[35%] min-w-[340px] h-full min-h-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 z-10">
              <FilterBuilder
                mode="sql"
                setMode={() => {}}
                logic="AND"
                setLogic={() => {}}
                filters={[]}
                addFilterRow={() => {}}
                removeFilterRow={() => {}}
                handleFilterColumnChange={() => {}}
                updateFilterRow={() => {}}
                handlePhonePresetChange={() => {}}
                getPhonePresetId={() => {}}
                normalizePhoneCode={() => {}}
                fieldNames={fieldNames}
                columns={[]}
                sql={sqlRequest || ''}
                setSql={() => {}}
                setPage={setPage}
                queryPreview={queryPreview}
                activeFilterSummary={activeFilterSummary}
                totalCount={totalCount}
                fromSimulator={false}
                onRunQuery={() => {}}
                disableModeToggle
              />
            </div>

            {/* Right Panel (Results + AI control) */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
              <div className="flex-1 overflow-hidden relative">
                <DataGrid
                  rows={rows}
                  gridFields={gridFields}
                  fieldNames={fieldNames}
                  schemaLoading={schemaLoading}
                  running={runningViewer}
                  fromSimulator={false}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  handleColumnSort={() => {}}
                  page={page}
                  pageSize={pageSize}
                  setPage={setPage}
                  setPageSize={setPageSize}
                  totalCount={totalCount}
                  activeFilterSummary={activeFilterSummary}
                />
              </div>
            </div>

            {/* AI Control Panel */}
            <aside className="w-full sm:w-[420px] md:w-[360px] lg:w-[340px] xl:w-[360px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">AI Control Panel</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Real-time enrichment with Snowflake Cortex
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 text-sm px-4 py-3">
                  {error}
                </div>
              )}

            {/* Model availability (region/account) */}
            <div className="mb-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Model Availability (Region)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Probe which Cortex models are callable from this region.
                  </p>
                </div>
                {modelAvailabilityChecked && (
                  <span
                    className={`px-2 py-1 rounded text-[11px] font-semibold ${
                      anyModelAvailable
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    {anyModelAvailable ? 'Some available' : 'No models available'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => void checkModelAvailability()}
                disabled={modelAvailabilityLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {modelAvailabilityLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-sm">Check Available Models</span>
                )}
              </button>

              {modelAvailabilityError && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400">{modelAvailabilityError}</div>
              )}

              {modelAvailability?.models?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {modelAvailability.models.map((m) => {
                    const available = Boolean(m?.available);
                    return (
                      <div
                        key={String(m?.name)}
                        className={`rounded-lg border p-2 ${
                          available
                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20'
                            : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] font-mono text-slate-700 dark:text-slate-200 break-all">
                            {String(m?.name)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              available
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            {available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        {!available && m?.error && (
                          <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-200 font-mono break-words">
                            {String(m.error)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {String(user?.role || '').toLowerCase() === 'admin' &&
                modelAvailabilityChecked &&
                modelAvailability &&
                !anyModelAvailable && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => void enableCrossRegionInference()}
                      disabled={enablingCrossRegion}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-600 border border-transparent rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      {enablingCrossRegion ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable cross-region inference (Snowflake)'}
                    </button>
                    {enablingCrossRegionError && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">{enablingCrossRegionError}</div>
                    )}
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      This runs an `ALTER ACCOUNT` in Snowflake. You may need Snowflake privileges and may incur cost.
                    </p>
                  </div>
                )}

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                Enrichment will still fall back across the backend’s model candidate list if needed.
              </p>
            </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => void startAiEnrichment()}
                disabled={
                  !selectedTemplate ||
                  aiJob?.status === 'running' ||
                  aiJob?.status === 'queued' ||
                  (modelAvailabilityChecked && modelAvailability && !anyModelAvailable)
                }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {aiJob?.status === 'running' || aiJob?.status === 'queued' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Run AI Analysis
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                    Prompt Template
                  </h3>

                  {templatesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading templates…
                    </div>
                  ) : templatesError ? (
                    <div className="text-sm text-red-600 dark:text-red-400">{templatesError}</div>
                  ) : (
                    <select
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      value={templateIdSelected || ''}
                      onChange={(e) => setTemplateIdSelected(e.target.value || null)}
                    >
                      {templates.length === 0 && <option value="">No templates found</option>}
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                    Column Selector (Inference)
                  </h3>

                  {requiredVars.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Required by template: {requiredVars.map((v) => `{{${v}}}`).join(', ')}
                      </p>
                    </div>
                  )}

                  <div className="max-h-44 overflow-y-auto pr-1 space-y-1">
                    {availableColumns.length === 0 && (
                      <div className="text-sm text-slate-500 dark:text-slate-400">No columns available yet.</div>
                    )}
                    {availableColumns.map((c) => {
                      const checked = selectedColumns.some((s) => String(s).toLowerCase() === String(c).toLowerCase());
                      return (
                        <label
                          key={c}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/60 dark:hover:bg-slate-900/40 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(selectedColumns.map((x) => String(x)));
                              if (e.target.checked) next.add(c);
                              else {
                                // Remove by case-insensitive match
                                for (const item of Array.from(next)) {
                                  if (String(item).toLowerCase() === String(c).toLowerCase()) next.delete(item);
                                }
                              }
                              setSelectedColumns(Array.from(next));
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">{c}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                    Preview Output Column Name
                  </h3>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 dark:text-slate-100 font-mono break-all">
                        {previewOutputColumnName || 'Select a template to preview…'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Saved as a new Snowflake column and updated progressively.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                    Job Progress
                  </h3>

                  {aiJob?.status ? (
                    <>
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2">
                        <span className="font-mono">
                          {aiJob.status.toUpperCase()}
                        </span>
                        <span className="font-mono">{aiProgressPercent}%</span>
                      </div>

                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded overflow-hidden mb-2">
                        <div
                          className="h-full bg-indigo-600"
                          style={{ width: `${aiProgressPercent}%`, transition: 'width 0.2s ease' }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Rows processed</p>
                          <p className="font-mono font-semibold">{aiRowsProcessed.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Rows remaining</p>
                          <p className="font-mono font-semibold">
                            {aiTotalRows > 0 ? Math.max(0, aiTotalRows - aiRowsProcessed).toLocaleString() : '—'}
                          </p>
                        </div>
                      </div>

                      {aiErrorRows > 0 && (
                        <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-2">
                          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm font-semibold">
                            <AlertTriangle className="w-4 h-4" />
                            Errors: {aiErrorRows}
                          </div>
                          {aiErrorKeys.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {aiErrorKeys.map((k) => (
                                <span
                                  key={String(k)}
                                  className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[11px] font-mono"
                                >
                                  {String(k)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {aiJob?.status === 'failed' && aiJob?.error && (
                        <div className="mt-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-2">
                          <div className="text-xs font-semibold text-red-800 dark:text-red-200">AI job failed</div>
                          <p className="mt-1 text-[11px] text-red-800 dark:text-red-200 font-mono break-words">
                            {String(aiJob.error)}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Choose a template and columns, then click <span className="font-semibold">Run AI Analysis</span>.
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

