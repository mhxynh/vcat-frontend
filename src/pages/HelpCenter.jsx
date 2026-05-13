import React, { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import HelpArticle from '../components/help/HelpArticle';
import HelpSearch from '../components/help/HelpSearch';
import HelpSidebar from '../components/help/HelpSidebar';
import { useRole } from '../auth';
import { HELP_CATEGORIES, HELP_DOCS, sortHelpDocs } from '../data/help/docs';
import { buildHelpSearchIndex, getHelpDocById, searchHelpDocs } from '../data/help/searchIndex';

export default function HelpCenter() {
  const { role } = useRole();
  const sortedDocs = useMemo(() => sortHelpDocs(HELP_DOCS), []);
  const [selectedDocId, setSelectedDocId] = useState(() => sortedDocs[0]?.id || null);
  const [query, setQuery] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const searchIndex = useMemo(() => buildHelpSearchIndex(HELP_DOCS), []);
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

  function handleSelectDoc(docId) {
    setSelectedDocId(docId);
    setIsMobileNavOpen(false);
  }

  function handleClearSearch() {
    setQuery('');
    if (!visibleDocIds.has(selectedDocId) && sortedDocs[0]?.id) {
      setSelectedDocId(sortedDocs[0].id);
    }
  }

  return (
    <section className="help-center-page">
      <PageHeader title="Help Center" />

      <div className="help-center-page__search">
        <HelpSearch
          value={query}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          resultCount={searchResults.length}
        />
      </div>

      <button
        type="button"
        className="help-center-page__nav-toggle"
        aria-expanded={isMobileNavOpen}
        aria-controls="help-center-sidebar"
        onClick={() => setIsMobileNavOpen((open) => !open)}
      >
        Browse docs
      </button>

      <div className="help-center-page__layout">
        <div
          id="help-center-sidebar"
          className={`help-center-page__sidebar-wrap ${
            isMobileNavOpen ? 'help-center-page__sidebar-wrap--open' : ''
          }`}
        >
          <HelpSidebar
            categories={HELP_CATEGORIES}
            docs={visibleDocs}
            activeDocId={activeDocId}
            currentRole={role}
            onSelectDoc={handleSelectDoc}
          />
        </div>

        <main className="help-center-page__content">
          {activeDoc ? (
            <HelpArticle doc={activeDoc} currentRole={role} searchQuery={query} />
          ) : (
            <div className="dashboard-panel help-center-page__empty">
              <div className="dashboard-panel__title">No matching docs</div>
              <p className="help-center-page__empty-text">
                Try searching for a feature, workflow, permission, or role.
              </p>
              {query ? (
                <button type="button" className="btn btn--new" onClick={handleClearSearch}>
                  Clear search
                </button>
              ) : null}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
