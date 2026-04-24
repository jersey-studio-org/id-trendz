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

import { useEffect, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { resolveAssetUrl } from '../utils/productImage';

// ─────────────────────────────────────────────────────────────────────────────
// PNG asset paths (served from /public/assets/)
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.BASE_URL || '/';
const JERSEY_FRONT_PNG = resolveAssetUrl('/assets/jersey-front.png', BASE_URL);
const JERSEY_BACK_PNG = resolveAssetUrl('/assets/jersey-back.png', BASE_URL);
const JERSEY_MASK_FRONT_PNG = resolveAssetUrl('/assets/jersey-mask-front.png', BASE_URL);
const JERSEY_MASK_BACK_PNG = resolveAssetUrl('/assets/jersey-mask-back.png', BASE_URL);
const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 480;

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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampElementSize(element, nextSize) {
  const minSize = element.type === 'logo' ? 24 : 14;
  const maxSize = element.type === 'number' ? 120 : element.type === 'logo' ? 220 : 72;
  return clamp(Math.round(nextSize), minSize, maxSize);
}

function getSvgCoordinates(svgEl, clientX, clientY) {
  const point = svgEl.createSVGPoint();
  point.x = clientX;
  point.y = clientY;

  const ctm = svgEl.getScreenCTM();
  if (!ctm) {
    return { x: 0, y: 0 };
  }

  const transformed = point.matrixTransform(ctm.inverse());
  return {
    x: clamp(transformed.x, 0, VIEWBOX_WIDTH),
    y: clamp(transformed.y, 0, VIEWBOX_HEIGHT),
  };
}

function JerseyBase({ view, colorHex }) {
  const seamStroke = '#d6d6d6';
  const outlineStroke = '#b9b9b9';
  const collarStroke = '#9b9b9b';
  const hemFill = '#f7f7f7';

  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={`shirtShade-${view}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="38%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
        </linearGradient>
      </defs>

      <path
        d="M136 40 C154 26 177 20 200 20 C223 20 246 26 264 40 L286 62 L320 82 L350 116 L362 166 L362 224 C362 235 356 244 346 247 L312 257 C302 260 293 253 291 243 L283 187 C280 170 273 154 264 142 L246 116 L246 444 C246 456 236 466 224 466 L176 466 C164 466 154 456 154 444 L154 116 L136 142 C127 154 120 170 117 187 L109 243 C107 253 98 260 88 257 L54 247 C44 244 38 235 38 224 L38 166 L50 116 L80 82 L114 62 Z"
        fill={colorHex}
        stroke={outlineStroke}
        strokeWidth="2"
      />
      <path
        d="M136 40 C154 26 177 20 200 20 C223 20 246 26 264 40 L286 62 L320 82 L350 116 L362 166 L362 224 C362 235 356 244 346 247 L312 257 C302 260 293 253 291 243 L283 187 C280 170 273 154 264 142 L246 116 L246 444 C246 456 236 466 224 466 L176 466 C164 466 154 456 154 444 L154 116 L136 142 C127 154 120 170 117 187 L109 243 C107 253 98 260 88 257 L54 247 C44 244 38 235 38 224 L38 166 L50 116 L80 82 L114 62 Z"
        fill={`url(#shirtShade-${view})`}
      />
      <path
        d="M161 36 C171 52 184 60 200 60 C216 60 229 52 239 36"
        fill="none"
        stroke={collarStroke}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M171 39 C179 48 189 53 200 53 C211 53 221 48 229 39"
        fill="none"
        stroke={hemFill}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <line x1="136" y1="62" x2="154" y2="116" stroke={seamStroke} strokeWidth="1.5" />
      <line x1="264" y1="62" x2="246" y2="116" stroke={seamStroke} strokeWidth="1.5" />
      <line x1="154" y1="116" x2="154" y2="444" stroke={seamStroke} strokeWidth="1.2" />
      <line x1="246" y1="116" x2="246" y2="444" stroke={seamStroke} strokeWidth="1.2" />
      <path d="M80 82 L118 110 L108 150" fill="none" stroke={seamStroke} strokeWidth="1.2" />
      <path d="M320 82 L282 110 L292 150" fill="none" stroke={seamStroke} strokeWidth="1.2" />
      {view === 'back' && (
        <line
          x1="200"
          y1="60"
          x2="200"
          y2="444"
          stroke="#ebebeb"
          strokeWidth="1.2"
          strokeDasharray="6 5"
        />
      )}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: renders one jersey panel (front OR back)
// ─────────────────────────────────────────────────────────────────────────────

function JerseyPanel({
  svgRef,
  view,
  colorHex,
  frontDesign = { elements: [] },
  backDesign  = { elements: [] },
  selectedElementId = null,
  onSelectElement,
  onUpdateElement,
}) {
  const textureSrc = view === 'front' ? JERSEY_FRONT_PNG : JERSEY_BACK_PNG;
  const maskSrc = view === 'front' ? JERSEY_MASK_FRONT_PNG : JERSEY_MASK_BACK_PNG;
  const currentElements = view === 'front'
    ? (frontDesign.elements || [])
    : (backDesign.elements  || []);
  const dragStateRef = useRef(null);
  const touchPointsRef = useRef(new Map());
  const pinchStateRef = useRef(null);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const dragState = dragStateRef.current;
      const svgEl = svgRef.current;
      if (!svgEl) return;

      if (touchPointsRef.current.has(event.pointerId)) {
        touchPointsRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
      }

      const pinchState = pinchStateRef.current;
      if (pinchState && touchPointsRef.current.size >= 2) {
        event.preventDefault();
        const points = Array.from(touchPointsRef.current.values());
        const distance = Math.hypot(points[0].clientX - points[1].clientX, points[0].clientY - points[1].clientY);
        if (distance > 0) {
          onUpdateElement?.(view, pinchState.elementId, {
            size: clampElementSize(pinchState.element, pinchState.initialSize * (distance / pinchState.initialDistance)),
          });
        }
        return;
      }

      if (!dragState) return;

      event.preventDefault();
      const coords = getSvgCoordinates(svgEl, event.clientX, event.clientY);
      onUpdateElement?.(view, dragState.elementId, {
        x: clamp(coords.x - dragState.offsetX, 0, VIEWBOX_WIDTH),
        y: clamp(coords.y - dragState.offsetY, 0, VIEWBOX_HEIGHT),
      });
    };

    const stopDragging = (event) => {
      dragStateRef.current = null;
      touchPointsRef.current.delete(event.pointerId);
      if (touchPointsRef.current.size < 2) {
        pinchStateRef.current = null;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [onUpdateElement, svgRef, view]);

  function startDrag(event, element) {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    event.preventDefault();
    event.stopPropagation();

    touchPointsRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });

    if (event.pointerType === 'touch' && selectedElementId === element.id && touchPointsRef.current.size >= 2) {
      const points = Array.from(touchPointsRef.current.values());
      pinchStateRef.current = {
        elementId: element.id,
        element,
        initialSize: element.size,
        initialDistance: Math.max(
          Math.hypot(points[0].clientX - points[1].clientX, points[0].clientY - points[1].clientY),
          1,
        ),
      };
      return;
    }

    const coords = getSvgCoordinates(svgEl, event.clientX, event.clientY);
    dragStateRef.current = {
      elementId: element.id,
      offsetX: coords.x - element.x,
      offsetY: coords.y - element.y,
    };

    onSelectElement?.(view, element.id);
  }

  return (
    <div
      className="jersey-wrapper"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onSelectElement?.(view, null);
        }
      }}
    >
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
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        aria-label={`Jersey ${view} elements`}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onSelectElement?.(view, null);
          }
        }}
        onWheel={(event) => {
          const activeElement = currentElements.find((element) => element.id === selectedElementId);
          if (!activeElement) return;
          event.preventDefault();
          const delta = event.deltaY < 0 ? 4 : -4;
          onUpdateElement?.(view, activeElement.id, {
            size: clampElementSize(activeElement, activeElement.size + delta),
          });
        }}
      >
        <defs>
          <filter id={`jersey-text-shadow-${view}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>
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
                fontFamily={el.font || 'Arial'}
                letterSpacing="2"
                dominantBaseline="middle"
                filter={`url(#jersey-text-shadow-${view})`}
                style={{ cursor: 'grab', pointerEvents: 'auto', userSelect: 'none' }}
                onPointerDown={(event) => startDrag(event, el)}
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
                fontFamily={el.font || 'Arial'}
                letterSpacing="2"
                dominantBaseline="middle"
                filter={`url(#jersey-text-shadow-${view})`}
                style={{ cursor: 'grab', pointerEvents: 'auto', userSelect: 'none' }}
                onPointerDown={(event) => startDrag(event, el)}
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
                preserveAspectRatio="xMidYMid meet"
                style={{ cursor: 'grab', pointerEvents: 'auto' }}
                onPointerDown={(event) => startDrag(event, el)}
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
async function compositePanelToImage(textureSrc, maskSrc, colorHex, svgEl) {
  const [textureImg, maskImg, elementsImg] = await Promise.all([
    loadImage(textureSrc),
    loadImage(maskSrc),
    svgToImage(svgEl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width  = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext('2d');

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = EXPORT_W;
  colorCanvas.height = EXPORT_H;
  const colorCtx = colorCanvas.getContext('2d');

  colorCtx.fillStyle = colorHex;
  colorCtx.fillRect(0, 0, EXPORT_W, EXPORT_H);
  colorCtx.globalCompositeOperation = 'destination-in';
  colorCtx.drawImage(maskImg, 0, 0, EXPORT_W, EXPORT_H);

  ctx.drawImage(textureImg, 0, 0, EXPORT_W, EXPORT_H);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(colorCanvas, 0, 0);
  ctx.restore();
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
    selectedElementId = null,
    onSelectElement,
    onUpdateElement,
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
          compositePanelToImage(JERSEY_FRONT_PNG, JERSEY_MASK_FRONT_PNG, colorHex, fe),
          compositePanelToImage(JERSEY_BACK_PNG, JERSEY_MASK_BACK_PNG, colorHex, be),
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
  const sharedProps = useMemo(() => ({
    colorHex,
    frontDesign,
    backDesign,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
  }), [backDesign, colorHex, frontDesign, onSelectElement, onUpdateElement, selectedElementId]);

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
