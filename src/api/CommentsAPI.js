import { authFetch, API_BASE } from './apiClient';

function toUiComment(row, usersById = {}) {
  const authorId = row?.author_user_id ?? null;
  const authorUser = authorId != null ? usersById[String(authorId)] : null;

  const author =
    authorUser?.full_name ||
    authorUser?.name ||
    authorUser?.display_name ||
    authorUser?.email ||
    `User ${authorId ?? ''}`.trim();

  return {
    id: row?.comment_id ?? row?.id,
    authorUserId: authorId,
    author,
    text: row?.comment_text ?? '',
    date: formatCommentDate(row?.posted_at),
    postedAt: row?.posted_at ?? null,
    requestId: row?.request_id ?? null,
    testId: row?.test_id ?? null,
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
  return Array.isArray(data) ? data : [];
}

export async function createRequestComment({ requestId, authorUserId, commentText }) {
  if (requestId == null) throw new Error('requestId is required');
  if (authorUserId == null) throw new Error('authorUserId is required');
  if (!String(commentText || '').trim()) throw new Error('commentText is required');

  const resp = await authFetch(`${API_BASE}/comments`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: requestId,
      author_user_id: authorUserId,
      comment_text: String(commentText).trim(),
    }),
  });

  if (!resp.ok) {
    let msg = `Failed to create comment (HTTP ${resp.status})`;
    try {
      const data = await resp.json();
      msg = data?.error || data?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return await resp.json();
}

export function mapCommentRowsToUi(rows, usersById = {}) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => toUiComment(row, usersById))
    .sort((a, b) => {
      const ta = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const tb = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return tb - ta;
    });
}
