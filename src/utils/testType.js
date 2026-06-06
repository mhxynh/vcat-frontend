export function flagsFromTestType(value) {
  if (value === 'DAT Only') return { requiresDat: true, requiresOet: false };
  if (value === 'OET Only') return { requiresDat: false, requiresOet: true };
  if (value === 'DAT & OET') return { requiresDat: true, requiresOet: true };
  return { requiresDat: false, requiresOet: false };
}

export function testTypeFromFlags(test, { short = false } = {}) {
  const requiresDat = !!(test?.requiresDat ?? test?.requires_dat);
  const requiresOet = !!(test?.requiresOet ?? test?.requires_oet);

  if (requiresDat && requiresOet) return 'DAT & OET';
  if (requiresDat) return short ? 'DAT' : 'DAT Only';
  if (requiresOet) return short ? 'OET' : 'OET Only';
  return '-';
}
