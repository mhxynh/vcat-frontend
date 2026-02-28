import React, { useState, useEffect } from 'react';
import '../../styles/pages/views/Kanban.css';
import { fetchKanban, mapTestRowToCard } from '../../api/KanbanAPI';
import { fetchRequests } from '../../api/RequestsAPI';

const KanbanBoard = () => {
  const statusColors = {
    not_started: '#ef4444',
    in_progress: '#f59e0b',
    in_review: '#a78bfa',
    completed: '#22c55e',
  };

  const columns = [
    { key: 'not_started', title: 'Not Started' },
    { key: 'in_progress', title: 'In Progress' },
    { key: 'in_review', title: 'In Review' },
    { key: 'completed', title: 'Completed' },
  ];

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBoard() {
      setLoading(true);
      setError('');

      try {
        const requests = await fetchRequests();
        const responses = await Promise.all(
          requests.map((r) => fetchKanban({ requestId: r.request_id, details: true }))
        );
        const allTests = responses.flat();
        const mapped = allTests.map(mapTestRowToCard);
        setCards(mapped);
      } catch (e) {
        console.error('Kanban API error', e);
        setError(e.message || 'Failed to load kanban data');
      } finally {
        setLoading(false);
      }
    }

    loadBoard();
  }, []);

  if (loading) {
    return <div className="kanban-board">Loading...</div>;
  }

  if (error) {
    return <div className="kanban-board">Error: {error}</div>;
  }

  if (cards.length === 0) {
    return (
      <div className="kanban-board">
        <div className="no-results">No items to display.</div>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      {columns.map((column) => {
        const columnCards = cards.filter((card) => card.status === column.key);

        return (
          <div key={column.key} className="kanban-column">
            <div className="kanban-column-header">
              <div className="kanban-title-with-status">
                <span
                  className="kanban-status-dot"
                  style={{ backgroundColor: statusColors[column.key] }}
                />
                <span>{column.title}</span>
              </div>
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
