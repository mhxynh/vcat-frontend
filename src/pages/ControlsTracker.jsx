import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Tests from './views/Tests';
import Requests from './views/Request';
import Kanban from './views/Kanban';
import Calendar from './views/Calendar';
import CreateTestModal from '../components/CreateTestModal';
import CreateRequestModal from '../components/CreateRequestModal';
import '../styles/pages/views/Tests.css';

export default function ControlsTracker() {
  const [activeTab, setActiveTab] = useState('Controls');
  const tabs = ['Controls', 'Requests', 'Kanban', 'Calendar'];

  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
  const [controlsRefreshKey, setControlsRefreshKey] = useState(0);

  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [requestsRefreshKey, setRequestsRefreshKey] = useState(0);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Controls':
        return <Tests refreshKey={controlsRefreshKey} />;
      case 'Kanban':
        return <Kanban />;
      case 'Requests':
        return <Requests refreshKey={requestsRefreshKey} />;
      case 'Calendar':
        return <Calendar />;
      default:
        return <Tests refreshKey={controlsRefreshKey} />;
    }
  };

  const handleRefreshClick = () => {
    if (activeTab === 'Controls') setControlsRefreshKey((k) => k + 1);
    if (activeTab === 'Requests') setRequestsRefreshKey((k) => k + 1);
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
              onClick={() => setActiveTab(tab)}
              className={`sub-tab ${activeTab === tab ? 'sub-tab--active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Controls' && (
          <button className="btn btn--new" type="button" onClick={() => setIsCreateTestOpen(true)}>
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

      <CreateTestModal
        isOpen={isCreateTestOpen}
        onClose={() => setIsCreateTestOpen(false)}
        onCreated={(created) => {
          console.log('created test:', created);
          setControlsRefreshKey((k) => k + 1);
        }}
      />

      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onCreated={(created) => {
          console.log('created request:', created);
          setIsCreateRequestOpen(false);
          setRequestsRefreshKey((k) => k + 1);
        }}
      />
    </main>
  );
}
