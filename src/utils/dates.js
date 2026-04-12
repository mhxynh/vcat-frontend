export function parseLocalDate(value) {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function toLocalDayStart(date) {
  if (!date) return null;
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) return null;
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function isOverdue(value) {
  const due = toLocalDayStart(parseLocalDate(value));
  if (!due) return false;

  const today = toLocalDayStart(new Date());
  return due < today;
}
