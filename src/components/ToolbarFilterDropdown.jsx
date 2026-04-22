import React from 'react';
import filterIcon from '../assets/images/filter.png';

/**
 * Filter button + anchored popover (uses controls-toolbar__filter-wrap / cfp-panel styles).
 * Parent owns open state and outside-click / tab switching.
 */
export default function ToolbarFilterDropdown({
  isOpen,
  onToggle,
  onClose,
  value,
  onChange,
  FilterPopover,
}) {
  return (
    <div className="controls-toolbar__filter-wrap">
      <button
        className="btn controls-toolbar__action controls-toolbar__action--filter"
        type="button"
        onClick={onToggle}
      >
        <span className="controls-toolbar__filter-icon" aria-hidden="true">
          <img src={filterIcon} alt="" className="controls-toolbar__filter-icon-image" />
        </span>
        <span className="controls-toolbar__filter-label">Filter</span>
      </button>
      <FilterPopover isOpen={isOpen} onClose={onClose} value={value} onChange={onChange} />
    </div>
  );
}
