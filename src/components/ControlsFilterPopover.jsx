import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_FILTERS = Object.freeze({
  owner: '',
  sme: '',
  escalation: 'all', // all | yes | no
  tested: 'all', // all | tested | not_tested
});

export default function ControlsFilterPopover({ isOpen, onClose, value, onChange }) {
  const initialValue = value ?? DEFAULT_FILTERS;
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(value ?? DEFAULT_FILTERS);
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const activeCount = useMemo(() => {
    let count = 0;
    if (draft.owner.trim()) count += 1;
    if (draft.sme.trim()) count += 1;
    if (draft.escalation !== 'all') count += 1;
    if (draft.tested !== 'all') count += 1;
    return count;
  }, [draft]);

  if (!isOpen) return null;

  return (
    <div className="cfp-panel" role="dialog" aria-label="Filter controls">
      <div className="cfp-title">Filter Controls</div>

      <div className="cfp-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="cfp-owner">
            Control Owner contains
          </label>
          <input
            id="cfp-owner"
            className="form-input"
            placeholder="e.g. Jane"
            value={draft.owner}
            onChange={(e) => setDraft((p) => ({ ...p, owner: e.target.value }))}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="cfp-sme">
            Control SME contains
          </label>
          <input
            id="cfp-sme"
            className="form-input"
            placeholder="e.g. John"
            value={draft.sme}
            onChange={(e) => setDraft((p) => ({ ...p, sme: e.target.value }))}
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="cfp-escalation">
            Escalation Required
          </label>
          <select
            id="cfp-escalation"
            className="form-input"
            value={draft.escalation}
            onChange={(e) => setDraft((p) => ({ ...p, escalation: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="cfp-tested">
            Testing Status
          </label>
          <select
            id="cfp-tested"
            className="form-input"
            value={draft.tested}
            onChange={(e) => setDraft((p) => ({ ...p, tested: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="tested">Tested</option>
            <option value="not_tested">Not Tested Yet</option>
          </select>
        </div>
      </div>

      <div className="cfp-hint" aria-live="polite">
        {activeCount === 0
          ? 'No filters applied.'
          : `${activeCount} filter${activeCount === 1 ? '' : 's'} selected.`}
      </div>

      <div className="cfp-actions">
        <button
          type="button"
          className="btn cfp-btn-clear"
          onClick={() => setDraft(DEFAULT_FILTERS)}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn btn--red"
          onClick={() => {
            onChange?.(draft);
            onClose?.();
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_FILTERS };
