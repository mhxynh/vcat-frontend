import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import Tests from './views/Tests';
import Requests from './views/Request';
import Kanban from './views/Kanban';
import Calendar from './views/Calendar';
import '../styles/pages/views/Tests.css';

export default function ControlsTracker() {
  const [activeTab, setActiveTab] = useState('Controls');
  const tabs = ['Controls', 'Requests', 'Kanban', 'Calendar'];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Controls':
        return <Tests />;
      case 'Kanban':
        return <Kanban />;
      case 'Requests':
        return <Requests />;
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
          <button className="btn btn--new" type="button">
            + Add Request
          </button>
        )}
      </div>

      <div className="tracker__content">{renderActiveView()}</div>
    </main>
  );
}
