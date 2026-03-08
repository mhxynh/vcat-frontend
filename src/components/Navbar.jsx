import { NavLink } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import vanguardLogo from '../assets/images/vanguard.png';

export default function Navbar() {
  const { signOut, authStatus } = useAuthenticator((ctx) => [ctx.authStatus]);
  const isAuthenticated = authStatus === 'authenticated';

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <img className="navbar__logo" src={vanguardLogo} alt="Vanguard" />

        <span className="navbar__divider" aria-hidden="true" />

        <div className="navbar__brand">Control Testing</div>
      </div>

      <div className="navbar__right">
        {isAuthenticated && (
          <div className="navbar__links">
            <NavLink
              to="/"
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/catalog"
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
            >
              Catalog
            </NavLink>

            <NavLink
              to="/tracker"
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
            >
              Tracker
            </NavLink>
          </div>
        )}

        {isAuthenticated && (
          <>
            <span className="navbar__divider" aria-hidden="true" />

            <button type="button" className="navbar__avatar" title="Sign out" onClick={signOut}>
              MH
            </button>

            <button
              type="button"
              className="navbar__bell"
              aria-label="Notifications"
              title="Notifications"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
