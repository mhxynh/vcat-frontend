import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/components/DetailsTestModal.css';
import Icon from './common/Icon';
import AuditHistoryView from './AuditHistoryView';
import EditTestModal from './EditTestModal';
import AddAttachmentLinkModal from './AddAttachmentLinkModal';
import ConfirmActionModal from './ConfirmActionModal';
import { ActionButton, Badge } from './ui';
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
  updateTest,
  fetchTestById,
  unarchiveTest,
} from '../api/TestsAPI';
import { fetchAuditLogsByTestId } from '../api/AuditAPI';
import {
  fetchCommentsByTestId,
  createTestComment,
  deleteTestComment,
  mapCommentRowsToUi,
} from '../api/CommentsAPI';
import { fetchUsers, fetchUserByEmail } from '../api/UsersAPI';
import { fetchUserAttributes } from 'aws-amplify/auth';
import RestrictedAction from './RestrictedAction';
import { ACTIONS, useRole } from '../auth';
import { isOverdue, parseLocalDate } from '../utils/date.js';
import { createRefreshHandlers } from '../utils/modalRefresh';

export default function DetailsTestModal({
  isOpen,
  onClose,
  test,
  onArchived,
  onDeleted,
  onEdit,
  onUpdated,
}) {
  const { isManager } = useRole();
  const [activeTab, setActiveTab] = useState('Details');
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [localTest, setLocalTest] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('Updating...');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => setIsEditOpen(false);

  const [isAddAttachmentModalOpen, setIsAddAttachmentModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isUnarchiveConfirmOpen, setIsUnarchiveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isUnblockConfirmOpen, setIsUnblockConfirmOpen] = useState(false);
  const [isRemoveAttachmentConfirmOpen, setIsRemoveAttachmentConfirmOpen] = useState(false);
  const [pendingAttachmentRemoval, setPendingAttachmentRemoval] = useState(null);

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

  const openBlockConfirm = () => setIsBlockConfirmOpen(true);
  const closeBlockConfirm = () => setIsBlockConfirmOpen(false);

  const openUnblockConfirm = () => setIsUnblockConfirmOpen(true);
  const closeUnblockConfirm = () => setIsUnblockConfirmOpen(false);

  const openAddAttachmentModal = () => setIsAddAttachmentModalOpen(true);
  const closeAddAttachmentModal = () => setIsAddAttachmentModalOpen(false);

  const openRemoveAttachmentConfirm = () => setIsRemoveAttachmentConfirmOpen(true);
  const closeRemoveAttachmentConfirm = () => {
    setIsRemoveAttachmentConfirmOpen(false);
    setPendingAttachmentRemoval(null);
  };

  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [commentSaving, setCommentSaving] = useState(false);
  const [commentDeletingId, setCommentDeletingId] = useState(null);
  const [isDeleteCommentConfirmOpen, setIsDeleteCommentConfirmOpen] = useState(false);
  const [pendingCommentDeletion, setPendingCommentDeletion] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [usersById, setUsersById] = useState({});

  const normalizedTest = useMemo(
    () => objectToCamelCase(localTest ?? test ?? null),
    [localTest, test]
  );
  const attachments = useMemo(() => normalizeAttachments(normalizedTest), [normalizedTest]);

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
      setIsBlockConfirmOpen(false);
      setIsUnblockConfirmOpen(false);
      setIsRemoveAttachmentConfirmOpen(false);
      setIsAddAttachmentModalOpen(false);
      setPendingAttachmentRemoval(null);
      setIsDeleteCommentConfirmOpen(false);
      setPendingCommentDeletion(null);
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
    setIsBlockConfirmOpen(false);
    setIsUnblockConfirmOpen(false);
    setIsDeleteCommentConfirmOpen(false);
    setPendingCommentDeletion(null);
    setIsRemoveAttachmentConfirmOpen(false);
    setPendingAttachmentRemoval(null);
    setCommentsError('');
    setCommentDeletingId(null);
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

      if (isBlockConfirmOpen) {
        closeBlockConfirm();
        return;
      }

      if (isUnblockConfirmOpen) {
        closeUnblockConfirm();
        return;
      }

      if (isRemoveAttachmentConfirmOpen) {
        closeRemoveAttachmentConfirm();
        return;
      }

      if (isAddAttachmentModalOpen) {
        closeAddAttachmentModal();
        return;
      }

      if (isDeleteCommentConfirmOpen) {
        setIsDeleteCommentConfirmOpen(false);
        setPendingCommentDeletion(null);
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
    isUnarchiveConfirmOpen,
    isSubmitConfirmOpen,
    isRejectConfirmOpen,
    isApproveConfirmOpen,
    isBlockConfirmOpen,
    isUnblockConfirmOpen,
    isRemoveAttachmentConfirmOpen,
    isAddAttachmentModalOpen,
    isDeleteCommentConfirmOpen,
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
    const normalized = preserveAssignedTesterDisplayName(
      objectToCamelCase(fresh),
      normalizedTest,
      usersById
    );

    setLocalTest(normalized);
    onEdit?.(normalized);
    await onUpdated?.(normalized);
    return normalized;
  }

  const { refreshInline, refreshAndClose } = createRefreshHandlers({
    localRefresh: refreshTest,
    parentRefresh: onUpdated,
  });

  const stop = (e) => e.stopPropagation();

  const t = useMemo(() => normalizedTest ?? {}, [normalizedTest]);

  const { currentStepLabel, nextStepLabel } = useMemo(() => computeStepLabels(t), [t]);

  if (!isOpen) return null;

  const testId = currentTestId;
  const vgcpid = t?.vgcpid ?? t?.controlVgcpid ?? t?.controlId ?? 'Unknown';
  const testTitle = t?.title ?? t?.description ?? String(vgcpid);
  const assignedName = getAssignedTesterDisplayName(t, usersById);

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

  function handleAddEvidenceLink() {
    openAddAttachmentModal();
  }

  function normalizeEvidenceLinkUrl(nextUrl) {
    const parsedUrl = new URL(nextUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Unsupported URL protocol');
    }
    return parsedUrl.toString();
  }

  async function handleAddAttachmentLinkSubmit(nextUrl) {
    if (testId == null || isBusy) return;

    let normalizedUrl = nextUrl;
    try {
      normalizedUrl = normalizeEvidenceLinkUrl(nextUrl);
    } catch {
      showErrorToast({
        title: 'Invalid Link',
        message: 'Enter a valid http:// or https:// URL.',
      });
      return;
    }

    const existingUrls = attachments.map((attachment) => attachment.url);
    const normalizedExistingUrls = Array.from(
      new Set(
        existingUrls
          .map((url) => {
            try {
              return normalizeEvidenceLinkUrl(url);
            } catch {
              return String(url || '').trim();
            }
          })
          .filter(Boolean)
      )
    );

    if (normalizedExistingUrls.includes(normalizedUrl)) {
      showErrorToast({
        title: 'Link Already Added',
        message: 'That evidence link is already in the list.',
      });
      return;
    }

    try {
      await runBusy('Saving attachments...', async () => {
        await updateTest(testId, {
          action: 'update_evidence_links',
          evidenceLinks: [...normalizedExistingUrls, normalizedUrl],
        });
        await refreshTest();
      });

      showSuccessToast({
        title: 'Evidence Link Added',
        message: 'The attachment list has been updated.',
      });

      closeAddAttachmentModal();
    } catch (e) {
      showErrorToast({
        title: 'Failed to Add Link',
        message: e?.message || 'An error occurred while saving the evidence link.',
      });
    }
  }

  async function handleRemoveEvidenceLink(url) {
    if (testId == null || isBusy || !url) return;

    const attachment = attachments.find((item) => item.url === url) || null;
    setPendingAttachmentRemoval(attachment || { url, title: url });
    openRemoveAttachmentConfirm();
  }

  async function handleConfirmRemoveEvidenceLink() {
    const url = pendingAttachmentRemoval?.url;
    if (testId == null || isBusy || !url) return;

    const nextLinks = attachments
      .map((attachment) => attachment.url)
      .filter((attachmentUrl) => attachmentUrl !== url);

    try {
      await runBusy('Updating attachments...', async () => {
        await updateTest(testId, {
          action: 'update_evidence_links',
          evidenceLinks: nextLinks,
        });
        await refreshTest();
      });

      showSuccessToast({
        title: 'Evidence Link Removed',
        message: 'The attachment list has been updated.',
      });
      closeRemoveAttachmentConfirm();
    } catch (e) {
      showErrorToast({
        title: 'Failed to Remove Link',
        message: e?.message || 'An error occurred while removing the evidence link.',
      });
    }
  }

  async function handleArchive() {
    if (testId == null || isBusy) return;

    try {
      setIsBusy(true);

      await archiveTest(testId);

      const fresh = await refreshTest();

      await onArchived?.(testId, fresh ?? { ...t, status: 'ARCHIVED' });

      showSuccessToast({
        title: 'Control Test Archived',
        message: `${vgcpid} has been archived successfully.`,
      });

      setIsArchiveConfirmOpen(false);
      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to archive control test';

      showErrorToast({
        title: 'Control Test Archive Failed',
        message: `An error occurred while archiving the control test: ${errorMessage}`,
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUnarchive() {
    if (testId == null || isBusy) return;

    try {
      setBusyMessage('Unarchiving...');
      setIsBusy(true);

      await unarchiveTest(testId);

      await refreshTest();

      showSuccessToast({
        title: 'Control Test Unarchived',
        message: `${vgcpid} has been unarchived successfully.`,
      });

      setIsUnarchiveConfirmOpen(false);
      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to unarchive control test';

      showErrorToast({
        title: 'Control Test Unarchive Failed',
        message: `An error occurred while unarchiving the control test: ${errorMessage}`,
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (testId == null || isBusy) return;

    try {
      setBusyMessage('Deleting...');
      setIsBusy(true);

      await hardDeleteTest(testId);

      await onDeleted?.(testId);

      showSuccessToast({
        title: 'Control Test Deleted',
        message: `${vgcpid} has been deleted successfully.`,
      });

      setIsDeleteConfirmOpen(false);
      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to delete control test';

      showErrorToast({
        title: 'Control Test Delete Failed',
        message: `An error occurred while deleting the control test: ${errorMessage}`,
      });
    } finally {
      setIsBusy(false);
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
    if (statusUpper === 'BLOCKED') return '';
    if (isInProgress(statusUpper)) {
      if (isFinalTestingComplete(testRow)) return 'Submit for Approval';
      return 'Next Step';
    }
    if (statusUpper === 'IN_REVIEW') return 'Approve Control';
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

        await refreshInline();
      });
    } catch (e) {
      alert(e?.message || 'Failed to start work');
    }
  }

  async function handleApproveConfirmAction() {
    if (testId == null) return;
    if (!isManager) {
      showPermissionDeniedToast();
      return;
    }

    try {
      await runBusy('Approving control...', async () => {
        await completeTest(testId);
        await refreshInline();
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

  async function handleBlock() {
    if (testId == null) return;

    try {
      await runBusy('Marking as blocked...', async () => {
        const track = getActiveTrack(t) || (t?.requiresOet ? 'OET' : 'DAT');
        if (!track) return;

        await setTrackStepApi(track, 'TESTING_BLOCKED', 'BLOCKED');
        await refreshInline();
      });

      showSuccessToast({
        title: 'Control Test Blocked',
        message: `${vgcpid} has been marked as blocked.`,
      });
    } catch (e) {
      showErrorToast({
        title: 'Failed to Mark Blocked',
        message: e?.message || 'An error occurred while marking the control test as blocked.',
      });
    }
  }

  async function handleUnblock() {
    if (testId == null) return;

    try {
      await runBusy('Unblocking test...', async () => {
        const track = getActiveTrack(t) || (t?.requiresOet ? 'OET' : 'DAT');
        if (!track) return;

        await setTrackStepApi(track, 'TESTING_READY', statusForTrack(track));
        await refreshInline();
      });

      showSuccessToast({
        title: 'Control Test Unblocked',
        message: `${vgcpid} has been unblocked and returned to in progress.`,
      });
    } catch (e) {
      showErrorToast({
        title: 'Failed to Unblock Test',
        message: e?.message || 'An error occurred while unblocking the control test.',
      });
    }
  }

  async function handleSubmitForApprovalConfirmAction() {
    if (testId == null) return;

    await runBusy('Submitting for approval...', async () => {
      await reviewTest(testId);
      await refreshInline();
    });
  }

  async function handlePrimaryAction() {
    if (testId == null) return;

    const statusUpper = String(t?.status || 'NOT_STARTED').toUpperCase();

    if (statusUpper === 'IN_REVIEW' && !isManager) {
      showPermissionDeniedToast();
      return;
    }

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
          await refreshInline();
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
    if (statusUpper === 'IN_REVIEW' && !isManager) {
      showPermissionDeniedToast();
      return;
    }

    try {
      if (statusUpper === 'IN_REVIEW') {
        const track = getActiveTrack(t) || (t?.requiresOet ? 'OET' : 'DAT');

        await runBusy('Reverting...', async () => {
          await setTrackStepApi(track, 'COMPLETED', statusForTrack(track));
          await refreshInline();
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
          await refreshInline();
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
    if (!isManager) {
      showPermissionDeniedToast();
      return;
    }

    try {
      await runBusy('Rejecting...', async () => {
        const finalTrack = t?.requiresOet ? 'OET' : 'DAT';
        await setTrackStepApi(finalTrack, 'ADDRESSING_COMMENTS', statusForTrack(finalTrack));
        await refreshInline();
      });
    } catch (e) {
      alert(e?.message || 'Failed to reject');
    }
  }

  async function handleAddComment() {
    const text = commentText.trim();
    if (!text || testId == null || commentSaving) return;

    if (!currentUser?.['user_id']) {
      const msg = 'Could not identify the logged-in user.';
      setCommentsError(msg);
      showErrorToast({
        title: 'Failed to add comment',
        message: msg,
      });
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
      showSuccessToast({
        title: 'Comment Added',
        message: 'Your comment was posted successfully.',
      });
    } catch (e) {
      const msg = e?.message || 'Failed to add comment';
      setCommentsError(msg);
      showErrorToast({
        title: 'Failed to add comment',
        message: msg,
      });
    } finally {
      setCommentSaving(false);
    }
  }

  async function handleDeleteComment(comment) {
    const commentId = comment?.id;
    const commentAuthorId = comment?.authorUserId;

    if (testId == null || commentId == null || commentDeletingId != null) return;

    const currentUserId = currentUser?.['user_id'];
    if (currentUserId == null || String(currentUserId) !== String(commentAuthorId ?? '')) {
      const msg = 'You can only delete comments you posted.';
      setCommentsError(msg);
      showErrorToast({
        title: 'Failed to delete comment',
        message: msg,
      });
      return;
    }

    setPendingCommentDeletion(comment);
    setIsDeleteCommentConfirmOpen(true);
  }

  async function handleConfirmDeleteComment() {
    const comment = pendingCommentDeletion;
    const commentId = comment?.id;
    const commentAuthorId = comment?.authorUserId;

    if (testId == null || commentId == null || commentDeletingId != null) return;

    const currentUserId = currentUser?.['user_id'];
    if (currentUserId == null || String(currentUserId) !== String(commentAuthorId ?? '')) {
      const msg = 'You can only delete comments you posted.';
      setCommentsError(msg);
      showErrorToast({
        title: 'Failed to delete comment',
        message: msg,
      });
      setIsDeleteCommentConfirmOpen(false);
      setPendingCommentDeletion(null);
      return;
    }

    try {
      setCommentDeletingId(String(commentId));
      setCommentsError('');
      await deleteTestComment({ commentId, testId });
      setLocalComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)));
      setIsDeleteCommentConfirmOpen(false);
      setPendingCommentDeletion(null);
      showSuccessToast({
        title: 'Comment Deleted',
        message: 'Your comment was deleted successfully.',
      });
    } catch (e) {
      const msg = e?.message || 'Failed to delete comment';
      setCommentsError(msg);
      showErrorToast({
        title: 'Failed to delete comment',
        message: msg,
      });
    } finally {
      setCommentDeletingId(null);
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
      .replaceAll('_', '-')
      .replace(/\s+/g, '-');
  }

  function normalizeAttachments(test) {
    const raw = test?.evidenceLinks ?? test?.evidence_links ?? [];
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item) => {
        if (item == null) return null;

        const url =
          typeof item === 'string' ? item.trim() : String(item?.url ?? item?.href ?? '').trim();
        if (!url) return null;

        const parsed = safeParseUrl(url);
        const title =
          typeof item === 'object' && item?.title
            ? String(item.title).trim()
            : formatAttachmentTitle(parsed, url);
        const source = parsed?.hostname ? parsed.hostname : 'External link';

        return {
          id: url,
          url,
          title,
          meta: source,
        };
      })
      .filter(Boolean);
  }

  function safeParseUrl(url) {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }

  function formatAttachmentTitle(parsed, fallbackUrl) {
    if (!parsed) return fallbackUrl;

    const pathParts = String(parsed.pathname || '')
      .split('/')
      .filter(Boolean);
    const fileName = pathParts[pathParts.length - 1] || parsed.hostname || fallbackUrl;

    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  }

  const statusUpper = String(t?.status || 'NOT_STARTED').toUpperCase();
  const isTrackInProgress = isInProgress(statusUpper);
  const isLockedStatus = statusUpper === 'COMPLETED';
  const isBlockedStatus = statusUpper === 'BLOCKED';
  const showRevert =
    statusUpper !== 'NOT_STARTED' &&
    !isBlockedStatus &&
    !(statusUpper === 'IN_REVIEW' && !isManager);
  const showReject = statusUpper === 'IN_REVIEW' && isManager;
  const primaryLabel = getPrimaryActionLabel(t);
  const showNextStepPanel =
    statusUpper !== 'COMPLETED' && !isBlockedStatus && !(statusUpper === 'IN_REVIEW' && !isManager);

  return (
    <>
      <div className="dtm-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
        <div className="dtm-modal" onMouseDown={stop}>
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
                <Badge tone={statusToBadgeType(status)}>{statusToLabel(status)}</Badge>
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

            {statusUpper === 'COMPLETED' ? (
              <div className="dtm-step-card dtm-step-card--completed">
                <div className="dtm-complete-box">
                  <div className="dtm-complete-icon" aria-hidden="true">
                    <Icon name="checkmark" category="deco" size="sm" color="currentColor" />
                  </div>

                  <div>
                    <div className="dtm-complete-label">STATUS</div>
                    <div className="dtm-complete-title">Control Testing Complete</div>
                  </div>
                </div>
              </div>
            ) : isBlockedStatus ? (
              <div className="dtm-step-card dtm-step-card--blocked">
                <div className="dtm-complete-box">
                  <div className="dtm-complete-icon" aria-hidden="true">
                    <Icon name="block" category="actions" size="sm" color="currentColor" />
                  </div>

                  <div>
                    <div className="dtm-complete-label">STATUS</div>
                    <div className="dtm-complete-title">Control Testing Blocked</div>
                  </div>

                  <div className="dtm-step-actions-right" style={{ marginLeft: 'auto' }}>
                    <ActionButton
                      className="dtm-btn dtm-btn--primary"
                      type="button"
                      onClick={openUnblockConfirm}
                      disabled={isBusy}
                    >
                      <Icon
                        name="start"
                        category="deco"
                        size="sm"
                        color="#fff"
                        className="dtm-btn-icon"
                      />
                      Unblock
                    </ActionButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="dtm-step-card">
                <div className="dtm-step-left">
                  <div
                    className={`dtm-step-icon ${statusUpper === 'IN_REVIEW' ? 'dtm-step-icon--review' : isTrackInProgress ? 'dtm-step-icon--progress' : 'dtm-step-icon--default'}`}
                    aria-hidden="true"
                  >
                    {statusUpper === 'IN_REVIEW' ? (
                      <Icon name="eye" category="deco" size="sm" color="currentColor" />
                    ) : isTrackInProgress ? (
                      <Icon name="control-details" category="deco" size="sm" color="currentColor" />
                    ) : (
                      <Icon name="start" category="deco" size="sm" color="currentColor" />
                    )}
                  </div>
                  <div>
                    <div className="dtm-step-label">CURRENT STEP</div>
                    <div className="dtm-step-value">{currentStepLabel}</div>
                  </div>
                </div>

                <div className="dtm-step-actions-left">
                  {showRevert ? (
                    <ActionButton
                      className="dtm-btn dtm-btn--revert"
                      variant="cancel"
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
                      <Icon
                        name="undo"
                        category="actions"
                        size="sm"
                        color="#545454"
                        className="dtm-btn-icon"
                      />
                      Revert
                    </ActionButton>
                  ) : null}

                  {isTrackInProgress ? (
                    <ActionButton
                      className="dtm-btn dtm-btn--secondary"
                      variant="cancel"
                      type="button"
                      onClick={openBlockConfirm}
                      disabled={isBusy}
                    >
                      <Icon
                        name="block"
                        category="actions"
                        size="sm"
                        color="#C20029"
                        className="dtm-btn-icon"
                      />
                      Mark Blocked
                    </ActionButton>
                  ) : null}

                  {showReject ? (
                    <ActionButton
                      className="dtm-btn dtm-btn--secondary"
                      variant="cancel"
                      type="button"
                      onClick={openRejectConfirm}
                      disabled={isBusy}
                    >
                      <Icon
                        name="reject"
                        category="actions"
                        size="sm"
                        color="#C20029"
                        className="dtm-btn-icon"
                      />
                      Reject
                    </ActionButton>
                  ) : null}
                </div>

                {showNextStepPanel ? (
                  <>
                    <div className="dtm-step-mid" aria-hidden="true">
                      <Icon name="arrow" category="deco" size="sm" color="#D1D1D1" />
                    </div>

                    <div className="dtm-step-right">
                      {primaryLabel ? (
                        <ActionButton
                          className="dtm-btn dtm-btn--primary dtm-step-action--approve"
                          type="button"
                          onClick={handlePrimaryAction}
                          disabled={isBusy}
                        >
                          {statusUpper === 'IN_REVIEW' ? (
                            <>
                              <Icon
                                name="approve"
                                category="actions"
                                size="sm"
                                color="#fff"
                                className="dtm-btn-icon"
                              />
                              {primaryLabel}
                            </>
                          ) : (
                            <>
                              {primaryLabel}
                              <Icon
                                name="arrow"
                                category="deco"
                                size="sm"
                                color="#fff"
                                className="dtm-btn-icon"
                              />
                            </>
                          )}
                        </ActionButton>
                      ) : null}

                      <span className="dtm-next">
                        <span className="dtm-next-label">Next: </span>
                        {nextStepLabel}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            )}
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
              <span>Attachments</span>
              {attachments.length > 0 ? (
                <span className="dtm-tab-count">{attachments.length}</span>
              ) : null}
            </button>
            <button
              type="button"
              className={`dtm-tab ${activeTab === 'Comments' ? 'dtm-tab--active' : ''}`}
              onClick={() => setActiveTab('Comments')}
            >
              <span>Comments</span>
              {localComments.length > 0 ? (
                <span className="dtm-tab-count">{localComments.length}</span>
              ) : null}
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
                  <ActionButton
                    className="dtm-send"
                    type="button"
                    onClick={handleAddComment}
                    aria-label="Send"
                    isLoading={commentSaving}
                    disabled={
                      !currentUser || commentSaving || commentsLoading || !commentText.trim()
                    }
                  >
                    <span className="dtm-send-icon">{commentSaving ? '...' : '➤'}</span>
                  </ActionButton>
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
                            <div className="dtm-comment-meta">
                              <div className="dtm-comment-date">{c.date ?? ''}</div>
                              {currentUser?.['user_id'] != null &&
                              String(currentUser['user_id']) === String(c.authorUserId ?? '') ? (
                                <button
                                  className="dtm-comment-action dtm-comment-action--delete"
                                  type="button"
                                  onClick={() => handleDeleteComment(c)}
                                  disabled={commentDeletingId != null}
                                  aria-label="Delete comment"
                                  title="Delete comment"
                                >
                                  {commentDeletingId === String(c.id) ? (
                                    '...'
                                  ) : (
                                    <Icon name="trash" category="actions" size="sm" />
                                  )}
                                </button>
                              ) : null}
                            </div>
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
              <div className="dtm-attachments">
                <div className="dtm-attachments-note" role="note">
                  <Icon
                    name="exclamation"
                    category="deco"
                    size="sm"
                    color="#1d4ed8"
                    className="dtm-attachments-note-icon-svg"
                  />
                  <div>
                    <div className="dtm-attachments-note-title">
                      Attachments are stored as external links. No files are uploaded or stored
                      within this application.
                    </div>
                  </div>
                </div>

                <div className="dtm-attachments-header">
                  <div>
                    <div className="dtm-section-title">Linked Files ({attachments.length})</div>
                  </div>

                  {attachments.length > 0 ? (
                    <ActionButton
                      className="dtm-btn dtm-btn--compact"
                      type="button"
                      onClick={handleAddEvidenceLink}
                      disabled={isBusy}
                    >
                      <Icon
                        name="attach"
                        category="actions"
                        size="sm"
                        color="#fff"
                        className="dtm-btn-icon"
                      />
                      Add Link
                    </ActionButton>
                  ) : null}
                </div>

                {attachments.length === 0 ? (
                  <div className="dtm-attachments-empty">
                    <div className="dtm-attachments-empty-title">No links yet</div>
                    <div className="dtm-attachments-empty-text">
                      Add a supporting document, screenshot, or other external evidence link to
                      track test artifacts here.
                    </div>
                    <ActionButton
                      className="dtm-btn dtm-btn--primary dtm-btn--compact"
                      type="button"
                      onClick={handleAddEvidenceLink}
                      disabled={isBusy}
                    >
                      <Icon
                        name="attach"
                        category="actions"
                        size="sm"
                        color="#fff"
                        className="dtm-btn-icon"
                      />
                      Add Link
                    </ActionButton>
                  </div>
                ) : (
                  <div className="dtm-attachments-list">
                    {attachments.map((attachment) => (
                      <div className="dtm-attachment-card" key={attachment.id}>
                        <div className="dtm-attachment-link">
                          <div className="dtm-attachment-media" aria-hidden="true">
                            <Icon
                              name="documents"
                              category="deco"
                              size="sm"
                              color="#4b5563"
                              className="dtm-attachment-media-icon"
                            />
                          </div>

                          <div className="dtm-attachment-body">
                            <div className="dtm-attachment-title-row">
                              <div className="dtm-attachment-title">{attachment.title}</div>
                            </div>
                            <div className="dtm-attachment-meta">{attachment.meta}</div>
                          </div>
                        </div>

                        <div className="dtm-attachment-actions">
                          <a
                            className="dtm-attachment-action dtm-attachment-action--open"
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Link"
                          >
                            <Icon name="link" category="actions" size="sm" color="#545454" />
                          </a>

                          <button
                            className="dtm-attachment-action dtm-attachment-action--delete"
                            type="button"
                            onClick={() => handleRemoveEvidenceLink(attachment.url)}
                            disabled={isBusy}
                            aria-label={`Remove ${attachment.title}`}
                            title="Delete Link"
                          >
                            <Icon name="trash" category="actions" size="sm" color="#545454" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                    <ActionButton
                      className="dtm-btn dtm-btn--secondary"
                      variant="cancel"
                      type="button"
                      onClick={openUnarchiveConfirm}
                      disabled={isBusy}
                    >
                      Unarchive Control Test
                    </ActionButton>
                  ) : (
                    <ActionButton
                      className="dtm-btn dtm-btn--secondary"
                      variant="cancel"
                      type="button"
                      onClick={openArchiveConfirm}
                      disabled={isBusy}
                    >
                      Archive Control Test
                    </ActionButton>
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
                  <ActionButton
                    className="dtm-btn dtm-btn--secondary"
                    variant="cancel"
                    type="button"
                    onClick={openDeleteConfirm}
                    disabled={isBusy}
                  >
                    Delete Control Test
                  </ActionButton>
                </RestrictedAction>
              </div>

              <ActionButton
                className="dtm-btn dtm-btn--primary"
                type="button"
                onClick={openEdit}
                disabled={!testId}
              >
                Edit Control Test
              </ActionButton>
            </div>
          </section>
        </div>
      </div>

      <ConfirmActionModal
        isOpen={isDeleteConfirmOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
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
        isOpen={isDeleteCommentConfirmOpen}
        onClose={() => {
          setIsDeleteCommentConfirmOpen(false);
          setPendingCommentDeletion(null);
        }}
        onConfirm={handleConfirmDeleteComment}
        title="Delete Comment?"
        message="Are you sure you want to permanently delete this comment?"
        itemName={String(pendingCommentDeletion?.text || '')}
        warning="Deleted comments are permanently removed and cannot be recovered."
        confirmText={commentDeletingId != null ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        confirmDisabled={commentDeletingId != null}
      />

      <ConfirmActionModal
        isOpen={isRemoveAttachmentConfirmOpen}
        onClose={closeRemoveAttachmentConfirm}
        onConfirm={async () => {
          await handleConfirmRemoveEvidenceLink();
        }}
        title="Remove Evidence Link?"
        message="Are you sure you want to remove this evidence link?"
        itemName={String(pendingAttachmentRemoval?.title || pendingAttachmentRemoval?.url || '')}
        warning="This will remove the link from the control test attachments list."
        confirmText={isBusy ? 'Removing...' : 'Remove'}
        cancelText="Cancel"
        confirmDisabled={isBusy}
        cancelDisabled={isBusy}
      />

      <ConfirmActionModal
        isOpen={isArchiveConfirmOpen}
        onClose={closeArchiveConfirm}
        onConfirm={handleArchive}
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
        onConfirm={handleUnarchive}
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

      <ConfirmActionModal
        isOpen={isBlockConfirmOpen}
        onClose={closeBlockConfirm}
        onConfirm={async () => {
          closeBlockConfirm();
          await handleBlock();
        }}
        title="Mark Control Test as Blocked?"
        message="Are you sure you want to mark this test as blocked?"
        itemName={String(testTitle)}
        warning="Blocked tests will be removed from the normal testing flow until they are updated again."
        confirmText={isBusy ? 'Marking...' : 'Mark Blocked'}
        cancelText="Cancel"
        confirmDisabled={isBusy}
        cancelDisabled={isBusy}
        confirmButtonClassName="dcm-confirm-btn dcm-confirm-btn--delete"
      />

      <ConfirmActionModal
        isOpen={isUnblockConfirmOpen}
        onClose={closeUnblockConfirm}
        onConfirm={async () => {
          closeUnblockConfirm();
          await handleUnblock();
        }}
        title="Unblock Control Test?"
        message="Are you sure you want to unblock this test?"
        itemName={String(testTitle)}
        warning="This will return the control test to an in-progress state so work can continue."
        confirmText={isBusy ? 'Unblocking...' : 'Unblock'}
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
          await refreshAndClose();
        }}
      />

      <AddAttachmentLinkModal
        isOpen={isAddAttachmentModalOpen}
        onClose={closeAddAttachmentModal}
        onAdd={handleAddAttachmentLinkSubmit}
        isLoading={isBusy}
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

function firstNonBlank(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function getUserDisplayName(user) {
  return firstNonBlank(
    user?.displayName,
    user?.display_name,
    user?.fullName,
    user?.full_name,
    user?.name,
    user?.email
  );
}

function getAssignedTesterDisplayName(testRow, usersById = {}) {
  const directName = firstNonBlank(
    testRow?.assignedTesterName,
    testRow?.testerName,
    testRow?.assignee
  );

  if (directName) return directName;

  const assignedTesterId = testRow?.assignedTesterId;
  if (assignedTesterId != null) {
    const resolvedName = getUserDisplayName(usersById[String(assignedTesterId)]);
    if (resolvedName) return resolvedName;
  }

  return 'Unassigned';
}

function preserveAssignedTesterDisplayName(nextTest, previousTest, usersById = {}) {
  if (!nextTest) return nextTest;

  const nextName = getAssignedTesterDisplayName(nextTest, usersById);
  if (nextName !== 'Unassigned') return { ...nextTest, assignedTesterName: nextName };

  const nextAssignedTesterId = nextTest?.assignedTesterId;
  const previousAssignedTesterId = previousTest?.assignedTesterId;

  if (
    nextAssignedTesterId != null &&
    previousAssignedTesterId != null &&
    String(nextAssignedTesterId) === String(previousAssignedTesterId)
  ) {
    const previousName = getAssignedTesterDisplayName(previousTest, usersById);
    if (previousName !== 'Unassigned') return { ...nextTest, assignedTesterName: previousName };
  }

  return nextTest;
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
  const statusUpper = String(test?.status || '').toUpperCase();
  if (statusUpper === 'BLOCKED') {
    return { currentStepLabel: 'Blocked', nextStepLabel: '-' };
  }

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
