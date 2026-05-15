import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import vanguardLogo from '../assets/images/vanguard.png';

function getInitialsFromUser(attrs) {
  const combinedName = [attrs?.['given_name'], attrs?.['family_name']]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
  const displayName = String(attrs?.['name'] || combinedName || '').trim();
  if (displayName) {
    const parts = displayName.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase();
  }

  const email = String(attrs?.email || '').trim();
  if (email) {
    return email
      .split('@')[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((token) => token[0]?.toUpperCase())
      .join('');
  }

  return 'U';
}

export default function Navbar() {
  const { signOut, authStatus } = useAuthenticator((ctx) => [ctx.authStatus]);
  const isAuthenticated = authStatus === 'authenticated';
  const [avatarInitials, setAvatarInitials] = useState('U');

  useEffect(() => {
    let cancelled = false;

    async function loadInitials() {
      if (!isAuthenticated) {
        setAvatarInitials('U');
        return;
      }

      try {
        const attrs = await fetchUserAttributes();
        if (!cancelled) setAvatarInitials(getInitialsFromUser(attrs));
      } catch {
        if (!cancelled) setAvatarInitials('U');
      }
    }

    void loadInitials();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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

            <NavLink
              to="/help"
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
            >
              Help
            </NavLink>
          </div>
        )}

        {isAuthenticated && (
          <>
            <span className="navbar__divider" aria-hidden="true" />

            <button
              type="button"
              className="navbar__avatar"
              title="Sign out"
              aria-label="Sign out"
              onClick={signOut}
            >
              {avatarInitials}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
