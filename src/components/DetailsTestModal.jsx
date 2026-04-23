import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/components/DetailsTestModal.css';
import Icon from './common/Icon';
import AuditHistoryView from './AuditHistoryView';
import EditTestModal from './EditTestModal';
import ConfirmActionModal from './ConfirmActionModal';
import { objectToCamelCase } from '../utils/transformer';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import {
  archiveTest,
  hardDeleteTest,
  startTest,
  reviewTest,
  completeTest,
  updateDat,
  updateOet,
  fetchTestById,
  unarchiveTest,
} from '../api/TestsAPI';
import { fetchAuditLogsByTestId } from '../api/AuditAPI';
import { fetchCommentsByTestId, createTestComment, mapCommentRowsToUi } from '../api/CommentsAPI';
import { fetchUsers, fetchUserByEmail } from '../api/UsersAPI';
import { fetchUserAttributes } from 'aws-amplify/auth';
import RestrictedAction from './RestrictedAction';
import { ACTIONS } from '../auth';
import { isOverdue, parseLocalDate } from '../utils/date.js';

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

  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isUnarchiveConfirmOpen, setIsUnarchiveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);

  const openArchiveConfirm = () => setIsArchiveConfirmOpen(true);
  const closeArchiveConfirm = () => setIsArchiveConfirmOpen(false);
  const openUnarchiveConfirm = () => setIsUnarchiveConfirmOpen(true);
  const closeUnarchiveConfirm = () => setIsUnarchiveConfirmOpen(false);

  const openDeleteConfirm = () => setIsDeleteConfirmOpen(true);
  const closeDeleteConfirm = () => setIsDeleteConfirmOpen(false);

  const openSubmitConfirm = () => setIsSubmitConfirmOpen(true);
  const closeSubmitConfirm = () => setIsSubmitConfirmOpen(false);

  const openRejectConfirm = () => setIsRejectConfirmOpen(true);
  const closeRejectConfirm = () => setIsRejectConfirmOpen(false);

  const openApproveConfirm = () => setIsApproveConfirmOpen(true);
  const closeApproveConfirm = () => setIsApproveConfirmOpen(false);

  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [usersById, setUsersById] = useState({});

  const normalizedTest = useMemo(
    () => objectToCamelCase(localTest ?? test ?? null),
    [localTest, test]
  );

  const currentTestId = normalizedTest?.testId ?? null;

  const buildUsersById = useCallback((users) => {
    const map = {};
    for (const u of Array.isArray(users) ? users : []) {
      const id = u?.['user_id'];
      if (id != null) map[String(id)] = u;
    }
    return map;
  }, []);

  const getCurrentUserEmail = useCallback(async () => {
    try {
      const attrs = await fetchUserAttributes();
      return attrs?.email || '';
    } catch {
      return '';
    }
  }, []);

  const loadCommentsAndUsers = useCallback(
    async (tid, isCancelled = () => false) => {
      if (tid == null) {
        if (!isCancelled()) setLocalComments([]);
        return;
      }

      if (!isCancelled()) {
        setCommentsLoading(true);
        setCommentsError('');
      }

      try {
        const [commentRows, activeUsers] = await Promise.all([
          fetchCommentsByTestId(tid),
          fetchUsers({ isActive: true }),
        ]);

        if (isCancelled()) return;

        const userMap = buildUsersById(activeUsers);
        setUsersById(userMap);

        const uiComments = mapCommentRowsToUi(commentRows, userMap);
        setLocalComments(uiComments);

        const email = await getCurrentUserEmail();
        if (isCancelled()) return;

        if (email) {
          try {
            const me = await fetchUserByEmail(email);
            if (!isCancelled()) setCurrentUser(me || null);
          } catch (e) {
            console.warn('Failed to resolve current user by email', e);
          }
        } else if (!isCancelled()) {
          setCurrentUser(null);
        }
      } catch (e) {
        if (!isCancelled()) {
          setCommentsError(e?.message || 'Failed to load comments');
          setLocalComments([]);
          setCurrentUser(null);
        }
      } finally {
        if (!isCancelled()) setCommentsLoading(false);
      }
    },
    [buildUsersById, getCurrentUserEmail]
  );

  useEffect(() => {
    if (!isOpen) {
      setIsEditOpen(false);
      setIsArchiveConfirmOpen(false);
      setIsUnarchiveConfirmOpen(false);
      setIsDeleteConfirmOpen(false);
      setIsSubmitConfirmOpen(false);
      setIsRejectConfirmOpen(false);
      setIsApproveConfirmOpen(false);
    }
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
    setIsArchiveConfirmOpen(false);
    setIsDeleteConfirmOpen(false);
    setIsSubmitConfirmOpen(false);
    setIsRejectConfirmOpen(false);
    setIsApproveConfirmOpen(false);
    setCommentsError('');
    setCurrentUser(null);
    setUsersById({});
    setLocalTest(objectToCamelCase(test ?? null));
  }, [isOpen, test]);

  useEffect(() => {
    if (!isOpen || !currentTestId) return;

    let cancelled = false;
    void loadCommentsAndUsers(currentTestId, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentTestId, loadCommentsAndUsers]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;

      if (isDeleteConfirmOpen) {
        closeDeleteConfirm();
        return;
      }

      if (isArchiveConfirmOpen) {
        closeArchiveConfirm();
        return;
      }

      if (isUnarchiveConfirmOpen) {
        closeUnarchiveConfirm();
        return;
      }

      if (isSubmitConfirmOpen) {
        closeSubmitConfirm();
        return;
      }

      if (isRejectConfirmOpen) {
        closeRejectConfirm();
        return;
      }

      if (isApproveConfirmOpen) {
        closeApproveConfirm();
        return;
      }

      onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    isOpen,
    onClose,
    isDeleteConfirmOpen,
    isArchiveConfirmOpen,
    isSubmitConfirmOpen,
    isRejectConfirmOpen,
    isApproveConfirmOpen,
  ]);

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
  const testTitle = t?.title ?? t?.description ?? String(vgcpid);
  const assignedName = t?.assignedTesterName ?? t?.testerName ?? String(t?.assignedTesterId ?? '-');

  const status = t?.status ?? 'NOT_STARTED';
  const typeLabel = testTypeFromFlags(t);

  const updatedAt = formatLongDate(t?.updatedAt);
  const dueDate = formatLongDate(t?.dueDate);
  const overdue =
    isOverdue(t?.dueDate) &&
    !['COMPLETED', 'ARCHIVED'].includes(String(t?.status || '').toUpperCase());
  const etaDate = formatLongDate(t?.estimatedDate);

  const description = t?.description ?? 'No description.';

  function showPermissionDeniedToast() {
    showErrorToast({
      title: 'Permission Denied',
      message: 'Only managers have permission for this action. Contact a manager for access.',
    });
  }

  async function handleArchive() {
    if (testId == null) return;

    try {
      await archiveTest(testId);

      const fresh = await refreshTest();

      await onArchived?.(testId, fresh ?? { ...t, status: 'ARCHIVED' });

      showSuccessToast({
        title: 'Control Test Archived',
        message: `${vgcpid} has been archived successfully.`,
      });

      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to archive control test';

      showErrorToast({
        title: 'Control Test Archive Failed',
        message: `An error occurred while archiving the control test: ${errorMessage}`,
      });
    }
  }

  async function handleUnarchive() {
    if (testId == null) return;

    try {
      await runBusy('Unarchiving...', async () => {
        await unarchiveTest(testId);
        await refreshTest();
      });

      showSuccessToast({
        title: 'Control Test Unarchived',
        message: `${vgcpid} has been unarchived successfully.`,
      });

      await onUpdated?.();
      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to unarchive control test';

      showErrorToast({
        title: 'Control Test Unarchive Failed',
        message: `An error occurred while unarchiving the control test: ${errorMessage}`,
      });
    }
  }

  async function handleDelete() {
    if (testId == null) return;

    try {
      await hardDeleteTest(testId);
      await onDeleted?.(testId);

      showSuccessToast({
        title: 'Control Test Deleted',
        message: `${vgcpid} has been deleted successfully.`,
      });

      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to delete control test';

      showErrorToast({
        title: 'Control Test Delete Failed',
        message: `An error occurred while deleting the control test: ${errorMessage}`,
      });
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
      if (track === 'OET') {
        return ['', 'TESTING_READY', 'TESTING_IN_PROGRESS', 'COMPLETED', 'ADDRESSING_COMMENTS'];
      }
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

  function isInProgress(statusValue) {
    const s = String(statusValue || '').toUpperCase();
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

  async function handleApproveConfirmAction() {
    if (testId == null) return;

    try {
      await runBusy('Approving control...', async () => {
        await completeTest(testId);
        await refreshTest();
      });

      showSuccessToast({
        title: 'Control Test Completed',
        message: `${vgcpid} has been completed successfully.`,
      });
    } catch (e) {
      const errorMessage = e?.message || 'Failed to complete control test';

      showErrorToast({
        title: 'Control Test Completion Failed',
        message: `An error occurred while completing the control test: ${errorMessage}`,
      });
    }
  }

  async function handleSubmitForApprovalConfirmAction() {
    if (testId == null) return;

    await runBusy('Submitting for approval...', async () => {
      await reviewTest(testId);
      await refreshTest();
    });
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
        openApproveConfirm();
        return;
      }

      if (isInProgress(statusUpper)) {
        if (isFinalTestingComplete(t)) {
          openSubmitConfirm();
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

  async function handleAddComment() {
    const text = commentText.trim();
    if (!text || testId == null || commentSaving) return;

    if (!currentUser?.['user_id']) {
      setCommentsError('Could not identify the logged-in user.');
      return;
    }

    try {
      setCommentSaving(true);
      setCommentsError('');

      const created = await createTestComment({
        testId,
        commentText: text,
      });

      const createdUi = mapCommentRowsToUi([created], {
        ...usersById,
        ...(currentUser?.['user_id'] != null
          ? { [String(currentUser['user_id'])]: currentUser }
          : {}),
      })[0];

      setLocalComments((prev) => [createdUi, ...prev]);
      setCommentText('');
    } catch (e) {
      setCommentsError(e?.message || 'Failed to add comment');
    } finally {
      setCommentSaving(false);
    }
  }

  function statusToLabel(statusValue) {
    return String(statusValue || 'NOT_STARTED')
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
      .replace(/\b(Dat|Oet)\b/g, (m) => m.toUpperCase());
  }

  function statusToBadgeType(statusValue) {
    return String(statusValue || 'NOT_STARTED')
      .toLowerCase()
      .replaceAll('_', '-');
  }

  const statusUpper = String(t?.status || 'NOT_STARTED').toUpperCase();
  const isLockedStatus = statusUpper === 'COMPLETED';
  const showRevert = statusUpper !== 'NOT_STARTED';
  const showReject = statusUpper === 'IN_REVIEW';
  const primaryLabel = getPrimaryActionLabel(t);
  const showNextStepPanel = statusUpper !== 'COMPLETED';

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
                    disabled={isBusy || isLockedStatus}
                    title={
                      isBusy
                        ? 'Action in progress'
                        : isLockedStatus
                          ? `Cannot revert a ${statusUpper.toLowerCase()} control test`
                          : 'Revert this control test to the previous step'
                    }
                  >
                    Revert
                  </button>
                ) : null}

                {showReject ? (
                  <button
                    className="dtm-btn dtm-btn--danger"
                    type="button"
                    onClick={openRejectConfirm}
                    disabled={isBusy}
                  >
                    Reject
                  </button>
                ) : null}
              </div>

              {showNextStepPanel ? (
                <>
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
                </>
              ) : null}
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
                <div className="dtm-addcomment dtm-addcomment--top">
                  <input
                    className="dtm-comment-input"
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={commentSaving || commentsLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment();
                    }}
                  />
                  <button
                    className="dtm-send"
                    type="button"
                    onClick={handleAddComment}
                    aria-label="Send"
                    disabled={
                      !currentUser || commentSaving || commentsLoading || !commentText.trim()
                    }
                  >
                    {commentSaving ? '...' : '➤'}
                  </button>
                </div>

                <div className="dtm-comments">
                  {commentsLoading ? (
                    <div className="dtm-empty">Loading comments...</div>
                  ) : commentsError ? (
                    <div className="dtm-empty">Error: {commentsError}</div>
                  ) : localComments.length === 0 ? (
                    <div className="dtm-empty">No comments found.</div>
                  ) : (
                    localComments.map((c) => (
                      <div className="dtm-comment" key={c.id}>
                        <div className="dtm-comment-left">
                          <div className="dtm-avatar" aria-hidden="true">
                            {String(c.author || '?')
                              .trim()
                              .slice(0, 1)
                              .toUpperCase()}
                          </div>
                        </div>

                        <div className="dtm-comment-main">
                          <div className="dtm-comment-top">
                            <div className="dtm-comment-author">{c.author ?? '-'}</div>
                            <div className="dtm-comment-date">{c.date ?? ''}</div>
                          </div>
                          <div className="dtm-comment-text">{c.text ?? ''}</div>
                        </div>
                      </div>
                    ))
                  )}
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
              {/* Archive / Unarchive */}
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
                <RestrictedAction action={ACTIONS.ARCHIVE_CONTROL_TEST}>
                  {statusUpper === 'ARCHIVED' ? (
                    <button
                      className="dtm-btn dtm-btn--outline"
                      type="button"
                      onClick={openUnarchiveConfirm}
                      disabled={isBusy}
                    >
                      Unarchive Control Test
                    </button>
                  ) : (
                    <button
                      className="dtm-btn dtm-btn--outline"
                      type="button"
                      onClick={openArchiveConfirm}
                      disabled={isBusy}
                    >
                      Archive Control Test
                    </button>
                  )}
                </RestrictedAction>
              </div>

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
                <RestrictedAction action={ACTIONS.DELETE_CONTROL_TEST}>
                  <button
                    className="dtm-btn dtm-btn--danger"
                    type="button"
                    onClick={openDeleteConfirm}
                    disabled={isBusy}
                  >
                    Delete Control Test
                  </button>
                </RestrictedAction>
              </div>

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

      <ConfirmActionModal
        isOpen={isDeleteConfirmOpen}
        onClose={closeDeleteConfirm}
        onConfirm={async () => {
          closeDeleteConfirm();
          await handleDelete();
        }}
        title="Delete Control Test?"
        message="Are you sure you want to permanently delete this control test?"
        itemName={String(vgcpid)}
        warning="Deleted control tests will be permanently removed and cannot be recovered."
        confirmText={isBusy ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        confirmDisabled={isBusy}
        cancelDisabled={isBusy}
      />

      <ConfirmActionModal
        isOpen={isArchiveConfirmOpen}
        onClose={closeArchiveConfirm}
        onConfirm={async () => {
          closeArchiveConfirm();
          await handleArchive();
        }}
        title="Archive Control Test?"
        message="Are you sure you want to archive this control test?"
        itemName={String(vgcpid)}
        warning="Archived control tests will be removed from active views, but can still be accessed from the archive."
        confirmText={isBusy ? 'Archiving...' : 'Archive'}
        cancelText="Cancel"
        confirmDisabled={isBusy}
        cancelDisabled={isBusy}
        confirmButtonClassName="dcm-confirm-btn dcm-confirm-btn--delete"
      />

      <ConfirmActionModal
        isOpen={isUnarchiveConfirmOpen}
        onClose={closeUnarchiveConfirm}
        onConfirm={async () => {
          closeUnarchiveConfirm();
          await handleUnarchive();
        }}
        title="Unarchive Control Test?"
        message="Are you sure you want to unarchive this control test?"
        itemName={String(vgcpid)}
        warning="Unarchived control tests will be returned to active views and set to Not Started."
        confirmText={isBusy ? 'Unarchiving...' : 'Unarchive'}
        cancelText="Cancel"
        confirmDisabled={isBusy}
        cancelDisabled={isBusy}
      />

      <ConfirmActionModal
        isOpen={isSubmitConfirmOpen}
        onClose={closeSubmitConfirm}
        onConfirm={async () => {
          closeSubmitConfirm();
          await handleSubmitForApprovalConfirmAction();
        }}
        title="Submit Control Test?"
        message="Are you sure you want to submit this test for approval?"
        itemName={String(testTitle)}
        warning='This will move the control test to the "In Review" Status.'
        confirmText={isBusy ? 'Submitting...' : 'Submit'}
        cancelText="Cancel"
        confirmDisabled={isBusy}
        cancelDisabled={isBusy}
        confirmButtonClassName="dcm-confirm-btn dcm-confirm-btn--delete"
      />

      <ConfirmActionModal
        isOpen={isRejectConfirmOpen}
        onClose={closeRejectConfirm}
        onConfirm={async () => {
          closeRejectConfirm();
          await handleReject();
        }}
        title="Reject Control Test?"
        message="Are you sure you want to reject this test?"
        itemName={String(testTitle)}
        warning='This will return the control test to "Addressing Comments" for future action.'
        confirmText={isBusy ? 'Rejecting...' : 'Reject'}
        cancelText="Cancel"
        confirmDisabled={isBusy}
        cancelDisabled={isBusy}
      />

      <ConfirmActionModal
        isOpen={isApproveConfirmOpen}
        onClose={closeApproveConfirm}
        onConfirm={async () => {
          closeApproveConfirm();
          await handleApproveConfirmAction();
        }}
        title="Approve Control Test?"
        message="Are you sure you want to approve this test?"
        itemName={String(testTitle)}
        warning='This will mark the control test as "Completed".'
        confirmText={isBusy ? 'Approving...' : 'Approve'}
        cancelText="Cancel"
        confirmDisabled={isBusy}
        cancelDisabled={isBusy}
        confirmButtonClassName="dcm-confirm-btn dcm-confirm-btn--delete"
      />

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
