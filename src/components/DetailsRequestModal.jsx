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
import { showSuccessToast, showErrorToast } from '../utils/toast';
import RestrictedAction from './RestrictedAction';
import { ACTIONS } from '../auth';
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

  const stop = (e) => e.stopPropagation();

  function showPermissionDeniedToast() {
    showErrorToast({
      title: 'Permission Denied',
      message: 'Only managers have permission for this action. Contact a manager for access.',
    });
  }

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
      const errorMessage = e?.message || 'Failed to archive request and associated tests';
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
      const errorMessage = e?.message || 'Failed to unarchive request and associated tests';
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
      const errorMessage = e?.message || 'Failed to delete request';
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
      <div className="drm-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
        <div className="drm-modal" onMouseDown={stop}>
          <section className="drm-section-header">
            <div className="drm-header">
              <div className="drm-title">Request Details: {requestTitle}</div>
              <button className="drm-close" type="button" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>
          </section>

          <div className="drm-divider" />

          <section className="drm-section-statusbar">
            <div className="drm-statusbar">
              <span className={`drm-pill ${priorityBadgeClass(priority)}`}>
                {formatPriority(priority)}
              </span>

              <div className="drm-statusbar-mid">
                <span className="drm-status-label">Status:</span>
                <span className={`drm-pill ${statusBadgeClass(status)}`}>
                  {formatStatus(status)}
                </span>
              </div>

              <div className="drm-statusbar-right">
                <Icon name="graph" category="deco" />
                <span className="drm-progress">
                  {progress.completed} / {progress.total}
                </span>
                <span className="drm-progress-label">Controls Completed</span>
              </div>
            </div>
          </section>

          <div className="drm-divider" />

          <section className="drm-section-description-details">
            <div className="drm-section">
              <div className="drm-section-title">Description</div>
              <div className="drm-description">{description}</div>

              <div className="drm-details-card">
                <div className="drm-detail-item">
                  <div className="drm-detail-label">Requested By</div>
                  <div className="drm-detail-value">{requestedBy}</div>
                </div>

                <div className="drm-detail-item">
                  <div className="drm-detail-label">Priority Level</div>
                  <div className="drm-detail-value">{formatPriority(priority)}</div>
                </div>

                <div className="drm-detail-item">
                  <div className="drm-detail-label">Request Date</div>
                  <div className="drm-detail-value">{requestDate}</div>
                </div>

                <div className="drm-detail-item">
                  <div className="drm-detail-label">Due Date</div>
                  <div className="drm-detail-value drm-date-warn">{dueDate}</div>
                </div>
              </div>
            </div>
          </section>

          <div className="drm-divider" />

          <section className="drm-section-associated">
            <div className="drm-section">
              <div className="drm-section-title drm-section-title--withicon">
                <span className="drm-icon" aria-hidden="true">
                  <Icon name="documents" category="deco" size="md" />
                </span>
                Associated Controls ({controls.length})
              </div>

              {controls.length === 0 ? (
                <div className="drm-empty">No tests found for this request.</div>
              ) : (
                <div className="drm-table-wrap">
                  <table className="drm-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Assignee</th>
                        <th>ETA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controls.map((c) => (
                        <tr key={c.test_id || c.id}>
                          <td className="drm-mono">
                            <button
                              type="button"
                              className="vgcpid-link"
                              onClick={() => openTestDetails(c)}
                            >
                              {c.vgcpid || c.id}
                            </button>
                          </td>
                          <td>{c.title || c.description || '-'}</td>
                          <td>
                            <span
                              className={`drm-pill ${testStatusBadgeClass(c.statusLabel || c.status)}`}
                            >
                              {c.statusLabel || formatStatus(c.status)}
                            </span>
                          </td>
                          <td>{c.assignee ?? '-'}</td>
                          <td>{c.eta ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <div className="drm-divider" />

          <section className="drm-section-tabs">
            <div className="drm-tabs">
              <button
                type="button"
                className={`drm-tab ${activeTab === 'Comments' ? 'drm-tab--active' : ''}`}
                onClick={() => setActiveTab('Comments')}
              >
                <span>Comments</span>
                {localComments.length > 0 ? (
                  <span className="drm-tab-count">{localComments.length}</span>
                ) : null}
              </button>
              <button
                type="button"
                className={`drm-tab ${activeTab === 'History' ? 'drm-tab--active' : ''}`}
                onClick={() => setActiveTab('History')}
              >
                History
              </button>
            </div>

            <div className="drm-tab-content">
              {activeTab === 'Comments' ? (
                <>
                  <div className="drm-addcomment drm-addcomment--top">
                    <input
                      className="drm-comment-input"
                      placeholder="Write a comment…"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={commentSaving || commentsLoading || !currentUser}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          currentUser &&
                          !commentSaving &&
                          !commentsLoading &&
                          commentText.trim()
                        ) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <button
                      className="drm-send"
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

                  <div className="drm-comments">
                    {commentsLoading ? (
                      <div className="drm-empty">Loading comments...</div>
                    ) : commentsError ? (
                      <div className="drm-empty">Error: {commentsError}</div>
                    ) : localComments.length === 0 ? (
                      <div className="drm-empty">No comments found.</div>
                    ) : (
                      localComments.map((c) => (
                        <div className="drm-comment" key={c.id}>
                          <div className="drm-comment-left">
                            <div className="drm-avatar" aria-hidden="true">
                              {String(c.author || '?')
                                .trim()
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>
                          </div>

                          <div className="drm-comment-main">
                            <div className="drm-comment-top">
                              <div className="drm-comment-author">{c.author ?? '-'}</div>
                              <div className="drm-comment-meta">
                                <div className="drm-comment-date">{c.date ?? ''}</div>
                                {currentUser?.['user_id'] != null &&
                                String(currentUser['user_id']) === String(c.authorUserId ?? '') ? (
                                  <button
                                    className="drm-comment-action drm-comment-action--delete"
                                    type="button"
                                    onClick={() => handleDeleteComment(c)}
                                    disabled={commentDeletingId != null}
                                    aria-label="Delete comment"
                                    title="Delete comment"
                                  >
                                    {commentDeletingId === String(c.id) ? (
                                      '...'
                                    ) : (
                                      <Icon
                                        name="trash"
                                        category="actions"
                                        size="sm"
                                        color="#545454"
                                      />
                                    )}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                            <div className="drm-comment-text">{c.text ?? ''}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
          </section>

          <div className="drm-divider" />

          <section className="drm-section-footer">
            <div className="drm-footer">
              <button className="drm-btn drm-btn--ghost" type="button" onClick={onClose}>
                Close
              </button>

              <div className="drm-footer-right">
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
                  <RestrictedAction action={ACTIONS.ARCHIVE_REQUEST}>
                    {statusUpper === 'ARCHIVED' ? (
                      <button
                        className="drm-btn drm-btn--outline"
                        type="button"
                        onClick={openUnarchive}
                        disabled={archiving || deleting || requestId == null}
                        title={requestId == null ? 'No request selected' : 'Unarchive this request'}
                      >
                        Unarchive Request
                      </button>
                    ) : (
                      <button
                        className="drm-btn drm-btn--outline"
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
                  <RestrictedAction action={ACTIONS.REMOVE_REQUEST}>
                    <button
                      className="drm-btn drm-btn--outline"
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
                    </button>
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
                  <RestrictedAction action={ACTIONS.UPDATE_REQUEST}>
                    <button
                      className="drm-btn drm-btn--primary"
                      type="button"
                      onClick={openEdit}
                      disabled={!requestId}
                      title={requestId ? 'Edit this request' : 'No request selected'}
                    >
                      Edit Request
                    </button>
                  </RestrictedAction>
                </div>
              </div>
            </div>

            {deleteError ? <div className="drm-delete-error">Error: {deleteError}</div> : null}
          </section>
        </div>

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
      </div>

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

/* helpers */
function formatStatus(s) {
  const v = String(s || '')
    .replaceAll('_', ' ')
    .toLowerCase();
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : '-';
}

function formatPriority(p) {
  const v = String(p || '').toUpperCase();
  if (v === 'CRITICAL') return 'Critical Priority';
  if (v === 'HIGH') return 'High Priority';
  if (v === 'MEDIUM') return 'Medium Priority';
  if (v === 'LOW') return 'Low Priority';
  return 'Medium Priority';
}

function statusBadgeClass(status) {
  const v = String(status || '').toUpperCase();
  if (v === 'COMPLETED') return 'drm-pill--good';
  if (v === 'DAT_IN_PROGRESS') return 'drm-pill--info';
  if (v === 'OET_IN_PROGRESS') return 'drm-pill--info';
  if (v === 'BLOCKED') return 'drm-pill--bad';
  if (v === 'ARCHIVED') return 'drm-pill--neutral';
  return 'drm-pill--neutral';
}

function priorityBadgeClass(priority) {
  const v = String(priority || '').toUpperCase();
  if (v === 'LOW') return 'drm-pill--low';
  if (v === 'MEDIUM') return 'drm-pill--medium';
  if (v === 'HIGH') return 'drm-pill--high';
  if (v === 'CRITICAL') return 'drm-pill--critical';
  return 'drm-pill--medium';
}

function testStatusBadgeClass(status) {
  const low = String(status || '').toLowerCase();
  if (low.includes('complete')) return 'drm-pill--good';
  if (low.includes('progress') || low.includes('review')) return 'drm-pill--info';
  if (low.includes('block')) return 'drm-pill--bad';
  return 'drm-pill--neutral';
}
