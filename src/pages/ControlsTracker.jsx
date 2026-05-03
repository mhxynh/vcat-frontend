import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import InfoTooltipIcon from '../components/InfoTooltipIcon';
import Tests from './views/Tests';
import Requests from './views/Request';
import Kanban from './views/Kanban';
import Calendar from './views/Calendar';
import CreateTestModal from '../components/CreateTestModal';
import CreateRequestModal from '../components/CreateRequestModal';
import AssignTestModal from '../components/AssignTestModal';
import ExportButton from '../components/ExportButton';
import RestrictedAction from '../components/RestrictedAction';
import { ACTIONS } from '../auth';
import { updateTest } from '../api/TestsAPI';
import { exportTable } from '../api/ExportAPI';
import { showErrorToast } from '../utils/toast';
import { triggerBrowserDownload } from '../utils/download';
import TrackerTopToolbar from '../components/TrackerTopToolbar';
import TrackerTestsFilterPopover, {
  DEFAULT_FILTERS as DEFAULT_TESTS_FILTERS,
} from '../components/TrackerTestsFilterPopover';
import TrackerRequestsFilterPopover, {
  DEFAULT_FILTERS as DEFAULT_REQUESTS_FILTERS,
} from '../components/TrackerRequestsFilterPopover';
import ToolbarFilterDropdown from '../components/ToolbarFilterDropdown';
import '../styles/pages/views/Tests.css';

function formatLastUpdated(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

export default function ControlsTracker() {
  const [activeTab, setActiveTab] = useState('Controls');
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['Controls']));
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const tabs = ['Controls', 'Requests', 'Kanban', 'Calendar'];

  const [controlsSearch, setControlsSearch] = useState('');
  const [requestsSearch, setRequestsSearch] = useState('');
  const [controlsFilters, setControlsFilters] = useState(DEFAULT_TESTS_FILTERS);
  const [requestsFilters, setRequestsFilters] = useState(DEFAULT_REQUESTS_FILTERS);
  const [isControlsFilterOpen, setIsControlsFilterOpen] = useState(false);
  const [isRequestsFilterOpen, setIsRequestsFilterOpen] = useState(false);

  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
  const [controlsRefreshKey, setControlsRefreshKey] = useState(0);
  const [selectedTestRows, setSelectedTestRows] = useState([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [requestsRefreshKey, setRequestsRefreshKey] = useState(0);
  const [kanbanRefreshKey, setKanbanRefreshKey] = useState(0);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [controlsLoading, setControlsLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [newRequestToOpen, setNewRequestToOpen] = useState(null);

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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  };

  const renderView = (tab) => {
    switch (tab) {
      case 'Controls':
        return (
          <Tests
            refreshKey={controlsRefreshKey}
            searchValue={controlsSearch}
            filters={controlsFilters}
            selectedRows={selectedTestRows}
            onSelectionChange={setSelectedTestRows}
            onLoadingChange={setControlsLoading}
          />
        );
      case 'Kanban':
        return <Kanban refreshKey={kanbanRefreshKey} />;
      case 'Requests':
        return (
          <Requests
            refreshKey={requestsRefreshKey}
            searchValue={requestsSearch}
            filters={requestsFilters}
            newRequestToOpen={newRequestToOpen}
            onNewRequestOpened={() => setNewRequestToOpen(null)}
            onLoadingChange={setRequestsLoading}
          />
        );
      case 'Calendar':
        return <Calendar refreshKey={calendarRefreshKey} />;
      default:
        return null;
    }
  };

  const handleRefreshClick = () => {
    setLastUpdatedAt(new Date());
    if (activeTab === 'Controls') {
      setControlsLoading(true);
      setControlsRefreshKey((k) => k + 1);
    }
    if (activeTab === 'Requests') {
      setRequestsLoading(true);
      setRequestsRefreshKey((k) => k + 1);
    }
    if (activeTab === 'Kanban') setKanbanRefreshKey((k) => k + 1);
    if (activeTab === 'Calendar') setCalendarRefreshKey((k) => k + 1);
  };

  const exportConfigByTab = {
    Controls: { table: 'tests', fallbackFilename: 'test_export.csv' },
    Requests: { table: 'requests', fallbackFilename: 'request_export.csv' },
  };

  const activeExportConfig = exportConfigByTab[activeTab];
  const activeTabLoading =
    activeTab === 'Controls' ? controlsLoading : activeTab === 'Requests' ? requestsLoading : false;

  async function handleExportClick() {
    if (!activeExportConfig || activeTabLoading) return;

    setIsExporting(true);

    try {
      const { downloadUrl, filename } = await exportTable(
        activeExportConfig.table,
        activeExportConfig.fallbackFilename
      );
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
    setIsControlsFilterOpen(false);
    setIsRequestsFilterOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!isControlsFilterOpen && !isRequestsFilterOpen) return;
    const onMouseDown = (e) => {
      if (!e.target.closest?.('.controls-toolbar__filter-wrap')) {
        setIsControlsFilterOpen(false);
        setIsRequestsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isControlsFilterOpen, isRequestsFilterOpen]);

  return (
    <main className="tracker">
      <PageHeader
        title={
          <div className="dashboard-header-title">
            <span>Controls Tracker</span>
            <InfoTooltipIcon tooltip={`Last Updated ${formatLastUpdated(lastUpdatedAt)}`} />
          </div>
        }
        actions={
          <>
            <ExportButton
              isLoading={isExporting}
              isPageLoading={activeTabLoading}
              disabled={!activeExportConfig}
              onClick={handleExportClick}
            />
            <button className="btn btn--blue" type="button" onClick={handleRefreshClick}>
              Refresh
            </button>
          </>
        }
      />

      <div className="sub-page-tabs">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={`sub-tab ${activeTab === tab ? 'sub-tab--active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Controls' ? (
        <TrackerTopToolbar
          searchValue={controlsSearch}
          onSearchChange={setControlsSearch}
          searchPlaceholder="Search controls..."
          searchAriaLabel="Search controls"
          right={
            <>
              {selectedTestRows.length > 0 ? (
                <div className="tracker-toolbar-selection">
                  <div className="tracker-toolbar-selection__pill">
                    <button
                      type="button"
                      className="tracker-toolbar-selection__clear"
                      aria-label="Clear selection"
                      onClick={() => setSelectedTestRows([])}
                    >
                      ×
                    </button>
                    <span>{selectedTestRows.length} selected</span>
                  </div>
                  <RestrictedAction action={ACTIONS.BULK_ASSIGN_TESTERS}>
                    <button
                      className="btn btn--new"
                      type="button"
                      onClick={() => setIsAssignOpen(true)}
                    >
                      Bulk Assign
                    </button>
                  </RestrictedAction>
                </div>
              ) : null}

              <div onClick={handleRestrictedOverlayClick}>
                <RestrictedAction action={ACTIONS.CREATE_TEST}>
                  <button
                    className="btn btn--new"
                    type="button"
                    onClick={() => setIsCreateTestOpen(true)}
                  >
                    + Add Control Test
                  </button>
                </RestrictedAction>
              </div>

              <ToolbarFilterDropdown
                filterPanelId="tracker-controls-filter-panel"
                isOpen={isControlsFilterOpen}
                onToggle={() => setIsControlsFilterOpen((v) => !v)}
                onClose={() => setIsControlsFilterOpen(false)}
                value={controlsFilters}
                onChange={setControlsFilters}
                FilterPopover={TrackerTestsFilterPopover}
              />
            </>
          }
        />
      ) : null}

      {activeTab === 'Requests' ? (
        <TrackerTopToolbar
          searchValue={requestsSearch}
          onSearchChange={setRequestsSearch}
          searchPlaceholder="Search requests..."
          searchAriaLabel="Search requests"
          right={
            <>
              <div onClick={handleRestrictedOverlayClick}>
                <RestrictedAction action={ACTIONS.CREATE_REQUEST}>
                  <button
                    className="btn btn--new"
                    type="button"
                    onClick={() => setIsCreateRequestOpen(true)}
                  >
                    + Add Request
                  </button>
                </RestrictedAction>
              </div>

              <ToolbarFilterDropdown
                filterPanelId="tracker-requests-filter-panel"
                isOpen={isRequestsFilterOpen}
                onToggle={() => setIsRequestsFilterOpen((v) => !v)}
                onClose={() => setIsRequestsFilterOpen(false)}
                value={requestsFilters}
                onChange={setRequestsFilters}
                FilterPopover={TrackerRequestsFilterPopover}
              />
            </>
          }
        />
      ) : null}

      <div className="tracker__content">
        {tabs.map((tab) =>
          visitedTabs.has(tab) ? (
            <section
              key={tab}
              className="tracker__view-panel"
              hidden={activeTab !== tab}
              aria-hidden={activeTab !== tab}
            >
              {renderView(tab)}
            </section>
          ) : null
        )}
      </div>

      <CreateTestModal
        isOpen={isCreateTestOpen}
        onClose={() => setIsCreateTestOpen(false)}
        onCreated={(created) => {
          setControlsRefreshKey((k) => k + 1);
        }}
      />

      <AssignTestModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        testIds={selectedTestRows}
        onAssign={async (testIds, userId, displayName, note) => {
          if (!Array.isArray(testIds) || testIds.length === 0) return;
          setIsAssignOpen(false);
          setSelectedTestRows([]);

          try {
            await Promise.all(
              testIds.map((id) =>
                updateTest(id, { action: 'assign', assignedTesterId: String(userId) })
              )
            );

            setControlsRefreshKey((k) => k + 1);
          } catch (e) {
            alert('Failed to assign tests: ' + (e?.message || e));
            setControlsRefreshKey((k) => k + 1);
          }
        }}
      />

      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onCreated={(created) => {
          setIsCreateRequestOpen(false);
          setRequestsRefreshKey((k) => k + 1);
          setNewRequestToOpen(created);
        }}
      />
    </main>
  );
}
