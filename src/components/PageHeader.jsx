import React from "react";

export default function PageHeader({ title, actions }) {
  return (
    <div className="page-header">
      <div className="page-header__title">{title}</div>
      <div className="page-header__actions">{actions}</div>
    </div>
  );
}
