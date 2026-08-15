import React, { useEffect, useMemo, useRef } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import '../../css/snowflake-tabulator.css';

const BIO_FIELD_NAME = 'BIO';
const CELL_PREVIEW_LIMIT = 160; // compact in-table preview
const MODAL_CONTENT_LIMIT = 900; // "high level" content on hover

function normalizeCellValue(v) {
  if (v == null) return '';
  if (typeof v === 'bigint') return v.toString();
  return v;
}

function isBioField(field) {
  return String(field || '').toUpperCase() === BIO_FIELD_NAME;
}

function escapeHtml(input) {
  // Basic escaping for HTML formatter output.
  return String(input ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeHtmlAttr(input) {
  // For attributes (same escaping as HTML, but kept separate for clarity).
  return escapeHtml(input);
}

function truncateText(input, limit) {
  const str = String(input ?? '');
  if (!str) return '—';
  if (str.length <= limit) return str;
  return `${str.slice(0, limit).trimEnd()}…`;
}

/**
 * Align row keys to known field names (Snowflake often returns uppercase keys).
 */
export function normalizeRowsForFields(rows, fields) {
  if (!rows?.length || !fields?.length) return [];
  return rows.map((row) => {
    const out = {};
    for (const f of fields) {
      let v = row[f];
      if (v === undefined) {
        const match = Object.keys(row).find((k) => k.toUpperCase() === f.toUpperCase());
        v = match !== undefined ? row[match] : '';
      }
      out[f] = normalizeCellValue(v);
    }
    return out;
  });
}

function fieldMatchesSort(field, sortColumn) {
  if (!sortColumn) return false;
  return field.toUpperCase() === String(sortColumn).toUpperCase();
}

/**
 * Data grid: server-side sort (Snowflake ORDER BY) or local sort (simulator / offline).
 */
export default function SnowflakeTabulatorGrid({
  rows,
  fields,
  emptyMessage,
  /** When true, column clicks call onColumnSort; sort indicators reflect server state */
  serverSideSort = false,
  sortColumn = null,
  sortDirection = 'asc',
  onColumnSort,
  loading = false
}) {
  const hostRef = useRef(null);
  const tableRef = useRef(null);
  const tableBuiltRef = useRef(false);
  const pendingColumnsRef = useRef(null);
  const pendingDataRef = useRef(null);

  const tabColumns = useMemo(() => {
    if (!fields?.length) {
      return [{ title: '—', field: '_empty', headerSort: false }];
    }

    const bioFormatter = (cell) => {
      const raw = normalizeCellValue(cell.getValue());
      const cellPreview = truncateText(raw, CELL_PREVIEW_LIMIT);
      const modalContent = truncateText(raw, MODAL_CONTENT_LIMIT);
      // Avoid raw newlines inside HTML attributes; decode back for the popover.
      const modalContentForAttr = modalContent.replace(/\r?\n/g, '\\n');

      // Keep the formatter output compact. Hover/modal content is delivered via data attribute.
      return `
        <div
          class="sf-bio-cell"
          tabindex="0"
          role="button"
          aria-describedby="sf-bio-hover-modal"
          data-bio-full="${escapeHtmlAttr(modalContentForAttr)}"
        >
          <span class="sf-bio-cell-text">${escapeHtml(cellPreview)}</span>
        </div>
      `;
    };

    return fields.map((f) => {
      const col = {
        field: f,
        minWidth: isBioField(f) ? 200 : 140,
        width: isBioField(f) ? 200 : undefined,
        maxWidth: isBioField(f) ? 240 : undefined,
        resizable: true,
        formatter: isBioField(f) ? bioFormatter : 'plaintext',
        headerFilter: 'input',
        headerFilterPlaceholder: 'Filter…'
      };

      if (isBioField(f)) {
        // Use a smaller header filter box and avoid extra vertical space.
        col.headerFilterPlaceholder = 'Search…';
      }

      if (serverSideSort && typeof onColumnSort === 'function') {
        col.headerSort = false;
        col.titleFormatter = () => {
          const wrap = document.createElement('button');
          wrap.type = 'button';
          wrap.className =
            'sf-th-sort w-full text-left flex items-center justify-between gap-2 px-1 py-1 -mx-1 rounded font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
          const label = document.createElement('span');
          label.className = 'truncate';
          label.textContent = f;
          const ind = document.createElement('span');
          ind.className = 'shrink-0 text-xs tabular-nums opacity-70';
          const active = fieldMatchesSort(f, sortColumn);
          if (active) {
            ind.textContent = sortDirection === 'desc' ? '▼' : '▲';
            wrap.setAttribute('aria-sort', sortDirection === 'desc' ? 'descending' : 'ascending');
          } else {
            ind.textContent = '⇅';
            wrap.setAttribute('aria-sort', 'none');
          }
          wrap.appendChild(label);
          wrap.appendChild(ind);
          wrap.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onColumnSort(f);
          });
          return wrap;
        };
        col.title = f;
      } else {
        col.title = f;
        col.headerSort = true;
      }
      return col;
    });
  }, [fields, serverSideSort, onColumnSort, sortColumn, sortDirection]);

  const data = useMemo(() => normalizeRowsForFields(rows, fields), [rows, fields]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;

    tableBuiltRef.current = false;
    pendingColumnsRef.current = null;
    pendingDataRef.current = null;

    if (tableRef.current) {
      tableRef.current.destroy();
      tableRef.current = null;
    }

    // Hover modal (popover) for BIO cells. Implemented via direct DOM for instant show/hide.
    const overlay = document.createElement('div');
    overlay.id = 'sf-bio-hover-modal';
    overlay.className = 'sf-bio-hover-modal';
    overlay.setAttribute('role', 'tooltip');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="sf-bio-hover-modal-title">Bio</div>
      <div class="sf-bio-hover-modal-content"></div>
    `;
    document.body.appendChild(overlay);
    const overlayContent = overlay.querySelector('.sf-bio-hover-modal-content');

    function hideOverlay() {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      if (overlayContent) overlayContent.textContent = '';
    }

    function showOverlayFromTarget(targetEl, bioText) {
      if (!targetEl || !(targetEl instanceof HTMLElement)) return;
      const rect = targetEl.getBoundingClientRect();

      // Place popover to the right when possible, otherwise to the left.
      const margin = 12;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(420, vw - margin * 2);
      const maxHeight = 240;

      let x = rect.right + margin;
      if (x + width > vw - margin) {
        x = rect.left - margin - width;
      }
      let y = rect.top;
      if (y + maxHeight > vh - margin) {
        y = vh - margin - maxHeight;
      }
      if (y < margin) y = margin;

      overlay.style.width = `${width}px`;
      overlay.style.left = `${x}px`;
      overlay.style.top = `${y}px`;

      if (overlayContent) overlayContent.textContent = bioText;
      overlay.style.display = 'block';
      overlay.setAttribute('aria-hidden', 'false');
    }

    function showOverlayFromCell(cell, e) {
      const field = cell?.getField?.();
      if (!isBioField(field)) return;

      const cellEl = cell?.getElement?.();
      const bioEl =
        (cellEl && cellEl.querySelector && cellEl.querySelector('.sf-bio-cell')) ||
        (e?.target instanceof HTMLElement && e.target.closest && e.target.closest('.sf-bio-cell'));

      const bioText =
        (bioEl?.dataset?.bioFull ? bioEl.dataset.bioFull : truncateText(cell?.getValue?.(), MODAL_CONTENT_LIMIT)) ||
        '—';

      // Decode newlines if present.
      const bioTextDecoded = String(bioText).replace(/\\n/g, '\n');

      showOverlayFromTarget(bioEl || cellEl || e?.target, bioTextDecoded);
    }

    const table = new Tabulator(el, {
      data,
      columns: tabColumns,
      layout: 'fitDataStretch',
      height: serverSideSort ? 620 : 560,
      pagination: serverSideSort ? false : 'local',
      paginationSize: serverSideSort ? undefined : 50,
      paginationSizeSelector: serverSideSort ? undefined : [25, 50, 100, 200, 500],
      paginationCounter: serverSideSort ? undefined : 'rows',
      movableColumns: true,
      clipboard: true,
      placeholder: emptyMessage || 'No rows — run a query or use the simulator.'
    });

    tableRef.current = table;

    const flushPendingUpdates = () => {
      if (pendingColumnsRef.current) {
        table.setColumns(pendingColumnsRef.current);
        pendingColumnsRef.current = null;
      }

      if (pendingDataRef.current) {
        const nextData = pendingDataRef.current;
        pendingDataRef.current = null;
        table.replaceData(nextData).catch(() => {
          table.setData(nextData);
        });
      }
    };

    const onTableBuilt = () => {
      tableBuiltRef.current = true;
      flushPendingUpdates();
    };

    table.on('tableBuilt', onTableBuilt);
    table.on('table-built', onTableBuilt);

    const onCellMouseEnter = (e, cell) => showOverlayFromCell(cell, e);
    const onCellMouseLeave = () => hideOverlay();

    // Tabulator emits lowercase/hyphenated events internally.
    // We register both variants to be robust across Tabulator builds.
    table.on('cellMouseEnter', onCellMouseEnter);
    table.on('cellMouseLeave', onCellMouseLeave);
    table.on('cell-mouseenter', onCellMouseEnter);
    table.on('cell-mouseleave', onCellMouseLeave);

    const onFocusIn = (ev) => {
      const target = ev?.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.classList.contains('sf-bio-cell')) return;
      const bioText = target.dataset?.bioFull || '—';
      const decoded = String(bioText).replace(/\\n/g, '\n');
      showOverlayFromTarget(target, decoded);
    };

    const onFocusOut = () => hideOverlay();

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      tableBuiltRef.current = false;
      pendingColumnsRef.current = null;
      pendingDataRef.current = null;
      table.destroy();
      tableRef.current = null;
      hideOverlay();
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      overlay.remove();
    };
  }, [emptyMessage, serverSideSort]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    if (!tableBuiltRef.current) {
      pendingColumnsRef.current = tabColumns;
      return;
    }
    table.setColumns(tabColumns);
  }, [tabColumns]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    if (!tableBuiltRef.current) {
      pendingDataRef.current = data;
      return;
    }
    // Update data in-place to avoid tearing down/reinitializing Tabulator on every query refresh.
    table.replaceData(data).catch(() => {
      table.setData(data);
    });
  }, [data]);

  return (
    <div className="relative snowflake-tabulator-host w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-950">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-[1px]">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading…</span>
        </div>
      ) : null}
      <div ref={hostRef} className="w-full" />
    </div>
  );
}
