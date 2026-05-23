import React, { useEffect, useState } from 'react';
import '../styles/components/AssignRequestModal.css';
import GroupIcon from '../assets/images/assign request icons/group.svg';
import { fetchUsers } from '../api/UsersAPI';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { formatRequestDisplayId } from '../utils/requestDisplayId';

export default function AssignRequestModal({ isOpen, onClose, request, onAssign }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [note, setNote] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedUser('');
      setNote('');
      setAssigning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    (async () => {
      try {
        setLoadingUsers(true);
        setUsersError('');
        const all = await fetchUsers({ isActive: true });
        if (cancelled) return;

        const testers = Array.isArray(all)
          ? all.filter((u) => String(u.role).toUpperCase() === 'TESTER')
          : [];
        setUsers(testers);
      } catch (e) {
        if (!cancelled) setUsersError(e?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const controlsCount = Array.isArray(request?.controls) ? request.controls.length : 0;
  const requestTitle = formatRequestDisplayId(request) || 'Request';

  function stop(e) {
    e.stopPropagation();
  }

  async function handleAssign() {
    if (!selectedUser) {
      showErrorToast({
        title: 'Tester Required',
        message: 'Please select a tester to assign.',
      });
      return;
    }

    const sel = users.find(
      (u) =>
        String(u.userId) === String(selectedUser) ||
        String(u.user_id) === String(selectedUser) ||
        String(u.id) === String(selectedUser)
    );
    const display = sel?.display_name ?? sel?.displayName ?? sel?.email ?? String(selectedUser);
    const idVal = sel?.userId ?? sel?.user_id ?? sel?.id ?? selectedUser;

    try {
      setAssigning(true);

      await onAssign?.(request?.requestId ?? request?.id, String(idVal), display, note);

      showSuccessToast({
        title: 'Request Bulk Assigned',
        message: `${requestTitle} has been assigned successfully.`,
      });

      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to bulk assign request';

      showErrorToast({
        title: 'Request Bulk Assign Failed',
        message: `An error occurred while bulk assigning the request: ${errorMessage}`,
      });
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="arm-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="arm-modal" onMouseDown={stop}>
        <header className="arm-header">
          <h3>Assign Request: {requestTitle}</h3>
          <button className="arm-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="arm-divider" />

        <section className="arm-bulk">
          <div className="arm-bulk-left">
            <img src={GroupIcon} alt="" className="arm-bulk-icon" />
            <div className="arm-bulk-title">Bulk Assignment</div>
          </div>
          <div className="arm-bulk-desc">
            You are about to assign {controlsCount} controls in this request to a new tester. This
            will update the assignee for all associated controls.
          </div>
        </section>

        <section className="arm-form">
          <label className="arm-label">Select Tester</label>
          <select
            className="arm-select"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={loadingUsers || assigning}
          >
            <option value="">{loadingUsers ? 'Loading testers...' : 'Select a user'}</option>
            {!loadingUsers &&
              users.map((u) => {
                const idVal = u.userId ?? u.user_id ?? u.id;
                const label = u.display_name ?? u.displayName ?? u.email ?? `User ${idVal}`;
                return (
                  <option key={String(idVal)} value={String(idVal)}>
                    {label}
                  </option>
                );
              })}
          </select>
          {usersError ? <div className="arm-error">Error: {usersError}</div> : null}

          <label className="arm-label">Add Note (Optional)</label>
          <textarea
            className="arm-textarea"
            placeholder="Reason for assignment..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={assigning}
          />
        </section>

        <div className="arm-divider" />

        <footer className="arm-footer">
          <button
            className="arm-btn arm-btn-ghost modal-action-cancel"
            onClick={onClose}
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            className="arm-btn arm-btn-primary modal-action-primary"
            onClick={handleAssign}
            disabled={assigning || loadingUsers}
          >
            {assigning ? 'Assigning...' : 'Assign All Controls'}
          </button>
        </footer>
      </div>
    </div>
  );
}
