import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Tests from './views/Tests';
import Requests from './views/Request';
import Kanban from './views/Kanban';
import Calendar from './views/Calendar';
import CreateRequestModal from '../components/CreateRequestModal';
import '../styles/pages/views/Tests.css';

export default function ControlsTracker() {
  const [activeTab, setActiveTab] = useState('Controls');
  const tabs = ['Controls', 'Requests', 'Kanban', 'Calendar'];

  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [requestsRefreshKey, setRequestsRefreshKey] = useState(0);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Controls':
        return <Tests />;
      case 'Kanban':
        return <Kanban />;
      case 'Requests':
        return <Requests refreshKey={requestsRefreshKey} />;
      case 'Calendar':
        return <Calendar />;
      default:
        return <Tests />;
    }
  };

  return (
    <main className="tracker">
      <PageHeader
        title="Controls Tracker"
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

      <div className="sub-page-tabs">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`sub-tab ${activeTab === tab ? 'sub-tab--active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Controls' && (
          <button className="btn btn--new" type="button">
            + Add Control Test
          </button>
        )}

        {activeTab === 'Requests' && (
          <button
            className="btn btn--new"
            type="button"
            onClick={() => setIsCreateRequestOpen(true)}
          >
            + Add Request
          </button>
        )}
      </div>

      <div className="tracker__content">{renderActiveView()}</div>

      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onCreated={() => setRequestsRefreshKey((k) => k + 1)}
        onOpenCreateControl={() => {
          // wire this to your Create Control modal when you plug it in
          alert('Open Create Control modal (TODO)');
        }}
      />
    </main>
  );
}
