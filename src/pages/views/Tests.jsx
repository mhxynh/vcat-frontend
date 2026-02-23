import React, { useState } from 'react';
import { controlsData } from '../../context/TestData';
import '../../styles/pages/views/Tests.css';

export default function Tests() {
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(controlsData.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((rowId) => rowId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const isAllSelected = controlsData.length > 0 && selectedRows.length === controlsData.length;

  return (
    <div className="tracker__table-container">
      <table className="table">
        <thead className="table__head">
          <tr>
            <th className="table__header-cell">
              <input
                type="checkbox"
                className="table__checkbox"
                aria-label="Select all rows"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </th>
            <th className="table__header-cell">VGCPID</th>
            <th className="table__header-cell">Tester</th>
            <th className="table__header-cell">Test Type</th>
            <th className="table__header-cell">Status</th>
            <th className="table__header-cell">In-Progress Step</th>
            <th className="table__header-cell">Last Updated</th>
            <th className="table__header-cell">Due Date</th>
            <th className="table__header-cell">ETA Date</th>
          </tr>
        </thead>
        <tbody className="table__body">
          {controlsData.map((row) => (
            <tr key={row.id} className="table__row">
              <td className="table__cell">
                <input
                  type="checkbox"
                  className="table__checkbox"
                  aria-label={`Select ${row.vgcpid}`}
                  checked={selectedRows.includes(row.id)}
                  onChange={() => handleSelectRow(row.id)}
                />
              </td>
              <td className="table__cell table__cell--vgcpid">{row.vgcpid}</td>
              <td className="table__cell">{row.tester}</td>
              <td className="table__cell">{row.testType}</td>
              <td className="table__cell">
                <span className={`badge badge--${row.statusType}`}>{row.status}</span>
              </td>
              <td className="table__cell">{row.step}</td>
              <td className="table__cell">{row.dateUpdated}</td>
              <td className="table__cell table__cell--due-date">{row.dueDate}</td>
              <td className="table__cell">{row.etaDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
