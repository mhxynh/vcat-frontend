import React, { useCallback, useEffect, useState } from 'react';
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
import RefreshButton from '../components/RefreshButton';
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
import { ActionButton } from '../components/ui';
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
  const [kanbanLoading, setKanbanLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [refreshingTab, setRefreshingTab] = useState(null);

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
            onLoadingChange={handleControlsLoadingChange}
            onTestUpdated={handleTestUpdated}
          />
        );
      case 'Kanban':
        return <Kanban refreshKey={kanbanRefreshKey} onLoadingChange={handleKanbanLoadingChange} />;
      case 'Requests':
        return (
          <Requests
            refreshKey={requestsRefreshKey}
            searchValue={requestsSearch}
            filters={requestsFilters}
            newRequestToOpen={newRequestToOpen}
            onNewRequestOpened={() => setNewRequestToOpen(null)}
            onLoadingChange={handleRequestsLoadingChange}
          />
        );
      case 'Calendar':
        return (
          <Calendar refreshKey={calendarRefreshKey} onLoadingChange={handleCalendarLoadingChange} />
        );
      default:
        return null;
    }
  };

  const exportConfigByTab = {
    Controls: { table: 'tests', fallbackFilename: 'test_export.csv' },
    Requests: { table: 'requests', fallbackFilename: 'request_export.csv' },
  };

  const activeExportConfig = exportConfigByTab[activeTab];
  const activeTabLoading =
    activeTab === 'Controls'
      ? controlsLoading
      : activeTab === 'Requests'
        ? requestsLoading
        : activeTab === 'Kanban'
          ? kanbanLoading
          : activeTab === 'Calendar'
            ? calendarLoading
            : false;

  const handleControlsLoadingChange = useCallback((loading) => {
    setControlsLoading(loading);
    if (!loading) {
      setRefreshingTab((tab) => (tab === 'Controls' ? null : tab));
    }
  }, []);

  const handleRequestsLoadingChange = useCallback((loading) => {
    setRequestsLoading(loading);
    if (!loading) {
      setRefreshingTab((tab) => (tab === 'Requests' ? null : tab));
    }
  }, []);

  const handleTestUpdated = useCallback(() => {
    setRequestsRefreshKey((k) => k + 1);
  }, []);

  const handleKanbanLoadingChange = useCallback((loading) => {
    setKanbanLoading(loading);
    if (!loading) {
      setRefreshingTab((tab) => (tab === 'Kanban' ? null : tab));
    }
  }, []);

  const handleCalendarLoadingChange = useCallback((loading) => {
    setCalendarLoading(loading);
    if (!loading) {
      setRefreshingTab((tab) => (tab === 'Calendar' ? null : tab));
    }
  }, []);

  const handleRefreshClick = () => {
    if (activeTabLoading) return;

    setRefreshingTab(activeTab);
    setLastUpdatedAt(new Date());

    if (activeTab === 'Controls') {
      setControlsLoading(true);
      setControlsRefreshKey((k) => k + 1);
    } else if (activeTab === 'Requests') {
      setRequestsLoading(true);
      setRequestsRefreshKey((k) => k + 1);
    } else if (activeTab === 'Kanban') {
      setKanbanLoading(true);
      setKanbanRefreshKey((k) => k + 1);
    } else if (activeTab === 'Calendar') {
      setCalendarLoading(true);
      setCalendarRefreshKey((k) => k + 1);
    }
  };

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
            <RefreshButton
              isLoading={refreshingTab === activeTab}
              isPageLoading={activeTabLoading}
              onClick={handleRefreshClick}
            />
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
                    <ActionButton
                      className="btn btn--new"
                      type="button"
                      onClick={() => setIsAssignOpen(true)}
                      isPageLoading={activeTabLoading}
                    >
                      Bulk Assign
                    </ActionButton>
                  </RestrictedAction>
                </div>
              ) : null}

              <div onClick={handleRestrictedOverlayClick}>
                <RestrictedAction action={ACTIONS.CREATE_TEST}>
                  <ActionButton
                    className="btn btn--new"
                    type="button"
                    onClick={() => setIsCreateTestOpen(true)}
                    isPageLoading={activeTabLoading}
                  >
                    + Add Control Test
                  </ActionButton>
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
                  <ActionButton
                    className="btn btn--new"
                    type="button"
                    onClick={() => setIsCreateRequestOpen(true)}
                    isPageLoading={activeTabLoading}
                  >
                    + Add Request
                  </ActionButton>
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
