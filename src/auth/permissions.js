import { ROLES } from './roles';

/** Fine-grained keys for `can()` / RestrictedAction */
export const ACTIONS = {
  CREATE_CONTROL: 'CREATE_CONTROL',
  RETIRE_CONTROL: 'RETIRE_CONTROL',
  DELETE_CONTROL_HARD: 'DELETE_CONTROL_HARD',
  UPDATE_CONTROL: 'UPDATE_CONTROL',
  IMPORT_CONTROLS: 'IMPORT_CONTROLS',
  VIEW_CONTROLS: 'VIEW_CONTROLS',
  CREATE_REQUEST: 'CREATE_REQUEST',
  UPDATE_REQUEST: 'UPDATE_REQUEST',
  ARCHIVE_REQUEST: 'ARCHIVE_REQUEST',
  REMOVE_REQUEST: 'REMOVE_REQUEST',
  COMMENT: 'COMMENT',
  CREATE_TEST: 'CREATE_TEST',
  DELETE_CONTROL_TEST: 'DELETE_CONTROL_TEST',
  ARCHIVE_CONTROL_TEST: 'ARCHIVE_CONTROL_TEST',
  VIEW_TESTS: 'VIEW_TESTS',
  UPDATE_TEST: 'UPDATE_TEST',
  ASSIGN_TESTER: 'ASSIGN_TESTER',
  /** Re-linking a test to a different control (VGCPID) */
  CHANGE_TEST_CONTROL_VGCPID: 'CHANGE_TEST_CONTROL_VGCPID',
  BULK_ASSIGN_TESTERS: 'BULK_ASSIGN_TESTERS',
  ASSIGN_TESTER_TO_REQUEST: 'ASSIGN_TESTER_TO_REQUEST',
  VIEW_SUMMARY: 'VIEW_SUMMARY',
  EXPORT_SUMMARY: 'EXPORT_SUMMARY',
  VIEW_VERSION_HISTORY: 'VIEW_VERSION_HISTORY',
  VERSION_RESTORE: 'VERSION_RESTORE',
};

/** Manager-only actions per SDD permissions matrix */
const MANAGER_ONLY = new Set([
  ACTIONS.CREATE_CONTROL,
  ACTIONS.RETIRE_CONTROL,
  ACTIONS.DELETE_CONTROL_HARD,
  ACTIONS.IMPORT_CONTROLS,
  ACTIONS.CREATE_REQUEST,
  ACTIONS.UPDATE_REQUEST,
  ACTIONS.ARCHIVE_REQUEST,
  ACTIONS.REMOVE_REQUEST,
  ACTIONS.CREATE_TEST,
  ACTIONS.DELETE_CONTROL_TEST,
  ACTIONS.ARCHIVE_CONTROL_TEST,
  ACTIONS.ASSIGN_TESTER,
  ACTIONS.CHANGE_TEST_CONTROL_VGCPID,
  ACTIONS.BULK_ASSIGN_TESTERS,
  ACTIONS.ASSIGN_TESTER_TO_REQUEST,
  ACTIONS.VERSION_RESTORE,
]);

export const ACTION_MESSAGES = {
  [ACTIONS.CREATE_CONTROL]: 'Only managers can create controls. Contact a manager for access.',
  [ACTIONS.RETIRE_CONTROL]: 'Only managers can retire controls. Contact a manager for assistance.',
  [ACTIONS.DELETE_CONTROL_HARD]:
    'Only managers can remove controls. Contact a manager for assistance.',
  [ACTIONS.IMPORT_CONTROLS]: 'Only managers can import controls. Contact a manager for access.',
  [ACTIONS.CREATE_REQUEST]: 'Only managers can create requests.',
  [ACTIONS.UPDATE_REQUEST]: 'Only managers can update requests.',
  [ACTIONS.ARCHIVE_REQUEST]:
    'Only managers can archive requests. Contact a manager for assistance.',
  [ACTIONS.REMOVE_REQUEST]: 'Only managers can remove requests.',
  [ACTIONS.CREATE_TEST]:
    'Only managers can create new control tests. Contact a manager for access.',
  [ACTIONS.DELETE_CONTROL_TEST]:
    'Only managers can delete control tests. Contact a manager for assistance.',
  [ACTIONS.ARCHIVE_CONTROL_TEST]:
    'Only managers can archive control tests. Contact a manager for assistance.',
  [ACTIONS.ASSIGN_TESTER]: 'Only managers can assign testers.',
  [ACTIONS.CHANGE_TEST_CONTROL_VGCPID]:
    'Only managers can change which control (VGCPID) a test is linked to. Contact a manager for assistance.',
  [ACTIONS.BULK_ASSIGN_TESTERS]: 'Only managers can assign testers.',
  [ACTIONS.ASSIGN_TESTER_TO_REQUEST]: 'Only managers can assign testers to requests.',
  [ACTIONS.VERSION_RESTORE]: 'Only managers can restore previous versions.',
};

/**
 * @param {string | null} role - ROLES.MANAGER | ROLES.TESTER | null (null = least privilege)
 * @param {string} action - ACTIONS.*
 * @returns {boolean}
 */
export function can(role, action) {
  if (role === ROLES.MANAGER) return true;
  if (MANAGER_ONLY.has(action)) return false;
  return true;
}

/**
 * @param {string} action
 * @returns {string}
 */
export function messageForAction(action) {
  return (
    ACTION_MESSAGES[action] || 'You do not have permission for this action. Contact a manager.'
  );
}
