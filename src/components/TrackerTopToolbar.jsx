import React from 'react';
import { SearchInput } from './ui';

export default function TrackerTopToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  right,
}) {
  return (
    <div className="tracker-top-toolbar controls-toolbar">
      <SearchInput
        className="controls-search-input-wrap"
        iconClassName="controls-search-icon"
        inputClassName="search-input"
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={onSearchChange}
        ariaLabel={searchAriaLabel || searchPlaceholder}
      />

      {right ? <div className="controls-toolbar__actions">{right}</div> : null}
    </div>
  );
}
