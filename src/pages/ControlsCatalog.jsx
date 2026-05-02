import React, { useMemo, useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import InfoTooltipIcon from '../components/InfoTooltipIcon';
import CreateControlModal from '../components/CreateControlModal';
import ExportButton from '../components/ExportButton';
import RestrictedAction from '../components/RestrictedAction';
import { ACTIONS } from '../auth';
import { exportCatalog, fetchControls, mapControlRowToUi } from '../api/ControlsAPI';
import DetailsControlModal from '../components/DetailsControlModal';
import Icon from '../components/common/Icon';
import { showErrorToast } from '../utils/toast';
import { triggerBrowserDownload } from '../utils/download';
import ControlsFilterPopover, { DEFAULT_FILTERS } from '../components/ControlsFilterPopover';
import TrackerTopToolbar from '../components/TrackerTopToolbar';
import ToolbarFilterDropdown from '../components/ToolbarFilterDropdown';

function formatLastUpdated(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

function formatDisplayDate(value) {
  if (!value || value === '-') return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

export default function Controls() {
  const [filter, setFilter] = useState('All');
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(DEFAULT_FILTERS);

  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const [isExporting, setIsExporting] = useState(false);

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

  function showPermissionDeniedToast() {
    showErrorToast({
      title: 'Permission Denied',
      message: 'Only managers have permission for this action. Contact a manager for access.',
    });
  }

  function handleRestrictedOverlayClick(e) {
    const blockedWrapper = e.target.closest('.restricted-action--blocked');
    if (blockedWrapper) {
      e.preventDefault();
      e.stopPropagation();
      showPermissionDeniedToast();
    }
  }

  async function loadControls({ setFirstOpen = false } = {}) {
    setLoading(true);
    setError('');

    try {
      const rows = await fetchControls();
      const uiControls = rows.map(mapControlRowToUi);

      setControls(uiControls);
      setLastUpdatedAt(new Date());
      if (setFirstOpen) setOpenId(uiControls[0]?.id ?? null);
    } catch (e) {
      setError(e?.message || 'Failed to load controls');
      setControls([]);
      if (setFirstOpen) setOpenId(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshControls() {
    try {
      const rows = await fetchControls();
      const uiControls = rows.map(mapControlRowToUi);
      setControls(uiControls);
      setLastUpdatedAt(new Date());
    } catch (e) {
      setError(e?.message || 'Failed to load controls');
    }
  }

  async function handleExport() {
    if (loading) return;

    setIsExporting(true);

    try {
      const { downloadUrl, filename } = await exportCatalog();
      triggerBrowserDownload(downloadUrl, filename);
    } catch {
      showErrorToast({
        title: 'Export Failed',
        message: 'Failed to generate export. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  }

  useEffect(() => {
    loadControls();
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

    if (advancedFilters.owner.trim() !== '') {
      const q = advancedFilters.owner.toLowerCase();
      result = result.filter((c) => (c.owner ?? '').toLowerCase().includes(q));
    }

    if (advancedFilters.sme.trim() !== '') {
      const q = advancedFilters.sme.toLowerCase();
      result = result.filter((c) => (c.sme ?? '').toLowerCase().includes(q));
    }

    if (advancedFilters.escalation !== 'all') {
      const want = advancedFilters.escalation === 'yes';
      result = result.filter((c) => Boolean(c.escalationRequired) === want);
    }

    if (advancedFilters.tested !== 'all') {
      const isTested = (c) => {
        const value = c.testing ?? c.lastTested;
        if (!value) return false;
        const s = String(value).toLowerCase();
        if (s.includes('not tested')) return false;
        if (s === '-') return false;
        return true;
      };
      const wantTested = advancedFilters.tested === 'tested';
      result = result.filter((c) => isTested(c) === wantTested);
    }

    return result;
  }, [controls, filter, search, advancedFilters]);

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
  }, [filter, search, advancedFilters]);

  useEffect(() => {
    if (!isFilterOpen) return;

    const onMouseDown = (e) => {
      const panel = e.target.closest?.('.controls-toolbar__filter-wrap');
      if (!panel) setIsFilterOpen(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isFilterOpen]);

  return (
    <div className="controls-page">
      <PageHeader
        title={
          <div className="dashboard-header-title">
            <span>Controls Catalog</span>
            <InfoTooltipIcon tooltip={`Last Updated ${formatLastUpdated(lastUpdatedAt)}`} />
          </div>
        }
        actions={
          <>
            <ExportButton isLoading={isExporting} disabled={loading} onClick={handleExport} />
            <button
              className="btn btn--blue"
              type="button"
              onClick={() => loadControls()}
              disabled={loading}
            >
              Refresh
            </button>
          </>
        }
      />

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

        <TrackerTopToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search controls..."
          searchAriaLabel="Search controls"
          right={
            <>
              <div onClick={handleRestrictedOverlayClick}>
                <RestrictedAction action={ACTIONS.CREATE_CONTROL}>
                  <button
                    className="btn btn--new controls-toolbar__action controls-toolbar__action--add"
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <span className="controls-toolbar__add-label">+ Add Control</span>
                  </button>
                </RestrictedAction>
              </div>

              <ToolbarFilterDropdown
                filterPanelId="controls-catalog-filter-panel"
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen((v) => !v)}
                onClose={() => setIsFilterOpen(false)}
                value={advancedFilters}
                onChange={setAdvancedFilters}
                FilterPopover={ControlsFilterPopover}
              />
            </>
          }
        />
      </div>

      {loading ? (
        <div className="no-results">Loading controls...</div>
      ) : error ? (
        <div className="no-results">Error: {error}</div>
      ) : (
        <>
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

                        <span className="badge badge--neutral">
                          {control.testing && control.testing !== 'Not Tested Yet'
                            ? `Last Tested ${formatDisplayDate(control.testing)}`
                            : (control.testing ?? 'Not Tested Yet')}
                        </span>

                        <span className={`chev ${isOpen ? 'chev--open' : ''}`}>
                          {isOpen ? '▴' : '▾'}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="acc-body">
                        <div className="acc-grid">
                          <div className="acc-card">
                            <div className="acc-card__label">
                              <Icon name="documents" category="deco" />
                              Description
                            </div>
                            <div className="acc-card__text">
                              {control.description ?? 'No description yet.'}
                            </div>
                          </div>

                          <div className="acc-card">
                            <div className="acc-card__label">
                              <Icon name="control-details" category="deco" />
                              Control Details
                            </div>
                            <div className="acc-details">
                              <div className="acc-details__row">
                                <div className="acc-details__k">
                                  <Icon name="calendar" category="deco" />
                                  Date Created
                                </div>
                                <div className="acc-details__v">
                                  {formatDisplayDate(control.dateCreated)}
                                </div>
                              </div>
                              <div className="acc-details__row">
                                <div className="acc-details__k">
                                  <Icon name="clock" category="deco" />
                                  Last Tested
                                </div>
                                <div className="acc-details__v">
                                  {formatDisplayDate(control.lastTested)}
                                </div>
                              </div>
                              <div className="acc-details__row">
                                <div className="acc-details__k">
                                  <Icon name="user" category="deco" />
                                  Control Owner
                                </div>
                                <div className="acc-details__v">{control.owner ?? '-'}</div>
                              </div>
                              <div className="acc-details__row">
                                <div className="acc-details__k">
                                  <Icon name="user" category="deco" />
                                  Control SME
                                </div>
                                <div className="acc-details__v">{control.sme ?? '-'}</div>
                              </div>
                              <div className="acc-details__row">
                                <div className="acc-details__k">
                                  <Icon name="exclamation" category="deco" color="#00A63E" />
                                  Escalation Required
                                </div>
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
                                View More Details
                                <Icon name="link" category="actions" />
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
          </div>
        </>
      )}

      <DetailsControlModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetails}
        control={selectedControl}
        onUpdated={refreshControls}
        onDeleted={async () => {
          await refreshControls();
        }}
      />

      <CreateControlModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={async () => {
          await loadControls();
        }}
      />
    </div>
  );
}
