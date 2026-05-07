/**
 * ColorSwatchPalette – reusable quick-access color palette component.
 *
 * Props:
 *   colors        – array of { name: string, hex: string }
 *   selectedColor – currently active hex string
 *   onSelectColor – callback(hex) when a swatch is clicked
 *   disabled      – if true, swatches are non-interactive and greyed out
 *   disabledMessage – optional helper text shown when disabled
 *   label         – optional label rendered above the row
 */

const VIBGYOR_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Violet', hex: '#8F00FF' },
  { name: 'Indigo', hex: '#4B0082' },
  { name: 'Blue', hex: '#0057FF' },
  { name: 'Green', hex: '#00A651' },
  { name: 'Yellow', hex: '#FFD500' },
  { name: 'Orange', hex: '#FF7A00' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Grey', hex: '#808080' },
];

export { VIBGYOR_COLORS };

export default function ColorSwatchPalette({
  colors = VIBGYOR_COLORS,
  selectedColor = '',
  onSelectColor,
  disabled = false,
  disabledMessage = '',
  label = '',
}) {
  const normalizedSelected = selectedColor.toUpperCase();

  return (
    <div className={`color-swatch-palette${disabled ? ' is-disabled' : ''}`}>
      {label && (
        <span className="color-swatch-label">{label}</span>
      )}

      <div className="color-swatch-row" role="radiogroup" aria-label={label || 'Color palette'}>
        {colors.map((color) => {
          const isActive = normalizedSelected === color.hex.toUpperCase();
          const isWhite = color.hex.toUpperCase() === '#FFFFFF';

          return (
            <button
              key={color.hex}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`Select ${color.name}`}
              title={color.name}
              tabIndex={disabled ? -1 : 0}
              disabled={disabled}
              className={
                'color-swatch' +
                (isActive ? ' is-active' : '') +
                (isWhite ? ' is-white' : '')
              }
              style={{ '--swatch-color': color.hex }}
              onClick={() => {
                if (!disabled && onSelectColor) {
                  onSelectColor(color.hex);
                }
              }}
            />
          );
        })}
      </div>

      {disabled && disabledMessage && (
        <span className="color-swatch-helper">{disabledMessage}</span>
      )}
    </div>
  );
}
