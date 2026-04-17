import React, { useEffect, useMemo, useState } from 'react';
import { updateControl, retireControl } from '../api/ControlsAPI';
import { useRole, ACTIONS } from '../auth';
import '../styles/components/EditControlModal.css';
import { showSuccessToast, showErrorToast } from '../utils/toast';

export default function EditControlModal({ isOpen, onClose, control, onUpdated }) {
  const { isManager, restrictionMessage } = useRole();
  const originalVgcpid = control?.id ?? '';

  const initial = useMemo(() => {
    return {
      vgcpid: control?.id ?? '',
      description: control?.description ?? '',
      controlOwner: control?.owner ?? '',
      controlSme: control?.sme ?? '',
      escalation: (control?.escalationRequired ?? '').toLowerCase() === 'yes',
      status: control?.status ?? 'Active',
    };
  }, [control]);

  const [vgcpid, setVgcpid] = useState('');
  const [description, setDescription] = useState('');
  const [controlOwner, setControlOwner] = useState('');
  const [controlSme, setControlSme] = useState('');
  const [escalation, setEscalation] = useState(false);
  const [status, setStatus] = useState('Active');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setVgcpid(initial.vgcpid);
    setDescription(initial.description);
    setControlOwner(initial.controlOwner);
    setControlSme(initial.controlSme);
    setEscalation(initial.escalation);
    setStatus(initial.status);

    setError('');
    setSubmitting(false);
    setFieldErrors({});
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
    setFieldErrors({});

    const errs = {};
    if (!vgcpid.trim()) errs.vgcpid = 'Control ID is required.';
    if (!description.trim()) errs.description = 'Description is required.';
    if (!controlOwner.trim()) errs.controlOwner = 'Control Owner is required.';

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);

    try {
      const effectiveVgcpid = isManager ? vgcpid.trim() : initial.vgcpid.trim();
      const transitioningToRetired =
        isManager && status === 'Retired' && initial.status !== 'Retired';

      if (transitioningToRetired) {
        await retireControl(originalVgcpid);
      } else {
        const payload = {
          vgcpid: effectiveVgcpid,
          description: description.trim(),
          controlOwner: controlOwner.trim(),
          controlSme: controlSme.trim(),
          escalation,
          isActive: status === 'Active',
        };

        await updateControl(originalVgcpid, payload);
      }

      if (onUpdated) await onUpdated();

      showSuccessToast({
        title: 'Control Saved',
        message: `Control ${originalVgcpid} has been saved successfully.`,
      });

      onClose?.();
    } catch (e) {
      const errorMessage = e?.message || 'Failed to update control';
      setError(errorMessage);

      showErrorToast({
        title: 'Control Save Failed',
        message: `An error occurred while saving the control: ${errorMessage}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const controlIdFieldTitle = !isManager
    ? restrictionMessage(ACTIONS.CHANGE_CATALOG_CONTROL_ID)
    : undefined;
  const statusFieldTitle = !isManager ? restrictionMessage(ACTIONS.RETIRE_CONTROL) : undefined;

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
              <label className="ecm-label">
                Control ID <span className="ecm-req" aria-hidden="true">*</span>
              </label>
              <input
                className="ecm-input"
                value={vgcpid}
                onChange={(e) => setVgcpid(e.target.value)}
                placeholder="e.g. VGCP-123456"
                disabled={!isManager}
                title={controlIdFieldTitle}
                aria-invalid={fieldErrors.vgcpid ? 'true' : 'false'}
              />
              {fieldErrors.vgcpid ? <div className="field-error">{fieldErrors.vgcpid}</div> : null}
            </div>

            <div className="ecm-field">
              <label className="ecm-label">
                Status{' '}
                <span className="ecm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                className="ecm-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!isManager}
                title={statusFieldTitle}
              >
                {isManager ? (
                  <>
                    <option value="Active">Active</option>
                    <option value="Retired">Retired</option>
                  </>
                ) : initial.status === 'Retired' ? (
                  <option value="Retired">Retired</option>
                ) : (
                  <option value="Active">Active</option>
                )}
              </select>
            </div>

            <div className="ecm-field ecm-field--full">
              <label className="ecm-label">
                Description{' '}
                <span className="ecm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <textarea
                className="ecm-textarea"
                placeholder="Enter detailed control description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={fieldErrors.description ? 'true' : 'false'}
              />
              {fieldErrors.description ? (
                <div className="field-error">{fieldErrors.description}</div>
              ) : null}
            </div>

            <div className="ecm-field">
              <label className="ecm-label">
                Control Owner{' '}
                <span className="ecm-req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                className="ecm-input"
                value={controlOwner}
                onChange={(e) => setControlOwner(e.target.value)}
                aria-invalid={fieldErrors.controlOwner ? 'true' : 'false'}
              />
              {fieldErrors.controlOwner ? (
                <div className="field-error">{fieldErrors.controlOwner}</div>
              ) : null}
            </div>

            <div className="ecm-field">
              <label className="ecm-label">Control SME</label>
              <input
                className="ecm-input"
                value={controlSme}
                onChange={(e) => setControlSme(e.target.value)}
              />
            </div>

            <div className="ecm-field ecm-field--full">
              <label className="ecm-label">
                Escalation Required?{' '}
                <span className="ecm-req" aria-hidden="true">
                  *
                </span>
              </label>
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
          <button
            type="button"
            className="ecm-btn ecm-btn--outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="button"
            className="ecm-btn ecm-btn--primary"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
