import React from 'react';
import FilterPopoverFrame from './FilterPopoverFrame';
import { CfpSelectField, CfpTextField } from './FilterPopoverFields';

const DEFAULT_FILTERS = Object.freeze({
  owner: '',
  sme: '',
  escalation: 'all',
  tested: 'all',
});

const ESCALATION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const TESTED_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'tested', label: 'Tested' },
  { value: 'not_tested', label: 'Not Tested Yet' },
];

export default function ControlsFilterPopover({ isOpen, onClose, value, onChange, panelId }) {
  return (
    <FilterPopoverFrame
      isOpen={isOpen}
      onClose={onClose}
      value={value}
      defaultFilters={DEFAULT_FILTERS}
      onApply={onChange}
      title="Filter Controls"
      ariaLabel="Filter controls"
      panelId={panelId}
    >
      {(draft, setDraft) => (
        <div className="cfp-grid">
          <CfpTextField
            id="cfp-owner"
            label="Control Owner contains"
            placeholder="e.g. Jane"
            value={draft.owner}
            onValue={(v) => setDraft((p) => ({ ...p, owner: v }))}
          />
          <CfpTextField
            id="cfp-sme"
            label="Control SME contains"
            placeholder="e.g. John"
            value={draft.sme}
            onValue={(v) => setDraft((p) => ({ ...p, sme: v }))}
          />
          <CfpSelectField
            id="cfp-escalation"
            label="Escalation Required"
            value={draft.escalation}
            onValue={(v) => setDraft((p) => ({ ...p, escalation: v }))}
            options={ESCALATION_OPTIONS}
          />
          <CfpSelectField
            id="cfp-tested"
            label="Testing Status"
            value={draft.tested}
            onValue={(v) => setDraft((p) => ({ ...p, tested: v }))}
            options={TESTED_OPTIONS}
          />
        </div>
      )}
    </FilterPopoverFrame>
  );
}

export { DEFAULT_FILTERS };
