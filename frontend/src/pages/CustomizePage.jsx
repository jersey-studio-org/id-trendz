import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import useCart from '../hooks/useCart';
import JerseyTemplateCanvas from '../components/JerseyTemplateCanvas';
import LoaderStitch from '../components/LoaderStitch';
import { jsPDF } from 'jspdf';

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

  const [selectedColor, setSelectedColor] = useState('#888888');
  
  const [inputName, setInputName] = useState('');
  const [inputNumber, setInputNumber] = useState('');
  
  const [frontDesign, setFrontDesign] = useState({
    elements: []
  });
  
  const [backDesign, setBackDesign] = useState({
    elements: []
  });

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [viewSide, setViewSide] = useState('front');
  const [viewMode, setViewMode] = useState('front');
  const [selectedElementId, setSelectedElementId] = useState(null);

  const currentDesign = viewMode === "front" ? frontDesign : backDesign;

  const selectedElement = currentDesign.elements?.find(
    el => el.id === selectedElementId
  );

  function addElement(type, value) {
    const currentElements = viewMode === "front" ? frontDesign.elements : backDesign.elements;
    const offset = currentElements.length * 10;
    const newElement = {
      id: Date.now().toString(),
      type,
      value,
      x: 200 + offset,
      y: 200 + offset,
      size: type === 'logo' ? 50 : 24,
      color: "#000000"
    };

    if (viewMode === "front") {
      setFrontDesign(prev => ({
        ...prev,
        elements: [...(prev.elements || []), newElement]
      }));
    } else {
      setBackDesign(prev => ({
        ...prev,
        elements: [...(prev.elements || []), newElement]
      }));
    }

    setSelectedElementId(newElement.id);
    setViewSide(viewMode);
  }

  function updateElement(id, updates, side = viewMode) {
    if (side === "front") {
      setFrontDesign(prev => ({
        ...prev,
        elements: (prev.elements || []).map(el =>
          el.id === id ? { ...el, ...updates } : el
        )
      }));
    } else {
      setBackDesign(prev => ({
        ...prev,
        elements: (prev.elements || []).map(el =>
          el.id === id ? { ...el, ...updates } : el
        )
      }));
    }
  }

  function deleteElement(id, side = viewMode) {
    if (side === "front") {
      setFrontDesign(prev => ({
        ...prev,
        elements: (prev.elements || []).filter(el => el.id !== id)
      }));
    } else {
      setBackDesign(prev => ({
        ...prev,
        elements: (prev.elements || []).filter(el => el.id !== id)
      }));
    }
    if (selectedElementId === id) setSelectedElementId(null);
  }

  function handleCanvasSelectElement(side, elementId) {
    setViewMode(side);
    setViewSide(side);
    setSelectedElementId(elementId);
  }

  function handleCanvasUpdateElement(side, id, updates) {
    updateElement(id, updates, side);
  }

  function onAddName() {
    if (!inputName.trim()) return;
    addElement('text', inputName);
    setInputName('');
  }

  function onAddNumber() {
    if (!inputNumber.trim()) return;
    addElement('number', inputNumber);
    setInputNumber('');
  }

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
        setSelectedColor(data?.colors?.[0] || '#888888');
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

    const url = URL.createObjectURL(file);
    addElement('logo', url);
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
      const exportedImage = await templateCanvasRef.current.exportImage();
      if (exportedImage) previewImageURL = exportedImage;
    }

    addToCart({
      productId: product.id,
      title: product.title || product.name,
      thumbnail: previewImageURL,
      previewImageURL: previewImageURL,
      options: {
        color: selectedColor,
        size: selectedSize,
        variant: selectedVariant,
        frontDesign,
        backDesign
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
          viewSide={viewSide}
          frontDesign={frontDesign}
          backDesign={backDesign}
          onSelectElement={handleCanvasSelectElement}
          onUpdateElement={handleCanvasUpdateElement}
        />
      </section>

      <aside className="controls-pane">
        <h2>{product.title || product.name}</h2>

        {/* ── SECTION: MODE ── */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
            Mode
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Editing Mode Toggle ── */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #4b5563)' }}>
            Editing: {viewMode.toUpperCase()}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('front')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                border: viewMode === 'front' ? '2px solid var(--accent, #6B7FFF)' : '1px solid #d1d5db',
                background: viewMode === 'front' ? 'rgba(107,127,255,0.08)' : '#ffffff',
                color: viewMode === 'front' ? 'var(--accent, #6B7FFF)' : '#374151',
              }}
            >
              FRONT
            </button>
            <button
              onClick={() => setViewMode('back')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                border: viewMode === 'back' ? '2px solid var(--accent, #6B7FFF)' : '1px solid #d1d5db',
                background: viewMode === 'back' ? 'rgba(107,127,255,0.08)' : '#ffffff',
                color: viewMode === 'back' ? 'var(--accent, #6B7FFF)' : '#374151',
              }}
            >
              BACK
            </button>
          </div>
        </div>

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
        
          </div>
        </section>

        {/* ── SECTION: ADD ELEMENTS ── */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
            Add Elements
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Name */}
        <div className="control-group">
          <div className="control-label">Name</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddName()}
              placeholder="Enter name (e.g., John)"
              maxLength={20}
              style={{ flex: 1, height: '40px', padding: '0 10px', borderRadius: '8px', border: '1.5px solid #d1d5db' }}
            />
            <button
              onClick={onAddName}
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
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Number */}
        <div className="control-group">
          <div className="control-label">Jersey Number</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
              onKeyDown={(e) => e.key === 'Enter' && onAddNumber()}
              placeholder="Enter number (e.g., 55)"
              maxLength={3}
              style={{ flex: 1, height: '40px', padding: '0 10px', borderRadius: '8px', border: '1.5px solid #d1d5db' }}
            />
            <button
              onClick={onAddNumber}
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
              }}
            >
              Add
            </button>
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
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #111827)', letterSpacing: '0.01em' }}>
              Upload Logo
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                Choose File
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>PNG, JPG, or SVG</span>
            </div>
          </div>
        </div>

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

          </div>
        </section>

        {/* ── SECTION: EDIT SELECTED ELEMENT ── */}
        {(currentDesign.elements?.length > 0 || selectedElement) && (
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
              Edit Selected Element
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
              {/* Elements List */}
              {currentDesign.elements?.length > 0 && (
                <div className="control-group">
                  <div className="control-label">Active Elements</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {currentDesign.elements.map(el => (
                      <button
                        key={el.id}
                        onClick={() => setSelectedElementId(el.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: selectedElementId === el.id ? '2px solid var(--accent, #6B7FFF)' : '1px solid #d1d5db',
                          background: selectedElementId === el.id ? 'rgba(107,127,255,0.1)' : '#fff',
                          color: selectedElementId === el.id ? 'var(--accent, #6B7FFF)' : '#374151',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {el.type.toUpperCase()}: {el.type === 'logo' ? 'Logo' : el.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Element Editor */}
              {selectedElement && (
                <div className="control-group" style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px' }}>
                  <div className="control-label" style={{ color: 'var(--accent, #6B7FFF)' }}>Element Controls</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* X Position */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>X Position</span>
                      <input 
                        type="number" 
                        value={selectedElement.x} 
                        onChange={e => {
                          const val = e.target.value === "" ? selectedElement.x : Number(e.target.value);
                          updateElement(selectedElement.id, { x: val });
                        }}
                        style={{ width: '80px', height: '30px', padding: '0 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      />
                    </div>

                    {/* Y Position */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Y Position</span>
                      <input 
                        type="number" 
                        value={selectedElement.y} 
                        onChange={e => {
                          const val = e.target.value === "" ? selectedElement.y : Number(e.target.value);
                          updateElement(selectedElement.id, { y: val });
                        }}
                        style={{ width: '80px', height: '30px', padding: '0 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      />
                    </div>

                    {/* Size */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Size</span>
                      <input 
                        type="number" 
                        value={selectedElement.size} 
                        onChange={e => {
                          const val = e.target.value === "" ? selectedElement.size : Number(e.target.value);
                          updateElement(selectedElement.id, { size: val });
                        }}
                        style={{ width: '80px', height: '30px', padding: '0 8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      />
                    </div>

                    {/* Color */}
                    {selectedElement.type !== 'logo' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Color</span>
                        <input 
                          type="color" 
                          value={selectedElement.color} 
                          onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
                          style={{ width: '80px', height: '30px', padding: '0', cursor: 'pointer', border: '1px solid #d1d5db' }}
                        />
                      </div>
                    )}
                    
                    {/* Delete Element */}
                    <button
                      onClick={() => deleteElement(selectedElement.id)}
                      style={{
                        marginTop: '8px',
                        padding: '8px',
                        borderRadius: '6px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Delete Element
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>
        )}

        {/* ── SECTION: EXPORT ── */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
            Export
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>PNG · PDF · JSON</span>
            </div>

            {/* Button row */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

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
                  flex: '1 1 30%',
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
                Image
              </button>

              {/* ── Download PDF ── */}
              <button
                onClick={async () => {
                  try {
                    if (!templateCanvasRef.current) return;
                    const dataUrl = await templateCanvasRef.current.exportImage();
                    if (!dataUrl) {
                      console.error("Export Image returned empty data");
                      return;
                    }
                    
                    const doc = new jsPDF({
                      orientation: 'landscape',
                      unit: 'mm',
                      format: 'a4'
                    });

                    // Title
                    doc.setFontSize(26);
                    doc.setFont("helvetica", "bold");
                    doc.text('Custom Jersey Design Preview', 148.5, 30, { align: 'center' });
                    
                    // Labels over each image half
                    doc.setFontSize(14);
                    doc.setFont("helvetica", "normal");
                    doc.text('Front View', 93.5, 48, { align: 'center' });
                    doc.text('Back View', 203.5, 48, { align: 'center' });
                    
                    // Image is 1200x600 px native (2:1 aspect).
                    // Draw size 220x110mm centered on A4 landscape (297 width -> x=38.5, y=55)
                    doc.addImage(dataUrl, 'PNG', 38.5, 55, 220, 110);
                    
                    // Footer
                    doc.setFontSize(10);
                    doc.setTextColor(150, 150, 150);
                    doc.text('Generated by Jersey Studio', 148.5, 195, { align: 'center' });
                    
                    doc.save('jersey-design.pdf');
                  } catch (e) {
                    console.error("Failed to export PDF:", e);
                  }
                }}
                style={{
                  flex: '1 1 30%',
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
                title="Download design as PDF"
                aria-label="Download design as PDF"
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>📄</span>
                PDF
              </button>

              {/* ── Download Config (JSON) ── */}
              <button
                onClick={() => {
                  try {
                    const config = {
                      front: frontDesign,
                      back: backDesign
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
                  flex: '1 1 30%',
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

          </div>
        </section>

        {/* POLISH UPDATE - Reset and primary actions */}
        <div className="control-actions">
          <button 
            className="button-secondary" 
            onClick={() => {
              setSelectedColor(product?.colors?.[0] || '#888888');
              setFrontDesign({ elements: [] });
              setBackDesign({ elements: [] });
              setInputName('');
              setInputNumber('');
              setSelectedElementId(null);
              setShowColorPicker(false);
              setHexInput('');
              setRgbInput({ r: '', g: '', b: '' });
              setViewSide('front');
              setViewMode('front');
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


