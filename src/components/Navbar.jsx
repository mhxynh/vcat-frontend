import { NavLink } from 'react-router-dom';
import vanguardLogo from '../assets/images/vanguard.png';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__left">
        <img className="navbar__logo" src={vanguardLogo} alt="Vanguard" />

        <span className="navbar__divider" aria-hidden="true" />

        <div className="navbar__brand">Control Testing</div>
      </div>

      <div className="navbar__right">
        <div className="navbar__links">
          <NavLink
            to="/"
            className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/controls"
            className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
          >
            Catalog
          </NavLink>

          <NavLink
            to="/requests"
            className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
          >
            Request
          </NavLink>

          <NavLink
            to="/kanban"
            className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
          >
            Kanban
          </NavLink>
        </div>

        <span className="navbar__divider" aria-hidden="true" />
      </div>
    </nav>
  );
}
