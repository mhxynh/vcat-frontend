import React from 'react';

const CALLOUT_LABELS = {
  tip: 'Tip',
  warning: 'Warning',
  permission: 'Permission',
};

export default function HelpCallout({ type, children }) {
  const tone = ['tip', 'warning', 'permission'].includes(type) ? type : 'tip';

  return (
    <aside className={`help-callout help-callout--${tone}`}>
      <div className="help-callout__label">{CALLOUT_LABELS[tone]}</div>
      <div className="help-callout__body">{children}</div>
    </aside>
  );
}
