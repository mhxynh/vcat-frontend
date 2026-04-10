import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAllTests } from '../../api/TestsAPI';
import '../../styles/pages/views/Tests.css';
import DetailsTestModal from '../../components/DetailsTestModal';
import Icon from '../../components/common/Icon';
import { isOverdue, parseLocalDate } from '../../utils/dates';

function formatDate(value) {
  const d = parseLocalDate(value);
  if (!d) return '-';
  return d.toLocaleDateString();
}

function statusToLabel(status) {
  return String(status || 'NOT_STARTED')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    .replace(/\b(Dat|Oet)\b/g, (m) => m.toUpperCase());
}

function statusToBadgeType(status) {
  return String(status || 'NOT_STARTED')
    .toLowerCase()
    .replaceAll('_', '-');
}

function testTypeFromFlags(t) {
  const dat = !!t?.requires_dat;
  const oet = !!t?.requires_oet;
  if (dat && oet) return 'DAT & OET';
  if (dat) return 'DAT';
  if (oet) return 'OET';
  return '-';
}

function formatStepLabel(step) {
  if (!step) return '-';

  return String(step).replaceAll('_', ' ').toUpperCase();
}

function stepFromTracks(t) {
  const requiresDat = !!t?.requires_dat;
  const requiresOet = !!t?.requires_oet;

  if (requiresDat) {
    return formatStepLabel(t?.dat_step);
  }

  if (requiresOet) {
    return formatStepLabel(t?.oet_step);
  }

  return '-';
}

function normalizeText(v) {
  return String(v ?? '').toLowerCase();
}

export default function Tests({
  refreshKey = 0,
  selectedRows: propSelectedRows,
  onSelectionChange,
}) {
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  const propSelectedRowsRef = React.useRef(propSelectedRows);

  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
    propSelectedRowsRef.current = propSelectedRows;
  }, [onSelectionChange, propSelectedRows]);
  const [search, setSearch] = useState('');
  const [tests, setTests] = useState([]);
  const [localSelectedRows, setLocalSelectedRows] = useState([]);
  const selectedRows = propSelectedRows !== undefined ? propSelectedRows : localSelectedRows;

  const updateSelectedRows = useCallback(
    (newRows) => {
      if (propSelectedRows !== undefined) {
        onSelectionChange?.(newRows);
      } else {
        setLocalSelectedRows(newRows);
      }
    },
    [propSelectedRows, onSelectionChange]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isTestDetailsOpen, setIsTestDetailsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  function openTestDetails(t) {
    setSelectedTest(t);
    setIsTestDetailsOpen(true);
  }

  function closeTestDetails() {
    setIsTestDetailsOpen(false);
    setSelectedTest(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const data = await fetchAllTests();
        if (cancelled) return;

        setTests(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load tests');
          setTests([]);
          // Clear selection without changing this effect's dependencies
          if (propSelectedRowsRef.current !== undefined) {
            onSelectionChangeRef.current?.([]);
          } else {
            setLocalSelectedRows([]);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // Intentionally only depend on refreshKey so selecting rows doesn't re-fetch
  }, [refreshKey]);

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
    updateSelectedRows(e.target.checked ? rowIds : []);
  };

  const handleSelectRow = (id) => {
    const next = selectedRows.includes(id)
      ? selectedRows.filter((x) => x !== id)
      : [...selectedRows, id];
    updateSelectedRows(next);
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
        <>
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
                const overdue =
                  isOverdue(t?.due_date) &&
                  !['COMPLETED', 'ARCHIVED'].includes(String(t?.status || '').toUpperCase());
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

                    <td className="table__cell table__cell--vgcpid">
                      <button
                        type="button"
                        className="vgcpid-link"
                        onClick={() => openTestDetails(t)}
                        title="Open test details"
                      >
                        {vgcpidCell}
                      </button>
                    </td>
                    <td className="table__cell">{testerCell}</td>
                    <td className="table__cell">{testType}</td>

                    <td className="table__cell">
                      <span className={`badge badge--${statusType}`}>{statusLabel}</span>
                    </td>

                    <td className="table__cell">{step}</td>
                    <td className="table__cell">{lastUpdated}</td>
                    <td className="table__cell table__cell--due-date">
                      <span className="due-date-content">
                        <span>{dueDate}</span>
                        {overdue && <Icon name="exclamation" category="deco" color="#c20029" />}
                      </span>
                    </td>
                    <td className="table__cell">{etaDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      <DetailsTestModal
        isOpen={isTestDetailsOpen}
        onClose={closeTestDetails}
        test={selectedTest}
        onArchived={(testId) => {
          setTests((prev) =>
            prev.map((x) => (x.test_id === testId ? { ...x, status: 'ARCHIVED' } : x))
          );
        }}
        onDeleted={(testId) => {
          setTests((prev) => prev.filter((x) => x.test_id !== testId));
        }}
        onEdit={(updatedTest) => {
          if (!updatedTest?.test_id) return;

          setTests((prev) =>
            prev.map((x) => (x?.test_id === updatedTest.test_id ? { ...x, ...updatedTest } : x))
          );

          setSelectedTest((prev) =>
            prev?.test_id === updatedTest.test_id ? { ...prev, ...updatedTest } : prev
          );
        }}
      />
    </div>
  );
}
