export const FONT_FAMILY_MAP = {
  Arial: 'Arial, Helvetica, sans-serif',
  Impact: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  Poppins: '"Poppins", "Segoe UI", sans-serif',
  Montserrat: '"Montserrat", "Segoe UI", sans-serif',
  Roboto: '"Roboto", "Segoe UI", sans-serif',
  Oswald: '"Oswald", "Arial Narrow", sans-serif',
  'Bebas Neue': '"Bebas Neue", Impact, sans-serif',
  'Brush Script MT': '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive',
  'FreeStyle Script': '"FreeStyle Script", "Segoe Script", "Lucida Handwriting", cursive',
  'Palace Script MT': '"Palace Script MT", "Brush Script MT", "Segoe Script", cursive',
};

export const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
  { label: 'Brush Script MT', value: 'Brush Script MT' },
  { label: 'FreeStyle Script', value: 'FreeStyle Script' },
  { label: 'Palace Script MT', value: 'Palace Script MT' },
];

export function resolveFontFamily(fontName) {
  return FONT_FAMILY_MAP[fontName] || fontName || FONT_FAMILY_MAP.Arial;
}

export function buildFontOptions(extraFonts = []) {
  const extraOptions = extraFonts
    .filter((fontName) => typeof fontName === 'string' && fontName.trim())
    .map((fontName) => ({ label: fontName.trim(), value: fontName.trim() }));

  const seen = new Set();

  return [...FONT_OPTIONS, ...extraOptions].filter((font) => {
    if (seen.has(font.value)) return false;
    seen.add(font.value);
    return true;
  });
}

export default function FontSelector({ value, onChange, label = 'Font', options = FONT_OPTIONS }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--customize-muted, #374151)' }}>
        {label}
      </span>
      <select
        value={value || 'Arial'}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid var(--customize-input-border, #d1d5db)',
          background: 'var(--customize-input-bg, #ffffff)',
          color: 'var(--customize-text, #111827)',
          fontFamily: resolveFontFamily(value),
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {options.map((font) => (
          <option key={font.value} value={font.value} style={{ fontFamily: resolveFontFamily(font.value) }}>
            {font.label}
          </option>
        ))}
      </select>
    </label>
  );
}
