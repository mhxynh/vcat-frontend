import React, { useState } from 'react';
import Kanban from './Kanban'; // Importing your existing Kanban view
import PageHeader from '../components/PageHeader';
import { controlsData } from '../context/ControlsData';
import '../styles/pages/Tests.css';

export default function ControlsTracker() {
  const [activeTab, setActiveTab] = useState('Controls');
  const tabs = ['Controls', 'Requests', 'Kanban', 'Calendar'];

  // 1. We extract the table into its own sub-component to keep things clean
  const ControlsTable = () => (
    <div className="tracker__table-container">
      <table className="table">
        <thead className="table__head">
          <tr>
            <th className="table__header-cell">
              <input type="checkbox" aria-label="Select all" />
            </th>
            <th className="table__header-cell">Control</th>
            <th className="table__header-cell">Tester</th>
            <th className="table__header-cell">Test Type</th>
            <th className="table__header-cell">Status</th>
            <th className="table__header-cell">In-Progress Step</th>
            <th className="table__header-cell">Date Updated</th>
            <th className="table__header-cell">Due Date</th>
            <th className="table__header-cell">ETA Date</th>
          </tr>
        </thead>
        <tbody className="table__body">
          {controlsData.map((row) => (
            <tr key={row.id} className="table__row">
              <td className="table__cell">
                <input type="checkbox" aria-label={`Select ${row.control}`} />
              </td>
              <td className="table__cell table__cell--fw-bold">{row.control}</td>
              <td className="table__cell">{row.tester}</td>
              <td className="table__cell">{row.testType}</td>
              <td className="table__cell">
                <span className={`badge badge--${row.statusType}`}>{row.status}</span>
              </td>
              <td className="table__cell">{row.step}</td>
              <td className="table__cell">{row.dateUpdated}</td>
              <td className="table__cell">{row.dueDate}</td>
              <td className="table__cell">{row.etaDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // 2. A helper function to conditionally render the correct view
  const renderActiveView = () => {
    switch (activeTab) {
      case 'Controls':
        return <ControlsTable />;
      case 'Kanban':
        return <Kanban />;
      case 'Requests':
      case 'Calendar':
        return (
          <div className="tracker__placeholder">
            <p>{activeTab} view is currently under development.</p>
          </div>
        );
      default:
        return <ControlsTable />;
    }
  };

  return (
    <main className="tracker">
      {/* Header */}
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

      {/* Tracker Tabs */}
      <div className="tracker__navigation">
        <div className="tracker__tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tracker__tab ${activeTab === tab ? 'tracker__tab--active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="btn btn--new">
          <span aria-hidden="true">+</span> New Control
        </button>
      </div>

      {/* 3. Render the selected view here */}
      <div className="tracker__content">{renderActiveView()}</div>
    </main>
  );
}
