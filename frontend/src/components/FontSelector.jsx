import React, { useState, useRef, useEffect } from 'react';

const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Impact', value: 'Impact' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Oswald', value: 'Oswald' },
  { label: 'Bebas Neue', value: 'Bebas Neue' },
];

export default function FontSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFonts = FONT_OPTIONS.filter((f) =>
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid var(--customize-input-border, #d1d5db)',
          background: isOpen ? 'rgba(107,127,255,0.07)' : 'var(--customize-input-bg, #ffffff)',
          color: isOpen ? 'var(--accent, #6B7FFF)' : 'var(--customize-muted, #374151)',
          fontWeight: 600,
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <span>
          🔤 Text Font{' '}
          <span style={{ fontFamily: value || 'Arial', fontSize: '12px', opacity: 0.8, marginLeft: '4px' }}>
            ({value || 'Arial'})
          </span>
        </span>
        <span style={{ fontSize: '10px', opacity: 0.6 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'var(--customize-input-bg, #ffffff)',
            border: '1px solid var(--customize-divider, #e5e7eb)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 50,
            maxHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '8px' }}>
            <input
              type="text"
              placeholder="Search fonts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--customize-input-border, #d1d5db)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto', padding: '0 4px 4px' }}>
            {filteredFonts.length === 0 ? (
              <div style={{ padding: '8px', fontSize: '12px', color: 'var(--customize-hint, #9ca3af)', textAlign: 'center' }}>
                No fonts found
              </div>
            ) : (
              filteredFonts.map((font) => {
                const isActive = value === font.value;
                return (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => {
                      onChange(font.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: isActive ? 'rgba(107,127,255,0.1)' : 'transparent',
                      color: isActive ? 'var(--accent, #6B7FFF)' : 'var(--customize-text, #111827)',
                      border: 'none',
                      borderRadius: '4px',
                      fontFamily: font.value,
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '2px'
                    }}
                  >
                    <span>{font.label}</span>
                    {isActive && <span style={{ fontSize: '12px' }}>✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
