import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { can as canPermission, messageForAction } from './permissions';
import { parseCognitoGroups, resolveRoleFromGroups, ROLES } from './roles';

const RoleContext = createContext(null);

function readRoleFromSession(session) {
  const payload = session?.tokens?.idToken?.payload;
  if (!payload) return { role: null, groups: [] };
  const groups = parseCognitoGroups(payload['cognito:groups']);
  return { role: resolveRoleFromGroups(groups), groups };
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshRole = useCallback(async () => {
    setLoading(true);
    try {
      const session = await fetchAuthSession({ forceRefresh: false });
      const next = readRoleFromSession(session);
      setRole(next.role);
      setGroups(next.groups);
    } catch {
      setRole(null);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRole();
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      const evt = payload?.event;
      if (evt === 'signedIn' || evt === 'signedOut' || evt === 'tokenRefresh') {
        refreshRole();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [refreshRole]);

  const value = useMemo(() => {
    const isManager = role === ROLES.MANAGER;
    const isTester = role === ROLES.TESTER;
    return {
      role,
      groups,
      loading,
      isManager,
      isTester,
      refreshRole,
      /** @param {string} action */
      can(action) {
        return canPermission(role, action);
      },
      /** @param {string} action */
      restrictionMessage(action) {
        return messageForAction(action);
      },
    };
  }, [role, groups, loading, refreshRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return ctx;
}

/** @param {string} action */
export function useCan(action) {
  return useRole().can(action);
}
