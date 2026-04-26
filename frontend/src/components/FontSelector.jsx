const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
];

export default function FontSelector({ value, onChange, label = 'Font' }) {
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
          fontFamily: value || 'Arial',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {FONT_OPTIONS.map((font) => (
          <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
            {font.label}
          </option>
        ))}
      </select>
    </label>
  );
}
