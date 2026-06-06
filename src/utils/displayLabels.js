export function formatStatusLabel(value, fallback = 'Not Started') {
  const label = String(value || fallback)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase())
    .replace(/\b(Dat|Oet|Oat)\b/g, (match) => match.toUpperCase());

  return label || '-';
}

export function statusToBadgeTone(value) {
  return String(value || 'NOT_STARTED')
    .toLowerCase()
    .replaceAll('_', '-')
    .replace(/\s+/g, '-');
}

export function formatPriorityLabel(value) {
  const normalized = String(value || 'MEDIUM').toUpperCase();
  if (normalized === 'CRITICAL') return 'Critical Priority';
  if (normalized === 'HIGH') return 'High Priority';
  if (normalized === 'MEDIUM') return 'Medium Priority';
  if (normalized === 'LOW') return 'Low Priority';
  return 'Medium Priority';
}

export function priorityToBadgeTone(value) {
  return String(value || 'MEDIUM').toLowerCase();
}
