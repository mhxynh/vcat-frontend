import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import InfoTooltipIcon from '../components/InfoTooltipIcon';
import Tests from './views/Tests';
import Requests from './views/Request';
import Kanban from './views/Kanban';
import Calendar from './views/Calendar';
import CreateTestModal from '../components/CreateTestModal';
import CreateRequestModal from '../components/CreateRequestModal';
import AssignTestModal from '../components/AssignTestModal';
import RestrictedAction from '../components/RestrictedAction';
import { ACTIONS } from '../auth';
import { updateTest } from '../api/TestsAPI';
import { showErrorToast } from '../utils/toast';
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

  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
  const [controlsRefreshKey, setControlsRefreshKey] = useState(0);
  const [selectedTestRows, setSelectedTestRows] = useState([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [requestsRefreshKey, setRequestsRefreshKey] = useState(0);
  const [kanbanRefreshKey, setKanbanRefreshKey] = useState(0);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const [newRequestToOpen, setNewRequestToOpen] = useState(null);

  function showPermissionDeniedToast() {
    showErrorToast({
      title: 'Permission Denied',
      message: 'Only managers have permission for this action. Contact a manager for access.',
    });
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
            selectedRows={selectedTestRows}
            onSelectionChange={setSelectedTestRows}
          />
        );
      case 'Kanban':
        return <Kanban refreshKey={kanbanRefreshKey} />;
      case 'Requests':
        return (
          <Requests
            refreshKey={requestsRefreshKey}
            newRequestToOpen={newRequestToOpen}
            onNewRequestOpened={() => setNewRequestToOpen(null)}
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
    if (activeTab === 'Controls') setControlsRefreshKey((k) => k + 1);
    if (activeTab === 'Requests') setRequestsRefreshKey((k) => k + 1);
    if (activeTab === 'Kanban') setKanbanRefreshKey((k) => k + 1);
    if (activeTab === 'Calendar') setCalendarRefreshKey((k) => k + 1);
  };

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
            <button className="btn btn--white" type="button">
              Export
            </button>
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

        {activeTab === 'Controls' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selectedTestRows.length > 0 ? (
              <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 4,
                    backgroundColor: 'rgba(150,21,29,0.05)',
                    padding: '4px 8px',
                    color: '#96151d',
                  }}
                >
                  <button
                    aria-label="Clear selection"
                    onClick={() => setSelectedTestRows([])}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#96151d',
                      cursor: 'pointer',
                      padding: 0,
                      marginRight: 6,
                      fontSize: 14,
                      lineHeight: '14px',
                    }}
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

            <div
              onClick={(e) => {
                const blockedWrapper = e.target.closest('.restricted-action--blocked');
                if (blockedWrapper) {
                  e.preventDefault();
                  e.stopPropagation();
                  showPermissionDeniedToast();
                }
              }}
            >
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
          </div>
        )}

        {activeTab === 'Requests' && (
          <div
            onClick={(e) => {
              const blockedWrapper = e.target.closest('.restricted-action--blocked');
              if (blockedWrapper) {
                e.preventDefault();
                e.stopPropagation();
                showPermissionDeniedToast();
              }
            }}
          >
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
        )}
      </div>

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
