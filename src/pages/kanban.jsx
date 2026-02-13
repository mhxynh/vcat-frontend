import React, { useState } from "react";

const KanbanBoard = () => {
  const columns = [
    { key: "not_started", title: "Not Started" },
    { key: "in_progress", title: "In Progress" },
    { key: "in_review", title: "In Review" },
    { key: "completed", title: "Completed" }
  ];

  /* placeholder */
  const [cards, setCards] = useState([
    {
      id: "VGCP-XXXX",
      desc: "Blah blah blah",
      assignee: "MH",
      due: "Jan 15",
      status: "not_started",
      dot: "#ef4444"
    },
    {
      id: "VGCP-XXXX",
      desc: "MOre blah blahb lah",
      assignee: "MN",
      due: "Jan 18",
      status: "in_progress",
      dot: "#ef4444"
    },
    {
      id: "VG-XXXX",
      desc: "Ye",
      assignee: "AN",
      due: "Jan 12",
      status: "in_review",
      dot: "#f59e0b"
    },
    {
      id: "VG-XXXX",
      desc: "Amongus",
      assignee: "MH",
      due: "Jan 10",
      status: "completed",
      dot: "#22c55e"
    }
  ]);

  const refreshBoard = () => {
    console.log("Refreshing...");
  };

  const exportData = () => {
    console.log("Exporting...");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Controls Tracker</h2>
        <div>
          <button style={styles.exportBtn} onClick={exportData}>
            Export
          </button>
          <button style={styles.refreshBtn} onClick={refreshBoard}>
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...styles.activeTab }}>Kanban</button>
      </div>

      <div style={styles.board}>
        {columns.map((column) => {
          const columnCards = cards.filter(
            (card) => card.status === column.key
          );

          return (
            <div key={column.key} style={styles.column}>
              <div style={styles.columnHeader}>
                <span>{column.title}</span>
                <span style={styles.count}>{columnCards.length}</span>
              </div>

              {columnCards.map((card) => (
                <div key={card.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <span style={styles.code}>{card.id}</span>
                    <span
                      style={{
                        ...styles.dot,
                        backgroundColor: card.dot
                      }}
                    />
                  </div>

                  <p style={styles.desc}>{card.desc}</p>

                  <div style={styles.cardBottom}>
                    <div style={styles.avatar}>
                      {card.assignee}
                    </div>
                    <div style={styles.due}>
                      📅 {card.due}
                    </div>
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

const styles = {
  container: {
    padding: "20px",
    fontFamily: "system-ui",
    backgroundColor: "#f4f6f8",
    minHeight: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px"
  },
  exportBtn: {
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    padding: "8px 12px",
    marginRight: "8px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  refreshBtn: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  tabs: {
    marginBottom: "15px"
  },
  tab: {
    marginRight: "8px",
    padding: "6px 10px",
    borderRadius: "20px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    cursor: "pointer"
  },
  activeTab: {
    backgroundColor: "#831010",
    color: "white"
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px"
  },
  column: {
    backgroundColor: "#e5e7eb",
    padding: "10px",
    borderRadius: "10px"
  },
  columnHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontWeight: "bold"
  },
  count: {
    backgroundColor: "#dbeafe",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "12px"
  },
  card: {
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "10px"
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  code: {
    fontWeight: "bold",
    color: "#831010",
    fontSize: "12px"
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%"
  },
  desc: {
    fontSize: "13px"
  },
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "12px",
    fontWeight: "bold"
  },
  due: {
    fontSize: "12px",
    color: "#6b7280"
  }
};

export default KanbanBoard;
