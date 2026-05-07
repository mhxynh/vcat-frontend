import React, { useEffect, useMemo, useState, useCallback } from 'react';
import '../../styles/pages/views/Request.css';
import { fetchRequests, mapRequestRowToUi } from '../../api/RequestsAPI';
import {
  fetchTestsByRequestId,
  mapTestRowToRequestControlCard,
  updateTest,
} from '../../api/TestsAPI';
import DetailsRequestModal from '../../components/DetailsRequestModal';
import AssignRequestModal from '../../components/AssignRequestModal';
import DetailsTestModal from '../../components/DetailsTestModal';
import RestrictedAction from '../../components/RestrictedAction';
import { ACTIONS } from '../../auth';
import { showErrorToast } from '../../utils/toast';
import { formatRequestDisplayId } from '../../utils/requestDisplayId';
import '../../styles/components/DetailsRequestModal.css';
import '../../styles/components/AssignRequestModal.css';
import Icon from '../../components/common/Icon';

export default function Requests({ refreshKey = 0, searchValue = '', filters, onLoadingChange }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [testsByRequestId, setTestsByRequestId] = useState({});
  const [fullTestsById, setFullTestsById] = useState({});

  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAssignRequest, setSelectedAssignRequest] = useState(null);
  const [isTestDetailsOpen, setIsTestDetailsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  function showPermissionDeniedToast() {
    showErrorToast({
      title: 'Permission Denied',
      message: 'Only managers have permission for this action. Contact a manager for access.',
    });
  }

  function openRequestDetails(req) {
    setSelectedRequest(req);
    setIsRequestDetailsOpen(true);
  }

  function closeRequestDetails() {
    setIsRequestDetailsOpen(false);
    setSelectedRequest(null);
    refreshRequests();
  }

  function openAssignModal(req) {
    setSelectedAssignRequest(req);
    setIsAssignOpen(true);
  }

  function closeAssignModal() {
    setIsAssignOpen(false);
    setSelectedAssignRequest(null);
  }

  function openTestDetails(testId) {
    const test = fullTestsById[testId];
    if (test) {
      setSelectedTest(test);
      setIsTestDetailsOpen(true);
    }
  }

  function closeTestDetails() {
    setIsTestDetailsOpen(false);
    setSelectedTest(null);
  }

  async function handleAssign(requestId, userId, displayName, note) {
    if (!requestId) return;

    const previousBucket = testsByRequestId[requestId] ?? null;

    setTestsByRequestId((prev) => {
      const bucket = prev[requestId];
      if (!bucket || !Array.isArray(bucket.items)) return prev;

      return {
        ...prev,
        [requestId]: {
          ...bucket,
          error: '',
          items: bucket.items.map((c) => ({ ...c, assignee: displayName })),
        },
      };
    });

    try {
      const raw = await fetchTestsByRequestId(requestId, { details: true });
      if (!Array.isArray(raw)) return;

      await Promise.all(
        raw.map(async (t) => {
          const id = t?.test_id ?? t?.id ?? t?.testId ?? null;
          if (id == null) return;

          await updateTest(id, {
            action: 'assign',
            assignedTesterId: String(userId),
          });
        })
      );
    } catch (e) {
      setTestsByRequestId((prev) => {
        const next = { ...prev };
        const bucket = next[requestId];
        if (!bucket || !Array.isArray(bucket.items)) return prev;

        next[requestId] = {
          ...(previousBucket || bucket),
          error: e?.message || 'Failed to assign testers',
        };
        return next;
      });
      throw e;
    }
  }

  const preloadAllTests = useCallback(async (requestList) => {
    setTestsByRequestId((prev) => {
      const next = { ...prev };

      requestList.forEach((r) => {
        if (r.requestId == null) return;

        const existing = next[r.requestId];
        if (existing?.loading || Array.isArray(existing?.items)) return;

        next[r.requestId] = { loading: true, error: '', items: null };
      });

      return next;
    });

    await Promise.all(
      requestList.map(async (r) => {
        if (r.requestId == null) return;

        try {
          const rows = await fetchTestsByRequestId(r.requestId, { details: true });
          const items = rows.map(mapTestRowToRequestControlCard);

          const testsMap = {};
          rows.forEach((test) => {
            const testId = test.vgcpid || test.test_id || String(test.control_id || '');
            testsMap[testId] = test;
          });
          setFullTestsById((prev) => ({ ...prev, ...testsMap }));

          setTestsByRequestId((prev) => ({
            ...prev,
            [r.requestId]: { loading: false, error: '', items },
          }));
        } catch (e) {
          setTestsByRequestId((prev) => ({
            ...prev,
            [r.requestId]: {
              loading: false,
              error: e?.message || 'Failed to load tests',
              items: [],
            },
          }));
        }
      })
    );
  }, []);

  const refreshRequests = useCallback(async () => {
    try {
      const rows = await fetchRequests();
      const ui = rows.map(mapRequestRowToUi);

      setRequests(ui);

      if (ui[0]?.id) setExpanded((prev) => (prev.size === 0 ? new Set([ui[0].id]) : prev));

      await preloadAllTests(ui);
    } catch (e) {
      setError(e?.message || 'Failed to load requests');
    }
  }, [preloadAllTests]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await refreshRequests();
    } finally {
      setLoading(false);
    }
  }, [refreshRequests]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await loadRequests();
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load requests');
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, refreshRequests, loadRequests]);

  function toggleExpand(req) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(req.id)) next.delete(req.id);
      else next.add(req.id);
      return next;
    });
  }

  const enrichedRequests = useMemo(() => {
    return requests.map((r) => {
      const bucket = r.requestId != null ? testsByRequestId[r.requestId] : null;
      const controls = Array.isArray(bucket?.items) ? bucket.items : [];
      return {
        ...r,
        controls,
        testsLoading: Boolean(bucket?.loading),
        testsError: bucket?.error || '',
      };
    });
  }, [requests, testsByRequestId]);

  useEffect(() => {
    if (!selectedRequest || !isRequestDetailsOpen) return;
    const enriched = enrichedRequests.find((r) => r.requestId === selectedRequest.requestId);
    if (enriched) {
      setSelectedRequest(enriched);
    }
  }, [enrichedRequests, isRequestDetailsOpen, selectedRequest?.requestId]);

  const filteredRequests = useMemo(() => {
    const priorityFilter = filters?.priority ?? 'all';
    const overdueFilter = filters?.overdue ?? 'all';

    const base = enrichedRequests.filter((r) => {
      if (priorityFilter !== 'all') {
        const p = String(r.priority || '').toLowerCase();
        if (p !== priorityFilter) return false;
      }

      if (overdueFilter !== 'all') {
        const overdue = Boolean(r.overdue);
        if (overdueFilter === 'overdue' && !overdue) return false;
        if (overdueFilter === 'not_overdue' && overdue) return false;
      }

      return true;
    });

    const q = String(searchValue).trim().toLowerCase();
    if (!q) return base;

    return base.filter((r) => {
      const dispId = formatRequestDisplayId(r).toLowerCase();
      const matchReq =
        String(r.id).toLowerCase().includes(q) ||
        (dispId && dispId.includes(q)) ||
        String(r.requestedBy).toLowerCase().includes(q) ||
        String(r.priority).toLowerCase().includes(q) ||
        String(r.status).toLowerCase().includes(q) ||
        String(r.description ?? '')
          .toLowerCase()
          .includes(q);

      const matchControl = (r.controls || []).some((c) => {
        const id = String(c.id || '').toLowerCase();
        const title = String(c.title || '').toLowerCase();
        const assignee = String(c.assignee || '').toLowerCase();
        const status = String(c.status || '').toLowerCase();
        return id.includes(q) || title.includes(q) || assignee.includes(q) || status.includes(q);
      });

      return matchReq || matchControl;
    });
  }, [enrichedRequests, searchValue, filters?.priority, filters?.overdue]);

  function computeProgress(req) {
    const total = (req.controls || []).length;
    if (total === 0) return { label: '0/0 Completed', pct: 0 };

    const done = req.controls.filter((c) => String(c.status).toUpperCase() === 'COMPLETED').length;
    const pct = Math.round((done / total) * 100);
    return { label: `${done}/${total} Completed`, pct };
  }

  return (
    <div className="container">
      {loading ? (
        <div className="no-results">Loading requests...</div>
      ) : error ? (
        <div className="no-results">Error: {error}</div>
      ) : (
        <div className="requests-list">
          {filteredRequests.length === 0 ? (
            <div className="no-results">No requests found.</div>
          ) : (
            filteredRequests.map((req) => {
              const isOpen = expanded.has(req.id);
              const progress = computeProgress(req);
              const controls = req.controls || [];
              const isCompleted = controls.length > 0 && progress.pct === 100;

              return (
                <div key={req.id} className="request-card">
                  <div className="request-row">
                    <div className="req-left">
                      <div style={{ fontWeight: 800 }}>{formatRequestDisplayId(req)}</div>
                      <div className={`badge badge-${String(req.priority || '').toLowerCase()}`}>
                        {req.priority}
                      </div>
                    </div>

                    <div className="req-meta-grid">
                      <Meta label="Requested By" icon="user" value={req.requestedBy} />
                      <Meta label="Request Date" icon="clock" value={req.requestDate} />
                      <Meta
                        label="Due Date"
                        icon={isCompleted ? 'checkmark' : req.overdue ? 'exclamation' : 'clock'}
                        iconColor={isCompleted ? '#00A63E' : req.overdue ? '#96151D' : '#6C6C6C'}
                        valueClassName={
                          isCompleted
                            ? 'meta-value--success'
                            : req.overdue
                              ? 'meta-value--overdue'
                              : ''
                        }
                        value={
                          <>
                            {req.dueDate}{' '}
                            {!isCompleted && req.overdue ? (
                              <span className="overdue">Overdue</span>
                            ) : null}
                          </>
                        }
                      />
                    </div>

                    <div className="req-right">
                      <div style={{ minWidth: 220 }}>
                        <div className="progress-top">
                          <span className="progress-label">Progress</span>
                          <span className="progress-value">{progress.label}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-fill ${isCompleted ? 'progress-fill--success' : ''}`}
                            style={{ width: `${progress.pct}%` }}
                          />
                        </div>
                      </div>

                      <button className="btn-outline" onClick={() => openRequestDetails(req)}>
                        Details
                      </button>

                      <div
                        onClick={(e) => {
                          const blockedWrapper = e.target.closest('.restricted-action--blocked');
                          if (blockedWrapper) {
                            e.preventDefault();
                            e.stopPropagation();
                            showPermissionDeniedToast();
                          }
                        }}
                      >
                        <RestrictedAction action={ACTIONS.ASSIGN_TESTER_TO_REQUEST}>
                          <button className="btn-outline" onClick={() => openAssignModal(req)}>
                            Assign
                          </button>
                        </RestrictedAction>
                      </div>

                      <button className="btn-chev" onClick={() => toggleExpand(req)}>
                        {isOpen ? '▴' : '▾'}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="controls-grid">
                      {req.testsLoading ? (
                        <div className="empty-controls">Loading tests...</div>
                      ) : req.testsError ? (
                        <div className="empty-controls">Error: {req.testsError}</div>
                      ) : (req.controls || []).length === 0 ? (
                        <div className="empty-controls">No tests found for this request.</div>
                      ) : (
                        req.controls.map((c) => (
                          <div key={c.id} className="control-card">
                            <div className="control-top">
                              <div className="control-id-wrap">
                                <StatusIcon status={c.statusLabel || c.status} />
                                <span
                                  className="control-id"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => openTestDetails(c.id)}
                                >
                                  {c.id}
                                </span>
                              </div>
                              <span
                                className={`status-pill ${String(c.statusLabel || c.status || '')
                                  .toLowerCase()
                                  .replace(/\s+/g, '-')}`}
                              >
                                {c.statusLabel || c.status}
                              </span>
                            </div>

                            <div className="control-title">{c.title}</div>

                            <div className="control-meta">
                              <div className="control-meta-row control-meta-row--assignee">
                                <Icon
                                  name="user"
                                  category="deco"
                                  size="xs"
                                  color="#6C6C6C"
                                  className="control-meta-icon"
                                />
                                <span>{c.assignee}</span>
                              </div>

                              <div className="control-meta-row control-meta-row--eta-note">
                                <div className="control-eta">
                                  <span>ETA: {c.eta}</span>
                                </div>

                                {c.note ? (
                                  <span className="control-note-inline">{c.note}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <DetailsRequestModal
        isOpen={isRequestDetailsOpen}
        onClose={closeRequestDetails}
        request={selectedRequest}
        onUpdated={(requestId, ui, items) => {
          if (!requestId) return;

          if (ui) {
            setRequests((prev) =>
              prev.map((r) => (r.requestId === requestId ? { ...r, ...ui } : r))
            );
          }

          if (Array.isArray(items)) {
            setTestsByRequestId((prev) => ({
              ...prev,
              [requestId]: { loading: false, error: '', items },
            }));
          }

          setSelectedRequest((prev) =>
            prev && prev.requestId === requestId
              ? { ...prev, ...(ui || {}), controls: Array.isArray(items) ? items : prev.controls }
              : prev
          );
        }}
        onArchived={(requestId) => {
          setRequests((prev) =>
            prev.map((r) =>
              r.requestId === requestId
                ? {
                    ...r,
                    status: 'ARCHIVED',
                  }
                : r
            )
          );

          setSelectedRequest((prev) => {
            if (!prev) return prev;
            if (prev.requestId !== requestId) return prev;
            return { ...prev, status: 'ARCHIVED' };
          });
        }}
        onDeleted={(requestId) => {
          setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
          setTestsByRequestId((prev) => {
            const next = { ...prev };
            delete next[requestId];
            return next;
          });

          setSelectedRequest((prev) => {
            if (!prev) return prev;
            if (prev.requestId !== requestId) return prev;
            return null;
          });
          setIsRequestDetailsOpen(false);
        }}
      />

      <AssignRequestModal
        isOpen={isAssignOpen}
        onClose={closeAssignModal}
        request={selectedAssignRequest}
        onAssign={(requestId, userId, displayName, note) =>
          handleAssign(requestId, userId, displayName, note)
        }
      />
      <DetailsTestModal isOpen={isTestDetailsOpen} onClose={closeTestDetails} test={selectedTest} />
    </div>
  );
}

function Meta({ label, icon, iconColor = '#6C6C6C', value, valueClassName = '', size = 'sm' }) {
  return (
    <div className="meta">
      <div className="meta-label">{label}</div>
      <div className={`meta-value ${icon ? 'meta-value--inline' : ''} ${valueClassName}`.trim()}>
        {icon ? (
          <Icon
            name={icon}
            category="deco"
            size={size}
            color={iconColor}
            className="meta-value-icon"
          />
        ) : null}
        <span>{value}</span>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  const normalized = String(status || 'NOT_STARTED')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  let iconName = 'not-started';
  let color = '#9ca3af';
  let useDot = false;

  if (normalized === 'COMPLETED') {
    iconName = 'checkmark';
    color = '#00A63E';
  } else if (normalized === 'IN_REVIEW') {
    iconName = 'eye';
    color = '#00786f';
  } else if (
    normalized === 'DAT_IN_PROGRESS' ||
    normalized === 'OET_IN_PROGRESS' ||
    normalized === 'IN_PROGRESS'
  ) {
    useDot = true;
    color = '#155DFC';
  }

  if (useDot) {
    return (
      <span
        className={`status-dot status-dot--${normalized.toLowerCase()}`}
        aria-hidden="true"
        style={{ backgroundColor: color }}
      />
    );
  }

  return (
    <Icon
      name={iconName}
      category="deco"
      size="xs"
      color={color}
      className={`status-icon status-icon--${normalized.toLowerCase()}`}
    />
  );
}
