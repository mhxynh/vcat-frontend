import React, { useEffect, useMemo, useState } from 'react';
import '../styles/components/DetailsTestModal.css';
import Icon from './common/Icon';
import AuditHistoryView from './AuditHistoryView';
import EditTestModal from './EditTestModal';
import { objectToCamelCase } from '../utils/transformer';
import {
  archiveTest,
  hardDeleteTest,
  startTest,
  reviewTest,
  completeTest,
  updateDat,
  updateOet,
  fetchTestById,
} from '../api/TestsAPI';
import { fetchAuditLogsByTestId } from '../api/AuditAPI';

export default function DetailsTestModal({
  isOpen,
  onClose,
  test,
  onArchived,
  onDeleted,
  onEdit,
  onUpdated,
}) {
  const [activeTab, setActiveTab] = useState('Details');
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [localTest, setLocalTest] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('Updating...');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => setIsEditOpen(false);

  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const normalizedTest = useMemo(
    () => objectToCamelCase(localTest ?? test ?? null),
    [localTest, test]
  );

  useEffect(() => {
    if (!isOpen) setIsEditOpen(false);
  }, [isOpen]);

  async function runBusy(message, fn) {
    setBusyMessage(message || 'Updating...');
    setIsBusy(true);
    try {
      return await fn();
    } finally {
      setIsBusy(false);
    }
  }
  useEffect(() => {
    if (!isOpen) return;

    setActiveTab('Details');
    setCommentText('');
    setLocalComments([]);
    setHistoryLogs([]);
    setHistoryError('');

    setLocalTest(objectToCamelCase(test ?? null));

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, test, onClose]);

  const currentTestId = normalizedTest?.testId ?? null;

  useEffect(() => {
    if (!isOpen || activeTab !== 'History' || !currentTestId) return;

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError('');

    fetchAuditLogsByTestId({ testId: currentTestId })
      .then((logs) => {
        if (!cancelled) setHistoryLogs(Array.isArray(logs) ? logs : []);
      })
      .catch((e) => {
        if (!cancelled) setHistoryError(e?.message || 'Failed to load history');
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeTab, currentTestId]);

  async function refreshTest() {
    const testId = normalizedTest?.testId ?? null;
    if (testId == null) return null;

    const fresh = await fetchTestById(testId);
    const normalized = objectToCamelCase(fresh);
    setLocalTest(normalized);
    onEdit?.(normalized);
    return normalized;
  }

  const stop = (e) => e.stopPropagation();

  const t = useMemo(() => normalizedTest ?? {}, [normalizedTest]);

  const { currentStepLabel, nextStepLabel } = useMemo(() => computeStepLabels(t), [t]);

  if (!isOpen) return null;

  const testId = currentTestId;
  const vgcpid = t?.vgcpid ?? t?.controlVgcpid ?? t?.controlId ?? 'Unknown';
  const assignedName = t?.assignedTesterName ?? t?.testerName ?? String(t?.assignedTesterId ?? '-');

  const status = t?.status ?? 'NOT_STARTED';
  const typeLabel = testTypeFromFlags(t);

  const updatedAt = formatLongDate(t?.updatedAt);
  const dueDate = formatLongDate(t?.dueDate);
  const overdue =
    isOverdue(t?.due_date) &&
    !['COMPLETED', 'ARCHIVED'].includes(String(t?.status || '').toUpperCase());
  const etaDate = formatLongDate(t?.estimatedDate);

  const description = t?.description ?? 'No description.';

  async function handleArchive() {
    if (testId == null) return;

    const ok = window.confirm(`Archive control test ${vgcpid}?`);
    if (!ok) return;

    try {
      await archiveTest(testId);

      const fresh = await refreshTest();

      onArchived?.(testId, fresh ?? { ...t, status: 'ARCHIVED' });
      onClose?.();
    } catch (e) {
      alert(e?.message || 'Failed to archive control test');
    }
  }

  async function handleDelete() {
    if (testId == null) return;

    const ok = window.confirm(`Delete control test ${vgcpid}?\n\nThis is permanent.`);
    if (!ok) return;

    try {
      await hardDeleteTest(testId);
      onDeleted?.(testId);
      onClose?.();
    } catch (e) {
      alert(e?.message || 'Failed to delete control test');
    }
  }

  function getActiveTrack(testRow) {
    const requiresDat = !!testRow?.requiresDat;
    const requiresOet = !!testRow?.requiresOet;

    const datStep = String(testRow?.datStep || '');
    const oetStep = String(testRow?.oetStep || '');

    if (requiresDat && datStep !== 'COMPLETED') return 'DAT';

    if (requiresOet && oetStep !== 'COMPLETED') return 'OET';

    if (requiresOet) return 'OET';
    if (requiresDat) return 'DAT';
    return null;
  }

  function getFlowSteps(testRow, track) {
    const requiresDat = !!testRow?.requiresDat;
    const requiresOet = !!testRow?.requiresOet;

    if (requiresDat && requiresOet) {
      if (track === 'DAT') {
        return [
          '',
          'TESTING_READY',
          'WALKTHROUGH_SCHEDULED',
          'WALKTHROUGH_COMPLETED',
          'TESTING_IN_PROGRESS',
          'COMPLETED',
          'ADDRESSING_COMMENTS',
        ];
      }
      if (track === 'OET')
        return ['', 'TESTING_READY', 'TESTING_IN_PROGRESS', 'COMPLETED', 'ADDRESSING_COMMENTS'];
    }

    if (requiresDat) {
      return [
        '',
        'TESTING_READY',
        'WALKTHROUGH_SCHEDULED',
        'WALKTHROUGH_COMPLETED',
        'TESTING_IN_PROGRESS',
        'COMPLETED',
        'ADDRESSING_COMMENTS',
      ];
    }

    if (requiresOet) {
      return ['', 'TESTING_READY', 'TESTING_IN_PROGRESS', 'COMPLETED', 'ADDRESSING_COMMENTS'];
    }

    return [''];
  }

  function getTrackStep(testRow, track) {
    const raw = track === 'DAT' ? String(testRow?.datStep || '') : String(testRow?.oetStep || '');
    return raw;
  }

  async function setTrackStepApi(track, nextStep, statusValue) {
    if (testId == null) return null;
    if (track === 'DAT') return updateDat(testId, nextStep || null, statusValue);
    return updateOet(testId, nextStep || null, statusValue);
  }

  function isFinalTestingComplete(testRow) {
    const requiresDat = !!testRow?.requiresDat;
    const requiresOet = !!testRow?.requiresOet;

    const datStep = String(testRow?.datStep || '');
    const oetStep = String(testRow?.oetStep || '');

    const datReady = datStep === 'COMPLETED' || datStep === 'ADDRESSING_COMMENTS';
    const oetReady = oetStep === 'COMPLETED' || oetStep === 'ADDRESSING_COMMENTS';

    if (requiresDat && requiresOet) return datReady && oetReady;
    if (requiresDat) return datReady;
    if (requiresOet) return oetReady;
    return false;
  }

  function isInProgress(status) {
    const s = String(status || '').toUpperCase();
    return s === 'DAT_IN_PROGRESS' || s === 'OET_IN_PROGRESS';
  }

  function statusForTrack(track) {
    return track === 'DAT' ? 'DAT_IN_PROGRESS' : 'OET_IN_PROGRESS';
  }

  function getPrimaryActionLabel(testRow) {
    const statusUpper = String(testRow?.status || 'NOT_STARTED').toUpperCase();

    if (statusUpper === 'NOT_STARTED') return 'Start Work';
    if (isInProgress(statusUpper)) {
      if (isFinalTestingComplete(testRow)) return 'Submit for Approval';
      return 'Next Step';
    }
    if (statusUpper === 'IN_REVIEW') return 'Approve Control ✓';
    if (statusUpper === 'COMPLETED') return '';
    return 'Next Step';
  }

  async function handleStartWork() {
    if (testId == null) return;

    try {
      await runBusy('Starting work...', async () => {
        await startTest(testId);

        const requiresDat = !!t?.requiresDat;
        const requiresOet = !!t?.requiresOet;

        if (requiresDat) {
          await updateDat(testId, 'TESTING_READY', 'DAT_IN_PROGRESS');
        } else if (requiresOet) {
          await updateOet(testId, 'TESTING_READY', 'OET_IN_PROGRESS');
        }

        await refreshTest();
      });
    } catch (e) {
      alert(e?.message || 'Failed to start work');
    }
  }

  async function handlePrimaryAction() {
    if (testId == null) return;

    const statusUpper = String(t?.status || 'NOT_STARTED').toUpperCase();

    try {
      if (statusUpper === 'NOT_STARTED') {
        await handleStartWork();
        return;
      }

      if (statusUpper === 'IN_REVIEW') {
        const ok = window.confirm(`Approve control test ${vgcpid}?`);
        if (!ok) return;

        await runBusy('Approving control...', async () => {
          await completeTest(testId);
          await refreshTest();
        });
        return;
      }

      if (isInProgress(statusUpper)) {
        if (isFinalTestingComplete(t)) {
          const ok = window.confirm(`Submit ${vgcpid} for manager review?`);
          if (!ok) return;

          await runBusy('Submitting for approval...', async () => {
            await reviewTest(testId);
            await refreshTest();
          });
          return;
        }

        const track = getActiveTrack(t);
        if (!track) return;

        const steps = getFlowSteps(t, track);
        const cur = getTrackStep(t, track);
        const idx = Math.max(0, steps.indexOf(cur));
        const next = steps[Math.min(idx + 1, steps.length - 1)];

        await runBusy('Updating step...', async () => {
          await setTrackStepApi(track, next, statusForTrack(track));
          await refreshTest();
        });
        return;
      }
    } catch (e) {
      alert(e?.message || 'Update failed');
    }
  }

  function getRevertTrack(testRow) {
    const requiresDat = !!testRow?.requiresDat;
    const requiresOet = !!testRow?.requiresOet;

    const datStep = String(testRow?.datStep || '');
    const oetStep = String(testRow?.oetStep || '');

    const active = getActiveTrack(testRow);

    if (requiresDat && requiresOet) {
      if (active === 'OET' && oetStep === '' && datStep !== '') return 'DAT';
      if (active === 'DAT' && datStep === '' && oetStep !== '') return 'OET';
    }

    return active;
  }

  async function handleRevert() {
    if (testId == null) return;

    const statusUpper = String(t?.status || 'NOT_STARTED').toUpperCase();
    if (statusUpper === 'COMPLETED') return;

    try {
      if (statusUpper === 'IN_REVIEW') {
        const track = getActiveTrack(t) || (t?.requiresOet ? 'OET' : 'DAT');

        await runBusy('Reverting...', async () => {
          await setTrackStepApi(track, 'COMPLETED', statusForTrack(track));
          await refreshTest();
        });
        return;
      }

      if (isInProgress(statusUpper)) {
        const track = getRevertTrack(t);
        if (!track) return;

        const steps = getFlowSteps(t, track);
        const cur = getTrackStep(t, track);
        const idx = Math.max(0, steps.indexOf(cur));
        const prev = steps[Math.max(0, idx - 1)];

        const otherTrack = track === 'DAT' ? 'OET' : 'DAT';
        const otherStep = getTrackStep(t, otherTrack);

        const willBeNotStarted =
          prev === '' &&
          ((!!t?.requiresDat && !t?.requiresOet) ||
            (!t?.requiresDat && !!t?.requiresOet) ||
            (!!t?.requiresDat && !!t?.requiresOet && String(otherStep || '') === ''));

        const statusValue = willBeNotStarted ? 'NOT_STARTED' : statusForTrack(track);

        await runBusy('Reverting...', async () => {
          await setTrackStepApi(track, prev, statusValue);
          await refreshTest();
        });
      }
    } catch (e) {
      alert(e?.message || 'Failed to revert');
    }
  }

  async function handleReject() {
    if (testId == null) return;

    const statusUpper = String(t?.status || '').toUpperCase();
    if (statusUpper !== 'IN_REVIEW') return;

    const ok = window.confirm(
      `Reject ${vgcpid}? This will move it back to In Progress (Addressing Comments).`
    );
    if (!ok) return;

    try {
      await runBusy('Rejecting...', async () => {
        const finalTrack = t?.requiresOet ? 'OET' : 'DAT';
        await setTrackStepApi(finalTrack, 'ADDRESSING_COMMENTS', statusForTrack(finalTrack));
        await refreshTest();
      });
    } catch (e) {
      alert(e?.message || 'Failed to reject');
    }
  }

  function handleAddComment() {
    const text = commentText.trim();
    if (!text) return;

    const newComment = {
      id: `local-${Date.now()}`,
      author: 'You',
      text,
      date: new Date().toLocaleString(),
    };

    setLocalComments((prev) => [newComment, ...prev]);
    setCommentText('');
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

  const statusUpper = String(t?.status || 'NOT_STARTED').toUpperCase();
  const showRevert = statusUpper !== 'NOT_STARTED' && statusUpper !== 'COMPLETED';
  const showReject = statusUpper === 'IN_REVIEW';
  const primaryLabel = getPrimaryActionLabel(t);

  return (
    <>
      <div className="dtm-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
        <div className="dtm-modal" onMouseDown={stop}>
          {isBusy ? (
            <div className="dtm-busy-overlay" role="status" aria-live="polite">
              <div className="dtm-busy-card">
                <div className="dtm-spinner" aria-hidden="true" />
                <div className="dtm-busy-text">{busyMessage}</div>
              </div>
            </div>
          ) : null}
          <section className="dtm-header">
            <div className="dtm-title">Control Test Details: {String(vgcpid)}</div>
            <button className="dtm-close" type="button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </section>

          <div className="dtm-divider" />

          <section className="dtm-status">
            <div className="dtm-status-top">
              <div className="dtm-status-left">
                <span className={`badge badge--${statusToBadgeType(status)}`}>
                  {statusToLabel(status)}
                </span>
                <span className="dtm-dot">•</span>
                <span className="dtm-subtle">{typeLabel}</span>
              </div>

              <div className="dtm-assignee">
                <div className="dtm-assignee-label">Assigned To</div>
                <div className="dtm-assignee-row">
                  <div className="dtm-avatar" aria-hidden="true">
                    {initials(assignedName)}
                  </div>
                  <div className="dtm-assignee-name">{assignedName}</div>
                </div>
              </div>
            </div>

            <div className="dtm-step-card">
              <div className="dtm-step-left">
                <div className="dtm-step-icon" aria-hidden="true">
                  ▶
                </div>
                <div>
                  <div className="dtm-step-label">CURRENT STEP</div>
                  <div className="dtm-step-value">{currentStepLabel}</div>
                </div>
              </div>

              <div className="dtm-step-actions-left">
                {showRevert ? (
                  <button
                    className="dtm-btn dtm-btn--outline"
                    type="button"
                    onClick={handleRevert}
                    disabled={isBusy}
                  >
                    Revert
                  </button>
                ) : null}

                {showReject ? (
                  <button
                    className="dtm-btn dtm-btn--danger"
                    type="button"
                    onClick={handleReject}
                    disabled={isBusy}
                  >
                    Reject
                  </button>
                ) : null}
              </div>

              <div className="dtm-step-mid" aria-hidden="true">
                →
              </div>

              <div className="dtm-step-right">
                {primaryLabel ? (
                  <button
                    className="dtm-btn dtm-btn--primary"
                    type="button"
                    onClick={handlePrimaryAction}
                    disabled={isBusy}
                  >
                    {primaryLabel}
                  </button>
                ) : null}

                <span className="dtm-next">
                  <span className="dtm-next-label">Next:</span> {nextStepLabel}
                </span>
              </div>
            </div>
          </section>

          <div className="dtm-divider" />

          <section className="dtm-tabs">
            <button
              type="button"
              className={`dtm-tab ${activeTab === 'Details' ? 'dtm-tab--active' : ''}`}
              onClick={() => setActiveTab('Details')}
            >
              Details
            </button>
            <button
              type="button"
              className={`dtm-tab ${activeTab === 'Attachments' ? 'dtm-tab--active' : ''}`}
              onClick={() => setActiveTab('Attachments')}
            >
              Attachments
            </button>
            <button
              type="button"
              className={`dtm-tab ${activeTab === 'Comments' ? 'dtm-tab--active' : ''}`}
              onClick={() => setActiveTab('Comments')}
            >
              Comments
            </button>
            <button
              type="button"
              className={`dtm-tab ${activeTab === 'History' ? 'dtm-tab--active' : ''}`}
              onClick={() => setActiveTab('History')}
            >
              History
            </button>
          </section>

          <section className="dtm-body">
            {activeTab === 'Details' ? (
              <>
                <div className="dtm-details-grid">
                  <DetailItem label="DATE UPDATED" value={updatedAt} />
                  <DetailItem
                    label="DUE DATE"
                    value={
                      <span className="dtm-date-with-icon">
                        <span>{dueDate}</span>
                        {overdue && <Icon name="exclamation" category="deco" color="#c20029" />}
                      </span>
                    }
                  />
                  <DetailItem label="CURRENT STEP" value={currentStepLabel} />
                  <DetailItem label="ETA" value={etaDate} />
                </div>

                <div className="dtm-divider dtm-divider--soft" />

                <div className="dtm-desc">
                  <div className="dtm-section-title">Test Description</div>
                  <div className="dtm-desc-text">{description}</div>
                </div>
              </>
            ) : activeTab === 'Comments' ? (
              <>
                <div className="dtm-empty">
                  {localComments.length === 0 ? 'No comments found.' : null}
                </div>

                <div className="dtm-addcomment">
                  <input
                    className="dtm-comment-input"
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment();
                    }}
                  />
                  <button
                    className="dtm-send"
                    type="button"
                    onClick={handleAddComment}
                    aria-label="Send"
                  >
                    ➤
                  </button>
                </div>
              </>
            ) : activeTab === 'History' ? (
              <AuditHistoryView
                logs={historyLogs}
                loading={historyLoading}
                error={historyError}
                overlayTitle={`Test History: ${vgcpid}`}
                showContent={true}
                contextVgcpid={vgcpid}
              />
            ) : activeTab === 'Attachments' ? (
              <div className="dtm-empty">This view is not implemented yet.</div>
            ) : null}
          </section>

          <div className="dtm-divider" />

          <section className="dtm-footer">
            <button className="dtm-btn" type="button" onClick={onClose} disabled={isBusy}>
              Close
            </button>

            <div className="dtm-footer-right">
              <button
                className="dtm-btn dtm-btn--danger"
                type="button"
                onClick={handleDelete}
                disabled={isBusy}
              >
                Delete Control Test
              </button>
              <button
                className="dtm-btn dtm-btn--outline"
                type="button"
                onClick={handleArchive}
                disabled={isBusy}
              >
                Archive Control Test
              </button>
              <button
                className="dtm-btn dtm-btn--primary"
                type="button"
                onClick={openEdit}
                disabled={!testId}
              >
                Edit Control Test
              </button>
            </div>
          </section>
        </div>
      </div>

      <EditTestModal
        isOpen={isEditOpen}
        onClose={closeEdit}
        test={t}
        onUpdated={async () => {
          closeEdit();
          onClose?.();
          window.location.reload();
        }}
      />
    </>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="dtm-detail">
      <div className="dtm-detail-label">{label}</div>
      <div className="dtm-detail-value">{value ?? '-'}</div>
    </div>
  );
}

function initials(name) {
  const s = String(name || '?').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || '?';
  const b = parts[1]?.[0] || '';
  return (a + b).toUpperCase();
}

function testTypeFromFlags(t) {
  const dat = !!t?.requiresDat;
  const oet = !!t?.requiresOet;
  if (dat && oet) return 'DAT & OET';
  if (dat) return 'DAT Only';
  if (oet) return 'OET Only';
  return '-';
}

function humanStep(s) {
  if (!s) return 'Not Started';
  return String(s)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function computeStepLabels(test) {
  const requiresDat = !!test?.requiresDat;
  const requiresOet = !!test?.requiresOet;

  const datStep = String(test?.datStep || '');
  const oetStep = String(test?.oetStep || '');

  const datDone = datStep === 'COMPLETED';
  const oetDone = oetStep === 'COMPLETED';

  let track = null;
  let step = null;

  if (requiresDat && !datDone) {
    track = 'DAT';
    step = datStep;
  } else if (requiresOet && !oetDone) {
    track = 'OET';
    step = oetStep;
  } else if (requiresOet) {
    track = 'OET';
    step = oetStep;
  } else if (requiresDat) {
    track = 'DAT';
    step = datStep;
  }

  const currentStepLabel = track ? `${humanStep(step)}` : humanStep(null);

  const datFlow = [
    '',
    'TESTING_READY',
    'WALKTHROUGH_SCHEDULED',
    'WALKTHROUGH_COMPLETED',
    'TESTING_IN_PROGRESS',
    'COMPLETED',
    'ADDRESSING_COMMENTS',
  ];
  const oetFlow = ['', 'TESTING_READY', 'TESTING_IN_PROGRESS', 'COMPLETED', 'ADDRESSING_COMMENTS'];

  const flow = track === 'DAT' ? datFlow : oetFlow;

  let nextStepLabel = '-';

  if (String(step || '').toUpperCase() === 'ADDRESSING_COMMENTS') {
    nextStepLabel = 'Submit for Approval';
  } else {
    const idx = Math.max(0, flow.indexOf(String(step || '')));
    const next = flow[Math.min(idx + 1, flow.length - 1)];

    if (next === '')
      nextStepLabel = track === 'DAT' ? 'Walkthrough Scheduled' : 'Testing In Progress';
    else if (next === 'WALKTHROUGH_SCHEDULED') nextStepLabel = 'Walkthrough Scheduled';
    else if (next === 'WALKTHROUGH_COMPLETED') nextStepLabel = 'Walkthrough Completed';
    else if (next === 'TESTING_IN_PROGRESS') nextStepLabel = 'Testing In Progress';
    else if (next === 'COMPLETED') nextStepLabel = 'Testing Completed';
    else if (next === 'ADDRESSING_COMMENTS') nextStepLabel = 'Submit for Approval';
    else nextStepLabel = humanStep(next);
  }

  return { currentStepLabel, nextStepLabel };
}

function formatLongDate(value) {
  const d = parseLocalDate(value);
  if (!d) return '-';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseLocalDate(value) {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isOverdue(value) {
  const due = parseLocalDate(value);
  if (!due) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return due < today;
}
