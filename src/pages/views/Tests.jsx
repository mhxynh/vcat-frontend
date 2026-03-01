import React, { useEffect, useMemo, useState } from 'react';
import { fetchAllTests } from '../../api/TestsAPI';
import '../../styles/pages/views/Tests.css';

function parseLocalDate(value) {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatDate(value) {
  const d = parseLocalDate(value);
  if (!d) return '-';
  return d.toLocaleDateString();
}

function statusToLabel(status) {
  return String(status || 'NOT_STARTED')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function statusToBadgeType(status) {
  return String(status || 'NOT_STARTED')
    .toLowerCase()
    .replaceAll('_', '-');
}

function testTypeFromFlags(t) {
  const dat = !!t?.requires_dat;
  const oet = !!t?.requires_oet;
  if (dat && oet) return 'DAT + OET';
  if (dat) return 'DAT';
  if (oet) return 'OET';
  return '-';
}

function stepFromTracks(t) {
  const dat = t?.dat_step ? `DAT: ${String(t.dat_step).replaceAll('_', ' ')}` : '';
  const oet = t?.oet_step ? `OET: ${String(t.oet_step).replaceAll('_', ' ')}` : '';
  const parts = [dat, oet].filter(Boolean);
  return parts.length ? parts.join(' • ') : '-';
}

function normalizeText(v) {
  return String(v ?? '').toLowerCase();
}

export default function Tests() {
  const [search, setSearch] = useState('');
  const [tests, setTests] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const data = await fetchAllTests();
        if (cancelled) return;

        setTests(Array.isArray(data) ? data : []);
        setSelectedRows([]);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load tests');
          setTests([]);
          setSelectedRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tests;

    return tests.filter((t) => {
      const vgcpidCell = t?.vgcpid ?? t?.control_vgcpid ?? t?.control_id ?? '';
      const testerCell = t?.tester_name ?? t?.assigned_tester_name ?? t?.assigned_tester_id ?? '';
      const testType = testTypeFromFlags(t);
      const statusLabel = statusToLabel(t?.status);
      const statusType = statusToBadgeType(t?.status);
      const step = stepFromTracks(t);

      const lastUpdated = formatDate(t?.updated_at);
      const dueDate = formatDate(t?.due_date);
      const etaDate = formatDate(t?.estimated_date);

      const haystack = [
        t?.test_id,
        t?.request_id,
        t?.control_id,
        vgcpidCell,
        testerCell,
        testType,
        statusLabel,
        statusType,
        step,
        lastUpdated,
        dueDate,
        etaDate,
      ]
        .map(normalizeText)
        .join(' ');

      return haystack.includes(q);
    });
  }, [tests, search]);

  const rowIds = useMemo(
    () => filteredTests.map((t) => t?.test_id).filter((v) => v != null),
    [filteredTests]
  );

  const isAllSelected = rowIds.length > 0 && selectedRows.length === rowIds.length;

  const handleSelectAll = (e) => {
    setSelectedRows(e.target.checked ? rowIds : []);
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="tracker__table-container">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
        <input
          className="search-input"
          placeholder="Search tests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
      </div>

      {loading ? (
        <div className="no-results">Loading tests...</div>
      ) : error ? (
        <div className="no-results">Error: {error}</div>
      ) : filteredTests.length === 0 ? (
        <div className="no-results">No tests found.</div>
      ) : (
        <table className="table">
          <thead className="table__head">
            <tr>
              <th className="table__header-cell">
                <input
                  type="checkbox"
                  className="table__checkbox"
                  aria-label="Select all rows"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="table__header-cell">VGCPID</th>
              <th className="table__header-cell">Tester</th>
              <th className="table__header-cell">Test Type</th>
              <th className="table__header-cell">Status</th>
              <th className="table__header-cell">In-Progress Step</th>
              <th className="table__header-cell">Last Updated</th>
              <th className="table__header-cell">Due Date</th>
              <th className="table__header-cell">ETA Date</th>
            </tr>
          </thead>

          <tbody className="table__body">
            {filteredTests.map((t) => {
              const id = t.test_id;

              const vgcpidCell = t?.vgcpid ?? t?.control_vgcpid ?? t?.control_id ?? '-';
              const testerCell =
                t?.tester_name ?? t?.assigned_tester_name ?? t?.assigned_tester_id ?? '-';

              const testType = testTypeFromFlags(t);
              const statusLabel = statusToLabel(t?.status);
              const statusType = statusToBadgeType(t?.status);
              const step = stepFromTracks(t);

              const lastUpdated = formatDate(t?.updated_at);
              const dueDate = formatDate(t?.due_date);
              const etaDate = formatDate(t?.estimated_date);

              return (
                <tr key={id} className="table__row">
                  <td className="table__cell">
                    <input
                      type="checkbox"
                      className="table__checkbox"
                      aria-label={`Select ${String(vgcpidCell)}`}
                      checked={selectedRows.includes(id)}
                      onChange={() => handleSelectRow(id)}
                    />
                  </td>

                  <td className="table__cell table__cell--vgcpid">{vgcpidCell}</td>
                  <td className="table__cell">{testerCell}</td>
                  <td className="table__cell">{testType}</td>

                  <td className="table__cell">
                    <span className={`badge badge--${statusType}`}>{statusLabel}</span>
                  </td>

                  <td className="table__cell">{step}</td>
                  <td className="table__cell">{lastUpdated}</td>
                  <td className="table__cell table__cell--due-date">{dueDate}</td>
                  <td className="table__cell">{etaDate}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
