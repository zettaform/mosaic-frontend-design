import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../../partials/Sidebar';
import Header from '../../partials/Header';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { hasAccess, ROUTE_TO_SECTION } from '../../config/rbac';
import backendAuthService from '../../services/backendAuthService';
import { getApiUrl } from '../../utils/getBackendUrl';
import toast from 'react-hot-toast';

import TopBar from '../../components/snowflake/TopBar';
import FilterBuilder from '../../components/snowflake/FilterBuilder';
import DataGrid from '../../components/snowflake/DataGrid';

const FILTER_OPS = [
  { id: 'eq', label: 'equals' },
  { id: 'ne', label: 'not equals' },
  { id: 'contains', label: 'contains' },
  { id: 'starts', label: 'starts with' },
  { id: 'ends', label: 'ends with' },
  { id: 'gt', label: '>' },
  { id: 'gte', label: '>=' },
  { id: 'lt', label: '<' },
  { id: 'lte', label: '<=' }
];

const FILTER_LABELS = Object.fromEntries(FILTER_OPS.map((op) => [op.id, op.label]));
const PHONE_COUNTRY_OPTIONS = [
  { id: 'IN', label: 'India (+91)', value: '+91' },
  { id: 'US', label: 'US (+1)', value: '+1' },
  { id: 'UK', label: 'UK (+44)', value: '+44' }
];
const SIMULATOR_ROW_COUNT = 500;
const DEFAULT_FILTER_LOGIC = 'AND';

async function parseJsonSafe(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Unexpected non-JSON response (HTTP ${response.status})` };
  }
}

function formatCell(v) {
  if (v == null || v === '') return '—';
  return String(v);
}

function escapeCsvCell(value) {
  if (value == null) return '';
  const normalized =
    value instanceof Date
      ? value.toISOString()
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function buildCsv(rows, columns) {
  const header = columns.map(escapeCsvCell).join(',');
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const value =
          row[column] !== undefined
            ? row[column]
            : row[
                Object.keys(row).find((key) => key.toUpperCase() === String(column).toUpperCase()) || column
              ];
        return escapeCsvCell(value);
      })
      .join(',')
  );
  return `${header}\n${lines.join('\n')}`;
}

function triggerCsvDownload(csvText, filename) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function escapeSqlPreviewValue(value) {
  return String(value).replace(/'/g, "''");
}

function formatSqlPreviewValue(value) {
  if (value == null || value === '') return "''";
  if (typeof value === 'number') return String(value);
  return `'${escapeSqlPreviewValue(value)}'`;
}

function normalizePhoneCode(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  const compact = trimmed.replace(/\s+/g, '');
  const cleaned = compact.replace(/[^+\d]/g, '');
  const digits = cleaned.replace(/\+/g, '');
  if (!digits) return '';
  return `+${digits}`;
}

function getPhonePresetId(value) {
  const normalized = normalizePhoneCode(value);
  if (!normalized) return '';
  const preset = PHONE_COUNTRY_OPTIONS.find((option) => option.value === normalized);
  return preset ? preset.id : 'CUSTOM';
}

function describeFilter(filter) {
  const value = String(filter.value || '').trim();
  if (!value) return null;
  return `${filter.column} ${FILTER_LABELS[filter.op] || filter.op} ${value}`;
}

function buildStructuredPreview({ tableMeta, columns, filters, logic, page, pageSize, sortColumn, sortDirection }) {
  if (!tableMeta?.fullyQualifiedName) return '-- Loading schema…';
  const validFilters = filters.filter((filter) => filter.column && String(filter.value || '').trim() !== '');
  const projection = columns.length ? columns.join(', ') : '*';
  const orderColumn = sortColumn || (columns.includes('EXTERNAL_ID') ? 'EXTERNAL_ID' : null);
  const whereClause = validFilters.length
    ? `\nWHERE\n  ${validFilters
        .map((filter) => {
          const rawValue = String(filter.value || '').trim();
          const phoneValue = filter.column?.toUpperCase() === 'PHONE' ? normalizePhoneCode(rawValue) : rawValue;
          if (filter.column?.toUpperCase() === 'PHONE' && phoneValue && ['eq', 'starts'].includes(filter.op)) {
            return `${filter.column} LIKE ${formatSqlPreviewValue(`${phoneValue}%`)}`;
          }
          if (filter.op === 'contains') return `${filter.column} ILIKE ${formatSqlPreviewValue(`%${rawValue}%`)}`;
          if (filter.op === 'starts') return `${filter.column} ILIKE ${formatSqlPreviewValue(`${rawValue}%`)}`;
          if (filter.op === 'ends') return `${filter.column} ILIKE ${formatSqlPreviewValue(`%${rawValue}`)}`;
          const sqlOp =
            {
              eq: '=',
              ne: '!=',
              gt: '>',
              gte: '>=',
              lt: '<',
              lte: '<='
            }[filter.op] || '=';
          return `${filter.column} ${sqlOp} ${formatSqlPreviewValue(rawValue)}`;
        })
        .join(`\n  ${logic} `)}`
    : '\n-- Add at least one filter to preview the WHERE clause';

  const orderClause = orderColumn ? `\nORDER BY ${orderColumn} ${(sortDirection || 'asc').toUpperCase()}` : '';
  const offset = Math.max(0, page - 1) * pageSize;
  return `SELECT ${projection}
FROM ${tableMeta.fullyQualifiedName}${whereClause}${orderClause}
LIMIT ${pageSize} OFFSET ${offset};`;
}

function buildSqlPreview(sql, page, pageSize, sortColumn, sortDirection) {
  const trimmed = String(sql || '').trim().replace(/;\s*$/i, '');
  if (!trimmed) return '-- Enter a SELECT statement to preview the executed query';
  const orderClause = sortColumn ? ` ORDER BY ${sortColumn} ${(sortDirection || 'asc').toUpperCase()}` : '';
  const offset = Math.max(0, page - 1) * pageSize;
  return `SELECT * FROM (${trimmed}) AS _snowflake_ui_q${orderClause} LIMIT ${pageSize} OFFSET ${offset};`;
}

function normalizeSelectedTableContext(raw) {
  if (!raw) return null;
  const database = String(raw.database_name || raw.database || '').trim();
  const schema = String(raw.schema_name || raw.schema || '').trim();
  const table = String(raw.table_name || raw.table || '').trim();
  if (!database || !schema || !table) return null;
  return { database, schema, table };
}

function SnowflakeQuery() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const routeInfo = ROUTE_TO_SECTION[location.pathname];
  const allowed = user && routeInfo && hasAccess(user, routeInfo.section, routeInfo.page);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState('sql');
  const [columns, setColumns] = useState([]);
  const [tableMeta, setTableMeta] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [sql, setSql] = useState('');
  const filterIdRef = useRef(1);
  const buildFilterRow = useCallback((overrides = {}) => {
    const nextColumn = overrides.column ?? '';
    const phoneColumn = String(nextColumn || '').toUpperCase() === 'PHONE';
    return {
      id: overrides.id || `filter-${filterIdRef.current++}`,
      column: nextColumn,
      op: overrides.op || (phoneColumn ? 'starts' : 'eq'),
      value: overrides.value ?? ''
    };
  }, []);
  const [filters, setFilters] = useState(() => [buildFilterRow()]);
  const [logic, setLogic] = useState(DEFAULT_FILTER_LOGIC);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [totalCount, setTotalCount] = useState(null);
  const [fromSimulator, setFromSimulator] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [lastSuccessCoreKey, setLastSuccessCoreKey] = useState(null);
  const [savingTable, setSavingTable] = useState(false);
  const [selectedTableContext, setSelectedTableContext] = useState(null);

  const lastFqRef = useRef('');
  const bootQueryDone = useRef(false);
  const paginateSigRef = useRef(null);
  const processedSavedLoadKeyRef = useRef(null);

  const fieldNames = useMemo(() => columns.map((c) => c.name).filter(Boolean), [columns]);
  const defaultFilterColumn = fieldNames[0] || '';

  const validStructuredFilters = useMemo(
    () =>
      filters
        .map((filter) => ({
          column: filter.column,
          op: filter.op || 'eq',
          value: String(filter.value ?? '').trim()
        }))
        .filter((filter) => filter.column && filter.value !== ''),
    [filters]
  );

  const canRunStructuredQuery = validStructuredFilters.length > 0;
  const canRunQuery = mode === 'filter' ? canRunStructuredQuery : sql.trim() !== '';
  const canExportResults =
    !fromSimulator && canRunQuery && !running && !schemaLoading && !simulatorRunning && !exporting;

  const structuredPayload = useMemo(
    () => validStructuredFilters.map((filter) => ({ ...filter })),
    [validStructuredFilters]
  );

  const requestBody = useMemo(() => {
    const body =
      mode === 'filter'
        ? {
            mode: 'filter',
            filters: structuredPayload,
            logic,
            page,
            pageSize
          }
        : {
            mode: 'sql',
            sql,
            page,
            pageSize
          };

    if (sortColumn) {
      body.sortColumn = sortColumn;
      body.sortDirection = sortDirection;
    }
    if (selectedTableContext) {
      body.database = selectedTableContext.database;
      body.schema = selectedTableContext.schema;
      body.table = selectedTableContext.table;
    }

    return body;
  }, [logic, mode, page, pageSize, selectedTableContext, sortColumn, sortDirection, sql, structuredPayload]);

  const coreQueryKey = useMemo(() => {
    if (mode === 'filter') {
      return JSON.stringify({ mode: 'filter', filters: structuredPayload, logic });
    }
    return JSON.stringify({ mode: 'sql', sql: sql.trim() });
  }, [mode, sql, structuredPayload, logic]);

  const savedTableFromUrl = useMemo(() => {
    const sp = new URLSearchParams(location.search || '');
    const db = sp.get('db') || sp.get('database') || sp.get('database_name') || '';
    const schema = sp.get('schema') || sp.get('schema_name') || '';
    const table = sp.get('table') || sp.get('table_name') || '';
    if (!db || !schema || !table) return null;
    return { database_name: db, schema_name: schema, table_name: table };
  }, [location.search]);

  const savedTableFromState = useMemo(() => location.state?.loadSavedTable ?? null, [location.state]);

  const effectiveSavedTable = useMemo(() => savedTableFromState || savedTableFromUrl, [savedTableFromState, savedTableFromUrl]);

  const savedLoadKey = useMemo(() => {
    const st = effectiveSavedTable;
    if (!st?.database_name || !st?.schema_name || !st?.table_name) return null;
    return `${st.database_name}|${st.schema_name}|${st.table_name}`;
  }, [effectiveSavedTable]);

  const gridFields = useMemo(() => {
    const fromSchema = fieldNames;
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]);
      const upper = new Set(keys.map((k) => k.toUpperCase()));
      const matched = fromSchema.filter((field) => upper.has(field.toUpperCase()));
      if (matched.length > 0) {
        // Preserve schema ordering, but also append any extra keys (e.g., AI-added columns)
        const matchedUpper = new Set(matched.map((m) => m.toUpperCase()));
        const extras = keys.filter((k) => !matchedUpper.has(k.toUpperCase()));
        return [...matched, ...extras];
      }
      return keys;
    }
    return fromSchema;
  }, [fieldNames, rows]);

  const activeFilterSummary = useMemo(
    () => validStructuredFilters.map((filter) => describeFilter(filter)).filter(Boolean),
    [validStructuredFilters]
  );

  const queryPreview = useMemo(() => {
    if (mode === 'filter') {
      return buildStructuredPreview({
        tableMeta,
        columns: fieldNames,
        filters: validStructuredFilters,
        logic,
        page,
        pageSize,
        sortColumn,
        sortDirection
      });
    }
    return buildSqlPreview(sql, page, pageSize, sortColumn, sortDirection);
  }, [fieldNames, logic, mode, page, pageSize, sortColumn, sortDirection, sql, tableMeta, validStructuredFilters]);

  useEffect(() => {
    if (!tableMeta?.database) return;
    const fq = `${tableMeta.database}.${tableMeta.schema}.${tableMeta.table}`;
    if (lastFqRef.current !== fq) {
      lastFqRef.current = fq;
      setSql(`SELECT * FROM ${fq}`);
      bootQueryDone.current = false;
      paginateSigRef.current = null;
    }
  }, [tableMeta]);

  const authHeaders = useCallback(() => {
    const token = backendAuthService.getSessionToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const resetStructuredFilters = useCallback(() => {
    setFilters([buildFilterRow({ column: defaultFilterColumn })]);
    setLogic(DEFAULT_FILTER_LOGIC);
    setPage(1);
  }, [buildFilterRow, defaultFilterColumn]);

  const loadSchema = useCallback(async () => {
    setSchemaLoading(true);
    setError(null);
    bootQueryDone.current = false;
    paginateSigRef.current = null;
    try {
      const qs = new URLSearchParams();
      if (selectedTableContext) {
        qs.set('database', selectedTableContext.database);
        qs.set('schema', selectedTableContext.schema);
        qs.set('table', selectedTableContext.table);
      }
      const url = `${getApiUrl('/snowflake/schema')}${qs.toString() ? `?${qs}` : ''}`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      setTableMeta({
        database: data.database,
        schema: data.schema,
        table: data.table,
        fullyQualifiedName: data.fullyQualifiedName,
        warehouse: data.warehouse,
        role: data.role,
        account: data.account
      });
      const nextColumns = data.columns || [];
      setColumns(nextColumns);
      const nextDefaultColumn = nextColumns[0]?.name || '';
      setFilters((prev) => {
        if (!prev.length) return [buildFilterRow({ column: nextDefaultColumn })];
        return prev.map((row) => {
          const exists = nextColumns.some((column) => column.name === row.column);
          if (exists) return row;
          return {
            ...row,
            column: nextDefaultColumn,
            op: String(nextDefaultColumn).toUpperCase() === 'PHONE' ? 'starts' : row.op || 'eq'
          };
        });
      });
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSchemaLoading(false);
    }
  }, [authHeaders, buildFilterRow, selectedTableContext]);

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(getApiUrl('/snowflake/health'), {
        credentials: 'include',
        headers: authHeaders()
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setHealth(data);
      } else {
        setHealth({
          success: false,
          error: data.error || data.message || `HTTP ${res.status}`
        });
      }
    } catch {
      setHealth({ success: false, error: 'Network error reaching API' });
    } finally {
      setHealthLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (!user || !allowed) return;
    loadSchema();
    checkHealth();
  }, [allowed, checkHealth, loadSchema, user]);

  const runQueryImpl = useCallback(
    async (opts = {}) => {
      setRunning(true);
      setError(null);
      setFromSimulator(false);
      const successKeySnapshot = coreQueryKey;
      try {
        const res = await fetch(getApiUrl('/snowflake/query'), {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders(),
          body: JSON.stringify(requestBody)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || res.statusText);
        setRows(data.rows || []);
        setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : null);
        setLastSuccessCoreKey(successKeySnapshot);
        if (!opts.silent) {
          toast.success(
            `Page ${data.page}: ${data.rows?.length ?? 0} rows · ${(data.totalCount ?? 0).toLocaleString()} total in result set`
          );
        }
      } catch (e) {
        setLastSuccessCoreKey(null);
        setError(e.message);
        toast.error(e.message);
      } finally {
        setRunning(false);
      }
    },
    [authHeaders, requestBody, coreQueryKey]
  );

  const runQueryRef = useRef(runQueryImpl);
  runQueryRef.current = runQueryImpl;

  useEffect(() => {
    if (!user || !allowed || schemaLoading) return;
    if (!backendAuthService.getSessionToken()) return;
    if (!canRunQuery) return;
    if (bootQueryDone.current) return;
    bootQueryDone.current = true;
    void runQueryRef.current({ silent: true });
  }, [allowed, canRunQuery, schemaLoading, user]);

  useEffect(() => {
    if (!bootQueryDone.current) return;
    if (!user || !allowed || schemaLoading || fromSimulator) return;
    if (!backendAuthService.getSessionToken()) return;
    if (!canRunQuery) return;
    const sig = JSON.stringify({ page, pageSize, sortColumn, sortDirection, mode });
    if (paginateSigRef.current === null) {
      paginateSigRef.current = sig;
      return;
    }
    if (paginateSigRef.current === sig) return;
    paginateSigRef.current = sig;
    void runQueryRef.current({ silent: true });
  }, [allowed, canRunQuery, fromSimulator, mode, page, pageSize, schemaLoading, sortColumn, sortDirection, user]);

  const runQuery = useCallback(async () => {
    bootQueryDone.current = true;
    await runQueryImpl();
  }, [runQueryImpl]);

  const canSaveTable =
    lastSuccessCoreKey != null &&
    lastSuccessCoreKey === coreQueryKey &&
    !fromSimulator &&
    !running &&
    !schemaLoading;

  const handleSaveTable = useCallback(async () => {
    if (!canSaveTable) return;
    const raw = window.prompt('Table name (letters, numbers, underscores):', '');
    if (raw === null) return;
    const trimmed = String(raw).trim();
    if (!trimmed) {
      toast.error('Table name is required');
      return;
    }
    setSavingTable(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/snowflake/save-table'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({
          ...requestBody,
          tableName: trimmed
        })
      });
      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      toast.success(`Saved as ${data.fullyQualifiedName || data.tableName}`);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSavingTable(false);
    }
  }, [authHeaders, canSaveTable, requestBody]);

  useEffect(() => {
    if (!savedLoadKey) {
      processedSavedLoadKeyRef.current = null;
    }
  }, [savedLoadKey]);

  useEffect(() => {
    if (!effectiveSavedTable) return;
    const normalized = normalizeSelectedTableContext(effectiveSavedTable);
    if (!normalized) return;
    setSelectedTableContext(normalized);
  }, [effectiveSavedTable]);

  useEffect(() => {
    if (!user || !allowed || schemaLoading) return;
    if (!savedLoadKey) return;
    if (processedSavedLoadKeyRef.current === savedLoadKey) return;
    const st = effectiveSavedTable;
    if (!st?.database_name || !st?.schema_name || !st?.table_name) return;

    processedSavedLoadKeyRef.current = savedLoadKey;
    const db = String(st.database_name);
    const sc = String(st.schema_name);
    const tb = String(st.table_name).replace(/"/g, '""');
    const q = `SELECT * FROM ${db}.${sc}."${tb}" LIMIT 100`;

    setMode('sql');
    setSql(q);
    setPage(1);
    setSortColumn(null);
    setSortDirection('asc');
    setFromSimulator(false);
    setLastSuccessCoreKey(null);
    const normalized = normalizeSelectedTableContext(st);
    setSelectedTableContext(normalized);
    // Let the boot query effect run once with the updated SQL state.
    bootQueryDone.current = false;
    paginateSigRef.current = null;
    navigate('/snowflake-query', { replace: true, state: {} });
  }, [user, allowed, schemaLoading, savedLoadKey, effectiveSavedTable, navigate]);

  const runSimulator = useCallback(async () => {
    setSimulatorRunning(true);
    setError(null);
    setLastSuccessCoreKey(null);
    try {
      const res = await fetch(getApiUrl('/snowflake/sample'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ limit: SIMULATOR_ROW_COUNT })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      setRows(data.rows || []);
      setPageSize(Math.min(SIMULATOR_ROW_COUNT, data.limit || SIMULATOR_ROW_COUNT));
      setPage(1);
      setFromSimulator(true);
      setSortColumn(null);
      setTotalCount(Array.isArray(data.rows) ? data.rows.length : null);
      const src = data.sourceTable || 'configured table';
      if (data.usedFallback) {
        toast.success(
          `Simulator: ${data.rowCount} rows from ${src} (ingest table has ${data.ingestRowCount ?? 0} rows — sample fallback)`
        );
      } else {
        toast.success(`Simulator: ${data.rowCount} rows from ${src}`);
      }
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setSimulatorRunning(false);
    }
  }, [authHeaders]);

  const handleExportResults = useCallback(async (options = {}) => {
    if (!canExportResults) return;
    const scope = options?.scope === 'page' ? 'page' : 'full';

    if (scope === 'page') {
      const exportColumns = gridFields.length ? gridFields : fieldNames;
      if (!exportColumns.length) {
        toast.error('No columns available to export');
        return;
      }
      const csv = buildCsv(rows, exportColumns);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      triggerCsvDownload(csv, `snowflake-current-page-${stamp}.csv`);
      toast.success(`Exported ${rows.length.toLocaleString()} rows from current page`);
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/snowflake/export'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ ...requestBody, scope: 'full' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || res.statusText);
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white dark:bg-slate-900 shadow-lg rounded-lg pointer-events-auto border border-slate-200 dark:border-slate-700 p-4`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Full export queued</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Export is processing in the background.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              Close
            </button>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/snowflake-exports');
              }}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Open Exports
            </button>
          </div>
        </div>
      ));
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  }, [authHeaders, canExportResults, fieldNames, gridFields, navigate, requestBody, rows]);

  const handleColumnSort = useCallback(
    (field) => {
      if (fromSimulator) return;
      setSortColumn((prev) => {
        if (prev && prev.toUpperCase() === field.toUpperCase()) {
          setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
          return prev;
        }
        setSortDirection('asc');
        return field;
      });
      setPage(1);
    },
    [fromSimulator]
  );

  const filteredCatalogColumns = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    if (!query) return columns;
    return columns.filter((column) => {
      const haystack = [column.name, column.dataType, column.isNullable, column.columnDefault]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [catalogSearch, columns]);

  const updateFilterRow = useCallback((id, updater) => {
    setFilters((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        return typeof updater === 'function' ? updater(row) : { ...row, ...updater };
      })
    );
    setPage(1);
  }, []);

  const addFilterRow = useCallback(() => {
    setFilters((prev) => [...prev, buildFilterRow({ column: defaultFilterColumn })]);
    setPage(1);
  }, [buildFilterRow, defaultFilterColumn]);

  const removeFilterRow = useCallback(
    (id) => {
      setFilters((prev) => {
        const next = prev.filter((row) => row.id !== id);
        return next.length ? next : [buildFilterRow({ column: defaultFilterColumn })];
      });
      setPage(1);
    },
    [buildFilterRow, defaultFilterColumn]
  );

  const handleFilterColumnChange = useCallback(
    (id, column) => {
      updateFilterRow(id, (row) => {
        const isPhone = String(column || '').toUpperCase() === 'PHONE';
        return {
          ...row,
          column,
          op: isPhone ? 'starts' : row.op || 'eq',
          value: isPhone ? normalizePhoneCode(row.value) : row.value
        };
      });
    },
    [updateFilterRow]
  );

  const handlePhonePresetChange = useCallback(
    (id, presetId) => {
      if (!presetId) {
        updateFilterRow(id, { op: 'starts', value: '' });
        return;
      }
      if (presetId === 'CUSTOM') {
        updateFilterRow(id, { op: 'starts', value: '' });
        return;
      }
      const preset = PHONE_COUNTRY_OPTIONS.find((option) => option.id === presetId);
      updateFilterRow(id, { op: 'starts', value: preset?.value || '' });
    },
    [updateFilterRow]
  );

  const totalPages = totalCount != null && pageSize > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;

  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="sidebar-shell-main-noscroll">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TopBar
            tableMeta={tableMeta}
            healthLoading={healthLoading}
            health={health}
            running={running}
            exporting={exporting}
            savingTable={savingTable}
            canRunQuery={canRunQuery}
            canExportResults={canExportResults}
            canSaveTable={canSaveTable}
            onRunQuery={runQuery}
            onExportResults={handleExportResults}
            onSaveTable={handleSaveTable}
            user={user}
          />
          
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Panel (Filters) — min-h-0 so nested scroll areas work inside overflow-hidden shell */}
            <div className="w-full md:w-[30%] lg:w-[25%] xl:w-[22%] min-w-[300px] h-full min-h-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 z-10">
              <FilterBuilder
                mode={mode}
                setMode={setMode}
                logic={logic}
                setLogic={setLogic}
                filters={filters}
                addFilterRow={addFilterRow}
                removeFilterRow={removeFilterRow}
                handleFilterColumnChange={handleFilterColumnChange}
                updateFilterRow={updateFilterRow}
                handlePhonePresetChange={handlePhonePresetChange}
                getPhonePresetId={getPhonePresetId}
                normalizePhoneCode={normalizePhoneCode}
                fieldNames={fieldNames}
                columns={columns}
                sql={sql}
                setSql={setSql}
                setPage={setPage}
                queryPreview={queryPreview}
                activeFilterSummary={activeFilterSummary}
                totalCount={totalCount}
                fromSimulator={fromSimulator}
                onRunQuery={runQuery}
              />
            </div>
            
            {/* Right Panel (Results) */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
              {error && (
                <div className="m-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 text-sm px-4 py-3 shrink-0">
                  {error}
                </div>
              )}
              
              <DataGrid
                rows={rows}
                gridFields={gridFields}
                fieldNames={fieldNames}
                schemaLoading={schemaLoading}
                running={running}
                fromSimulator={fromSimulator}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                handleColumnSort={handleColumnSort}
                page={page}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                totalCount={totalCount}
                activeFilterSummary={activeFilterSummary}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SnowflakeQuery;
