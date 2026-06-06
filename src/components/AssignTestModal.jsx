import React, { useEffect, useState } from 'react';
import '../styles/components/AssignRequestModal.css';
import GroupIcon from '../assets/images/assign request icons/group.svg';
import { fetchUsers } from '../api/UsersAPI';
import { ActionButton, ModalCloseButton } from './ui';
import { showErrorToast } from '../utils/toast';

export default function AssignTestModal({ isOpen, onClose, testIds = [], onAssign }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [note, setNote] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedUser('');
      setNote('');
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

  const testsCount = Array.isArray(testIds) ? testIds.length : 0;

  function stop(e) {
    e.stopPropagation();
  }

  function handleAssign() {
    if (!selectedUser) {
      showErrorToast({
        title: 'Tester Required',
        message: 'Please select a tester before assigning the selected tests.',
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

    onAssign?.(testIds, String(idVal), display, note);
    onClose?.();
  }

  return (
    <div className="arm-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="arm-modal" onMouseDown={stop}>
        <header className="arm-header">
          <h3>Bulk Assign Tests</h3>
          <ModalCloseButton className="arm-close" onClick={onClose} />
        </header>

        <div className="arm-divider" />

        <section className="arm-bulk">
          <div className="arm-bulk-left">
            <img src={GroupIcon} alt="" className="arm-bulk-icon" />
            <div className="arm-bulk-title">Bulk Assignment</div>
          </div>
          <div className="arm-bulk-desc">
            You are about to assign {testsCount} tests to a new tester. This will update the
            assignee for all selected tests.
          </div>
        </section>

        <section className="arm-form">
          <label className="arm-label">Select Tester</label>
          <select
            className="arm-select"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            disabled={loadingUsers}
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
          />
        </section>

        <div className="arm-divider" />

        <footer className="arm-footer">
          <ActionButton className="arm-btn arm-btn-ghost" variant="cancel" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton className="arm-btn arm-btn-primary" onClick={handleAssign}>
            Assign Selected Tests
          </ActionButton>
        </footer>
      </div>
    </div>
  );
}
