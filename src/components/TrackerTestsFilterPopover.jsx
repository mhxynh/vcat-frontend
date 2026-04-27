import React, { useEffect, useState } from 'react';
import FilterPopoverFrame from './FilterPopoverFrame';
import { CfpSelectField, OVERDUE_FILTER_OPTIONS } from './FilterPopoverFields';
import { fetchUsers } from '../api/UsersAPI';

const DEFAULT_FILTERS = Object.freeze({
  status: 'all',
  testType: 'all',
  tester: 'all',
  overdue: 'all',
});

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'DAT_IN_PROGRESS', label: 'DAT In Progress' },
  { value: 'OET_IN_PROGRESS', label: 'OET In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const TEST_TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'dat', label: 'DAT' },
  { value: 'oet', label: 'OET' },
  { value: 'both', label: 'DAT & OET' },
];

export default function TrackerTestsFilterPopover({ isOpen, onClose, value, onChange, panelId }) {
  const [testerOptions, setTesterOptions] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    (async () => {
      try {
        const all = await fetchUsers({ isActive: true });
        if (cancelled) return;

        const testers = (Array.isArray(all) ? all : [])
          .filter((u) => String(u.role).toUpperCase() === 'TESTER')
          .map((u) => {
            const idVal = u.userId ?? u.user_id ?? u.id;
            const label = u.display_name ?? u.displayName ?? u.email ?? `User ${idVal}`;
            return { value: String(idVal), label };
          })
          .filter((u) => u.value)
          .sort((a, b) => a.label.localeCompare(b.label));

        setTesterOptions(testers);
      } catch (e) {
        if (!cancelled) setTesterOptions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const testerFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unassigned', label: 'Unassigned' },
    ...testerOptions,
  ];

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
    >
      {(draft, setDraft) => (
        <div className="cfp-grid">
          <CfpSelectField
            id="ttfp-status"
            label="Status"
            value={draft.status}
            onValue={(v) => setDraft((p) => ({ ...p, status: v }))}
            options={STATUS_OPTIONS}
          />
          <CfpSelectField
            id="ttfp-type"
            label="Test Type"
            value={draft.testType}
            onValue={(v) => setDraft((p) => ({ ...p, testType: v }))}
            options={TEST_TYPE_OPTIONS}
          />
          <CfpSelectField
            id="ttfp-tester"
            label="Tester"
            value={draft.tester}
            onValue={(v) => setDraft((p) => ({ ...p, tester: v }))}
            options={testerFilterOptions}
          />
          <CfpSelectField
            id="ttfp-overdue"
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
