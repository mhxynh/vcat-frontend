import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import HelpArticle from '../components/help/HelpArticle';
import HelpSearch from '../components/help/HelpSearch';
import HelpSidebar from '../components/help/HelpSidebar';
import { HELP_CATEGORIES, HELP_DOCS, sortHelpDocs } from '../data/help/docs';
import { buildHelpSearchIndex, getHelpDocById, searchHelpDocs } from '../data/help/searchIndex';

export default function HelpCenter() {
  const sortedDocs = useMemo(() => sortHelpDocs(HELP_DOCS), []);
  const [selectedDocId, setSelectedDocId] = useState(() => sortedDocs[0]?.id || null);
  const [query, setQuery] = useState('');

  const searchIndex = useMemo(() => buildHelpSearchIndex(HELP_DOCS, HELP_CATEGORIES), []);
  const searchResults = useMemo(() => searchHelpDocs(query, searchIndex), [query, searchIndex]);

  const visibleDocIds = useMemo(
    () => new Set(searchResults.map((result) => result.id)),
    [searchResults]
  );

  const visibleDocs = useMemo(
    () => sortedDocs.filter((doc) => visibleDocIds.has(doc.id)),
    [sortedDocs, visibleDocIds]
  );

  const activeDocId = visibleDocIds.has(selectedDocId) ? selectedDocId : searchResults[0]?.id;
  const activeDoc = getHelpDocById(activeDocId, HELP_DOCS);

  function handleSearchChange(nextQuery) {
    setQuery(nextQuery);

    const nextResults = searchHelpDocs(nextQuery, searchIndex);
    if (nextResults.length > 0 && !nextResults.some((result) => result.id === selectedDocId)) {
      setSelectedDocId(nextResults[0].id);
    }
  }

  return (
    <section className="help-center-page">
      <PageHeader title="Help Center" />

      <div className="help-center-page__search">
        <HelpSearch
          value={query}
          onChange={handleSearchChange}
          resultCount={searchResults.length}
        />
      </div>

      <div className="help-center-page__layout">
        <HelpSidebar
          categories={HELP_CATEGORIES}
          docs={visibleDocs}
          activeDocId={activeDocId}
          onSelectDoc={setSelectedDocId}
        />

        <main className="help-center-page__content">
          {activeDoc ? (
            <HelpArticle doc={activeDoc} />
          ) : (
            <div className="dashboard-panel help-center-page__empty">
              <div className="dashboard-panel__title">No matching docs</div>
              <p className="help-center-page__empty-text">
                Try searching for a feature, workflow, permission, or role.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
