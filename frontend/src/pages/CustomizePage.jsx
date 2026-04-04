import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import useCart from '../hooks/useCart';
import JerseyTemplateCanvas from '../components/JerseyTemplateCanvas';
import LoaderStitch from '../components/LoaderStitch';

const LAYOUTS = {
  style1: {
    name:   { top: '20%', left: '50%', transform: 'translate(-50%, -50%)' },
    number: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  },
  style2: {
    name:   { top: '10%', left: '50%', transform: 'translate(-50%, 0)' },
    number: { top: '60%', left: '50%', transform: 'translate(-50%, 0)' },
  },
  style3: {
    name:   { top: '30%', left: '50%', transform: 'translate(-50%, 0)' },
    number: { top: '70%', left: '50%', transform: 'translate(-50%, 0)' },
  },
  style4: {
    name:   { top: '15%', left: '50%', transform: 'translate(-50%, 0)' },
    number: { top: '45%', left: '50%', transform: 'translate(-50%, 0)' },
  },
};

export default function CustomizePage() {
  const { id } = useParams();
  const api = useApi();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedColor, setSelectedColor] = useState('#6B7FFF');
  const [nameText, setNameText] = useState('');
  const [numberText, setNumberText] = useState('');
  const [selectedFont, setSelectedFont] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [logoSide, setLogoSide] = useState('front'); // 'front' | 'back' | 'both'
  const [logoPosition, setLogoPosition] = useState('center'); // 'center' | 'left-chest' | 'upper'
  const [logoScale, setLogoScale] = useState(1);
  const [layoutStyle, setLayoutStyle] = useState('style1');
  const [viewSide, setViewSide] = useState('front');

  // Color picker UI-only states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hexInput, setHexInput] = useState('');
  const [rgbInput, setRgbInput] = useState({ r: '', g: '', b: '' });
  const [hexError, setHexError] = useState(false);
  const [rgbError, setRgbError] = useState(false);
  const templateCanvasRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await api.get(`/products/${id}`);
        if (!isMounted) return;
        setProduct(data);
        setSelectedColor(data?.colors?.[0] || '#6B7FFF');
        setSelectedFont(data?.fonts?.[0] || '');
        setSelectedSize(data?.sizes?.[0] || '');
        setSelectedVariant(data?.variants?.[0]?.id || data?.variants?.[0] || '');
      } catch (e) {
        if (isMounted) setError(e?.message || 'Failed to load product');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Please upload an image file for the logo.');
      return;
    }

    // Revoke previous object URL to avoid memory leaks
    if (logoImageUrl && logoImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(logoImageUrl);
    }

    setLogoFile(file);
    setLogoImageUrl(URL.createObjectURL(file));
  }

  async function handleAddToCart() {
    if (!product) return;
    const priceFromVariant = (() => {
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        const match = product.variants.find((v) => (typeof v === 'string' ? v : v.id) === selectedVariant);
        if (match && typeof match !== 'string') return match.price;
      }
      return product.price;
    })();

    // Export the canvas image
    let previewImageURL = product?.images?.[0] || product?.image || '';
    if (templateCanvasRef.current) {
      const exportedImage = templateCanvasRef.current.exportImage();
      if (exportedImage) previewImageURL = exportedImage;
    }

    addToCart({
      productId: product.id,
      title: product.title || product.name,
      thumbnail: previewImageURL,
      previewImageURL: previewImageURL,
      options: {
        color: selectedColor,
        name: nameText,
        number: numberText,
        font: selectedFont,
        fontSize: fontSize,
        textColor: textColor,
        size: selectedSize,
        variant: selectedVariant,
        logoImageUrl: logoImageUrl,
        logoSide: logoSide,
        logoPosition: logoPosition,
        logoScale: logoScale,
      },
      quantity: 1,
      price: priceFromVariant ?? 0,
    });
  }

  if (loading) {
    return (
      <div className="container">
        <LoaderStitch message="We're stitching your jersey… 🪡✨" />
      </div>
    );
  }
  if (error) return <div className="container error">{error}</div>;
  if (!product) return <div className="container">Product not found</div>;

  return (
    <div className="container customize-layout">
      <section className="preview-pane">
        <JerseyTemplateCanvas
          ref={templateCanvasRef}
          colorHex={selectedColor}
          nameText={nameText}
          numberText={numberText}
          fontFamily={selectedFont || 'Arial'}
          fontSize={fontSize}
          textColor={textColor}
          logoImageUrl={
            // Only supply the logo URL when the current view matches the logo's placement side
            logoImageUrl && (
              logoSide === 'both' ||
              (logoSide === 'front' && viewSide === 'front') ||
              (logoSide === 'back'  && viewSide === 'back')
            ) ? logoImageUrl : ''
          }
          logoSide={logoSide}
          logoPosition={logoPosition}
          logoScale={logoScale}
          nameLayout={LAYOUTS[layoutStyle].name}
          numberLayout={LAYOUTS[layoutStyle].number}
          viewSide={viewSide}
        />
      </section>

      <aside className="controls-pane">
        <h2>{product.title || product.name}</h2>

        {/* View Toggle */}
        <div className="control-group" style={{ padding: 0, border: 'none', background: 'none' }}>
          <div
            style={{
              background: 'var(--surface-raised, #f9fafb)',
              border: '1px solid var(--border-light, #e5e7eb)',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #111827)', letterSpacing: '0.01em', flexShrink: 0 }}>
              View
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['front', '⬛ Front'], ['back', '🔄 Back']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setViewSide(val)}
                  style={{
                    height: 32,
                    padding: '0 18px',
                    borderRadius: '20px',
                    border: viewSide === val ? '1.5px solid var(--accent, #6B7FFF)' : '1.5px solid #d1d5db',
                    background: viewSide === val ? 'rgba(107,127,255,0.10)' : '#ffffff',
                    color: viewSide === val ? 'var(--accent, #6B7FFF)' : '#374151',
                    fontSize: '12px',
                    fontWeight: viewSide === val ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {viewSide === 'back' && (
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: 'auto' }}>
                Name &amp; number shown
              </span>
            )}
          </div>
        </div>

        {/* Colors */}
        <div className="control-group" style={{ padding: 0, border: 'none', background: 'none' }}>
          <div
            style={{
              background: 'var(--surface-raised, #f9fafb)',
              border: '1px solid var(--border-light, #e5e7eb)',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Section label */}
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary, #111827)',
                letterSpacing: '0.01em',
              }}
            >
              Jersey Color
            </span>

            {/* Swatch row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Black swatch */}
              <button
                onClick={() => { setSelectedColor('#000000'); setShowColorPicker(false); }}
                aria-label="Select Black"
                title="Black"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#000000',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  flexShrink: 0,
                  outline: selectedColor === '#000000'
                    ? '2px solid var(--accent, #6B7FFF)'
                    : '2px solid transparent',
                  outlineOffset: '2px',
                  boxShadow: selectedColor === '#000000'
                    ? '0 0 0 4px rgba(107,127,255,0.18)'
                    : '0 1px 3px rgba(0,0,0,0.25)',
                  transform: selectedColor === '#000000' ? 'scale(1.1)' : 'scale(1)',
                  transition: 'outline 0.15s, box-shadow 0.15s, transform 0.15s',
                }}
              />
              {/* White swatch */}
              <button
                onClick={() => { setSelectedColor('#FFFFFF'); setShowColorPicker(false); }}
                aria-label="Select White"
                title="White"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  border: '1px solid #d1d5db',
                  padding: 0,
                  cursor: 'pointer',
                  flexShrink: 0,
                  outline: selectedColor === '#FFFFFF'
                    ? '2px solid var(--accent, #6B7FFF)'
                    : '2px solid transparent',
                  outlineOffset: '2px',
                  boxShadow: selectedColor === '#FFFFFF'
                    ? '0 0 0 4px rgba(107,127,255,0.18)'
                    : '0 1px 3px rgba(0,0,0,0.1)',
                  transform: selectedColor === '#FFFFFF' ? 'scale(1.1)' : 'scale(1)',
                  transition: 'outline 0.15s, box-shadow 0.15s, transform 0.15s',
                }}
              />

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: 'var(--border-light, #e5e7eb)', flexShrink: 0 }} />

              {/* All Colors button */}
              <button
                onClick={() => setShowColorPicker((prev) => !prev)}
                aria-label="Open color picker"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: 34,
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: showColorPicker
                    ? '1.5px solid var(--accent, #6B7FFF)'
                    : '1.5px solid var(--border-light, #d1d5db)',
                  background: showColorPicker ? 'rgba(107,127,255,0.07)' : '#ffffff',
                  color: showColorPicker ? 'var(--accent, #6B7FFF)' : 'var(--text-muted, #374151)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                  transition: 'border 0.15s, color 0.15s, background 0.15s',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                All Colors
                <span style={{ fontSize: '10px', opacity: 0.6 }}>{showColorPicker ? '▲' : '▼'}</span>
              </button>

              {/* Current color preview (when custom color picked) */}
              {selectedColor !== '#000000' && selectedColor !== '#FFFFFF' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: 'auto',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: 'var(--border-light, #f3f4f6)',
                    border: '1px solid var(--border-light, #e5e7eb)',
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: selectedColor,
                      border: '1px solid rgba(0,0,0,0.1)',
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted, #374151)', letterSpacing: '0.04em' }}>
                    {selectedColor.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* ── Expanded picker panel ── */}
            {showColorPicker && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light, #e5e7eb)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Native color wheel row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    style={{
                      width: 40,
                      height: 40,
                      cursor: 'pointer',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '2px',
                      background: '#f9fafb',
                      flexShrink: 0,
                    }}
                    aria-label="Color picker"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>Choose any color</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Or enter a code below</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#f3f4f6' }} />

                {/* HEX row */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Hex Code
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={hexInput}
                      maxLength={7}
                      placeholder="#RRGGBB"
                      onChange={(e) => { setHexInput(e.target.value); setHexError(false); }}
                      style={{
                        flex: 1,
                        height: '40px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        border: hexError ? '1.5px solid #ef4444' : '1.5px solid #d1d5db',
                        background: hexError ? '#fef2f2' : '#ffffff',
                        color: '#111827',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border 0.15s',
                      }}
                      aria-label="HEX color input"
                    />
                    <button
                      onClick={() => {
                        if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) {
                          setSelectedColor(hexInput);
                          setHexError(false);
                        } else {
                          setHexError(true);
                        }
                      }}
                      style={{
                        height: '40px',
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--accent, #6B7FFF)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                  {hexError && (
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ef4444' }}>
                      Enter a valid hex, e.g. <strong>#FF5733</strong>
                    </p>
                  )}
                </div>

                {/* RGB row */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    RGB Values
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {['r', 'g', 'b'].map((ch) => (
                      <div key={ch} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', textAlign: 'center' }}>{ch}</span>
                        <input
                          type="number"
                          min={0}
                          max={255}
                          value={rgbInput[ch]}
                          onChange={(e) => { setRgbInput((prev) => ({ ...prev, [ch]: e.target.value })); setRgbError(false); }}
                          style={{
                            width: '100%',
                            height: '40px',
                            padding: '0 8px',
                            borderRadius: '8px',
                            border: rgbError ? '1.5px solid #ef4444' : '1.5px solid #d1d5db',
                            background: rgbError ? '#fef2f2' : '#ffffff',
                            color: '#111827',
                            fontSize: '13px',
                            textAlign: 'center',
                            boxSizing: 'border-box',
                            outline: 'none',
                            transition: 'border 0.15s',
                          }}
                          aria-label={`${ch.toUpperCase()} value`}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const r = Number(rgbInput.r);
                        const g = Number(rgbInput.g);
                        const b = Number(rgbInput.b);
                        const valid = [r, g, b].every((v) => Number.isInteger(v) && v >= 0 && v <= 255);
                        if (valid && rgbInput.r !== '' && rgbInput.g !== '' && rgbInput.b !== '') {
                          const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
                          setSelectedColor(hex);
                          setRgbError(false);
                        } else {
                          setRgbError(true);
                        }
                      }}
                      style={{
                        height: '40px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'var(--accent, #6B7FFF)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        alignSelf: 'flex-end',
                        flexShrink: 0,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                  {rgbError && (
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ef4444' }}>
                      Each value must be between <strong>0</strong> and <strong>255</strong>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="control-group">
          <div className="control-label">Name</div>
          <input
            value={nameText}
            onChange={(e) => setNameText(e.target.value)}
            placeholder="Enter name (e.g., John)"
            maxLength={20}
          />
        </div>

        {/* Number */}
        <div className="control-group">
          <div className="control-label">Jersey Number</div>
          <input
            type="text"
            value={numberText}
            onChange={(e) => setNumberText(e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="Enter number (e.g., 55)"
            maxLength={3}
          />
        </div>

        {/* Layout Style Card */}
        <div className="control-group" style={{ padding: 0, border: 'none', background: 'none' }}>
          <div
            style={{
              background: 'var(--surface-raised, #f9fafb)',
              border: '1px solid var(--border-light, #e5e7eb)',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #111827)', letterSpacing: '0.01em' }}>
              Layout Style
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[['style1', 'Style 1'], ['style2', 'Style 2'], ['style3', 'Style 3'], ['style4', 'Style 4']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setLayoutStyle(val)}
                  style={{
                    height: 32,
                    padding: '0 16px',
                    borderRadius: '20px',
                    border: layoutStyle === val ? '1.5px solid var(--accent, #6B7FFF)' : '1.5px solid #d1d5db',
                    background: layoutStyle === val ? 'rgba(107,127,255,0.10)' : '#ffffff',
                    color: layoutStyle === val ? 'var(--accent, #6B7FFF)' : '#374151',
                    fontSize: '12px',
                    fontWeight: layoutStyle === val ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', lineHeight: 1.5 }}>
              Presets control where name &amp; number appear on the jersey.
            </p>
          </div>
        </div>

        {/* Logo Upload Card */}
        <div className="control-group" style={{ padding: 0, border: 'none', background: 'none' }}>
          <div
            style={{
              background: 'var(--surface-raised, #f9fafb)',
              border: '1px solid var(--border-light, #e5e7eb)',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Section label */}
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #111827)', letterSpacing: '0.01em' }}>
              Upload Logo
            </span>

            {/* Upload row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Custom file button */}
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  height: 36,
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-light, #d1d5db)',
                  background: '#ffffff',
                  color: 'var(--text-muted, #374151)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                  transition: 'border 0.15s',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '15px' }}>📁</span>
                {logoFile ? 'Replace' : 'Choose File'}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Thumbnail preview */}
              {logoImageUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <img
                    src={logoImageUrl}
                    alt="Logo preview"
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: 'contain',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light, #e5e7eb)',
                      background: '#fff',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted, #6b7280)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                    title={logoFile?.name}
                  >
                    {logoFile?.name || 'logo'}
                  </span>
                  <button
                    onClick={() => { setLogoFile(null); if (logoImageUrl.startsWith('blob:')) URL.revokeObjectURL(logoImageUrl); setLogoImageUrl(''); }}
                    title="Remove logo"
                    aria-label="Remove logo"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      color: '#9ca3af',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>PNG, JPG, or SVG</span>
              )}
            </div>

            {/* Show position/side/scale only when logo is uploaded */}
            {logoImageUrl && (
              <>
                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border-light, #e5e7eb)' }} />

                {/* Logo Side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Placement Side</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[['front', 'Front'], ['back', 'Back'], ['both', 'Both']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setLogoSide(val)}
                        style={{
                          height: 32,
                          padding: '0 14px',
                          borderRadius: '20px',
                          border: logoSide === val ? '1.5px solid var(--accent, #6B7FFF)' : '1.5px solid #d1d5db',
                          background: logoSide === val ? 'rgba(107,127,255,0.10)' : '#ffffff',
                          color: logoSide === val ? 'var(--accent, #6B7FFF)' : '#374151',
                          fontSize: '12px',
                          fontWeight: logoSide === val ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Position */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Logo Position</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[['center', 'Center'], ['left-chest', 'Left Chest'], ['upper', 'Upper']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setLogoPosition(val)}
                        style={{
                          height: 32,
                          padding: '0 14px',
                          borderRadius: '20px',
                          border: logoPosition === val ? '1.5px solid var(--accent, #6B7FFF)' : '1.5px solid #d1d5db',
                          background: logoPosition === val ? 'rgba(107,127,255,0.10)' : '#ffffff',
                          color: logoPosition === val ? 'var(--accent, #6B7FFF)' : '#374151',
                          fontSize: '12px',
                          fontWeight: logoPosition === val ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Size */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Logo Size</span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: 'var(--accent, #6B7FFF)',
                        background: 'rgba(107,127,255,0.08)',
                        padding: '2px 8px',
                        borderRadius: '8px',
                      }}
                    >
                      {logoScale.toFixed(1)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={logoScale}
                    onChange={(e) => setLogoScale(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent, #6B7FFF)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                    <span>0.5×</span><span>2×</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Font Size */}
        <div className="control-group">
          <div className="control-label">Font Size</div>
          <input
            type="range"
            min="16"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{fontSize}px</span>
        </div>

        {/* Text Color */}
        <div className="control-group">
          <div className="control-label">Text Color</div>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            style={{ width: '100%', height: '40px', cursor: 'pointer' }}
          />
        </div>

        {/* Font */}
        {Array.isArray(product.fonts) && product.fonts.length > 0 && (
          <div className="control-group">
            <div className="control-label">Font</div>
            <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)}>
              {product.fonts.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        )}

        {/* Size */}
        {Array.isArray(product.sizes) && product.sizes.length > 0 && (
          <div className="control-group">
            <div className="control-label">Size</div>
            <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
              {product.sizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* Variant */}
        {Array.isArray(product.variants) && product.variants.length > 0 && (
          <div className="control-group">
            <div className="control-label">Variant</div>
            <select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)}>
              {product.variants.map((v) => {
                const id = typeof v === 'string' ? v : v.id;
                const label = typeof v === 'string' ? v : (v.label || v.name || v.id);
                return <option key={id} value={id}>{label}</option>;
              })}
            </select>
          </div>
        )}

        {/* ── Export Design ── */}
        <div className="control-group" style={{ padding: 0, border: 'none', background: 'none' }}>
          <div
            style={{
              background: 'var(--surface-raised, #f9fafb)',
              border: '1px solid var(--border-light, #e5e7eb)',
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #111827)', letterSpacing: '0.01em' }}>
                Export Design
              </span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>PNG · JSON</span>
            </div>

            {/* Button row */}
            <div style={{ display: 'flex', gap: '10px' }}>

              {/* ── Download Image (PNG) ── */}
              <button
                onClick={async () => {
                  try {
                    if (!templateCanvasRef.current) return;
                    const dataUrl = await templateCanvasRef.current.exportImage();
                    if (!dataUrl) {
                      console.error("Export Image returned empty data");
                      return;
                    }
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = 'jersey-design.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (e) {
                    console.error("Failed to export PNG:", e);
                  }
                }}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  height: 40,
                  borderRadius: '10px',
                  border: '1.5px solid var(--accent, #6B7FFF)',
                  background: 'rgba(107,127,255,0.07)',
                  color: 'var(--accent, #6B7FFF)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  transition: 'background 0.15s, border 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,127,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,127,255,0.07)'}
                title="Download jersey design as PNG image"
                aria-label="Download jersey design as PNG image"
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>🖼️</span>
                Download Image
              </button>

              {/* ── Download Config (JSON) ── */}
              <button
                onClick={() => {
                  try {
                    const config = {
                      color: selectedColor || null,
                      name: nameText || "",
                      number: numberText || "",
                      logo: logoImageUrl || null,
                      layout: layoutStyle || "style1",
                      logoPosition: logoPosition || "chest",
                      logoScale: logoScale || 1
                    };
                    const json = JSON.stringify(config, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'jersey-config.json';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  } catch (e) {
                    console.error("Failed to export JSON:", e);
                  }
                }}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  height: 40,
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-light, #d1d5db)',
                  background: '#ffffff',
                  color: 'var(--text-muted, #374151)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                  transition: 'background 0.15s, border 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.border = '1.5px solid #9ca3af'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.border = '1.5px solid var(--border-light, #d1d5db)'; }}
                title="Download design settings as JSON file"
                aria-label="Download jersey configuration as JSON"
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>📋</span>
                Download Config
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', lineHeight: 1.5 }}>
              <strong>Image</strong> exports front &amp; back combined · <strong>Config</strong> saves all settings
            </p>
          </div>
        </div>

        {/* POLISH UPDATE - Reset and primary actions */}
        <div className="control-actions">
          <button 
            className="button-secondary" 
            onClick={() => {
              setSelectedColor(product?.colors?.[0] || '');
              setNameText('');
              setNumberText('');
              setSelectedFont(product?.fonts?.[0] || '');
              setFontSize(24);
              setTextColor('#FFFFFF');
              setLogoFile(null);
              setLogoImageUrl('');
              setLogoSide('front');
              setLogoPosition('center');
              setLogoScale(1);
              setLayoutStyle('style1');
              setViewSide('front');
            }}
          >
            Reset
          </button>
          <button 
            className="button-secondary"
            onClick={async () => {
              if (templateCanvasRef.current) {
                try {
                  const dataUrl = await templateCanvasRef.current.exportImage();
                  if (dataUrl) {
                    const link = document.createElement('a');
                    link.href = dataUrl;
                    link.download = `jersey-${product?.id || 'custom'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                } catch (e) {
                  console.error("Failed to save image:", e);
                }
              }
            }}
          >
            Save Image
          </button>
          <button className="button-primary" onClick={handleAddToCart}>Add to Cart</button>
        </div>
      </aside>
    </div>
  );
}


