import React from 'react';
import filterIcon from '../assets/images/filter.png';

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
          <img src={filterIcon} alt="" className="controls-toolbar__filter-icon-image" />
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
