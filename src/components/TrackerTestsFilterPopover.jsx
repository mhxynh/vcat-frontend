import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_FILTERS = Object.freeze({
  status: 'all', // all | NOT_STARTED | DAT_IN_PROGRESS | OET_IN_PROGRESS | IN_REVIEW | BLOCKED | COMPLETED | ARCHIVED
  testType: 'all', // all | dat | oet | both
  overdue: 'all', // all | overdue | not_overdue
});

export default function TrackerTestsFilterPopover({ isOpen, onClose, value, onChange }) {
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
    if (draft.status !== 'all') count += 1;
    if (draft.testType !== 'all') count += 1;
    if (draft.overdue !== 'all') count += 1;
    return count;
  }, [draft]);

  if (!isOpen) return null;

  return (
    <div className="cfp-panel" role="dialog" aria-label="Filter control tests">
      <div className="cfp-title">Filter</div>

      <div className="cfp-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="ttfp-status">
            Status
          </label>
          <select
            id="ttfp-status"
            className="form-input"
            value={draft.status}
            onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="DAT_IN_PROGRESS">DAT In Progress</option>
            <option value="OET_IN_PROGRESS">OET In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ttfp-type">
            Test Type
          </label>
          <select
            id="ttfp-type"
            className="form-input"
            value={draft.testType}
            onChange={(e) => setDraft((p) => ({ ...p, testType: e.target.value }))}
          >
            <option value="all">All</option>
            <option value="dat">DAT</option>
            <option value="oet">OET</option>
            <option value="both">DAT &amp; OET</option>
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="ttfp-overdue">
            Due Date
          </label>
          <select
            id="ttfp-overdue"
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
