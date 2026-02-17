import React, { useMemo, useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import CreateControlModal from '../components/CreateControlModal';

// SAMPLE CONTROLS, CHANGE THE SCHEMA AND STUFF WHEN DATABASE IS READY
const SAMPLE_CONTROLS = [
  {
    id: 'VGCP-406710',
    status: 'Active',
    testing: 'In Testing',
    description:
      'This is the only filled out control, the rest are empty besides the core status and testing.',
    dateCreated: '12/01/2025',
    lastTested: '12/31/2025',
    owner: 'John',
    sme: 'Joe',
    escalationRequired: 'No',
  },
  { id: 'VGCP-402120', status: 'Active', testing: 'Last Testing on 01/01/2025' },
  { id: 'VGCP-503322', status: 'Active', testing: 'Last Testing on 01/01/2025' },
  { id: 'VGCP-503456', status: 'Active', testing: 'Last Testing on 01/01/2025' },
  { id: 'VGCP-509696', status: 'Retired', testing: 'Last Testing on 01/01/2025' },
  { id: 'VGCP-506767', status: 'Retired', testing: 'Last Testing on 01/01/2025' },
  { id: 'VGCP-504425', status: 'Retired', testing: 'Last Testing on 01/01/2025' },
  { id: 'VGCP-600001', status: 'Active', testing: 'Last Testing on 02/01/2025' },
  { id: 'VGCP-600002', status: 'Active', testing: 'Last Testing on 02/03/2025' },
  { id: 'VGCP-600003', status: 'Active', testing: 'Last Testing on 02/05/2025' },
  { id: 'VGCP-600004', status: 'Retired', testing: 'Last Testing on 01/15/2025' },
  { id: 'VGCP-600005', status: 'Active', testing: 'Last Testing on 02/07/2025' },
  { id: 'VGCP-600006', status: 'Active', testing: 'Last Testing on 02/09/2025' },
  { id: 'VGCP-600007', status: 'Retired', testing: 'Last Testing on 01/22/2025' },
  { id: 'VGCP-600008', status: 'Active', testing: 'Last Testing on 02/10/2025' },
  { id: 'VGCP-600009', status: 'Active', testing: 'Last Testing on 02/11/2025' },
  { id: 'VGCP-600010', status: 'Retired', testing: 'Last Testing on 01/30/2025' },
];

export default function Controls() {
  const [filter, setFilter] = useState('All'); // Defaulted to ALL, can change to ACTIVE if needed
  const [openId, setOpenId] = useState(SAMPLE_CONTROLS[0]?.id ?? null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10; // Set a control per page limit depending on what we think
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = SAMPLE_CONTROLS; // change this when we get backend data

    if (filter !== 'All') {
      result = result.filter((c) => c.status === filter);
    }

    if (search.trim() !== '') {
      result = result.filter((c) => c.id.toLowerCase().includes(search.toLowerCase()));
    }

    return result;
  }, [filter, search]);

  const onToggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
                          <button type="button" className="linklike">
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
      </div>
    </div>
  );
}
