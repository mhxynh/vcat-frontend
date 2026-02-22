import React from 'react';
import { controlsData } from '../../context/TestData';
import '../../styles/pages/Tests.css';

export default function Tests() {
  return (
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
            <th className="table__header-cell">Last Updated</th>
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
}
