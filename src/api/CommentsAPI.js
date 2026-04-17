import { authFetch, API_BASE } from './apiClient';
import { objectToCamelCase, objectToSnakeCase } from '../utils/transformer';

function toUiComment(row, usersById = {}) {
  const authorId = row?.authorUserId ?? null;
  const authorUser = authorId != null ? usersById[String(authorId)] : null;

  const author = authorUser?.display_name || authorUser?.email || `User ${authorId ?? ''}`.trim();

  return {
    id: row?.commentId ?? row?.id,
    authorUserId: authorId,
    author,
    text: row?.commentText ?? '',
    date: formatCommentDate(row?.postedAt),
    postedAt: row?.postedAt ?? null,
    requestId: row?.requestId ?? null,
    testId: row?.testId ?? null,
  };
}

function formatCommentDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

export async function fetchCommentsByRequestId(requestId) {
  if (requestId == null) return [];

  const url = new URL(`${API_BASE}/comments`);
  url.searchParams.set('request_id', String(requestId));

  const resp = await authFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch comments (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  const camelData = objectToCamelCase(data);
  return Array.isArray(camelData) ? camelData : [];
}

export async function fetchCommentsByTestId(testId) {
  if (testId == null) return [];

  const url = new URL(`${API_BASE}/comments`);
  url.searchParams.set('test_id', String(testId));

  const resp = await authFetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!resp.ok) {
    let msg = `Failed to fetch comments (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  const camelData = objectToCamelCase(data);
  return Array.isArray(camelData) ? camelData : [];
}

export async function createRequestComment({ requestId, commentText }) {
  if (requestId == null) throw new Error('requestId is required');
  if (!String(commentText || '').trim()) throw new Error('commentText is required');

  const resp = await authFetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(
      objectToSnakeCase({
        requestId,
        commentText: String(commentText).trim(),
      })
    ),
  });

  if (!resp.ok) {
    let msg = `Failed to create comment (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return objectToCamelCase(data);
}

export async function createTestComment({ testId, commentText }) {
  if (testId == null) throw new Error('testId is required');
  if (!String(commentText || '').trim()) throw new Error('commentText is required');

  const resp = await authFetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(
      objectToSnakeCase({
        testId,
        commentText: String(commentText).trim(),
      })
    ),
  });

  if (!resp.ok) {
    let msg = `Failed to create comment (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  return objectToCamelCase(data);
}

export function mapCommentRowsToUi(rows, usersById = {}) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => toUiComment(row, usersById))
    .sort((a, b) => {
      const rawA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const rawB = b.postedAt ? new Date(b.postedAt).getTime() : 0;

      const ta = Number.isNaN(rawA) ? 0 : rawA;
      const tb = Number.isNaN(rawB) ? 0 : rawB;

      return tb - ta;
    });
}
