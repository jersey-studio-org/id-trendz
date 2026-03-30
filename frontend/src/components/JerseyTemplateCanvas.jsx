/**
 * JerseyTemplateCanvas
 *
 * Renders a side-by-side FRONT and BACK view of a blank jersey template.
 * The template is a clean SVG silhouette — completely independent of any product photo.
 * Users can customise:
 *   - Body colour (hex)
 *   - Name text (rendered on back)
 *   - Number text (rendered on back, large)
 *   - Font, font size, text colour
 *   - Uploaded logo (side + position + scale, rendered on front by default)
 *
 * The component draws everything onto two HTML canvases (one per view)
 * and exposes exportImage() via ref which returns a combined PNG data-URL.
 */
import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { calculateFontScale, getContrastColor } from '../utils/canvasHelpers';
import jerseyFrontSvg from '../assets/templates/jersey-front.svg';
import jerseyBackSvg from '../assets/templates/jersey-back.svg';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Load an image into an HTMLImageElement, returns a Promise. */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Re-colour a jersey SVG template: replace all #FFFFFF fills (jersey body)
 * with the chosen colour and return a blob URL ready to draw.
 */
function recolorSvg(svgText, colorHex) {
  const hex = colorHex && colorHex !== 'transparent' ? colorHex : '#6B7FFF';
  // Replace fill="#FFFFFF" (body) but leave stroke colours untouched.
  // Only patches fill on path/rect elements inside jersey-body groups.
  const coloured = svgText
    .replace(/(<(?:path|rect)[^>]*fill=")#FFFFFF(")/g, `$1${hex}$2`);
  const blob = new Blob([coloured], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

// Cache raw SVG text so we only fetch once per component lifetime
let _frontSvgText = null;
let _backSvgText = null;

async function getFrontSvg() {
  if (_frontSvgText) return _frontSvgText;
  const res = await fetch(jerseyFrontSvg);
  _frontSvgText = await res.text();
  return _frontSvgText;
}

async function getBackSvg() {
  if (_backSvgText) return _backSvgText;
  const res = await fetch(jerseyBackSvg);
  _backSvgText = await res.text();
  return _backSvgText;
}

// ─────────────────────────────────────────────────────────────
// Canvas drawing helpers
// ─────────────────────────────────────────────────────────────

const CANVAS_W = 320;
const CANVAS_H = 384; // 4:5 ratio matching the SVG viewBox

/**
 * Draw the jersey template (already re-coloured) centred on the canvas,
 * then overlay text / logo according to the view (front or back).
 */
function drawView(canvas, jerseyImg, opts) {
  const {
    view,          // 'front' | 'back'
    nameText,
    numberText,
    fontFamily,
    fontSize,
    textColor,
    logoImg,
    logoPosition,
    logoScale,
    logoSide,
  } = opts;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_W * dpr;
  canvas.height = CANVAS_H * dpr;
  canvas.style.width = `${CANVAS_W}px`;
  canvas.style.height = `${CANVAS_H}px`;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);

  // ── Jersey silhouette ──
  const aspect = jerseyImg.width / jerseyImg.height;
  const drawH = CANVAS_H;
  const drawW = drawH * aspect;
  const offsetX = (CANVAS_W - drawW) / 2;
  const offsetY = 0;
  ctx.drawImage(jerseyImg, offsetX, offsetY, drawW, drawH);

  // ── Logo overlay ──
  const showLogoOnFront = logoImg && (logoSide === 'front' || logoSide === 'both');
  const showLogoOnBack  = logoImg && (logoSide === 'back'  || logoSide === 'both');

  if ((view === 'front' && showLogoOnFront) || (view === 'back' && showLogoOnBack)) {
    const zones = {
      center:      { cx: 0.5,   cy: 0.46, maxW: 0.24 },
      'left-chest':{ cx: 0.395, cy: 0.37, maxW: 0.14 },
      upper:       { cx: 0.5,   cy: 0.30, maxW: 0.18 },
    };
    const zone = zones[logoPosition] || zones.center;
    const scale = Math.max(0.6, Math.min(1.8, logoScale));
    const logoW = drawW * zone.maxW * scale;
    const logoH = logoW * (logoImg.height / logoImg.width);
    ctx.drawImage(
      logoImg,
      offsetX + drawW * zone.cx - logoW / 2,
      offsetY + drawH * zone.cy - logoH / 2,
      logoW,
      logoH,
    );
  }

  // ── Text: name + number on back only ──
  if (view === 'back' && (nameText || numberText)) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontScale = calculateFontScale(CANVAS_W);
    const scaledBase = fontSize * fontScale;
    const strokeColor = getContrastColor(textColor);
    ctx.fillStyle = textColor;
    ctx.strokeStyle = strokeColor;

    const centerX = offsetX + drawW * 0.5;

    // Name zone — upper mid-back
    if (nameText) {
      const nameY = offsetY + drawH * 0.38;
      const maxNameW = drawW * 0.65;
      let nameSize = scaledBase * 1.0;
      ctx.font = `bold ${nameSize}px ${fontFamily}, Arial, sans-serif`;
      while (ctx.measureText(nameText).width > maxNameW && nameSize > 10) {
        nameSize -= 1;
        ctx.font = `bold ${nameSize}px ${fontFamily}, Arial, sans-serif`;
      }
      ctx.lineWidth = Math.max(2, nameSize * 0.09);
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = Math.max(4, nameSize * 0.2);
      ctx.shadowOffsetY = Math.max(1, nameSize * 0.06);
      ctx.strokeText(nameText.toUpperCase(), centerX, nameY);
      ctx.fillText(nameText.toUpperCase(), centerX, nameY);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    // Number zone — large, lower mid-back
    if (numberText) {
      const numY = offsetY + drawH * 0.56;
      const maxNumW = drawW * 0.60;
      let numSize = scaledBase * 2.6;
      ctx.font = `800 ${numSize}px ${fontFamily}, Arial, sans-serif`;
      while (ctx.measureText(numberText).width > maxNumW && numSize > 12) {
        numSize -= 2;
        ctx.font = `800 ${numSize}px ${fontFamily}, Arial, sans-serif`;
      }
      ctx.lineWidth = Math.max(2, numSize * 0.07);
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = Math.max(4, numSize * 0.15);
      ctx.shadowOffsetY = Math.max(1, numSize * 0.05);
      ctx.strokeText(numberText, centerX, numY);
      ctx.fillText(numberText, centerX, numY);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const JerseyTemplateCanvas = forwardRef(({
  colorHex = '#6B7FFF',
  nameText = '',
  numberText = '',
  fontFamily = 'Arial',
  fontSize = 24,
  textColor = '#FFFFFF',
  logoImageUrl = '',
  logoSide = 'front',
  logoPosition = 'center',
  logoScale = 1,
}, ref) => {
  const frontCanvasRef = useRef(null);
  const backCanvasRef  = useRef(null);
  const renderTimeoutRef = useRef(null);

  // Refs that hold the loaded images
  const frontImgRef = useRef(null);
  const backImgRef  = useRef(null);
  const logoImgRef  = useRef(null);
  const blobUrlsRef = useRef({ front: null, back: null });

  // Expose exportImage — combines front+back side by side
  useImperativeHandle(ref, () => ({
    exportImage: () => {
      const fc = frontCanvasRef.current;
      const bc = backCanvasRef.current;
      if (!fc || !bc) return null;
      const combined = document.createElement('canvas');
      combined.width = fc.width + bc.width;
      combined.height = Math.max(fc.height, bc.height);
      const ctx = combined.getContext('2d');
      ctx.drawImage(fc, 0, 0);
      ctx.drawImage(bc, fc.width, 0);
      return combined.toDataURL('image/png');
    },
  }));

  // ── Core render ──
  const renderBoth = async () => {
    if (!frontImgRef.current || !backImgRef.current) return;
    const opts = {
      nameText, numberText, fontFamily, fontSize, textColor,
      logoImg: logoImgRef.current,
      logoPosition, logoScale, logoSide,
    };
    if (frontCanvasRef.current)
      drawView(frontCanvasRef.current, frontImgRef.current, { ...opts, view: 'front' });
    if (backCanvasRef.current)
      drawView(backCanvasRef.current, backImgRef.current, { ...opts, view: 'back' });
  };

  const scheduleRender = () => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(renderBoth, 60);
  };

  // ── Load / reload jersey template when colour changes ──
  useEffect(() => {
    let cancelled = false;
    const prevFront = blobUrlsRef.current.front;
    const prevBack  = blobUrlsRef.current.back;

    (async () => {
      try {
        const [frontText, backText] = await Promise.all([getFrontSvg(), getBackSvg()]);
        if (cancelled) return;

        const frontUrl = recolorSvg(frontText, colorHex);
        const backUrl  = recolorSvg(backText,  colorHex);
        blobUrlsRef.current = { front: frontUrl, back: backUrl };

        const [fi, bi] = await Promise.all([loadImage(frontUrl), loadImage(backUrl)]);
        if (cancelled) return;
        frontImgRef.current = fi;
        backImgRef.current  = bi;
        renderBoth();
      } catch (e) {
        console.error('JerseyTemplateCanvas: template load error', e);
      } finally {
        // Revoke old blob URLs after new images have loaded
        if (prevFront) URL.revokeObjectURL(prevFront);
        if (prevBack)  URL.revokeObjectURL(prevBack);
      }
    })();

    return () => { cancelled = true; };
  }, [colorHex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reload logo when URL changes ──
  useEffect(() => {
    if (!logoImageUrl) {
      logoImgRef.current = null;
      scheduleRender();
      return;
    }
    loadImage(logoImageUrl)
      .then(img => { logoImgRef.current = img; scheduleRender(); })
      .catch(() => { logoImgRef.current = null; scheduleRender(); });
  }, [logoImageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-render when text/font/logo display options change ──
  useEffect(() => {
    scheduleRender();
    return () => { if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current); };
  }, [nameText, numberText, fontFamily, fontSize, textColor, logoSide, logoPosition, logoScale]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="jersey-template-views">
      <div className="jersey-view-panel">
        <span className="jersey-view-label">Front</span>
        <canvas
          ref={frontCanvasRef}
          aria-label="Jersey front view"
          style={{ display: 'block', borderRadius: 'var(--radius-sm)' }}
        />
      </div>
      <div className="jersey-view-panel">
        <span className="jersey-view-label">Back</span>
        <canvas
          ref={backCanvasRef}
          aria-label="Jersey back view"
          style={{ display: 'block', borderRadius: 'var(--radius-sm)' }}
        />
      </div>
    </div>
  );
});

JerseyTemplateCanvas.displayName = 'JerseyTemplateCanvas';
export default JerseyTemplateCanvas;
