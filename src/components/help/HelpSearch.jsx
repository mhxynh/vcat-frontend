import React from 'react';

export default function HelpSearch({ value, onChange, resultCount }) {
  return (
    <div className="help-search">
      <div className="help-search__input-wrap">
        <span className="help-search__icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="16" height="16">
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
          className="help-search__input"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="Search help docs..."
          aria-label="Search help docs"
        />
      </div>

      <span className="help-search__count">
        {resultCount} {resultCount === 1 ? 'article' : 'articles'}
      </span>
    </div>
  );
}
