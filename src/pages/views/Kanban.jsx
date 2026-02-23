import React, { useState } from 'react';
import '../../styles/pages/views/Kanban.css';

const KanbanBoard = () => {
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

  return (
    <div className="kanban-board">
      {columns.map((column) => {
        const columnCards = cards.filter((card) => card.status === column.key);

        return (
          <div key={column.key} className="kanban-column">
            <div className="kanban-column-header">
              <span>{column.title}</span>
              <span className="kanban-count">{columnCards.length}</span>
            </div>

            {columnCards.map((card) => (
              <div key={card.id} className="kanban-card acc-card">
                <div className="kanban-card-top">
                  <span className="kanban-code">{card.id}</span>
                  <span className="kanban-dot" style={{ backgroundColor: card.dot }} />
                </div>

                <p className="kanban-desc">{card.desc}</p>

                <div className="kanban-card-bottom">
                  <div className="kanban-avatar">{card.assignee}</div>
                  <div className="kanban-due">📅 {card.due}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
