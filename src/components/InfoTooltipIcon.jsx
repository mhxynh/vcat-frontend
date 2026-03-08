import React from 'react';

export default function InfoTooltipIcon({ tooltip }) {
  return (
    <span className="dashboard-info-icon" title={tooltip}>
      <span className="dashboard-info-icon__glyph">i</span>
      <span className="dashboard-info-tooltip">{tooltip}</span>
    </span>
  );
}
