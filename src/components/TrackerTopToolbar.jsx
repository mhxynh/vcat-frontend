import React from 'react';

export default function TrackerTopToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  right,
}) {
  return (
    <div className="tracker-top-toolbar">
      <div className="controls-toolbar">
        <div className="controls-search-input-wrap">
          <span className="controls-search-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="13" height="13">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <path
                d="M10.75 10.75L14 14"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="search-input"
            aria-label={searchAriaLabel || searchPlaceholder}
          />
        </div>

        {right ? <div className="controls-toolbar__actions">{right}</div> : null}
      </div>
    </div>
  );
}
