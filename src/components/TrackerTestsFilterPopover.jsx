import React from 'react';
import FilterPopoverFrame from './FilterPopoverFrame';

const DEFAULT_FILTERS = Object.freeze({
  status: 'all',
  testType: 'all',
  overdue: 'all',
});

function countActive(draft) {
  let n = 0;
  if (draft.status !== 'all') n += 1;
  if (draft.testType !== 'all') n += 1;
  if (draft.overdue !== 'all') n += 1;
  return n;
}

export default function TrackerTestsFilterPopover({ isOpen, onClose, value, onChange, panelId }) {
  return (
    <FilterPopoverFrame
      isOpen={isOpen}
      onClose={onClose}
      value={value}
      defaultFilters={DEFAULT_FILTERS}
      onApply={onChange}
      title="Filter"
      ariaLabel="Filter control tests"
      panelId={panelId}
      getActiveCount={countActive}
    >
      {(draft, setDraft) => (
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
      )}
    </FilterPopoverFrame>
  );
}

export { DEFAULT_FILTERS };
