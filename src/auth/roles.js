/** Matches backend `auth_utils.py`: is_manager uses "Managers", is_tester uses "Testers". */

export const ROLES = {
  MANAGER: 'MANAGER',
  TESTER: 'TESTER',
};

const MANAGER_TOKENS = new Set(['MANAGER', 'MANAGERS', 'ADMIN']);
const TESTER_TOKENS = new Set(['TESTER', 'TESTERS']);

function normalizeGroupToken(raw) {
  return String(raw ?? '')
    .trim()
    .toUpperCase();
}

/**
 * Parse `cognito:groups` claim from Cognito / API Gateway (string or array).
 * @param {unknown} raw
 * @returns {string[]}
 */
export function parseCognitoGroups(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((g) => String(g).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw
      .split(/[,\s]+/)
      .map((g) => g.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * @param {string[]} groups - raw group names from token
 * @returns {keyof typeof ROLES | null} null if no recognized Tester/Manager group
 */
export function resolveRoleFromGroups(groups) {
  const tokens = groups.map(normalizeGroupToken);
  const isManager = tokens.some((t) => MANAGER_TOKENS.has(t));
  if (isManager) return ROLES.MANAGER;
  const isTester = tokens.some((t) => TESTER_TOKENS.has(t));
  if (isTester) return ROLES.TESTER;
  return null;
}
