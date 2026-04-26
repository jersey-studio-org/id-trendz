import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import useCart from '../hooks/useCart';
import JerseyTemplateCanvas from '../components/JerseyTemplateCanvas';
import LoaderStitch from '../components/LoaderStitch';
import FontSelector from '../components/FontSelector';
import { jsPDF } from 'jspdf';

const ELEMENT_SIZE_LIMITS = {
  text: { min: 14, max: 120, step: 2 },
  logo: { min: 24, max: 220, step: 4 }
};

const LAYOUTS = {
  style1: {
    name: { top: '20%', left: '50%', transform: 'translate(-50%, -50%)' },
    number: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  },
  style2: {
    name: { top: '10%', left: '50%', transform: 'translate(-50%, 0)' },
    number: { top: '60%', left: '50%', transform: 'translate(-50%, 0)' },
  },
  style3: {
    name: { top: '30%', left: '50%', transform: 'translate(-50%, 0)' },
    number: { top: '70%', left: '50%', transform: 'translate(-50%, 0)' },
  },
  style4: {
    name: { top: '15%', left: '50%', transform: 'translate(-50%, 0)' },
    number: { top: '45%', left: '50%', transform: 'translate(-50%, 0)' },
  },
};

function getElementSizeLimits(type) {
  return ELEMENT_SIZE_LIMITS[type] || ELEMENT_SIZE_LIMITS.text;
}

function normalizeElementSize(type, value) {
  const { min, max } = getElementSizeLimits(type);
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return min;
  }

  return Math.min(Math.max(Math.round(numericValue), min), max);
}

const customizeTheme = {
  heading: 'var(--customize-heading, #111827)',
  divider: 'var(--customize-divider, #e5e7eb)',
  panel: 'var(--customize-panel, #f9fafb)',
  card: 'var(--customize-card, #ffffff)',
  subtle: 'var(--customize-subtle, #f3f4f6)',
  text: 'var(--customize-text, #111827)',
  muted: 'var(--customize-muted, #374151)',
  hint: 'var(--customize-hint, #9ca3af)',
  label: 'var(--customize-label, #6b7280)',
  inputBg: 'var(--customize-input-bg, #ffffff)',
  inputBorder: 'var(--customize-input-border, #d1d5db)',
  error: 'var(--customize-error, #ef4444)',
  errorBg: 'var(--customize-error-bg, #fef2f2)',
  dangerBg: 'var(--customize-danger-bg, #fee2e2)',
  dangerBorder: 'var(--customize-danger-border, #fca5a5)',
  dangerText: 'var(--customize-danger-text, #dc2626)',
  shadow: 'var(--customize-shadow, 0 1px 3px rgba(0,0,0,0.07))'
};

export default function CustomizePage() {
  const { id } = useParams();
  const api = useApi();
  const { addToCart, updateCartItem } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedColor, setSelectedColor] = useState('#888888');

  const [inputText, setInputText] = useState('');

  // ── Centralised jersey configuration ─────────────────────────────────────
  const FIXED_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
  const SIDES = ['front', 'back', 'left', 'right'];
  const CANVAS_SIDES = ['front', 'back']; // sides the SVG canvas renders

  const EMPTY_SIDE = () => ({ text: '', elements: [] });



  const [config, setConfig] = useState({
    color: '#888888',
    size: 'M',
    sleeveType: 'half',
    neckType: 'round',
    activeSide: 'front',
    sides: {
      front: EMPTY_SIDE(),
      back: EMPTY_SIDE(),
      left: EMPTY_SIDE(),
      right: EMPTY_SIDE(),
    },
  });

  /** Shallow-merge top-level keys into config */
  function updateConfig(partial) {
    setConfig((prev) => ({ ...prev, ...partial }));
  }

  /** Patch only one side's data, leaving all other sides intact */
  function updateSide(sideName, partial) {
    setConfig((prev) => ({
      ...prev,
      sides: {
        ...prev.sides,
        [sideName]: { ...prev.sides[sideName], ...partial },
      },
    }));
  }

  /** Switch the active side without resetting any data */
  function setActiveSide(side) {
    setConfig((prev) => ({ ...prev, activeSide: side }));
    setSelectedElementId(null);
  }

  const [selectedElementId, setSelectedElementId] = useState(null);

  // Derived helpers
  const activeSide = config.activeSide;
  const currentSide = config.sides[activeSide];       // data for active side
  const currentDesign = { elements: currentSide.elements ?? [] };

  // Canvas still receives separate frontDesign / backDesign objects
  const frontDesign = { elements: config.sides.front.elements ?? [] };
  const backDesign = { elements: config.sides.back.elements ?? [] };

  // viewSide controls which face the SVG canvas shows (only front/back are rendered)
  const viewSide = CANVAS_SIDES.includes(activeSide) ? activeSide : 'front';

  const selectedElement = currentDesign.elements?.find(
    el => el.id === selectedElementId
  );
  const selectedElementSizeLimits = selectedElement ? getElementSizeLimits(selectedElement.type) : ELEMENT_SIZE_LIMITS.text;
  const presetColors = Array.isArray(product?.palette) && product.palette.length > 0
    ? product.palette
    : (product?.colors || []).map((hex) => ({ name: hex, hex }));
  const defaultVariant = Array.isArray(product?.variants) && product.variants.length > 0
    ? product.variants[0]
    : null;
  const displayPrice = (() => {
    if (defaultVariant && typeof defaultVariant !== 'string' && Number.isFinite(Number(defaultVariant.price))) {
      return Number(defaultVariant.price);
    }

    if (Number.isFinite(Number(product?.price))) {
      return Number(product.price);
    }

    return null;
  })();

  function addElement(type, value) {
    const side = activeSide;
    const existingElements = config.sides[side].elements ?? [];
    const offset = existingElements.length * 10;
    const newElement = {
      id: Date.now().toString(),
      type,
      value,
      x: 200 + offset,
      y: 200 + offset,
      size: normalizeElementSize(type, type === 'logo' ? 50 : 24),
      color: '#000000',
      font: product?.fonts?.[0] || 'Arial',
    };
    updateSide(side, { elements: [...existingElements, newElement] });
    setSelectedElementId(newElement.id);
  }

  function updateElement(id, updates, side = activeSide) {
    setConfig((prev) => ({
      ...prev,
      sides: {
        ...prev.sides,
        [side]: {
          ...prev.sides[side],
          elements: (prev.sides[side].elements ?? []).map((el) =>
            el.id === id
              ? {
                ...el,
                ...updates,
                ...(Object.prototype.hasOwnProperty.call(updates, 'size')
                  ? { size: normalizeElementSize(el.type, updates.size) }
                  : {}),
              }
              : el
          ),
        },
      },
    }));
  }

  function deleteElement(id, side = activeSide) {
    setConfig((prev) => ({
      ...prev,
      sides: {
        ...prev.sides,
        [side]: {
          ...prev.sides[side],
          elements: (prev.sides[side].elements ?? []).filter((el) => el.id !== id),
        },
      },
    }));
    if (selectedElementId === id) setSelectedElementId(null);
  }

  function handleCanvasSelectElement(side, elementId) {
    // Canvas only emits front/back — map directly to activeSide
    setConfig((prev) => ({ ...prev, activeSide: side }));
    setSelectedElementId(elementId);
  }

  function handleCanvasUpdateElement(side, id, updates) {
    updateElement(id, updates, side);
  }

  function onAddText() {
    if (!inputText.trim()) return;
    addElement('text', inputText);
    setInputText('');
  }

  // Color picker UI-only states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hexInput, setHexInput] = useState('');
  const [rgbInput, setRgbInput] = useState({ r: '', g: '', b: '' });
  const [hexError, setHexError] = useState(false);
  const [rgbError, setRgbError] = useState(false);
  // Collapsible panel states
  const [showTemplates, setShowTemplates] = useState(false);
  const templateCanvasRef = useRef(null);

  // ── Restore config when returning from Cart "Edit" ───────────────────
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('editConfig');
      if (!savedConfig) return;
      const parsed = JSON.parse(savedConfig);
      // Validate it has the expected shape before applying
      if (parsed && typeof parsed === 'object' && parsed.sides) {
        setConfig(parsed);
        // Keep selectedColor in sync with the restored config
        if (parsed.color) setSelectedColor(parsed.color);
      }
    } catch (e) {
      console.error('Failed to restore edit config:', e);
    }
    // Only run once on mount — we deliberately omit deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await api.get(`/products/${id}`);
        if (!isMounted) return;
        setProduct(data);
        const initialColor = data?.palette?.[0]?.hex || data?.colors?.[0] || '#888888';
        setSelectedColor(initialColor);
        setConfig((prev) => ({ ...prev, color: initialColor, activeSide: 'front' }));
      } catch (e) {
        if (isMounted) setError(e?.message || 'Failed to load product');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  function handleLogoUpload(event) {
    const input = event.target;
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Please upload an image file for the logo.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addElement('logo', reader.result);
      } else {
        window.alert('We could not read that logo file. Please try another image.');
      }
      input.value = '';
    };
    reader.onerror = () => {
      window.alert('We could not read that logo file. Please try again.');
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  async function handleAddToCart() {
    if (!product) return;

    // Detect edit mode
    const editCartId = localStorage.getItem('editCartId');
    const isEditMode = Boolean(editCartId);

    const priceFromVariant = (() => {
      if (defaultVariant && typeof defaultVariant !== 'string') {
        return defaultVariant.price;
      }
      return product.price;
    })();

    // Export the canvas image
    let previewImageURL = product?.images?.[0] || product?.image || '';
    if (templateCanvasRef.current) {
      const exportedImage = await templateCanvasRef.current.exportImage();
      if (exportedImage) previewImageURL = exportedImage;
    }

    const activePresetColor = presetColors.find((entry) => entry.hex === selectedColor);

    const cartOptions = {
      color: selectedColor,
      size: config.size,
      sleeveType: config.sleeveType,
      neckType: config.neckType,
      // Store the full config object so Cart can restore it later
      config: {
        color: selectedColor,
        size: config.size,
        sleeveType: config.sleeveType,
        neckType: config.neckType,
        activeSide: config.activeSide,
        sides: config.sides,
      },
      sides: {
        front: config.sides.front,
        back: config.sides.back,
        left: config.sides.left,
        right: config.sides.right,
      },
      // legacy compat
      frontDesign,
      backDesign,
    };

    const cartMetadata = {
      schoolName: product.schoolName || product.title || product.name || '',
      schoolAddress: product.address || '',
      schoolMascot: product.mascot || '',
      divisionName: product.divisionName || '',
      regionName: product.regionName || '',
      selectedColorName: activePresetColor?.name || 'Custom',
      selectedColorHex: selectedColor,
    };

    if (isEditMode) {
      // UPDATE existing cart item — no duplicate created
      updateCartItem(editCartId, {
        thumbnail: previewImageURL,
        previewImageURL: previewImageURL,
        options: cartOptions,
        metadata: cartMetadata,
      });
      // Clear edit state
      try {
        localStorage.removeItem('editConfig');
        localStorage.removeItem('editCartId');
        localStorage.removeItem('editProductId');
      } catch { /* ignore */ }
      navigate('/cart');
    } else {
      // Normal ADD flow
      addToCart({
        productId: product.id,
        title: product.title || product.name,
        thumbnail: previewImageURL,
        previewImageURL: previewImageURL,
        options: cartOptions,
        metadata: cartMetadata,
        quantity: 1,
        price: priceFromVariant ?? 0,
      });
    }
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
          selectedElementId={selectedElementId}
          onSelectElement={handleCanvasSelectElement}
          onUpdateElement={handleCanvasUpdateElement}
        />
      </section>

      <aside className="controls-pane">
        <h2>{product.title || product.name}</h2>
        {displayPrice !== null && (
          <p className="school-merch-price" style={{ margin: '8px 0 24px' }}>
            ${displayPrice.toFixed(2)}
          </p>
        )}

        {/* ── SECTION: MODE ── */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: customizeTheme.heading, borderBottom: `1px solid ${customizeTheme.divider}`, paddingBottom: '8px' }}>
            Mode
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Side Selector (Front / Back / Left / Right) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #4b5563)' }}>
                Editing: <strong style={{ color: 'var(--accent, #6B7FFF)' }}>{activeSide.toUpperCase()}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {SIDES.map((side) => {
                  const isActive = activeSide === side;
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setActiveSide(side)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: isActive
                          ? '2px solid var(--accent, #6B7FFF)'
                          : `1px solid ${customizeTheme.inputBorder}`,
                        background: isActive
                          ? 'rgba(107,127,255,0.08)'
                          : customizeTheme.inputBg,
                        color: isActive ? 'var(--accent, #6B7FFF)' : customizeTheme.muted,
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {side.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              {!CANVAS_SIDES.includes(activeSide) && (
                <p style={{ margin: 0, fontSize: '11px', color: customizeTheme.hint, lineHeight: 1.5 }}>
                  Canvas preview shows <strong>Front</strong> while editing {activeSide}.
                  Elements are saved independently for each side.
                </p>
              )}
            </div>

            {/* Colors */}
            <div className="control-group" style={{ padding: 0, border: 'none', background: 'none' }}>
              <div
                style={{
                  background: customizeTheme.panel,
                  border: `1px solid ${customizeTheme.divider}`,
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
                    color: customizeTheme.text,
                    letterSpacing: '0.01em',
                  }}
                >
                  Jersey Color
                </span>

                {/* Swatch row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {presetColors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => { setSelectedColor(color.hex); setShowColorPicker(false); }}
                      aria-label={`Select ${color.name}`}
                      title={color.name}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: color.hex,
                        border: color.hex.toLowerCase() === '#ffffff' ? `1px solid ${customizeTheme.inputBorder}` : 'none',
                        padding: 0,
                        cursor: 'pointer',
                        flexShrink: 0,
                        outline: selectedColor === color.hex
                          ? '2px solid var(--accent, #6B7FFF)'
                          : '2px solid transparent',
                        outlineOffset: '2px',
                        boxShadow: selectedColor === color.hex
                          ? '0 0 0 4px rgba(107,127,255,0.18)'
                          : '0 1px 3px rgba(0,0,0,0.25)',
                        transform: selectedColor === color.hex ? 'scale(1.1)' : 'scale(1)',
                        transition: 'outline 0.15s, box-shadow 0.15s, transform 0.15s',
                      }}
                    />
                  ))}

                  {/* Divider */}
                  <div style={{ width: 1, height: 24, background: customizeTheme.divider, flexShrink: 0 }} />

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
                        : `1.5px solid ${customizeTheme.inputBorder}`,
                      background: showColorPicker ? 'rgba(107,127,255,0.07)' : customizeTheme.inputBg,
                      color: showColorPicker ? 'var(--accent, #6B7FFF)' : customizeTheme.muted,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                      boxShadow: customizeTheme.shadow,
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
                  {!presetColors.some((color) => color.hex === selectedColor) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: 'auto',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: customizeTheme.subtle,
                        border: `1px solid ${customizeTheme.divider}`,
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
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: customizeTheme.muted, letterSpacing: '0.04em' }}>
                        {selectedColor.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Expanded picker panel ── */}
                {showColorPicker && (
                  <div
                    style={{
                      background: customizeTheme.card,
                      border: `1px solid ${customizeTheme.divider}`,
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
                          border: `1px solid ${customizeTheme.inputBorder}`,
                          borderRadius: '8px',
                          padding: '2px',
                          background: customizeTheme.panel,
                          flexShrink: 0,
                        }}
                        aria-label="Color picker"
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: customizeTheme.text }}>Choose any color</span>
                        <span style={{ fontSize: '11px', color: customizeTheme.hint }}>Or enter a code below</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: customizeTheme.subtle }} />

                    {/* HEX row */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: customizeTheme.label, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                            border: hexError ? `1.5px solid ${customizeTheme.error}` : `1.5px solid ${customizeTheme.inputBorder}`,
                            background: hexError ? customizeTheme.errorBg : customizeTheme.inputBg,
                            color: customizeTheme.text,
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
                            padding: '0 14px',
                            borderRadius: '8px',
                            border: '1.5px solid var(--accent, #6B7FFF)',
                            background: 'rgba(107,127,255,0.07)',
                            color: 'var(--accent, #6B7FFF)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            letterSpacing: '0.01em',
                            flexShrink: 0,
                          }}
                        >
                          Apply
                        </button>
                      </div>
                      {hexError && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: customizeTheme.error }}>
                          Enter a valid HEX like #1E3A8A
                        </div>
                      )}
                    </div>

                    {/* RGB row */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: customizeTheme.label, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        RGB Values
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {['r', 'g', 'b'].map((channel) => (
                          <input
                            key={channel}
                            type="number"
                            min="0"
                            max="255"
                            value={rgbInput[channel]}
                            onChange={(e) => {
                              setRgbInput(prev => ({ ...prev, [channel]: e.target.value }));
                              setRgbError(false);
                            }}
                            placeholder={channel.toUpperCase()}
                            style={{
                              width: '70px',
                              height: '40px',
                              padding: '0 10px',
                              borderRadius: '8px',
                              border: rgbError ? `1.5px solid ${customizeTheme.error}` : `1.5px solid ${customizeTheme.inputBorder}`,
                              background: rgbError ? customizeTheme.errorBg : customizeTheme.inputBg,
                              color: customizeTheme.text,
                              fontSize: '13px',
                              fontFamily: 'monospace',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            aria-label={`${channel.toUpperCase()} value`}
                          />
                        ))}
                        <button
                          onClick={() => {
                            const { r, g, b } = rgbInput;
                            if (
                              [r, g, b].every(v => v !== '' && !isNaN(v) && Number(v) >= 0 && Number(v) <= 255)
                            ) {
                              const toHex = (n) => Number(n).toString(16).padStart(2, '0');
                              setSelectedColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
                              setRgbError(false);
                            } else {
                              setRgbError(true);
                            }
                          }}
                          style={{
                            height: '40px',
                            padding: '0 14px',
                            borderRadius: '8px',
                            border: '1.5px solid var(--accent, #6B7FFF)',
                            background: 'rgba(107,127,255,0.07)',
                            color: 'var(--accent, #6B7FFF)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            letterSpacing: '0.01em',
                            flexShrink: 0,
                          }}
                        >
                          Apply
                        </button>
                      </div>
                      {rgbError && (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: customizeTheme.error }}>
                          Enter values from 0 to 255
                        </div>
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
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: customizeTheme.heading, borderBottom: `1px solid ${customizeTheme.divider}`, paddingBottom: '8px' }}>
            Add Elements
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Text / Number */}
            <div className="control-group">
              <div className="control-label">Text / Number</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddText()}
                  placeholder="Enter text or number (e.g., 23 JOHN)"
                  maxLength={30}
                  style={{ flex: 1, height: '40px', padding: '0 10px', borderRadius: '8px', border: `1.5px solid ${customizeTheme.inputBorder}`, background: customizeTheme.inputBg, color: customizeTheme.text }}
                />
                <button
                  onClick={onAddText}
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
                  background: customizeTheme.panel,
                  border: `1px solid ${customizeTheme.divider}`,
                  borderRadius: '12px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: customizeTheme.text, letterSpacing: '0.01em' }}>
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
                      border: `1.5px solid ${customizeTheme.inputBorder}`,
                      background: customizeTheme.inputBg,
                      color: customizeTheme.muted,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                      boxShadow: customizeTheme.shadow,
                      transition: 'border 0.15s',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Choose File
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <span style={{ fontSize: '12px', color: customizeTheme.hint }}>PNG, JPG, or SVG</span>
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="control-group">
              <div className="control-label">Size</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {FIXED_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateConfig({ size: s })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: config.size === s
                        ? '2px solid var(--accent, #6B7FFF)'
                        : `1px solid ${customizeTheme.inputBorder}`,
                      background: config.size === s
                        ? 'rgba(107,127,255,0.10)'
                        : customizeTheme.inputBg,
                      color: config.size === s
                        ? 'var(--accent, #6B7FFF)'
                        : customizeTheme.muted,
                      fontWeight: config.size === s ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── SECTION: STYLE OPTIONS ── */}
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: customizeTheme.heading, borderBottom: `1px solid ${customizeTheme.divider}`, paddingBottom: '8px' }}>
            Style Options
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Sleeve Type */}
            <div className="control-group">
              <div className="control-label" style={{ marginBottom: '10px' }}>Sleeve</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ value: 'half', label: 'Half Sleeve' }, { value: 'full', label: 'Full Sleeve' }].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateConfig({ sleeveType: value })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: config.sleeveType === value
                        ? '2px solid var(--accent, #6B7FFF)'
                        : `1px solid ${customizeTheme.inputBorder}`,
                      background: config.sleeveType === value
                        ? 'rgba(107,127,255,0.10)'
                        : customizeTheme.inputBg,
                      color: config.sleeveType === value
                        ? 'var(--accent, #6B7FFF)'
                        : customizeTheme.muted,
                      fontWeight: config.sleeveType === value ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Neck Type */}
            <div className="control-group">
              <div className="control-label" style={{ marginBottom: '10px' }}>Neck</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 'round', label: 'Round Neck' },
                  { value: 'v', label: 'V-Neck' },
                  { value: 'collar', label: 'Collar' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateConfig({ neckType: value })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: config.neckType === value
                        ? '2px solid var(--accent, #6B7FFF)'
                        : `1px solid ${customizeTheme.inputBorder}`,
                      background: config.neckType === value
                        ? 'rgba(107,127,255,0.10)'
                        : customizeTheme.inputBg,
                      color: config.neckType === value
                        ? 'var(--accent, #6B7FFF)'
                        : customizeTheme.muted,
                      fontWeight: config.neckType === value ? 700 : 500,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-designed Templates (placeholder) */}
            <div className="control-group">
              <button
                type="button"
                onClick={() => setShowTemplates((prev) => !prev)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${customizeTheme.inputBorder}`,
                  background: showTemplates ? 'rgba(107,127,255,0.07)' : customizeTheme.inputBg,
                  color: showTemplates ? 'var(--accent, #6B7FFF)' : customizeTheme.muted,
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span>Pre-designed Templates</span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>{showTemplates ? 'Hide' : 'Show'}</span>
              </button>
              {showTemplates && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${customizeTheme.divider}`,
                    background: customizeTheme.panel,
                    textAlign: 'center',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '12px', color: customizeTheme.hint }}>
                    Coming soon - pre-built designs will appear here.
                  </p>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── SECTION: EDIT SELECTED ELEMENT ── */}
        {(currentDesign.elements?.length > 0 || selectedElement) && (
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: customizeTheme.heading, borderBottom: `1px solid ${customizeTheme.divider}`, paddingBottom: '8px' }}>
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
                          border: selectedElementId === el.id ? '2px solid var(--accent, #6B7FFF)' : '1px solid #ccc',
                          background: selectedElementId === el.id ? 'rgba(107,127,255,0.1)' : customizeTheme.inputBg,
                          color: selectedElementId === el.id ? 'var(--accent, #6B7FFF)' : customizeTheme.muted,
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
                <div className="control-group" style={{ background: customizeTheme.panel, borderRadius: '8px', padding: '16px', border: `1px solid ${customizeTheme.divider}` }}>
                  <div className="control-label" style={{ color: 'var(--accent, #6B7FFF)' }}>Element Controls</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* X Position */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: customizeTheme.muted }}>X Position</span>
                      <input
                        type="number"
                        value={selectedElement.x}
                        onChange={e => {
                          const val = e.target.value === "" ? selectedElement.x : Number(e.target.value);
                          updateElement(selectedElement.id, { x: val });
                        }}
                        style={{ width: '80px', height: '30px', padding: '0 8px', borderRadius: '4px', border: `1px solid ${customizeTheme.inputBorder}`, background: customizeTheme.inputBg, color: customizeTheme.text }}
                      />
                    </div>

                    {/* Y Position */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: customizeTheme.muted }}>Y Position</span>
                      <input
                        type="number"
                        value={selectedElement.y}
                        onChange={e => {
                          const val = e.target.value === "" ? selectedElement.y : Number(e.target.value);
                          updateElement(selectedElement.id, { y: val });
                        }}
                        style={{ width: '80px', height: '30px', padding: '0 8px', borderRadius: '4px', border: `1px solid ${customizeTheme.inputBorder}`, background: customizeTheme.inputBg, color: customizeTheme.text }}
                      />
                    </div>

                    {/* Size */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: customizeTheme.muted }}>Size</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => updateElement(selectedElement.id, { size: selectedElement.size - selectedElementSizeLimits.step })}
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '999px',
                              border: `1px solid ${customizeTheme.inputBorder}`,
                              background: customizeTheme.inputBg,
                              color: customizeTheme.muted,
                              fontSize: '16px',
                              lineHeight: 1,
                              cursor: 'pointer'
                            }}
                            aria-label="Decrease selected element size"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={selectedElementSizeLimits.min}
                            max={selectedElementSizeLimits.max}
                            step={selectedElementSizeLimits.step}
                            value={selectedElement.size}
                            onChange={e => {
                              const val = e.target.value === "" ? selectedElement.size : Number(e.target.value);
                              updateElement(selectedElement.id, { size: val });
                            }}
                            style={{ width: '84px', height: '30px', padding: '0 8px', borderRadius: '4px', border: `1px solid ${customizeTheme.inputBorder}`, background: customizeTheme.inputBg, color: customizeTheme.text }}
                          />
                          <button
                            type="button"
                            onClick={() => updateElement(selectedElement.id, { size: selectedElement.size + selectedElementSizeLimits.step })}
                            style={{
                              width: '28px',
                              height: '28px',
                              padding: 0,
                              borderRadius: '999px',
                              border: `1px solid ${customizeTheme.inputBorder}`,
                              background: customizeTheme.inputBg,
                              color: customizeTheme.muted,
                              fontSize: '16px',
                              lineHeight: 1,
                              cursor: 'pointer'
                            }}
                            aria-label="Increase selected element size"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={selectedElementSizeLimits.min}
                        max={selectedElementSizeLimits.max}
                        step={selectedElementSizeLimits.step}
                        value={selectedElement.size}
                        onChange={e => updateElement(selectedElement.id, { size: Number(e.target.value) })}
                        aria-label="Resize selected element"
                      />
                      <span style={{ fontSize: '11px', color: customizeTheme.label }}>
                        Resize the selected {selectedElement.type === 'logo' ? 'logo' : 'text'} directly here.
                      </span>
                    </div>

                    {/* Color */}
                    {selectedElement.type !== 'logo' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: customizeTheme.muted }}>Color</span>
                        <input
                          type="color"
                          value={selectedElement.color}
                          onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
                          style={{ width: '80px', height: '30px', padding: '0', cursor: 'pointer', border: `1px solid ${customizeTheme.inputBorder}` }}
                        />
                      </div>
                    )}

                    {selectedElement.type === 'text' && (
                      <FontSelector
                        value={selectedElement.font || 'Arial'}
                        onChange={(fontName) => updateElement(selectedElement.id, { font: fontName })}
                        label="Text Font"
                      />
                    )}

                    {/* Delete Element */}
                    <button
                      onClick={() => deleteElement(selectedElement.id)}
                      style={{
                        marginTop: '8px',
                        padding: '8px',
                        borderRadius: '6px',
                        background: customizeTheme.dangerBg,
                        color: customizeTheme.dangerText,
                        border: `1px solid ${customizeTheme.dangerBorder}`,
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
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: customizeTheme.heading, borderBottom: `1px solid ${customizeTheme.divider}`, paddingBottom: '8px' }}>
            Export
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* ── Export Design ── */}
            <div className="control-group" style={{ padding: 0, border: 'none', background: 'none' }}>
              <div
                style={{
                  background: customizeTheme.panel,
                  border: `1px solid ${customizeTheme.divider}`,
                  borderRadius: '12px',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: customizeTheme.text, letterSpacing: '0.01em' }}>
                    Export Design
                  </span>
                  <span style={{ fontSize: '11px', color: customizeTheme.hint }}>PNG · PDF · JSON</span>
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
                        doc.text('Generated by IDTrendz', 148.5, 195, { align: 'center' });

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
                      border: `1.5px solid ${customizeTheme.inputBorder}`,
                      background: customizeTheme.inputBg,
                      color: customizeTheme.muted,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                      boxShadow: customizeTheme.shadow,
                      transition: 'background 0.15s, border 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = customizeTheme.panel; e.currentTarget.style.border = `1.5px solid ${customizeTheme.hint}`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = customizeTheme.inputBg; e.currentTarget.style.border = `1.5px solid ${customizeTheme.inputBorder}`; }}
                    title="Download design as PDF"
                    aria-label="Download design as PDF"
                  >
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
                      border: `1.5px solid ${customizeTheme.inputBorder}`,
                      background: customizeTheme.inputBg,
                      color: customizeTheme.muted,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                      boxShadow: customizeTheme.shadow,
                      transition: 'background 0.15s, border 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = customizeTheme.panel; e.currentTarget.style.border = `1.5px solid ${customizeTheme.hint}`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = customizeTheme.inputBg; e.currentTarget.style.border = `1.5px solid ${customizeTheme.inputBorder}`; }}
                    title="Download design settings as JSON file"
                    aria-label="Download jersey configuration as JSON"
                  >
                    Download Config
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '11px', color: customizeTheme.hint, lineHeight: 1.5 }}>
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
              const resetColor = presetColors?.[0]?.hex || product?.colors?.[0] || '#888888';
              setSelectedColor(resetColor);
              setConfig((prev) => ({
                ...prev,
                color: resetColor,
                activeSide: 'front',
                sides: {
                  front: EMPTY_SIDE(),
                  back: EMPTY_SIDE(),
                  left: EMPTY_SIDE(),
                  right: EMPTY_SIDE(),
                },
              }));
              setInputText('');
              setSelectedElementId(null);
              setShowColorPicker(false);
              setHexInput('');
              setRgbInput({ r: '', g: '', b: '' });
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
          <button className="button-primary" onClick={handleAddToCart}>
            {localStorage.getItem('editCartId') ? 'Save Changes' : 'Add to Cart'}
          </button>
        </div>
      </aside>
    </div>
  );
}





