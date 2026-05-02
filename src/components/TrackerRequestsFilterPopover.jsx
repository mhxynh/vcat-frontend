import React from 'react';
import FilterPopoverFrame from './FilterPopoverFrame';
import { CfpSelectField, OVERDUE_FILTER_OPTIONS } from './FilterPopoverFields';

const DEFAULT_FILTERS = Object.freeze({
  priority: 'all',
  overdue: 'all',
});

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

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
          <CfpSelectField
            id="trfp-priority"
            label="Priority"
            value={draft.priority}
            onValue={(v) => setDraft((p) => ({ ...p, priority: v }))}
            options={PRIORITY_OPTIONS}
          />
          <CfpSelectField
            id="trfp-overdue"
            label="Due Date"
            value={draft.overdue}
            onValue={(v) => setDraft((p) => ({ ...p, overdue: v }))}
            options={OVERDUE_FILTER_OPTIONS}
          />
        </div>
      )}
    </FilterPopoverFrame>
  );
}

export { DEFAULT_FILTERS };
