import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <ul style={{ display: 'flex', listStyle: 'none', gap: '20px' }}>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/catalog">Catalog</Link></li>
        <li><Link to="/controls">Controls</Link></li>
        <li><Link to="/kanban">Kanban</Link></li>
      </ul>
    </nav>
  );
};

export default NavBar;
