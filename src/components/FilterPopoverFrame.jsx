import React, { useEffect, useState } from 'react';
import { ActionButton } from './ui';

function countActiveFromDefaults(draft, defaults) {
  let n = 0;
  for (const key of Object.keys(defaults)) {
    const base = defaults[key];
    const cur = draft[key];
    if (base === 'all') {
      if (cur !== 'all') n += 1;
    } else if (base === '') {
      if (String(cur ?? '').trim() !== '') n += 1;
    } else if (cur !== base) {
      n += 1;
    }
  }
  return n;
}

/** Shared shell: draft sync on open, Escape closes, Clear / Apply. */
export default function FilterPopoverFrame({
  isOpen,
  onClose,
  value,
  defaultFilters,
  onApply,
  title,
  ariaLabel,
  panelId,
  getActiveCount,
  children,
}) {
  const [draft, setDraft] = useState(() => value ?? defaultFilters);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(value ?? defaultFilters);
  }, [isOpen, value, defaultFilters]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeCount = getActiveCount
    ? getActiveCount(draft)
    : countActiveFromDefaults(draft, defaultFilters);

  return (
    <div id={panelId || undefined} className="cfp-panel" role="dialog" aria-label={ariaLabel}>
      <div className="cfp-title">{title}</div>
      {children(draft, setDraft)}
      <div className="cfp-hint" aria-live="polite">
        {activeCount === 0
          ? 'No filters applied.'
          : `${activeCount} filter${activeCount === 1 ? '' : 's'} selected.`}
      </div>
      <div className="cfp-actions">
        <ActionButton
          type="button"
          variant="cancel"
          className="btn cfp-btn-clear"
          onClick={() => setDraft(defaultFilters)}
        >
          Clear
        </ActionButton>
        <ActionButton
          type="button"
          className="btn btn--red"
          onClick={() => {
            onApply?.(draft);
            onClose?.();
          }}
        >
          Apply
        </ActionButton>
      </div>
    </div>
  );
}
