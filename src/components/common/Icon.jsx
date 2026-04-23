import React from 'react';
import PropTypes from 'prop-types';

const Icon = ({
  name,
  category = '',
  size = 'sm',
  className = '',
  color = '#96151D',
  viewBox,
  width,
  height,
  ...props
}) => {
  const sizeMap = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const dimension = sizeMap[size] || sizeMap.md;
  const w = width ?? dimension;
  const h = height ?? dimension;

  const mergedStyle = { ...(props.style || {}), color };

  return (
    <svg
      viewBox={viewBox}
      stroke={color}
      style={mergedStyle}
      fill="none"
      className={`ui-icon icon-${category}-${name} ${className}`}
      aria-hidden="true"
      {...(viewBox ? { preserveAspectRatio: 'xMidYMid meet' } : {})}
      {...props}
      width={w}
      height={h}
    >
      <use href={`${process.env.PUBLIC_URL || ''}/icons.svg#icon-${category}-${name}`} />
    </svg>
  );
};

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  category: PropTypes.oneOf(['actions', 'deco', 'status', 'nav']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  color: PropTypes.string,
  className: PropTypes.string,
  viewBox: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default Icon;
