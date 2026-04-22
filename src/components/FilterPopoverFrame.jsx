import React, { useEffect, useState } from 'react';

/**
 * Shared shell for toolbar filter dropdowns (cfp-* styles).
 * Keeps draft state in sync when opened; Escape closes; Clear / Apply footer.
 */
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

  const activeCount = getActiveCount(draft);

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
        <button
          type="button"
          className="btn cfp-btn-clear"
          onClick={() => setDraft(defaultFilters)}
        >
          Clear
        </button>
        <button
          type="button"
          className="btn btn--red"
          onClick={() => {
            onApply?.(draft);
            onClose?.();
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
