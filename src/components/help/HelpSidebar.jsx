import React, { useEffect, useRef } from 'react';
import {
  getHelpDocAccessLabel,
  getHelpDocsByCategory,
  sortHelpCategories,
  userCanAccessHelpDoc,
} from '../../data/help/docs';

export default function HelpSidebar({ categories, docs, activeDocId, currentRole, onSelectDoc }) {
  const sortedCategories = sortHelpCategories(categories);
  const activeLinkRef = useRef(null);

  useEffect(() => {
    activeLinkRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [activeDocId]);

  return (
    <aside className="help-sidebar" aria-label="Help documentation navigation">
      <div className="help-sidebar__title">Documentation</div>

      <nav className="help-sidebar__nav">
        {sortedCategories.map((category) => {
          const categoryDocs = getHelpDocsByCategory(category.id, docs);
          if (categoryDocs.length === 0) return null;

          return (
            <section key={category.id} className="help-sidebar__group">
              <div className="help-sidebar__group-title">{category.title}</div>

              <div className="help-sidebar__links">
                {categoryDocs.map((doc) => {
                  const isRestricted = !userCanAccessHelpDoc(doc, currentRole);

                  return (
                    <button
                      key={doc.id}
                      type="button"
                      ref={activeDocId === doc.id ? activeLinkRef : null}
                      className={`help-sidebar__link ${
                        activeDocId === doc.id ? 'help-sidebar__link--active' : ''
                      } ${isRestricted ? 'help-sidebar__link--restricted' : ''}`}
                      onClick={() => onSelectDoc?.(doc.id)}
                    >
                      <span className="help-sidebar__link-title">{doc.title}</span>
                      {isRestricted ? (
                        <span className="help-sidebar__link-badge">
                          {getHelpDocAccessLabel(doc, currentRole)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
