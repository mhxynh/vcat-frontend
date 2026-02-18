import React, { useState } from 'react';
import '../styles/pages/calendar.css';

const CalendarView = () => {
  const columns = [
    { key: 'not_started', title: 'Not Started' },
    { key: 'in_progress', title: 'In Progress' },
    { key: 'in_review', title: 'In Review' },
    { key: 'completed', title: 'Completed' },
  ];

  /* placeholder */
  const [cards, setCards] = useState([
    {
      id: 'VGCP-XXXX',
      desc: 'Blah blah blah',
      assignee: 'MH',
      due: 'Jan 15',
      status: 'not_started',
      dot: '#ef4444',
    },
    {
      id: 'VGCP-XXXX',
      desc: 'MOre blah blahb lah',
      assignee: 'MN',
      due: 'Jan 18',
      status: 'in_progress',
      dot: '#ef4444',
    },
    {
      id: 'VG-XXXX',
      desc: 'Ye',
      assignee: 'AN',
      due: 'Jan 12',
      status: 'in_review',
      dot: '#f59e0b',
    },
    {
      id: 'VG-XXXX',
      desc: 'Amongus',
      assignee: 'MH',
      due: 'Jan 10',
      status: 'completed',
      dot: '#22c55e',
    },
  ]);

  const refreshCalendar = () => {
    console.log('Refreshing...');
  };

  const exportData = () => {
    console.log('Exporting...');
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2 style={{ margin: 0 }}>Controls Calendar</h2>
        <div className="calendar-actions">
          <button className="btn btn--white calendar-export-btn" onClick={exportData}>
            Export
          </button>
          <button className="btn btn--blue calendar-refresh-btn" onClick={refreshCalendar}>
            Refresh
          </button>
        </div>
      </div>

      <div className="calendar-tabs">
        <button className="calendar-tab calendar-tab-active">Calendar</button>
      </div>

      <div className="calendar-board">
        {columns.map((column) => {
          const columnCards = cards.filter((card) => card.status === column.key);

          return (
            <div key={column.key} className="calendar-column">
              <div className="calendar-column-header">
                <span>{column.title}</span>
                <span className="calendar-count">{columnCards.length}</span>
              </div>

              {columnCards.map((card) => (
                <div key={card.id} className="calendar-card acc-card">
                  <div className="calendar-card-top">
                    <span className="calendar-code">{card.id}</span>
                    <span className="calendar-dot" style={{ backgroundColor: card.dot }} />
                  </div>

                  <p className="calendar-desc">{card.desc}</p>

                  <div className="calendar-card-bottom">
                    <div className="calendar-avatar">{card.assignee}</div>
                    <div className="calendar-due">📅 {card.due}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
