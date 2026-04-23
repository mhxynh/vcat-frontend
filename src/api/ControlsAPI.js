import * as XLSX from 'xlsx';
import { objectToSnakeCase } from '../utils/transformer';
import { authFetch, API_BASE } from './apiClient';

export async function deleteControl(vgcpid, { hard = false } = {}) {
  const url = new URL(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`);
  if (hard) url.searchParams.set('hard', 'true');

  const resp = await authFetch(url.toString(), {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Delete failed (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

export async function fetchControls() {
  const resp = await authFetch(`${API_BASE}/controls`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch controls (HTTP ${resp.status})`);
  }

  const data = await resp.json();
  if (!Array.isArray(data)) return [];

  return data;
}

//schemas are: control_id, vgcpid, description, control_owner, control_sme, escalation, is_active, date_created, last_tested

export function mapControlRowToUi(control) {
  const lastTested = control.last_tested ?? null;

  return {
    id: control.vgcpid,
    controlId: control.control_id ?? null,
    status: control.is_active ? 'Active' : 'Retired',
    testing: lastTested ? `Last Tested on ${lastTested}` : 'Not Tested Yet',
    description: control.description ?? null,
    dateCreated: control.date_created ?? null,
    lastTested: lastTested,
    owner: control.control_owner,
    sme: control.control_sme ?? null,
    escalationRequired: control.escalation ? 'Yes' : 'No',
  };
}

export async function createControl(payload) {
  const resp = await authFetch(`${API_BASE}/controls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(objectToSnakeCase(payload)),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg =
      data?.error ||
      (Array.isArray(data?.missing) ? `Missing: ${data.missing.join(', ')}` : null) ||
      `Failed to create control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

export async function updateControl(vgcpid, updates) {
  const resp = await authFetch(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(objectToSnakeCase(updates)),
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Failed to update control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

export async function retireControl(vgcpid) {
  const resp = await authFetch(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Failed to retire control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

export async function fetchControlByVgcpid(vgcpid) {
  const resp = await authFetch(`${API_BASE}/controls/${encodeURIComponent(vgcpid)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Failed to fetch control (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  return data;
}

/** Headers the importing lambda accepts (see vcat-backend importing/main.py FIELD_TO_HEADER). */
const IMPORT_CSV_REQUIRED_SUBSTRINGS = [
  'control id',
  'description',
  'control owner',
  'control sme',
  'escalation needed',
];

/** Excel inserts a first row like sep=, or sep=; when saving CSV — it is not the column header row. */
function lineIsExcelCsvSepDirective(rawLine) {
  const s = String(rawLine ?? '')
    .replace(/^\ufeff/, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
  return /^sep\s*=\s*\S+$/i.test(s);
}

const STRIP_CSV_PEEK_BYTES = 65536;

function countLeadingLinesToStripFromCsvText(text) {
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const trimmed = String(lines[i] ?? '')
      .replace(/^\ufeff/, '')
      .trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    if (lineIsExcelCsvSepDirective(lines[i])) {
      i += 1;
      continue;
    }
    break;
  }
  return { stripCount: i, lines };
}

/**
 * Removes leading blank lines and Excel `sep=` hint rows so validation and the import API see the real header.
 */
async function stripLeadingExcelSepDirectiveFromCsvFile(file) {
  const peekBytes = Math.min(file.size, STRIP_CSV_PEEK_BYTES);
  const peekText = await file.slice(0, peekBytes).text();
  const { stripCount: peekStrip } = countLeadingLinesToStripFromCsvText(peekText);
  if (peekStrip === 0) return file;

  const text = await file.text();
  const { stripCount, lines } = countLeadingLinesToStripFromCsvText(text);
  if (stripCount === 0) return file;
  const body = lines.slice(stripCount).join('\n');
  const blob = new Blob([body], { type: file.type || 'text/csv;charset=utf-8;' });
  return new File([blob], file.name, {
    type: file.type || 'text/csv',
    lastModified: file.lastModified,
  });
}

function assertCatalogImportCsvHeaderPrefix(textPrefix) {
  const lines = textPrefix.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = String(line ?? '')
      .replace(/^\ufeff/, '')
      .trim();
    if (!trimmed) continue;
    if (lineIsExcelCsvSepDirective(line)) continue;
    const lower = trimmed.toLowerCase();
    const missing = IMPORT_CSV_REQUIRED_SUBSTRINGS.filter((s) => !lower.includes(s));
    if (missing.length) {
      throw new Error(
        'This CSV does not match the catalog import template. Download the CSV template and use its header row exactly (including Control SME and Escalation Needed).'
      );
    }
    return;
  }
  throw new Error('CSV is empty or has no header row.');
}

/** Same cap as backend SYNC_IMPORT_MAX_RAW_BYTES — avoids browser→S3 CORS on presigned PUT. */
const SYNC_IMPORT_MAX_BYTES = 6 * 1024 * 1024;

function lcFileName(name) {
  return String(name || '').toLowerCase();
}

function isCatalogImportCsvFilename(name) {
  return lcFileName(name).endsWith('.csv');
}

/**
 * Excel uploads (.xlsx / .xls / .xlsm, or misnamed .xlx) are turned into CSV in the browser
 * so the existing import API (CSV-only) still accepts them.
 */
function isCatalogImportExcelFilename(name) {
  const n = lcFileName(name);
  return n.endsWith('.xlsx') || n.endsWith('.xlsm') || n.endsWith('.xls') || n.endsWith('.xlx');
}

async function excelWorkbookFileToCsvFile(file) {
  let workbook;
  try {
    const buf = await file.arrayBuffer();
    workbook = XLSX.read(buf, { type: 'array' });
  } catch {
    throw new Error(
      'Could not read this Excel file. Save as .xlsx from Excel, or export as CSV and import the CSV.'
    );
  }

  const sheetName = workbook.SheetNames?.[0];
  if (!sheetName) {
    throw new Error('Excel file has no worksheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',', RS: '\n' });
  if (!csv || !String(csv).trim()) {
    throw new Error(
      'The first worksheet is empty. Add your control rows there, or pick another file.'
    );
  }

  const base = String(file.name || 'controls').replace(/\.[^.]+$/i, '') || 'controls';
  return new File([`\ufeff${csv}`], `${base}.csv`, {
    type: 'text/csv;charset=utf-8;',
    lastModified: file.lastModified,
  });
}

async function fileToBase64(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * Manager-only: small CSVs POST to /import/sync (no S3 browser upload).
 * Larger files use presigned PUT (S3 bucket must allow CORS for your app origin).
 * Excel (.xlsx, .xls, etc.) is converted to CSV here so the backend contract stays CSV-only.
 */
export async function uploadControlsCsvForImport(file) {
  let working = file;
  if (!isCatalogImportCsvFilename(file.name)) {
    if (!isCatalogImportExcelFilename(file.name)) {
      throw new Error('Please select a CSV or Excel file (.csv, .xlsx, .xls).');
    }
    working = await excelWorkbookFileToCsvFile(file);
  }

  const importFile = await stripLeadingExcelSepDirectiveFromCsvFile(working);
  const prefixBytes = Math.min(importFile.size, 32768);
  const prefix = await importFile.slice(0, prefixBytes).text();
  assertCatalogImportCsvHeaderPrefix(prefix);

  if (importFile.size <= SYNC_IMPORT_MAX_BYTES) {
    const contentBase64 = await fileToBase64(importFile);
    const resp = await authFetch(`${API_BASE}/import/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        filename: importFile.name,
        contentBase64,
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data?.error || data?.message || `Import failed (HTTP ${resp.status})`;
      throw new Error(msg);
    }
    return data;
  }

  const resp = await authFetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      filename: importFile.name,
      contentType: importFile.type || 'text/csv',
    }),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg = data?.error || data?.message || `Could not start import (HTTP ${resp.status})`;
    throw new Error(msg);
  }

  const uploadUrl = data.upload_url;
  const contentType =
    data.content_type ||
    (data.required_headers && data.required_headers['Content-Type']) ||
    'text/csv';

  if (!uploadUrl) {
    throw new Error('Import service did not return an upload URL.');
  }

  let putResp;
  try {
    putResp = await fetch(uploadUrl, {
      method: 'PUT',
      body: importFile,
      headers: { 'Content-Type': contentType },
    });
  } catch (e) {
    const hint =
      'Browser upload to storage failed (often S3 CORS). Files up to 6 MB use direct import automatically; split the CSV or configure S3 CORS for larger uploads.';
    throw new Error(e?.message ? `${e.message}. ${hint}` : hint);
  }

  if (!putResp.ok) {
    const errText = await putResp.text().catch(() => '');
    throw new Error(errText?.trim() || `Upload to storage failed (HTTP ${putResp.status}).`);
  }

  return data;
}
