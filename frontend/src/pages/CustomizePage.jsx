import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';
import useCart from '../hooks/useCart';
import JerseyTemplateCanvas from '../components/JerseyTemplateCanvas';
import LoaderStitch from '../components/LoaderStitch';

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
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [logoSide, setLogoSide] = useState('front'); // 'front' | 'back' | 'both'
  const [logoPosition, setLogoPosition] = useState('center'); // 'center' | 'left-chest' | 'upper'
  const [logoScale, setLogoScale] = useState(1);
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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
          logoImageUrl={logoImageUrl}
          logoSide={logoSide}
          logoPosition={logoPosition}
          logoScale={logoScale}
        />
      </section>

      <aside className="controls-pane">
        <h2>{product.title || product.name}</h2>

        {/* Colors */}
        {Array.isArray(product.colors) && product.colors.length > 0 && (
          <div className="control-group">
            <div className="control-label">Color</div>
            <div className="swatches">
              {product.colors.map((c) => (
                <button
                  key={c}
                  className={`swatch ${selectedColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setSelectedColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        )}

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

        <div className="control-group">
          <div className="control-label">Placement</div>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Name &amp; number appear on the back. Logo goes on the front (or your choice below).</p>
        </div>

        <div className="control-group">
          <div className="control-label">Upload Logo</div>
          <input type="file" accept="image/*" onChange={handleLogoUpload} />
          {logoImageUrl && (
            <button className="button-secondary" onClick={() => setLogoImageUrl('')}>
              Remove Logo
            </button>
          )}
        </div>

        <div className="control-group">
          <div className="control-label">Logo Side</div>
          <select value={logoSide} onChange={(e) => setLogoSide(e.target.value)}>
            <option value="front">Front</option>
            <option value="back">Back</option>
            <option value="both">Front and Back</option>
          </select>
        </div>

        <div className="control-group">
          <div className="control-label">Logo Position</div>
          <select value={logoPosition} onChange={(e) => setLogoPosition(e.target.value)}>
            <option value="center">Center</option>
            <option value="left-chest">Left Chest</option>
            <option value="upper">Upper</option>
          </select>
        </div>

        <div className="control-group">
          <div className="control-label">Logo Size</div>
          <input
            type="range"
            min="0.6"
            max="1.8"
            step="0.1"
            value={logoScale}
            onChange={(e) => setLogoScale(Number(e.target.value))}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{logoScale.toFixed(1)}x</span>
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

        {/* POLISH UPDATE - Added Reset and Save buttons */}
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
              setLogoImageUrl('');
              setLogoSide('front');
              setLogoPosition('center');
              setLogoScale(1);
            }}
          >
            Reset
          </button>
          <button 
            className="button-secondary"
            onClick={() => {
              if (templateCanvasRef.current) {
                const dataUrl = templateCanvasRef.current.exportImage();
                if (dataUrl) {
                  const link = document.createElement('a');
                  link.download = `jersey-${product?.id || 'custom'}.png`;
                  link.href = dataUrl;
                  link.click();
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


