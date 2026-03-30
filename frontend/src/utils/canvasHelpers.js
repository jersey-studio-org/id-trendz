// Utility: Canvas helper functions for jersey customization
// POLISH UPDATE - Added canvas utilities for text rendering and color calculations

/**
 * Calculate luminance of a color (0-1, where 1 is white)
 */
export function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  // Relative luminance formula from WCAG
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Get contrasting text color (black or white) based on background luminance
 */
export function getContrastColor(bgHex) {
  const luminance = getLuminance(bgHex);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Convert hex color to RGB object
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate font scale based on canvas size
 */
export function calculateFontScale(canvasWidth, baseWidth = 400) {
  return Math.max(0.5, Math.min(2, canvasWidth / baseWidth));
}

