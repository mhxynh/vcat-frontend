import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/components/DetailsRequestModal.css';
import Icon from './common/Icon';
import DetailsTestModal from './DetailsTestModal';
import EditRequestModal from './EditRequestModal';
import ConfirmActionModal from './ConfirmActionModal';
import {
  deleteRequest,
  fetchRequestById,
  mapRequestRowToUi,
  unarchiveRequest,
} from '../api/RequestsAPI';
import {
  fetchTestsByRequestId,
  mapTestRowToRequestControlCard,
  archiveTest,
  unarchiveTest,
} from '../api/TestsAPI';
import { fetchAuditLogsByRequestId } from '../api/AuditAPI';
import AuditHistoryView, { getVgcpidFromMap } from './AuditHistoryView';
import { getUserFriendlyErrorMessage, showSuccessToast, showErrorToast } from '../utils/toast';
import PermissionAction from './PermissionAction';
import { ACTIONS } from '../auth';
import {
  ActionButton,
  Badge,
  CommentsComposer,
  CommentsList,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  MetadataItem,
  Modal,
  ModalCloseButton,
  Panel,
  Tabs,
} from './ui';
import {
  formatPriorityLabel,
  formatStatusLabel,
  priorityToBadgeTone,
  statusToBadgeTone,
} from '../utils/displayLabels';
import {
  fetchCommentsByRequestId,
  createRequestComment,
  deleteRequestComment,
  mapCommentRowsToUi,
} from '../api/CommentsAPI';
import { fetchUsers, fetchUserByEmail } from '../api/UsersAPI';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { formatRequestDisplayId } from '../utils/requestDisplayId';
import { createRefreshHandlers } from '../utils/modalRefresh';

export default function DetailsRequestModal({
  isOpen,
  onClose,
  request,
  onUpdated,
  onDeleted,
  onArchived,
}) {
  const [activeTab, setActiveTab] = useState('Comments');
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [localRequest, setLocalRequest] = useState(request || null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const openEdit = () => setIsEditOpen(true);
  const closeEdit = () => setIsEditOpen(false);

  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isUnarchiveConfirmOpen, setIsUnarchiveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const openUnarchive = () => setIsUnarchiveConfirmOpen(true);

  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [localStatus, setLocalStatus] = useState(null);
  const [activeTest, setActiveTest] = useState(null);

  const openTestDetails = (testRow) => setActiveTest(testRow ?? null);
  const closeTestDetails = () => setActiveTest(null);

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
    async (rid, isCancelled = () => false) => {
      if (rid == null) {
        if (!isCancelled()) setLocalComments([]);
        return;
      }

      if (!isCancelled()) {
        setCommentsLoading(true);
        setCommentsError('');
      }

      try {
        const [commentRows, activeUsers] = await Promise.all([
          fetchCommentsByRequestId(rid),
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
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDeleteConfirmOpen) {
          setIsDeleteConfirmOpen(false);
          return;
        }
        if (isArchiveConfirmOpen) {
          setIsArchiveConfirmOpen(false);
          return;
        }
        if (isDeleteCommentConfirmOpen) {
          setIsDeleteCommentConfirmOpen(false);
          setPendingCommentDeletion(null);
          return;
        }
        if (isUnarchiveConfirmOpen) {
          setIsUnarchiveConfirmOpen(false);
          return;
        }
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isOpen,
    onClose,
    isDeleteConfirmOpen,
    isArchiveConfirmOpen,
    isUnarchiveConfirmOpen,
    isDeleteCommentConfirmOpen,
  ]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditOpen(false);
      setIsArchiveConfirmOpen(false);
      setIsUnarchiveConfirmOpen(false);
      setIsDeleteConfirmOpen(false);
      setIsDeleteCommentConfirmOpen(false);
      setPendingCommentDeletion(null);
    }
  }, [isOpen]);

  const requestKey = request?.requestId ?? request?.request_id ?? null;

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    setActiveTab('Comments');
    setCommentText('');
    setArchiving(false);
    setDeleting(false);
    setDeleteError('');
    setLocalStatus(null);
    setHistoryLogs([]);
    setHistoryError('');
    setCommentsError('');
    setCommentDeletingId(null);
    setIsDeleteCommentConfirmOpen(false);
    setPendingCommentDeletion(null);
    setCurrentUser(null);
    setUsersById({});
    setIsArchiveConfirmOpen(false);
    setIsUnarchiveConfirmOpen(false);
    setIsDeleteConfirmOpen(false);

    void loadCommentsAndUsers(requestKey, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [isOpen, requestKey, loadCommentsAndUsers]);

  useEffect(() => {
    if (!isOpen) return;
    setLocalRequest(request || null);
  }, [isOpen, requestKey, request]);

  const controls = useMemo(() => {
    return Array.isArray(localRequest?.controls) ? localRequest.controls : [];
  }, [localRequest?.controls]);

  const contextTestIdToVgcpid = useMemo(() => {
    const map = {};
    for (const c of controls) {
      if (c.testId != null && c.id) {
        map[String(c.testId)] = c.id;
        map[Number(c.testId)] = c.id;
      }
    }
    return map;
  }, [controls]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'History' || !request?.requestId) return;

    const status = String(localStatus ?? request?.status ?? '').toUpperCase();
    if (status !== 'DAT_IN_PROGRESS' && status !== 'OET_IN_PROGRESS' && status !== 'COMPLETED') {
      setHistoryLogs([]);
      return;
    }

    const testIdsForRequest = new Set();
    for (const c of controls) {
      const tid = c.testId ?? c.test_id;
      if (tid != null) {
        testIdsForRequest.add(tid);
        testIdsForRequest.add(String(tid));
        testIdsForRequest.add(Number(tid));
      }
    }

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError('');

    fetchAuditLogsByRequestId({ requestId: request.requestId })
      .then((logs) => {
        if (!cancelled) {
          const filtered = (logs || []).filter((log) => {
            const entity = String(log?.entity_type || '').toUpperCase();
            if (entity === 'REQUEST') return log.entity_id === request.requestId;
            if (entity === 'TEST')
              return (
                testIdsForRequest.has(log.entity_id) ||
                testIdsForRequest.has(Number(log.entity_id)) ||
                testIdsForRequest.has(String(log.entity_id))
              );
            return true;
          });
          const enriched = filtered.map((log) => {
            if (String(log?.entity_type || '').toUpperCase() === 'TEST' && !log.vgcpid) {
              const vgcpid = getVgcpidFromMap(contextTestIdToVgcpid, log.entity_id);
              if (vgcpid) return { ...log, vgcpid };
            }
            return log;
          });
          setHistoryLogs(enriched);
        }
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
  }, [
    isOpen,
    activeTab,
    request?.requestId,
    request?.status,
    localStatus,
    controls,
    contextTestIdToVgcpid,
  ]);

  const progress = useMemo(() => {
    const total = controls.length;
    const completed = controls.filter((c) => String(c.status).toUpperCase() === 'COMPLETED').length;
    return { completed, total };
  }, [controls]);

  if (!isOpen) return null;

  const requestTitle = formatRequestDisplayId(localRequest ?? request, {
    fallback: 'Request Details',
  });
  const backendStatus = localRequest?.status ?? 'Not Started';
  const status = localStatus ?? backendStatus;
  const statusUpper = String(status || '').toUpperCase();
  const isCompleted = String(status || '').toUpperCase() === 'COMPLETED';

  const priority = localRequest?.priority ?? 'MEDIUM';
  const description = localRequest?.description ?? 'No description.';
  const requestedBy = localRequest?.requestedBy ?? localRequest?.requestor ?? '-';
  const requestDate = localRequest?.requestDate ?? '-';
  const dueDate = localRequest?.dueDate ?? '-';

  const requestId = localRequest?.requestId ?? request?.requestId;

  async function handleAddComment() {
    const text = commentText.trim();
    if (!text || requestId == null || commentSaving) return;

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

      const created = await createRequestComment({
        requestId,
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

    if (requestId == null || commentId == null || commentDeletingId != null) return;

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

    if (requestId == null || commentId == null || commentDeletingId != null) return;

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
      await deleteRequestComment({ commentId, requestId });
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

  async function handleArchiveRequest() {
    if (requestId == null || archiving) return;

    try {
      setArchiving(true);
      setDeleteError('');

      const rows = await fetchTestsByRequestId(requestId, { details: true });
      const tests = Array.isArray(rows) ? rows : [];

      await Promise.all(
        tests
          .filter((t) => String(t?.status || '').toUpperCase() !== 'ARCHIVED')
          .map((t) => archiveTest(t.test_id))
      );

      await deleteRequest(requestId, { hard: false });

      await refreshLocalRequest();

      setLocalStatus('ARCHIVED');

      await onArchived?.(requestId);

      showSuccessToast({
        title: 'Request Archived',
        message: `${requestTitle} has been archived successfully.`,
      });

      setIsArchiveConfirmOpen(false);
      onClose?.();
    } catch (e) {
      const errorMessage = getUserFriendlyErrorMessage(
        e?.message,
        'Failed to archive request and associated tests'
      );
      setDeleteError(errorMessage);

      showErrorToast({
        title: 'Request Archive Failed',
        message: `An error occurred while archiving the request: ${errorMessage}`,
      });
    } finally {
      setArchiving(false);
    }
  }

  async function handleUnarchiveRequest() {
    if (requestId == null || archiving) return;

    try {
      setArchiving(true);
      setDeleteError('');

      const rows = await fetchTestsByRequestId(requestId, { details: true });
      const tests = Array.isArray(rows) ? rows : [];

      await Promise.all(
        tests
          .filter((t) => String(t?.status || '').toUpperCase() === 'ARCHIVED')
          .map((t) => unarchiveTest(t.test_id))
      );

      await unarchiveRequest(requestId);

      await refreshLocalRequest();

      setLocalStatus('NOT_STARTED');

      try {
        await onUpdated?.(requestId);
      } catch (e) {
        console.warn('Parent onUpdated handler failed', e);
      }

      showSuccessToast({
        title: 'Request Unarchived',
        message: `${requestTitle} has been unarchived successfully.`,
      });

      setIsUnarchiveConfirmOpen(false);
      onClose?.();
    } catch (e) {
      const errorMessage = getUserFriendlyErrorMessage(
        e?.message,
        'Failed to unarchive request and associated tests'
      );
      setDeleteError(errorMessage);

      showErrorToast({
        title: 'Request Unarchive Failed',
        message: `An error occurred while unarchiving the request: ${errorMessage}`,
      });
    } finally {
      setArchiving(false);
    }
  }

  async function handleHardDeleteRequest() {
    if (requestId == null || deleting) return;

    try {
      setDeleting(true);
      setDeleteError('');

      await deleteRequest(requestId, { hard: true });

      await onDeleted?.(requestId);

      showSuccessToast({
        title: 'Request Deleted',
        message: `${requestTitle} has been deleted successfully.`,
      });

      setIsDeleteConfirmOpen(false);
      onClose?.();
    } catch (e) {
      const errorMessage = getUserFriendlyErrorMessage(e?.message, 'Failed to delete request');
      setDeleteError(errorMessage);

      showErrorToast({
        title: 'Request Delete Failed',
        message: `An error occurred while deleting the request: ${errorMessage}`,
      });
    } finally {
      setDeleting(false);
    }
  }

  async function refreshLocalRequest() {
    const rid = requestId;
    if (rid == null) return null;
    try {
      const raw = await fetchRequestById(rid);
      const ui = mapRequestRowToUi(raw);

      let items = [];
      try {
        const rows = await fetchTestsByRequestId(rid, { details: true });
        items = Array.isArray(rows) ? rows.map(mapTestRowToRequestControlCard) : [];
      } catch (e) {
        console.warn('Failed to refresh tests for request', rid, e);
      }

      const refreshedRequest = { ...ui, controls: items };
      setLocalRequest(refreshedRequest);
      await loadCommentsAndUsers(rid);
      return refreshedRequest;
    } catch (e) {
      console.warn('Failed to refresh request', requestId, e);
      return null;
    }
  }

  const { refreshInline } = createRefreshHandlers({
    localRefresh: refreshLocalRequest,
    parentRefresh: (updatedRequest) => {
      if (!updatedRequest?.requestId) return;
      return onUpdated?.(
        updatedRequest.requestId,
        updatedRequest,
        Array.isArray(updatedRequest.controls) ? updatedRequest.controls : []
      );
    },
  });

  return (
    <>
      <Modal className="drm-modal" overlayClassName="drm-overlay" onClose={onClose}>
        <Modal.Section className="drm-section-header">
          <div className="drm-header">
            <div className="drm-title">Request Details: {requestTitle}</div>
            <ModalCloseButton className="drm-close" onClick={onClose} />
          </div>
        </Modal.Section>

        <Modal.Divider className="drm-divider" />

        <Modal.Section className="drm-section-statusbar">
          <div className="drm-statusbar">
            <Badge tone={priorityToBadgeTone(priority)}>{formatPriorityLabel(priority)}</Badge>

            <div className="drm-statusbar-mid">
              <span className="drm-status-label">Status:</span>
              <Badge tone={statusToBadgeTone(status)}>{formatStatusLabel(status)}</Badge>
            </div>

            <div className="drm-statusbar-right">
              <Icon name="graph" category="deco" />
              <span className="drm-progress">
                {progress.completed} / {progress.total}
              </span>
              <span className="drm-progress-label">Controls Completed</span>
            </div>
          </div>
        </Modal.Section>

        <Modal.Divider className="drm-divider" />

        <Modal.Section className="drm-section-description-details">
          <div className="drm-section">
            <Modal.SectionTitle className="drm-section-title">Description</Modal.SectionTitle>
            <div className="drm-description">{description}</div>

            <Panel className="drm-details-card">
              <MetadataItem
                className="drm-detail-item"
                labelClassName="drm-detail-label"
                valueClassName="drm-detail-value"
                label="Requested By"
                value={requestedBy}
              />
              <MetadataItem
                className="drm-detail-item"
                labelClassName="drm-detail-label"
                valueClassName="drm-detail-value"
                label="Priority Level"
                value={formatPriorityLabel(priority)}
              />
              <MetadataItem
                className="drm-detail-item"
                labelClassName="drm-detail-label"
                valueClassName="drm-detail-value"
                label="Request Date"
                value={requestDate}
              />
              <MetadataItem
                className="drm-detail-item"
                labelClassName="drm-detail-label"
                valueClassName="drm-detail-value drm-date-warn"
                label="Due Date"
                value={dueDate}
              />
            </Panel>
          </div>
        </Modal.Section>

        <Modal.Divider className="drm-divider" />

        <Modal.Section className="drm-section-associated">
          <div className="drm-section">
            <Modal.SectionTitle
              className="drm-section-title drm-section-title--withicon"
              iconClassName="drm-icon"
              icon={<Icon name="documents" category="deco" size="md" />}
            >
              Associated Controls ({controls.length})
            </Modal.SectionTitle>

            {controls.length === 0 ? (
              <EmptyState className="drm-empty">No tests found for this request.</EmptyState>
            ) : (
              <DataTable.Wrap className="drm-table-wrap">
                <DataTable className="drm-table">
                  <DataTable.Head>
                    <DataTable.Row>
                      <DataTable.HeaderCell>ID</DataTable.HeaderCell>
                      <DataTable.HeaderCell>Name</DataTable.HeaderCell>
                      <DataTable.HeaderCell>Status</DataTable.HeaderCell>
                      <DataTable.HeaderCell>Assignee</DataTable.HeaderCell>
                      <DataTable.HeaderCell>ETA</DataTable.HeaderCell>
                    </DataTable.Row>
                  </DataTable.Head>
                  <DataTable.Body>
                    {controls.map((c) => (
                      <DataTable.Row key={c.test_id || c.id}>
                        <DataTable.Cell className="drm-mono">
                          <button
                            type="button"
                            className="vgcpid-link"
                            onClick={() => openTestDetails(c)}
                          >
                            {c.vgcpid || c.id}
                          </button>
                        </DataTable.Cell>
                        <DataTable.Cell>{c.title || c.description || '-'}</DataTable.Cell>
                        <DataTable.Cell>
                          <Badge tone={statusToBadgeTone(c.statusLabel || c.status)}>
                            {c.statusLabel || formatStatusLabel(c.status)}
                          </Badge>
                        </DataTable.Cell>
                        <DataTable.Cell>{c.assignee ?? '-'}</DataTable.Cell>
                        <DataTable.Cell>{c.eta ?? '-'}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable.Body>
                </DataTable>
              </DataTable.Wrap>
            )}
          </div>
        </Modal.Section>

        <Modal.Divider className="drm-divider" />

        <Modal.Section className="drm-section-tabs">
          <Tabs className="drm-tabs">
            <Tabs.Tab
              className="drm-tab"
              activeClassName="drm-tab--active"
              countClassName="drm-tab-count"
              active={activeTab === 'Comments'}
              count={localComments.length}
              onClick={() => setActiveTab('Comments')}
            >
              Comments
            </Tabs.Tab>
            <Tabs.Tab
              className="drm-tab"
              activeClassName="drm-tab--active"
              active={activeTab === 'History'}
              onClick={() => setActiveTab('History')}
            >
              History
            </Tabs.Tab>
          </Tabs>

          <div className="drm-tab-content">
            {activeTab === 'Comments' ? (
              <>
                <CommentsComposer
                  className="drm-addcomment drm-addcomment--top"
                  inputClassName="drm-comment-input"
                  buttonClassName="drm-send"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onSubmit={handleAddComment}
                  inputDisabled={commentSaving || commentsLoading || !currentUser}
                  submitDisabled={
                    !currentUser || commentSaving || commentsLoading || !commentText.trim()
                  }
                  isSubmitting={commentSaving}
                />

                {commentsLoading ? (
                  <LoadingState className="drm-empty">Loading comments...</LoadingState>
                ) : commentsError ? (
                  <ErrorState className="drm-empty">{commentsError}</ErrorState>
                ) : localComments.length === 0 ? (
                  <EmptyState className="drm-empty">No comments found.</EmptyState>
                ) : (
                  <CommentsList
                    comments={localComments}
                    currentUserId={currentUser?.['user_id']}
                    deletingId={commentDeletingId}
                    onDelete={handleDeleteComment}
                    className="drm-comments"
                    itemClassName="drm-comment"
                    leftClassName="drm-comment-left"
                    avatarClassName="drm-avatar"
                    mainClassName="drm-comment-main"
                    topClassName="drm-comment-top"
                    authorClassName="drm-comment-author"
                    metaClassName="drm-comment-meta"
                    dateClassName="drm-comment-date"
                    actionClassName="drm-comment-action drm-comment-action--delete"
                    textClassName="drm-comment-text"
                    renderDeleteIcon={() => (
                      <Icon name="trash" category="actions" size="sm" color="#545454" />
                    )}
                  />
                )}
              </>
            ) : null}

            {activeTab === 'History' ? (
              <AuditHistoryView
                logs={historyLogs}
                loading={historyLoading}
                error={historyError}
                overlayTitle={`Request History: ${requestTitle}`}
                showContent={
                  status === 'DAT_IN_PROGRESS' ||
                  status === 'OET_IN_PROGRESS' ||
                  status === 'COMPLETED'
                }
                statusMessage="History is available when the request is in progress or completed."
                contextRequestId={requestTitle}
                contextTestIdToVgcpid={contextTestIdToVgcpid}
              />
            ) : null}
          </div>
        </Modal.Section>

        <Modal.Divider className="drm-divider" />

        <Modal.Section className="drm-section-footer">
          <Modal.ActionFooter
            className="drm-footer"
            actionsClassName="drm-footer-right"
            actions={
              <>
                <PermissionAction action={ACTIONS.ARCHIVE_REQUEST}>
                  {statusUpper === 'ARCHIVED' ? (
                    <ActionButton
                      className="drm-btn drm-btn--outline"
                      variant="cancel"
                      type="button"
                      onClick={openUnarchive}
                      disabled={archiving || deleting || requestId == null}
                      title={requestId == null ? 'No request selected' : 'Unarchive this request'}
                    >
                      Unarchive Request
                    </ActionButton>
                  ) : (
                    <ActionButton
                      className="drm-btn drm-btn--outline"
                      variant="cancel"
                      type="button"
                      onClick={() => setIsArchiveConfirmOpen(true)}
                      disabled={archiving || deleting || requestId == null || isCompleted}
                      title={
                        requestId == null
                          ? 'No request selected'
                          : isCompleted
                            ? 'Cannot archive a completed request'
                            : 'Archive this request'
                      }
                    >
                      Archive Request
                    </ActionButton>
                  )}
                </PermissionAction>

                <PermissionAction action={ACTIONS.REMOVE_REQUEST}>
                  <ActionButton
                    className="drm-btn drm-btn--outline"
                    variant="cancel"
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={deleting || archiving || requestId == null || isCompleted}
                    title={
                      requestId == null
                        ? 'No request selected'
                        : isCompleted
                          ? 'Cannot delete a completed request'
                          : 'Permanently delete this request'
                    }
                  >
                    Delete Request
                  </ActionButton>
                </PermissionAction>
                <PermissionAction action={ACTIONS.UPDATE_REQUEST}>
                  <button
                    className="drm-btn drm-btn--primary"
                    type="button"
                    onClick={openEdit}
                    disabled={!requestId}
                    title={requestId ? 'Edit this request' : 'No request selected'}
                  >
                    Edit Request
                  </button>
                </PermissionAction>
              </>
            }
          >
            <button className="drm-btn drm-btn--ghost" type="button" onClick={onClose}>
              Close
            </button>
          </Modal.ActionFooter>

          {deleteError ? <ErrorState className="drm-delete-error">{deleteError}</ErrorState> : null}
        </Modal.Section>
      </Modal>

      <EditRequestModal
        isOpen={isEditOpen}
        onClose={closeEdit}
        requestId={requestId}
        onUpdated={async () => {
          await refreshInline();
        }}
      />
      <DetailsTestModal
        isOpen={!!activeTest}
        onClose={closeTestDetails}
        test={activeTest}
        onArchived={async () => {
          await refreshInline();
          closeTestDetails();
        }}
        onDeleted={async () => {
          await refreshInline();
          closeTestDetails();
        }}
        onUpdated={async () => {
          await refreshInline();
        }}
      />

      <ConfirmActionModal
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchiveRequest}
        title="Archive Request?"
        message="Are you sure you want to archive this request?"
        itemName={requestTitle}
        warning="Archived requests will be removed from active views, but can still be accessed from the archive."
        confirmText={archiving ? 'Archiving...' : 'Archive'}
        cancelText="Cancel"
        confirmDisabled={archiving}
        cancelDisabled={archiving}
        confirmButtonClassName="dcm-confirm-btn dcm-confirm-btn--delete"
      />

      <ConfirmActionModal
        isOpen={isUnarchiveConfirmOpen}
        onClose={() => setIsUnarchiveConfirmOpen(false)}
        onConfirm={handleUnarchiveRequest}
        title="Unarchive Request?"
        message="Are you sure you want to unarchive this request?"
        itemName={requestTitle}
        warning="Unarchived requests will be returned to active views and set to Not Started."
        confirmText={archiving ? 'Unarchiving...' : 'Unarchive'}
        cancelText="Cancel"
        confirmDisabled={archiving}
        cancelDisabled={archiving}
      />

      <ConfirmActionModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleHardDeleteRequest}
        title="Delete Request?"
        message="Are you sure you want to permanently delete this request?"
        itemName={requestTitle}
        warning="Deleted requests will be permanently removed and cannot be recovered."
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        confirmDisabled={deleting}
        cancelDisabled={deleting}
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
    </>
  );
}
