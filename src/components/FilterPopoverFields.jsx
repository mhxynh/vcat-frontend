import React from 'react';

/** Shared by Tests + Requests filter popovers */
export const OVERDUE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'not_overdue', label: 'Not Overdue' },
];

// cfp = Controls Filter Popover
export function CfpTextField({ id, label, value, onValue, placeholder }) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValue(e.target.value)}
      />
    </div>
  );
}

export function CfpSelectField({ id, label, value, onValue, options }) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="form-input"
        value={value}
        onChange={(e) => onValue(e.target.value)}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
