export function normalizeCollarStyle(isCollared) {
  return isCollared ? 'collared' : 'round-neck';
}

export function normalizeSleeveStyle(isFullSleeve) {
  return isFullSleeve ? 'full' : 'half';
}

export function getTrimColor(colorHex) {
  if (!/^#?[0-9a-f]{6}$/i.test(colorHex || '')) {
    return '#d1d5db';
  }

  const normalized = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
  const red = parseInt(normalized.slice(1, 3), 16);
  const green = parseInt(normalized.slice(3, 5), 16);
  const blue = parseInt(normalized.slice(5, 7), 16);
  const average = (red + green + blue) / 3;

  return average > 170 ? '#6b7280' : '#e5e7eb';
}
