import React from 'react';
import FilterPopoverFrame from './FilterPopoverFrame';

const DEFAULT_FILTERS = Object.freeze({
  owner: '',
  sme: '',
  escalation: 'all',
  tested: 'all',
});

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
      )}
    </FilterPopoverFrame>
  );
}

export { DEFAULT_FILTERS };
