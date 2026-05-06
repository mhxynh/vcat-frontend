import React from 'react';
import PageHeader from '../components/PageHeader';
import { HELP_CATEGORIES, HELP_DOCS } from '../data/help/docs';

export default function HelpCenter() {
  return (
    <section className="help-center-page">
      <PageHeader title="Help Center" />

      <div className="dashboard-panel help-center-page__placeholder">
        <div className="dashboard-panel__title">Documentation workspace</div>
        <p className="help-center-page__placeholder-text">
          The content model is ready with {HELP_DOCS.length} starter articles across{' '}
          {HELP_CATEGORIES.length} categories. Search, navigation, tutorials, and role-aware
          rendering will be built in the next phases.
        </p>
      </div>
    </section>
  );
}
