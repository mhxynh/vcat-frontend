import React, { useState, useEffect } from 'react';
import '../../styles/pages/views/Kanban.css';
import { fetchKanban, mapTestRowToCard } from '../../api/KanbanAPI';
import { fetchRequests } from '../../api/RequestsAPI';
import DetailsTestModal from '../../components/DetailsTestModal';

/** Column lane colors (Figma: gray / blue / teal / green) */
function columnLaneDotColor(statusKey) {
  switch (statusKey) {
    case 'not_started':
      return '#d1d1d1';
    case 'in_progress':
      return '#1447e6';
    case 'in_review':
      return '#00bda3';
    case 'completed':
      return '#008236';
    default:
      return '#d1d1d1';
  }
}

const COLUMNS = [
  { key: 'not_started', title: 'Not Started' },
  { key: 'in_progress', title: 'In Progress', match: ['dat_in_progress', 'oet_in_progress'] },
  { key: 'in_review', title: 'In Review' },
  { key: 'completed', title: 'Completed' },
];

function getAssigneeInitials(raw) {
  if (raw == null || raw === '') return '?';
  const s = String(raw).trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }
  if (/^[A-Za-z0-9]{2,}$/.test(s) && s === s.toUpperCase()) {
    return s.slice(0, 2);
  }
  return s.slice(0, 2).toUpperCase();
}

const AVATAR_PALETTE = ['#96151d', '#2e7d32', '#1967d2', '#7b1fa2', '#00897b', '#c62828'];

function avatarBackground(seed) {
  const str = String(seed ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function CalendarGlyph({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 3v2M17 3v2M4 9h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const KanbanBoard = ({ refreshKey = 0 }) => {
  const [cards, setCards] = useState([]);
  const [tests, setTests] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTestDetailsOpen, setIsTestDetailsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

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
        const testsMap = {};
        allTests.forEach((test) => {
          const id = test.vgcpid || test.test_id || String(test.control_id || '');
          testsMap[id] = test;
        });
        setCards(mapped);
        setTests(testsMap);
      } catch (e) {
        console.error('Kanban API error', e);
        setError(e.message || 'Failed to load kanban data');
      } finally {
        setLoading(false);
      }
    }

    loadBoard();
  }, [refreshKey]);

  function openTestDetails(cardId) {
    const test = tests[cardId];
    if (test) {
      setSelectedTest(test);
      setIsTestDetailsOpen(true);
    }
  }

  function closeTestDetails() {
    setIsTestDetailsOpen(false);
    setSelectedTest(null);
  }

  function columnCardsFor(column) {
    return cards.filter((card) =>
      column.match ? column.match.includes(card.status) : card.status === column.key
    );
  }

  if (loading) {
    return (
      <div className="kanban-wrap">
        <div className="kanban-loading">Loading kanban…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kanban-wrap">
        <div className="kanban-error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-wrap">
      <div className="kanban-board">
        {COLUMNS.map((column) => {
          const columnCards = columnCardsFor(column);

          return (
            <div key={column.key} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-title-with-status">
                  <span
                    className="kanban-status-dot"
                    style={{ backgroundColor: columnLaneDotColor(column.key) }}
                  />
                  <span className="kanban-column-title">{column.title}</span>
                </div>
                <span className="kanban-count">{columnCards.length}</span>
              </div>

              <div className="kanban-column-well">
                <div className="kanban-column-cards">
                  {cards.length === 0 && column.key === 'not_started' ? (
                    <p className="kanban-empty-hint">No items to display.</p>
                  ) : null}
                  {columnCards.map((card) => (
                    <div key={card.id} className="kanban-card">
                      <div className="kanban-card-top">
                        <button
                          type="button"
                          className="kanban-code"
                          onClick={() => openTestDetails(card.id)}
                        >
                          {card.id}
                        </button>
                        <span
                          className="kanban-card-dot"
                          style={{ backgroundColor: card.dot }}
                          title="Status"
                        />
                      </div>

                      <p className="kanban-desc">{card.desc}</p>

                      <div className="kanban-card-bottom">
                        <div
                          className="kanban-avatar"
                          style={{ backgroundColor: avatarBackground(card.assignee || card.id) }}
                          title={String(card.assignee || '')}
                        >
                          <span className="kanban-avatar__initials">
                            {getAssigneeInitials(card.assignee)}
                          </span>
                        </div>
                        <div className="kanban-due">
                          <CalendarGlyph className="kanban-due-icon" />
                          <span className="kanban-due__text">{card.due || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <DetailsTestModal isOpen={isTestDetailsOpen} onClose={closeTestDetails} test={selectedTest} />
    </div>
  );
};

export default KanbanBoard;
