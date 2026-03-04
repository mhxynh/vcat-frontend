import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/pages/views/Request.css';
import { fetchRequests, mapRequestRowToUi } from '../../api/RequestsAPI';
import {
  fetchTestsByRequestId,
  mapTestRowToRequestControlCard,
  updateTest,
} from '../../api/TestsAPI';
import DetailsRequestModal from '../../components/DetailsRequestModal';
import AssignRequestModal from '../../components/AssignRequestModal';
import '../../styles/components/DetailsRequestModal.css';
import '../../styles/components/AssignRequestModal.css';

export default function Requests({ refreshKey = 0 }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [testsByRequestId, setTestsByRequestId] = useState({});

  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAssignRequest, setSelectedAssignRequest] = useState(null);

  function openRequestDetails(req) {
    setSelectedRequest(req);
    setIsRequestDetailsOpen(true);
  }

  function closeRequestDetails() {
    setIsRequestDetailsOpen(false);
    setSelectedRequest(null);
  }

  function openAssignModal(req) {
    setSelectedAssignRequest(req);
    setIsAssignOpen(true);
  }

  function closeAssignModal() {
    setIsAssignOpen(false);
    setSelectedAssignRequest(null);
  }

  async function handleAssign(requestId, userId, displayName, note) {
    if (!requestId) return;

    // optimistic UI update: update testsByRequestId so UI reflects new assignee
    setTestsByRequestId((prev) => {
      const next = { ...prev };
      const bucket = next[requestId];
      if (!bucket || !Array.isArray(bucket.items)) return prev;

      next[requestId] = {
        ...bucket,
        items: bucket.items.map((c) => ({ ...c, assignee: displayName })),
      };
      return next;
    });

    try {
      // fetch raw tests for this request so we have test IDs
      const raw = await fetchTestsByRequestId(requestId, { details: true });
      if (!Array.isArray(raw)) return;

      await Promise.all(
        raw.map(async (t) => {
          const id = t?.test_id ?? t?.id ?? t?.testId ?? null;
          if (id == null) return;

          // backend expects an action + assigned_tester_id in the body
          await updateTest(id, {
            action: 'assign',
            assignedTesterId: String(userId),
          });
        })
      );
    } catch (e) {
      // on error, revert UI and set an error marker
      setTestsByRequestId((prev) => {
        const next = { ...prev };
        const bucket = next[requestId];
        if (!bucket || !Array.isArray(bucket.items)) return prev;

        // mark error on bucket
        next[requestId] = { ...bucket, error: e?.message || 'Failed to assign testers' };
        return next;
      });
    }
  }

  async function preloadAllTests(requestList) {
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
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const rows = await fetchRequests();
        const ui = rows.map(mapRequestRowToUi);

        if (cancelled) return;

        setRequests(ui);

        if (ui[0]?.id) setExpanded(new Set([ui[0].id]));

        await preloadAllTests(ui);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load requests');
          setRequests([]);
          setExpanded(new Set());
          setTestsByRequestId({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

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

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enrichedRequests;

    return enrichedRequests.filter((r) => {
      const matchReq =
        String(r.id).toLowerCase().includes(q) ||
        String(r.requestedBy).toLowerCase().includes(q) ||
        String(r.priority).toLowerCase().includes(q) ||
        String(r.status).toLowerCase().includes(q);

      const matchControl = (r.controls || []).some((c) => {
        const id = String(c.id || '').toLowerCase();
        const title = String(c.title || '').toLowerCase();
        const assignee = String(c.assignee || '').toLowerCase();
        const status = String(c.status || '').toLowerCase();
        return id.includes(q) || title.includes(q) || assignee.includes(q) || status.includes(q);
      });

      return matchReq || matchControl;
    });
  }, [enrichedRequests, search]);

  function computeProgress(req) {
    const total = (req.controls || []).length;
    if (total === 0) return { label: '0/0 Completed', pct: 0 };

    const done = req.controls.filter((c) => String(c.status) === 'Completed').length;
    const pct = Math.round((done / total) * 100);
    return { label: `${done}/${total} Completed`, pct };
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
        <input
          className="search-input"
          placeholder="Search requests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
      </div>

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

              return (
                <div key={req.id} className="request-card">
                  <div className="request-row">
                    <div className="req-left">
                      <div style={{ fontWeight: 800 }}>{req.id}</div>
                      <div className={`badge badge-${String(req.priority || '').toLowerCase()}`}>
                        {req.priority}
                      </div>
                    </div>

                    <div className="req-meta-grid">
                      <Meta label="Requested By" value={req.requestedBy} />
                      <Meta label="Request Date" value={req.requestDate} />
                      <Meta
                        label="Due Date"
                        value={
                          <>
                            {req.dueDate}{' '}
                            {req.overdue ? <span className="overdue">Overdue</span> : null}
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
                          <div className="progress-fill" style={{ width: `${progress.pct}%` }} />
                        </div>
                      </div>

                      <button className="btn-outline" onClick={() => openRequestDetails(req)}>
                        Details
                      </button>
                      <button className="btn-outline" onClick={() => openAssignModal(req)}>
                        Assign
                      </button>

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
                                <span
                                  className={`status-dot ${String(c.status || '')
                                    .toLowerCase()
                                    .replace(/\s+/g, '-')}`}
                                />
                                <span className="control-id">{c.id}</span>
                              </div>
                              <span
                                className={`status-pill ${String(c.status || '')
                                  .toLowerCase()
                                  .replace(/\s+/g, '-')}`}
                              >
                                {c.status}
                              </span>
                            </div>

                            <div className="control-title">{c.title}</div>

                            <div className="control-meta">
                              <div className="control-meta-row control-meta-row--assignee">
                                <span className="meta-icon">👤</span>
                                <span>{c.assignee}</span>
                              </div>

                              <div className="control-meta-row control-meta-row--eta-note">
                                <div className="control-eta">
                                  <span className="meta-icon">⏱</span>
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
        onAssign={(requestId, assignee, note) => handleAssign(requestId, assignee, note)}
      />
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="meta">
      <div className="meta-label">{label}</div>
      <div className="meta-value">{value}</div>
    </div>
  );
}
