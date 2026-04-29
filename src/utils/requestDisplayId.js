import { parseLocalDate } from './date';

function parseYear(value) {
  if (!value) return null;
  const date = parseLocalDate(value);
  return date ? date.getFullYear() : null;
}

export function getRequestYearFromValue(value, { fallbackYear = new Date().getFullYear() } = {}) {
  return parseYear(value) ?? fallbackYear;
}

function getYearSourceFromRequest(req) {
  return (
    req?.createdAt ??
    req?.created_at ??
    req?.startDate ??
    req?.start_date ??
    req?.requestDateRaw ??
    req?.dateRaw ??
    req?.requestDate ??
    null
  );
}

function getRequestIdFromRequest(req) {
  return req?.requestId ?? req?.request_id ?? req?.id ?? null;
}

/**
 * Format a request display ID consistently across the app.
 *
 * Supported call shapes:
 * - formatRequestDisplayId(requestObj, { fallback: '' })
 * - formatRequestDisplayId(requestId, yearSource, { fallback: '' })
 */
export function formatRequestDisplayId(input, yearSource, options) {
  const isOptionsBag =
    yearSource != null &&
    typeof yearSource === 'object' &&
    !Array.isArray(yearSource) &&
    !(yearSource instanceof Date);
  const hasExplicitYearSource = arguments.length >= 2 && !isOptionsBag;
  const opts = (hasExplicitYearSource ? options : yearSource) || {};

  const { fallback = '', prefix = 'REQ', padLength = 4, includeYear = true } = opts;

  const isRequestObject =
    input != null && typeof input === 'object' && !Array.isArray(input) && !(input instanceof Date);

  const id = isRequestObject ? getRequestIdFromRequest(input) : input;
  if (id == null || id === '') return fallback;

  const yrSource = isRequestObject
    ? getYearSourceFromRequest(input)
    : hasExplicitYearSource
      ? yearSource
      : null;

  const padded = String(id).padStart(padLength, '0');
  if (!includeYear) return `${prefix}-${padded}`;

  const year = getRequestYearFromValue(yrSource);
  return `${prefix}-${year}-${padded}`;
}
