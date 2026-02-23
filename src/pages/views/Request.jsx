import React, { useMemo, useState } from 'react';
import '../../styles/pages/views/Request.css';

export default function Requests() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(() => new Set(['REQ-2026-001']));

  const requests = useMemo(
    () => [
      {
        id: 'REQ-2026-001',
        priority: 'High Priority',
        requestedBy: 'Audit Committee',
        requestDate: 'Jan 14, 2026',
        dueDate: 'Feb 14, 2026',
        overdue: true,
        controls: [
          {
            id: 'VGCP-01001',
            title: 'Access Control Review',
            assignee: 'John Smith',
            eta: 'Jan 27',
            status: 'In Progress',
            note: 'Addressing Comments',
          },
          {
            id: 'VGCP-01002',
            title: 'Password Policy Validation',
            assignee: 'Sarah Johnson',
            eta: 'Jan 17',
            status: 'Completed',
            note: '',
          },
          {
            id: 'VGCP-01003',
            title: 'Encryption Standards Check',
            assignee: 'Michael Chen',
            eta: 'Feb 4',
            status: 'Not Started',
            note: '',
          },
          {
            id: 'VGCP-01004',
            title: 'Change Management Process',
            assignee: 'Emily Davis',
            eta: 'Jan 31',
            status: 'In Progress',
            note: 'Testing in Progress',
          },
        ],
      },
      {
        id: 'REQ-2026-002',
        priority: 'High Priority',
        requestedBy: 'Security Team',
        requestDate: 'Jan 9, 2026',
        dueDate: 'Feb 9, 2026',
        overdue: true,
        controls: [],
      },
    ],
    []
  );

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;

    return requests.filter((r) => {
      const matchReq =
        r.id.toLowerCase().includes(q) ||
        r.requestedBy.toLowerCase().includes(q) ||
        r.priority.toLowerCase().includes(q);

      const matchControl = r.controls.some(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.assignee.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
      );

      return matchReq || matchControl;
    });
  }, [requests, search]);

  function toggleExpand(reqId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
  }

  function computeProgress(req) {
    const total = req.controls.length;
    if (total === 0) return { label: '0/0 Completed', pct: 0 };

    const done = req.controls.filter((c) => c.status === 'Completed').length;
    const pct = Math.round((done / total) * 100);
    return { label: `${done}/${total} Completed`, pct };
  }

  return (
    <div className="container">
      <div className="requests-list">
        {filteredRequests.map((req) => {
          const isOpen = expanded.has(req.id);
          const progress = computeProgress(req);

          return (
            <div key={req.id} className="request-card">
              <div className="request-row">
                <div className="req-left">
                  <div style={{ fontWeight: 800 }}>{req.id}</div>
                  <div className="badge">{req.priority}</div>
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

                  <button className="btn-outline" onClick={() => alert('Details alert')}>
                    Details
                  </button>
                  <button className="btn-outline" onClick={() => alert('Assign alert')}>
                    Assign
                  </button>

                  <button className="btn-chev" onClick={() => toggleExpand(req.id)}>
                    {isOpen ? '▴' : '▾'}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="controls-grid">
                  {req.controls.length === 0 ? (
                    <div className="empty-controls">
                      No controls listed for this request (demo).
                    </div>
                  ) : (
                    req.controls.map((c) => (
                      <div key={c.id} className="control-card">
                        <div className="control-top">
                          <div className="control-id-wrap">
                            <span
                              className={`status-dot ${c.status.toLowerCase().replace(/\s+/g, '-')}`}
                            />
                            <span className="control-id">{c.id}</span>
                          </div>
                          <span
                            className={`status-pill ${c.status.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {c.status}
                          </span>
                        </div>

                        <div className="control-title">{c.title}</div>

                        <div className="control-meta">
                          <div className="control-meta-row">
                            <span className="meta-icon">👤</span>
                            <span>{c.assignee}</span>
                          </div>
                          <div className="control-meta-row">
                            <span className="meta-icon">⏱</span>
                            <span>ETA: {c.eta}</span>
                          </div>
                        </div>

                        {c.note ? <div className="control-note">{c.note}</div> : null}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
