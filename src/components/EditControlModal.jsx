import React, { useEffect, useMemo, useState } from 'react';
import { updateControl, retireControl } from '../api/ControlsAPI';
import '../styles/components/EditControlModal.css';

export default function EditControlModal({ isOpen, onClose, control, onUpdated }) {
  const originalVgcpid = control?.id ?? '';

  const initial = useMemo(() => {
    return {
      vgcpid: control?.id ?? '',
      description: control?.description ?? '',
      controlOwner: control?.owner ?? '',
      controlSme: control?.sme ?? '',
      escalation: (control?.escalationRequired ?? '').toLowerCase() === 'yes',
      lastTested: control?.lastTested && control?.lastTested !== '-' ? control.lastTested : '',
      status: control?.status ?? 'Active',
    };
  }, [control]);

  const [vgcpid, setVgcpid] = useState('');
  const [description, setDescription] = useState('');
  const [controlOwner, setControlOwner] = useState('');
  const [controlSme, setControlSme] = useState('');
  const [escalation, setEscalation] = useState(false);
  const [lastTested, setLastTested] = useState('');
  const [status, setStatus] = useState('Active');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setVgcpid(initial.vgcpid);
    setDescription(initial.description);
    setControlOwner(initial.controlOwner);
    setControlSme(initial.controlSme);
    setEscalation(initial.escalation);
    setLastTested(initial.lastTested);
    setStatus(initial.status);

    setError('');
    setSubmitting(false);
  }, [isOpen, initial]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  async function handleSave() {
    setError('');

    if (!vgcpid.trim() || !description.trim() || !controlOwner.trim() || !controlSme.trim()) {
      setError('Please fill in Control ID, Description, Control Owner, and Control SME.');
      return;
    }

    // Backend does not support changing vgcpid via PUT right now.
    const vgcpidChanged = vgcpid.trim() !== originalVgcpid.trim();
    if (vgcpidChanged) {
      setError(
        'Control ID changes are not supported yet (backend uses the original ID). Saving other edits only.'
      );
    }

    setSubmitting(true);
    try {
      // If user selected Retired, do soft delete (sets is_active=false)
      if (status === 'Retired') {
        await retireControl(originalVgcpid);
      } else {
        // Normal updates via PUT
        const payload = {
          description: description.trim(),
          control_owner: controlOwner.trim(),
          control_sme: controlSme.trim(),
          escalation,
        };

        if (lastTested && lastTested !== '-') {
          payload.last_tested = lastTested;
        }

        await updateControl(originalVgcpid, payload);
      }

      if (onUpdated) await onUpdated();
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to update control');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="ecm-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="ecm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-control-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ecm-header">
          <h2 className="ecm-title" id="edit-control-title">
            Edit Control: {originalVgcpid}
          </h2>

          <button type="button" className="ecm-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="ecm-body">
          {error && <div className="ecm-error">{error}</div>}

          <div className="ecm-grid">
            <div className="ecm-field">
              <label className="ecm-label">Control ID *</label>
              <input
                className="ecm-input"
                value={vgcpid}
                onChange={(e) => setVgcpid(e.target.value)}
                placeholder="e.g. VGCP-123456"
              />
            </div>

            <div className="ecm-field">
              <label className="ecm-label">Status</label>
              <select
                className="ecm-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            <div className="ecm-field ecm-field--full">
              <label className="ecm-label">Description *</label>
              <textarea
                className="ecm-textarea"
                placeholder="Enter detailed control description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="ecm-field">
              <label className="ecm-label">Control Owner *</label>
              <input
                className="ecm-input"
                value={controlOwner}
                onChange={(e) => setControlOwner(e.target.value)}
              />
            </div>

            <div className="ecm-field">
              <label className="ecm-label">Control SME *</label>
              <input
                className="ecm-input"
                value={controlSme}
                onChange={(e) => setControlSme(e.target.value)}
              />
            </div>

            <div className="ecm-field">
              <label className="ecm-label">Last Tested</label>
              <input
                className="ecm-input"
                type="date"
                value={lastTested}
                onChange={(e) => setLastTested(e.target.value)}
              />
            </div>

            <div className="ecm-field ecm-field--full">
              <label className="ecm-label">Escalation Required?</label>
              <div className="ecm-radio-row" role="radiogroup" aria-label="Escalation Required">
                <label className="ecm-radio-item">
                  <input
                    type="radio"
                    name="edit-escalation"
                    checked={escalation === true}
                    onChange={() => setEscalation(true)}
                  />
                  <span>Yes</span>
                </label>

                <label className="ecm-radio-item">
                  <input
                    type="radio"
                    name="edit-escalation"
                    checked={escalation === false}
                    onChange={() => setEscalation(false)}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="ecm-footer">
          <button type="button" className="btn btn--white" onClick={onClose} disabled={submitting}>
            Cancel
          </button>

          <button type="button" className="btn btn--red" onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
