import React from 'react';
import { cx } from '../../utils/classNames';
import './DataTable.css';

function DataTable({ children, className = '', ...props }) {
  return (
    <table className={cx('data-table', className)} {...props}>
      {children}
    </table>
  );
}

function DataTableWrap({ children, className = '', ...props }) {
  return (
    <div className={cx('data-table-wrap', className)} {...props}>
      {children}
    </div>
  );
}

function DataTableHead({ children, className = '', ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

function DataTableBody({ children, className = '', ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

function DataTableRow({ children, className = '', ...props }) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

function DataTableHeaderCell({ children, className = '', ...props }) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}

function DataTableCell({ children, className = '', ...props }) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
}

DataTable.Wrap = DataTableWrap;
DataTable.Head = DataTableHead;
DataTable.Body = DataTableBody;
DataTable.Row = DataTableRow;
DataTable.HeaderCell = DataTableHeaderCell;
DataTable.Cell = DataTableCell;

export default DataTable;
