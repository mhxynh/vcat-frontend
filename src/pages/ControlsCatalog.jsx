import React, { useMemo, useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import CreateControlModal from '../components/CreateControlModal';
import { fetchControls, mapControlRowToUi } from '../api/ControlsAPI';
import DetailsControlModal from '../components/DetailsControlModal';

export default function Controls() {
  const [filter, setFilter] = useState('All'); // Defaulted to ALL, can change to ACTIVE if needed
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10; // Set a control per page limit depending on what we think
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState(null);

  const openDetails = (control) => {
    setSelectedControl(control);
    setIsDetailsModalOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedControl(null);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const rows = await fetchControls();
        const uiControls = rows.map(mapControlRowToUi);

        if (!cancelled) {
          setControls(uiControls);
          setOpenId(uiControls[0]?.id ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load controls');
          setControls([]);
          setOpenId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = controls;

    if (filter !== 'All') {
      result = result.filter((c) => c.status === filter);
    }

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter((c) => c.id.toLowerCase().includes(q));
    }

    return result;
  }, [controls, filter, search]);

  const onToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pagedControls = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
    setOpenId(null);
  }, [filter, search]);

  return (
    <div className="controls-page">
      {/* Header */}
      <PageHeader
        title="Controls Catalog"
        actions={
          <>
            <button className="btn btn--white" type="button">
              Export
            </button>
            <button className="btn btn--blue" type="button">
              Refresh
            </button>
          </>
        }
      />

      {/* Filter */}
      <div className="controls-filters">
        <div className="pill-group">
          <button
            type="button"
            className={`pill ${filter === 'All' ? 'pill--active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All
          </button>
          <button
            type="button"
            className={`pill ${filter === 'Active' ? 'pill--active' : ''}`}
            onClick={() => setFilter('Active')}
          >
            Active
          </button>
          <button
            type="button"
            className={`pill ${filter === 'Retired' ? 'pill--active' : ''}`}
            onClick={() => setFilter('Retired')}
          >
            Retired
          </button>
        </div>

        <div className="filter-search">
          <input
            type="text"
            placeholder="Search by ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <button className="btn btn--red" type="button" onClick={() => setIsCreateModalOpen(true)}>
          New Control
        </button>
      </div>

      {/* Loading / Error */}
      {loading ? (
        <div className="no-results">Loading controls...</div>
      ) : error ? (
        <div className="no-results">Error: {error}</div>
      ) : (
        <>
          {/* Accordion */}
          <div className="controls-accordion">
            {pagedControls.length === 0 ? (
              <div className="no-results">No controls found.</div>
            ) : (
              pagedControls.map((control) => {
                const isOpen = control.id === openId;

                return (
                  <div key={control.id} className="acc-item">
                    <button
                      type="button"
                      className="acc-header"
                      onClick={() => onToggle(control.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="acc-header__left">
                        <span className="acc-id">{control.id}</span>
                      </div>

                      <div className="acc-header__right">
                        <span
                          className={`badge ${
                            control.status === 'Active' ? 'badge--active' : 'badge--retired'
                          }`}
                        >
                          {control.status}
                        </span>

                        <span className="badge badge--neutral">{control.testing}</span>

                        <span className={`chev ${isOpen ? 'chev--open' : ''}`}>⌄</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="acc-body">
                        <div className="acc-grid">
                          <div className="acc-card">
                            <div className="acc-card__label">Description</div>
                            <div className="acc-card__text">
                              {control.description ?? 'No description yet.'}
                            </div>
                          </div>

                          <div className="acc-card">
                            <div className="acc-card__label">Control Details</div>

                            <div className="acc-details">
                              <div className="acc-details__row">
                                <div className="acc-details__k">Date Created</div>
                                <div className="acc-details__v">{control.dateCreated ?? '-'}</div>
                              </div>
                              <div className="acc-details__row">
                                <div className="acc-details__k">Last Tested</div>
                                <div className="acc-details__v">{control.lastTested ?? '-'}</div>
                              </div>
                              <div className="acc-details__row">
                                <div className="acc-details__k">Control Owner</div>
                                <div className="acc-details__v">{control.owner ?? '-'}</div>
                              </div>
                              <div className="acc-details__row">
                                <div className="acc-details__k">Control SME</div>
                                <div className="acc-details__v">{control.sme ?? '-'}</div>
                              </div>
                              <div className="acc-details__row">
                                <div className="acc-details__k">Escalation Required</div>
                                <div className="acc-details__v">
                                  {control.escalationRequired ?? '-'}
                                </div>
                              </div>
                            </div>

                            <div className="acc-footer">
                              <button
                                type="button"
                                className="linklike"
                                onClick={() => openDetails(control)}
                              >
                                View More Details ↗
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Pagination */}
            <div className="pagination">
              <button
                className="pagination__arrow"
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
              >
                ←
              </button>

              <div className="pagination__info">
                Page {page} of {totalPages}
              </div>

              <button
                className="pagination__arrow"
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                →
              </button>
            </div>

            {/* Create Control Modal */}
            <CreateControlModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
            />

            <DetailsControlModal
              isOpen={isDetailsModalOpen}
              onClose={closeDetails}
              control={selectedControl}
            />
          </div>
        </>
      )}
    </div>
  );
}
