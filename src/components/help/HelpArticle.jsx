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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getHighlightTerms(query) {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return [];

  const terms = new Set();
  if (normalizedQuery.includes(' ')) {
    terms.add(normalizedQuery);
  }

  normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .forEach((term) => terms.add(term));

  return Array.from(terms).sort((left, right) => right.length - left.length);
}

function highlightText(text, query) {
  if (typeof text !== 'string' || !text) return text;

  const terms = getHighlightTerms(query);
  if (terms.length === 0) return text;

  const highlightPattern = terms.map(escapeRegExp).join('|');
  const highlightRegex = new RegExp(`(${highlightPattern})`, 'gi');
  const splitParts = text.split(highlightRegex);

  if (splitParts.length === 1) return text;

  return splitParts.map((part, index) => {
    const isMatch = terms.some((term) => term.toLowerCase() === part.toLowerCase());

    if (isMatch) {
      return (
        <mark key={`${part}-${index}`} className="help-article__highlight">
          {part}
        </mark>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}

function renderSection(section, index, searchQuery) {
  if (!section) return null;

  if (section.type === HELP_SECTION_TYPES.PARAGRAPH) {
    return (
      <p key={index} className="help-article__paragraph">
        {highlightText(section.body, searchQuery)}
      </p>
    );
  }

  if (section.type === HELP_SECTION_TYPES.STEPS) {
    return (
      <section key={index} className="help-article__section">
        {section.title ? (
          <h2 className="help-article__section-title">
            {highlightText(section.title, searchQuery)}
          </h2>
        ) : null}
        <ol className="help-article__steps">
          {(section.items || []).map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>{highlightText(item, searchQuery)}</li>
          ))}
        </ol>
      </section>
    );
  }

  if (section.type === HELP_SECTION_TYPES.TIP) {
    return (
      <HelpCallout key={index} type="tip">
        {highlightText(section.body, searchQuery)}
      </HelpCallout>
    );
  }

  if (section.type === HELP_SECTION_TYPES.WARNING) {
    return (
      <HelpCallout key={index} type="warning">
        {highlightText(section.body, searchQuery)}
      </HelpCallout>
    );
  }

  if (section.type === HELP_SECTION_TYPES.PERMISSION) {
    return (
      <HelpCallout key={index} type="permission">
        {highlightText(section.body || ACTION_MESSAGES[section.action], searchQuery)}
      </HelpCallout>
    );
  }

  return null;
}

export default function HelpArticle({ doc, currentRole, searchQuery }) {
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
      <div className="help-article__meta">
        {highlightText(category?.title || 'Help', searchQuery)}
      </div>
      <h1 className="help-article__title">{highlightText(doc.title, searchQuery)}</h1>
      <p className="help-article__summary">{highlightText(doc.summary, searchQuery)}</p>

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
        {(doc.sections || []).map((section, index) => renderSection(section, index, searchQuery))}
      </div>
    </article>
  );
}
