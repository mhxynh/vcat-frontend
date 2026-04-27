export async function runRefreshStep(step, ...args) {
  if (typeof step !== 'function') return null;
  return await step(...args);
}

export async function runRefreshSteps(steps = [], ...args) {
  const results = [];

  for (const step of steps) {
    results.push(await runRefreshStep(step, ...args));
  }

  return results;
}

export async function refreshAfterChange({
  localRefresh,
  parentRefresh,
  afterRefresh,
  close,
  payload,
  closeAfter = false,
}) {
  const localResult = await runRefreshStep(localRefresh, payload);
  const refreshPayload = localResult ?? payload;

  await runRefreshStep(parentRefresh, refreshPayload);
  await runRefreshStep(afterRefresh, refreshPayload);

  if (closeAfter) {
    await runRefreshStep(close);
  }

  return refreshPayload;
}

export function createRefreshHandlers({ localRefresh, parentRefresh, afterRefresh, close }) {
  return {
    refreshInline(payload) {
      return refreshAfterChange({
        localRefresh,
        parentRefresh,
        afterRefresh,
        close,
        payload,
        closeAfter: false,
      });
    },

    refreshAndClose(payload) {
      return refreshAfterChange({
        localRefresh,
        parentRefresh,
        afterRefresh,
        close,
        payload,
        closeAfter: true,
      });
    },
  };
}
