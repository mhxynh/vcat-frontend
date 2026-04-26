import React from 'react';
import { ReactComponent as FilterIcon } from '../assets/images/search-bar-icons/filter.svg';

export default function ToolbarFilterDropdown({
  filterPanelId,
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
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={filterPanelId}
        onClick={onToggle}
      >
        <span className="controls-toolbar__filter-icon" aria-hidden="true">
          <FilterIcon
            className="controls-toolbar__filter-icon-svg"
            aria-hidden="true"
            focusable="false"
          />
        </span>
        <span className="controls-toolbar__filter-label">Filter</span>
      </button>
      <FilterPopover
        panelId={filterPanelId}
        isOpen={isOpen}
        onClose={onClose}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
