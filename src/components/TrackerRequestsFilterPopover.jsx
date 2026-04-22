import React from 'react';
import FilterPopoverFrame from './FilterPopoverFrame';

const DEFAULT_FILTERS = Object.freeze({
  priority: 'all',
  overdue: 'all',
});

export default function TrackerRequestsFilterPopover({
  isOpen,
  onClose,
  value,
  onChange,
  panelId,
}) {
  return (
    <FilterPopoverFrame
      isOpen={isOpen}
      onClose={onClose}
      value={value}
      defaultFilters={DEFAULT_FILTERS}
      onApply={onChange}
      title="Filter"
      ariaLabel="Filter requests"
      panelId={panelId}
    >
      {(draft, setDraft) => (
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
      )}
    </FilterPopoverFrame>
  );
}

export { DEFAULT_FILTERS };
