/**
 * JerseyTemplateCanvas
 *
 * PNG-based jersey renderer. Uses realistic PNG mockup images as the base,
 * with a color overlay (mix-blend-mode: multiply) and an SVG layer for
 * dynamic elements (name, number, logo).
 *
 * Structure per panel:
 *   <div className="jersey-wrapper">
 *     <img  className="jersey-base" />          ← PNG mockup
 *     <div  className="jersey-color-overlay" /> ← tinting via multiply
 *     <svg  className="jersey-elements" />      ← name / number / logo
 *   </div>
 *
 * Public API (props + ref) is UNCHANGED — CustomizePage requires zero edits.
 */

import { useRef, useImperativeHandle, forwardRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// PNG asset paths (served from /public/assets/)
// ─────────────────────────────────────────────────────────────────────────────
const JERSEY_FRONT_PNG      = '/assets/jersey-front.png';
const JERSEY_BACK_PNG       = '/assets/jersey-back.png';
const JERSEY_MASK_FRONT_PNG = '/assets/jersey-mask-front.png';
const JERSEY_MASK_BACK_PNG  = '/assets/jersey-mask-back.png';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WCAG-compliant relative luminance from a hex colour.
 * Returns 0 (black) → 1 (white).
 */
function hexLuminance(hex) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return 0.5;
  const toLinear = (c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(h.slice(0, 2));
  const g = toLinear(h.slice(2, 4));
  const b = toLinear(h.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Is the jersey body colour perceptually light? */
const isLight = (hex) => hexLuminance(hex) > 0.35;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: renders one jersey panel (front OR back)
// ─────────────────────────────────────────────────────────────────────────────

function JerseyPanel({
  svgRef,
  view,           // 'front' | 'back'
  colorHex,
  frontDesign = { elements: [] },
  backDesign  = { elements: [] },
}) {
  const textureSrc = view === 'front' ? JERSEY_FRONT_PNG      : JERSEY_BACK_PNG;
  const maskSrc    = view === 'front' ? JERSEY_FRONT_PNG : JERSEY_BACK_PNG;
  console.log("maskSrc:", maskSrc);

  const currentElements = view === 'front'
    ? (frontDesign.elements || [])
    : (backDesign.elements  || []);

  return (
    <div className="jersey-wrapper">
      {/* ── Layer 1: Color div masked to jersey silhouette only ── */}
      <div
        className="jersey-mask"
        style={{
          '--mask-color': colorHex,
          '--mask-image': `url("${maskSrc}")`,
        }}
      />

      {/* ── Layer 2: Photorealistic texture (shadows, fabric detail) ── */}
      <img
        className="jersey-texture"
        src={textureSrc}
        alt={`Jersey ${view}`}
        draggable={false}
      />

      {/* ── Layer 3: Dynamic SVG elements (name / number / logo) ── */}
      <svg
        ref={svgRef}
        className="jersey-elements"
        viewBox="0 0 400 480"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        aria-label={`Jersey ${view} elements`}
      >
        {currentElements.map((el) => {
          if (el.type === 'text') {
            return (
              <text
                key={el.id}
                x={el.x}
                y={el.y}
                textAnchor="middle"
                fill={el.color}
                fontSize={el.size}
                fontWeight="bold"
                letterSpacing="2"
                textTransform="uppercase"
              >
                {el.value}
              </text>
            );
          }

          if (el.type === 'number') {
            return (
              <text
                key={el.id}
                x={el.x}
                y={el.y}
                textAnchor="middle"
                fill={el.color}
                fontSize={el.size * 1.5}
                fontWeight="bold"
                letterSpacing="2"
              >
                {el.value}
              </text>
            );
          }

          if (el.type === 'logo') {
            return (
              <image
                key={el.id}
                href={el.value}
                x={el.x - el.size / 2}
                y={el.y - el.size / 2}
                width={el.size}
                height={el.size}
              />
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export helper — composite PNG base + SVG elements → offscreen canvas → PNG
// ─────────────────────────────────────────────────────────────────────────────

const EXPORT_W = 500;
const EXPORT_H = 600;

/**
 * Loads a URL as an HTMLImageElement (CORS-safe for same-origin PNGs).
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Serialises an SVG element to an HTMLImageElement.
 */
function svgToImage(svgEl) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const clone = svgEl.cloneNode(true);
        // Set explicit size so canvas renders correctly
        clone.setAttribute('width',  String(EXPORT_W));
        clone.setAttribute('height', String(EXPORT_H));

        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(clone);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url  = URL.createObjectURL(blob);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
      } catch (err) {
        reject(err);
      }
    }, 50);
  });
}

/**
 * Composites PNG base + color overlay + SVG elements into a single PNG image.
 * Returns an HTMLImageElement for drawing onto the final combined canvas.
 */
async function compositePanelToImage(pngSrc, colorHex, svgEl) {
  const [baseImg, elementsImg] = await Promise.all([
    loadImage(pngSrc),
    svgToImage(svgEl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width  = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext('2d');

  // 1. Draw PNG base (fills entire canvas)
  ctx.drawImage(baseImg, 0, 0, EXPORT_W, EXPORT_H);

  // 2. Draw color overlay (multiply)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
  ctx.restore();

  // 3. Draw SVG elements on top (normal blend)
  ctx.drawImage(elementsImg, 0, 0, EXPORT_W, EXPORT_H);

  return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const JerseyTemplateCanvas = forwardRef((
  {
    colorHex    = '#888888',
    viewSide    = 'front',
    frontDesign = { elements: [] },
    backDesign  = { elements: [] },
    viewMode    = 'front',
  },
  ref
) => {
  const frontSvgRef = useRef(null);
  const backSvgRef  = useRef(null);

  // ── Expose exportImage ──────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    exportImage: async () => {
      const fe = frontSvgRef.current;
      const be = backSvgRef.current;
      if (!fe || !be) return null;

      try {
        const [frontCanvas, backCanvas] = await Promise.all([
          compositePanelToImage(JERSEY_FRONT_PNG, colorHex, fe),
          compositePanelToImage(JERSEY_BACK_PNG,  colorHex, be),
        ]);

        const combined = document.createElement('canvas');
        combined.width  = 1200;
        combined.height = 600;

        const ctx = combined.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, combined.width, combined.height);

        // Front in left 600px box (centred → x=50, width=500)
        ctx.drawImage(frontCanvas, 50,  0, EXPORT_W, EXPORT_H);
        // Back  in right 600px box (centred → x=650, width=500)
        ctx.drawImage(backCanvas,  650, 0, EXPORT_W, EXPORT_H);

        return combined.toDataURL('image/png');
      } catch (e) {
        console.error('JerseyTemplateCanvas: exportImage failed', e);
        return null;
      }
    },
  }));

  // Shared props forwarded to each panel
  const sharedProps = { colorHex, frontDesign, backDesign };

  return (
    <div className="jersey-template-views">
      {/* Front panel */}
      <div
        className="jersey-view-panel"
        style={{
          outline: viewSide === 'front' ? '2px solid var(--accent, #6B7FFF)' : '2px solid transparent',
          borderRadius: 'var(--radius-sm)',
          transition: 'outline 0.15s',
        }}
      >
        <span className="jersey-view-label">Front</span>
        <JerseyPanel
          svgRef={frontSvgRef}
          view="front"
          {...sharedProps}
        />
      </div>

      {/* Back panel */}
      <div
        className="jersey-view-panel"
        style={{
          outline: viewSide === 'back' ? '2px solid var(--accent, #6B7FFF)' : '2px solid transparent',
          borderRadius: 'var(--radius-sm)',
          transition: 'outline 0.15s',
        }}
      >
        <span className="jersey-view-label">Back</span>
        <JerseyPanel
          svgRef={backSvgRef}
          view="back"
          {...sharedProps}
        />
      </div>
    </div>
  );
});

JerseyTemplateCanvas.displayName = 'JerseyTemplateCanvas';
export default JerseyTemplateCanvas;
