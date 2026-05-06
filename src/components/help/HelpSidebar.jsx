import React from 'react';
import { getHelpDocsByCategory, sortHelpCategories } from '../../data/help/docs';

export default function HelpSidebar({ categories, docs, activeDocId, onSelectDoc }) {
  const sortedCategories = sortHelpCategories(categories);

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
                {categoryDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    className={`help-sidebar__link ${
                      activeDocId === doc.id ? 'help-sidebar__link--active' : ''
                    }`}
                    onClick={() => onSelectDoc?.(doc.id)}
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </nav>
    </aside>
  );
}
