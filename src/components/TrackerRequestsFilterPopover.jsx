import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_FILTERS = Object.freeze({
  priority: 'all', // all | low | medium | high | critical
  overdue: 'all', // all | overdue | not_overdue
});

export default function TrackerRequestsFilterPopover({ isOpen, onClose, value, onChange }) {
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
    if (draft.priority !== 'all') count += 1;
    if (draft.overdue !== 'all') count += 1;
    return count;
  }, [draft]);

  if (!isOpen) return null;

  return (
    <div className="cfp-panel" role="dialog" aria-label="Filter requests">
      <div className="cfp-title">Filter</div>

      <div className="cfp-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="trfp-priority">
            Priority
          </label>
          <select
            id="trfp-priority"
            className="form-input"
            value={draft.priority}
            onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="trfp-overdue">
            Due Date
          </label>
          <select
            id="trfp-overdue"
            className="form-input"
            value={draft.overdue}
            onChange={(e) => setDraft((p) => ({ ...p, overdue: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="overdue">Overdue</option>
            <option value="not_overdue">Not Overdue</option>
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
