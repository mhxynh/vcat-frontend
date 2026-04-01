/**
 * Display label for a user row from /users (same rules as Dashboard team capacity).
 * @param {Object|null|undefined} user
 * @returns {string}
 */
export function userCapacityDisplayName(user) {
  if (!user) return 'Unknown';
  return user.display_name || user.displayName || user.email || 'Unknown';
}

/**
 * Avatar initials from a display string (same rules as Dashboard capacity avatars).
 * @param {string} name
 * @returns {string}
 */
export function toInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase())
    .join('');
}
