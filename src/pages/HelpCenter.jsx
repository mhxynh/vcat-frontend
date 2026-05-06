import React from 'react';
import PageHeader from '../components/PageHeader';

export default function HelpCenter() {
  return (
    <section className="help-center-page">
      <PageHeader title="Help Center" />

      <div className="dashboard-panel help-center-page__placeholder">
        <div className="dashboard-panel__title">Documentation workspace</div>
        <p className="help-center-page__placeholder-text">
          Search, navigation, tutorials, and role-aware documentation will be built here in the next
          phases.
        </p>
      </div>
    </section>
  );
}
