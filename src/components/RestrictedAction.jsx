import React from 'react';
import { useRole } from '../auth';
import '../styles/components/RestrictedAction.css';

/**
 * Enforces RBAC on a single interactive child (e.g. button).
 * When the user lacks permission: disabled, greyed, native tooltip via title.
 *
 * @param {Object} props
 * @param {string} props.action - import { ACTIONS } from '../auth'
 * @param {React.ReactElement} props.children
 */
export default function RestrictedAction({ action, children }) {
  const { can, restrictionMessage } = useRole();

  if (!React.isValidElement(children)) {
    return children;
  }

  const allowed = can(action);
  if (allowed) {
    return children;
  }

  const reason = restrictionMessage(action);
  const prevTitle = children.props.title;
  const title = prevTitle ? `${prevTitle} - ${reason}` : reason;
  const childStyle = {
    ...(children.props.style || {}),
    pointerEvents: 'none',
  };
  const childClassName = [children.props.className, 'restricted-action__control']
    .filter(Boolean)
    .join(' ');

  return (
    <span className="restricted-action restricted-action--blocked" title={title} aria-label={title}>
      {React.cloneElement(children, {
        disabled: true,
        'aria-disabled': true,
        tabIndex: -1,
        onClick: undefined,
        onMouseDown: undefined,
        onPointerDown: undefined,
        title,
        style: childStyle,
        className: childClassName,
      })}
    </span>
  );
}
