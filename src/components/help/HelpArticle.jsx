import React from 'react';
import { ACTION_MESSAGES } from '../../auth';
import {
  HELP_SECTION_TYPES,
  getHelpCategoryById,
  getHelpDocAccessLabel,
  userCanAccessHelpDoc,
} from '../../data/help/docs';
import HelpCallout from './HelpCallout';
import HelpMedia from './HelpMedia';

function renderSection(section, index) {
  if (!section) return null;

  if (section.type === HELP_SECTION_TYPES.PARAGRAPH) {
    return (
      <p key={index} className="help-article__paragraph">
        {section.body}
      </p>
    );
  }

  if (section.type === HELP_SECTION_TYPES.STEPS) {
    return (
      <section key={index} className="help-article__section">
        {section.title ? <h2 className="help-article__section-title">{section.title}</h2> : null}
        <ol className="help-article__steps">
          {(section.items || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
    );
  }

  if (section.type === HELP_SECTION_TYPES.TIP) {
    return (
      <HelpCallout key={index} type="tip">
        {section.body}
      </HelpCallout>
    );
  }

  if (section.type === HELP_SECTION_TYPES.WARNING) {
    return (
      <HelpCallout key={index} type="warning">
        {section.body}
      </HelpCallout>
    );
  }

  if (section.type === HELP_SECTION_TYPES.PERMISSION) {
    return (
      <HelpCallout key={index} type="permission">
        {section.body || ACTION_MESSAGES[section.action]}
      </HelpCallout>
    );
  }

  return null;
}

export default function HelpArticle({ doc, currentRole }) {
  if (!doc) {
    return (
      <article className="help-article help-article--empty">
        <h1 className="help-article__title">No Article Selected</h1>
        <p className="help-article__summary">Choose a help article from the navigation.</p>
      </article>
    );
  }

  const category = getHelpCategoryById(doc.categoryId);
  const canAccessDoc = userCanAccessHelpDoc(doc, currentRole);
  const accessLabel = getHelpDocAccessLabel(doc, currentRole);

  return (
    <article className="help-article">
      <div className="help-article__meta">{category?.title || 'Help'}</div>
      <h1 className="help-article__title">{doc.title}</h1>
      <p className="help-article__summary">{doc.summary}</p>

      <div className="help-article__chips" aria-label="Article metadata">
        <span
          className={`help-article__chip ${
            canAccessDoc ? 'help-article__chip--available' : 'help-article__chip--restricted'
          }`}
        >
          {accessLabel}
        </span>

        {(doc.roles || []).map((role) => (
          <span key={role} className="help-article__chip">
            {role}
          </span>
        ))}
      </div>

      {!canAccessDoc ? (
        <HelpCallout type="permission">
          This workflow is outside your current role. You can still read the guidance, but actions
          in the app may be disabled or require a manager.
        </HelpCallout>
      ) : null}

      {doc.media && doc.media.src ? <HelpMedia media={doc.media} /> : null}

      <div className="help-article__body">
        {(doc.sections || []).map((section, index) => renderSection(section, index))}
      </div>
    </article>
  );
}
