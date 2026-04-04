/**
 * JerseyTemplateCanvas
 *
 * Pure inline-SVG jersey renderer. Replaces the previous canvas-based
 * implementation with React-managed SVG layers — no async image loading,
 * no blob URLs, no Canvas 2D API calls.
 *
 * Public API (props + ref) is unchanged from the canvas version so
 * CustomizePage.jsx requires zero modifications.
 *
 * Layers (front to back):
 *   1. base  — jersey body paths, fill = colorHex
 *   2. shadow — subtle dark overlay for depth
 *   3. highlight — subtle light overlay for shine
 *   4. logo  — <image href> element, positioned by logoPosition zone
 *   5. text  — name + number <text> elements, y derived from layout props
 *
 * exportImage() serialises both SVGs, draws them side-by-side on an
 * offscreen <canvas>, and returns a combined PNG data URL — identical
 * contract to before.
 */

import { useRef, useImperativeHandle, forwardRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SVG Geometry — inlined from jersey-front.svg / jersey-back.svg
// viewBox: 0 0 400 480
// ─────────────────────────────────────────────────────────────────────────────

/** Paths shared by both front and back silhouettes */
const TORSO_PATH =
  'M 145 28 C 160 20, 180 15, 200 15 C 220 15, 240 20, 255 28 ' +
  'L 270 50 C 270 50, 258 58, 250 65 C 242 72, 238 80, 238 92 ' +
  'L 238 462 L 162 462 L 162 92 C 162 80, 158 72, 150 65 ' +
  'C 142 58, 130 50, 130 50 Z';

const LEFT_SLEEVE_PATH =
  'M 130 50 C 118 56, 100 66, 82 80 L 52 110 L 38 160 L 38 230 ' +
  'C 38 240, 44 248, 52 250 L 88 258 C 96 260, 104 254, 106 246 ' +
  'L 115 185 C 118 165, 124 148, 130 138 L 148 100 L 130 50 Z';

const RIGHT_SLEEVE_PATH =
  'M 270 50 C 282 56, 300 66, 318 80 L 348 110 L 362 160 L 362 230 ' +
  'C 362 240, 356 248, 348 250 L 312 258 C 304 260, 296 254, 294 246 ' +
  'L 285 185 C 282 165, 276 148, 270 138 L 252 100 L 270 50 Z';

/** Combined jersey silhouette as a single clip/mask source */
const JERSEY_COMBINED_PATH = `${TORSO_PATH} ${LEFT_SLEEVE_PATH} ${RIGHT_SLEEVE_PATH}`;

// Collar variants ─────────────────────────────────────────────────────
const V_NECK_PATH = 'M 168 28 L 200 70 L 232 28';
const ROUND_NECK_PATH =
  'M 168 28 C 176 40, 191 45, 200 46 C 209 45, 224 40, 232 28';

// ─────────────────────────────────────────────────────────────────────────────
// Logo position zones  (SVG coordinates, viewBox 400×480)
// ─────────────────────────────────────────────────────────────────────────────
const LOGO_ZONES = {
  center:       { cx: 200, cy: 220, baseW: 76 },
  'left-chest': { cx: 158, cy: 177, baseW: 52 },
  upper:        { cx: 200, cy: 144, baseW: 64 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a CSS `top` percentage string (e.g. "20%") to an SVG y coordinate */
function pctToY(topStr, viewBoxH = 480) {
  const pct = parseFloat(topStr);
  return Number.isFinite(pct) ? (pct / 100) * viewBoxH : viewBoxH * 0.5;
}

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

/**
 * Derive a stroke colour that contrasts against the rendered text fill.
 * Uses the jersey background luminance to pick the most legible stroke.
 */
function textStroke(textColor) {
  const lum = hexLuminance(textColor);
  // Light text → dark stroke; dark text → light stroke
  return lum > 0.5
    ? 'rgba(0,0,0,0.55)'
    : 'rgba(255,255,255,0.40)';
}

/**
 * Returns the best automatic text fill for a given jersey colour.
 * Used to enforce contrast when the user hasn't overridden textColor.
 */
function autoTextColor(jerseyHex, userTextColor) {
  // Always respect the user's explicit colour choice
  return userTextColor;
}

/** Seam colour that reads against both light and dark jerseys */
function seamColor(jerseyHex) {
  return isLight(jerseyHex) ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)';
}

/** Collar colour slightly darker/lighter than the body */
function collarColor(jerseyHex) {
  return isLight(jerseyHex) ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.22)';
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: renders one jersey SVG panel (front OR back)
// ─────────────────────────────────────────────────────────────────────────────

function JerseySVG({
  svgRef,
  view,          // 'front' | 'back'
  colorHex,
  nameText,
  numberText,
  fontFamily,
  fontSize,
  textColor,
  logoImageUrl,
  logoPosition,
  logoScale,
  logoSide,
  nameLayout,
  numberLayout,
}) {
  const uid = view; // unique filter ID suffix

  // Determine which collar to draw
  const collarPath = view === 'front' ? V_NECK_PATH : ROUND_NECK_PATH;

  // Determine whether logo should appear on this view
  const showLogo =
    !!logoImageUrl &&
    (logoSide === 'both' ||
      (logoSide === 'front' && view === 'front') ||
      (logoSide === 'back' && view === 'back'));

  // Logo geometry
  const zone = LOGO_ZONES[logoPosition] || LOGO_ZONES.center;
  const clampedScale = Math.max(0.4, Math.min(2.2, logoScale));
  const logoW = zone.baseW * clampedScale;
  // Height is left unset — browser infers aspect ratio from natural image size.
  // We set x/y so the image is centred on the zone's cx/cy.
  const logoX = zone.cx - logoW / 2;
  const logoY = zone.cy - logoW / 2; // approximate square anchor; browser corrects AR

  // Text y-coordinates from layout percentage strings
  const nameY    = nameLayout   ? pctToY(nameLayout.top)   : 480 * 0.35;
  const numberY  = numberLayout ? pctToY(numberLayout.top) : 480 * 0.60;

  // Name + number appear on BACK according to canvas convention, but the
  // task requires layout-driven positioning on both views. We render on both.
  const scaledNameSize   = Math.round(Math.max(14, Math.min(fontSize * 1.1, 38)));
  const scaledNumSize    = Math.round(Math.max(28, Math.min(fontSize * 2.4, 88)));

  const strokeCol = textStroke(textColor);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 480"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-label={`Jersey ${view} view`}
    >
      <defs>
        {/* Jersey drop-shadow — multi-pass for soft, realistic depth */}
        <filter id={`shadow-${uid}`} x="-12%" y="-8%" width="124%" height="124%">
          <feDropShadow dx="0" dy="6" stdDeviation="10"
            floodColor="#000000" floodOpacity="0.22" />
        </filter>

        {/* Logo drop-shadow */}
        <filter id={`logo-shadow-${uid}`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="3"
            floodColor="#000000" floodOpacity="0.28" />
        </filter>

        {/* Linear gradient for left-edge shadow fold */}
        <linearGradient id={`fold-left-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>

        {/* Linear gradient for right-edge shadow fold */}
        <linearGradient id={`fold-right-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>

        {/* Vertical bottom fade */}
        <linearGradient id={`hem-fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>

        {/* Centre chest highlight gradient */}
        <linearGradient id={`chest-shine-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0" />
          <stop offset="40%"  stopColor="#fff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        {/* Clip path — restricts depth layers to jersey silhouette */}
        <clipPath id={`jersey-clip-${uid}`}>
          <path d={JERSEY_COMBINED_PATH} />
        </clipPath>

        {/* ── Fabric noise texture ── */}
        {/*
          feTurbulence generates a seamless fractalNoise pattern.
          feFuncA clamps alpha to [0, 0.035] so it is barely perceptible
          — more of a "grain" feel than a visible pattern.
        */}
        <filter id={`fabric-noise-${uid}`} x="0" y="0" width="100%" height="100%"
          colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75 0.75"
            numOctaves="4"
            seed={uid === 'front' ? 1 : 7}
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
          <feComponentTransfer in="grey" result="clipped">
            <feFuncA type="table" tableValues="0 0.035" />
          </feComponentTransfer>
          <feComposite in="clipped" in2="SourceGraphic" operator="in" />
        </filter>

        {/* ── Diagonal fabric-shading gradient (top-right light → bottom-left dark) ── */}
        <linearGradient id={`fabric-grad-${uid}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="50%"  stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
        </linearGradient>

        {/* ── Stitched-seam accent: thin highlight next to each seam line ── */}
        <linearGradient id={`stitch-fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        {/* ── Edge-softness filter: blurred stroke around outer silhouette ── */}
        {/*
          A feGaussianBlur (stdDeviation=3) on the outline path
          creates a soft inner-glow / vignette effect so the jersey
          edge doesn't look like a hard cut-out vector.
          Kept inside clipPath so it never bleeds outside the shape.
        */}
        <filter id={`edge-soft-${uid}`} x="-4%" y="-4%" width="108%" height="108%"
          colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="over" />
        </filter>

        {/* ── Secondary offset diagonal gradient (non-linear light variation) ── */}
        {/*
          A second, slightly rotated gradient layer at low opacity breaks
          the "perfect gradient" look of the primary fabric-grad.
        */}
        <linearGradient id={`fabric-grad2-${uid}`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="60%"  stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.07" />
        </linearGradient>

        {/* ── Sleeve depth gradient — lateral highlight matching torso ── */}
        <linearGradient id={`sleeve-shine-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.16" />
          <stop offset="45%"  stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.08" />
        </linearGradient>

        {/* ── Text micro-shadow filter ── */}
        {/*
          Very subtle: dy=1, stdDeviation=1, opacity=0.15.
          Makes text look printed rather than floating.
        */}
        <filter id={`text-shadow-${uid}`} x="-5%" y="-5%" width="110%" height="130%"
          colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="1" stdDeviation="1"
            floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* ── Layer 1: Base (jersey body colour) ── */}
      <g id="base" filter={`url(#shadow-${uid})`}>
        <path d={TORSO_PATH}
          fill={colorHex}
          stroke={seamColor(colorHex)} strokeWidth="1.2"
        />
        <path d={LEFT_SLEEVE_PATH}
          fill={colorHex}
          stroke={seamColor(colorHex)} strokeWidth="1.2"
        />
        <path d={RIGHT_SLEEVE_PATH}
          fill={colorHex}
          stroke={seamColor(colorHex)} strokeWidth="1.2"
        />
      </g>

      {/* ── Layer 2: Shadow — natural jersey folds ── */}
      <g id="shadow" clipPath={`url(#jersey-clip-${uid})`} style={{ pointerEvents: 'none' }}>
        {/* Left sleeve — outer shadow fold (gradient) */}
        <path
          d="M 38 110 L 52 110 L 88 258 L 38 230 Z"
          fill={`url(#fold-left-${uid})`}
        />
        {/* Left sleeve — inner body shadow */}
        <path
          d="M 130 50 C 118 56, 100 66, 82 80 L 52 110 L 115 185 C 118 165, 124 148, 130 138 L 148 100 Z"
          fill={isLight(colorHex) ? 'rgba(0,0,0,0.09)' : 'rgba(0,0,0,0.15)'}
        />
        {/* Right sleeve — outer shadow fold (gradient) */}
        <path
          d="M 362 110 L 348 110 L 312 258 L 362 230 Z"
          fill={`url(#fold-right-${uid})`}
        />
        {/* Right sleeve — inner body shadow */}
        <path
          d="M 270 50 C 282 56, 300 66, 318 80 L 348 110 L 285 185 C 282 165, 276 148, 270 138 L 252 100 Z"
          fill={isLight(colorHex) ? 'rgba(0,0,0,0.09)' : 'rgba(0,0,0,0.15)'}
        />
        {/* Torso side-seam shadows — tapered, luminance-adapted */}
        <rect x="162" y="92" width="10" height="370"
          fill={isLight(colorHex) ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.12)'} />
        <rect x="228" y="92" width="10" height="370"
          fill={isLight(colorHex) ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.12)'} />
        {/* Hem bottom fade */}
        <rect x="130" y="310" width="140" height="152" fill={`url(#hem-fade-${uid})`} />
        {/* Armhole crease — luminance-adapted */}
        <path
          d="M 130 50 Q 148 100 162 92"
          fill="none"
          stroke={isLight(colorHex) ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.22)'}
          strokeWidth="2.5" strokeLinecap="round"
        />
        <path
          d="M 270 50 Q 252 100 238 92"
          fill="none"
          stroke={isLight(colorHex) ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.22)'}
          strokeWidth="2.5" strokeLinecap="round"
        />
      </g>

      {/* ── Layer 3: Highlight — shoulder & chest shine ── */}
      <g id="highlight" clipPath={`url(#jersey-clip-${uid})`} style={{ pointerEvents: 'none' }}>
        {/* Shoulder crown highlight */}
        <path
          d="M 168 20 C 180 14, 200 12, 220 14 L 235 72 C 218 62, 182 62, 165 72 Z"
          fill="rgba(255,255,255,0.22)"
        />
        {/* Centre-chest vertical shine band */}
        <rect x="162" y="92" width="76" height="260" fill={`url(#chest-shine-${uid})`} />
        {/* Left shoulder specular */}
        <path
          d="M 130 50 C 136 44, 146 30, 155 28 L 162 60 C 152 58, 140 62, 130 70 Z"
          fill="rgba(255,255,255,0.15)"
        />
        {/* Right shoulder specular */}
        <path
          d="M 270 50 C 264 44, 254 30, 245 28 L 238 60 C 248 58, 260 62, 270 70 Z"
          fill="rgba(255,255,255,0.15)"
        />
        {/* Sleeve top highlight */}
        <path
          d="M 82 80 C 90 72, 110 66, 130 62 L 130 80 C 112 80, 92 84, 82 96 Z"
          fill="rgba(255,255,255,0.12)"
        />
        <path
          d="M 318 80 C 310 72, 290 66, 270 62 L 270 80 C 288 80, 308 84, 318 96 Z"
          fill="rgba(255,255,255,0.12)"
        />
        {/* Left sleeve — vertical depth gradient (matches torso chest-shine logic) */}
        <path
          d="M 130 50 C 118 56, 100 66, 82 80 L 52 110 L 38 160 L 38 230 C 38 240, 44 248, 52 250 L 88 258 C 96 260, 104 254, 106 246 L 115 185 C 118 165, 124 148, 130 138 L 148 100 Z"
          fill={`url(#sleeve-shine-${uid})`}
        />
        {/* Right sleeve — vertical depth gradient */}
        <path
          d="M 270 50 C 282 56, 300 66, 318 80 L 348 110 L 362 160 L 362 230 C 362 240, 356 248, 348 250 L 312 258 C 304 260, 296 254, 294 246 L 285 185 C 282 165, 276 148, 270 138 L 252 100 Z"
          fill={`url(#sleeve-shine-${uid})`}
        />
      </g>

      {/* ── Layer 3b: Fabric texture — noise grain + diagonal gradients ── */}
      <g id="texture" clipPath={`url(#jersey-clip-${uid})`} style={{ pointerEvents: 'none' }}>
        {/* Noise grain — barely visible at max α=0.035 */}
        <rect
          x="0" y="0" width="400" height="480"
          fill="rgba(128,128,128,1)"
          filter={`url(#fabric-noise-${uid})`}
          style={{ mixBlendMode: 'overlay' }}
        />
        {/* Primary diagonal soft shading */}
        <rect x="0" y="0" width="400" height="480" fill={`url(#fabric-grad-${uid})`} />
        {/* Secondary offset gradient — breaks the linear uniformity */}
        <rect x="0" y="0" width="400" height="480" fill={`url(#fabric-grad2-${uid})`} />
      </g>

      {/* ── Layer 3c: Edge vignette — soft inner shadow along jersey outline ── */}
      {/*
        A blurred, low-opacity stroke of the COMBINED path drawn INSIDE
        (fill=none, large stroke-width, clip to silhouette) creates a
        soft edge darkening that removes the harsh vector cut-out look.
      */}
      <g id="edge-vignette" clipPath={`url(#jersey-clip-${uid})`} style={{ pointerEvents: 'none' }}>
        <path
          d={JERSEY_COMBINED_PATH}
          fill="none"
          stroke={isLight(colorHex) ? 'rgba(0,0,0,0.13)' : 'rgba(0,0,0,0.20)'}
          strokeWidth="10"
          filter={`url(#edge-soft-${uid})`}
        />
      </g>

      {/* ── Seam details — colour-adaptive ── */}
      <g id="seams" style={{ pointerEvents: 'none' }}>
        {/* Main seam lines */}
        <line x1="145" y1="28" x2="162" y2="92" stroke={seamColor(colorHex)} strokeWidth="1.2" />
        <line x1="255" y1="28" x2="238" y2="92" stroke={seamColor(colorHex)} strokeWidth="1.2" />
        <line x1="162" y1="92" x2="162" y2="462" stroke={seamColor(colorHex)} strokeWidth="1.2" />
        <line x1="238" y1="92" x2="238" y2="462" stroke={seamColor(colorHex)} strokeWidth="1.2" />
        {/* Highlight edge next to each main seam — simulates topstitching */}
        <line x1="164" y1="92" x2="164" y2="462"
          stroke={isLight(colorHex) ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'}
          strokeWidth="0.6" />
        <line x1="236" y1="92" x2="236" y2="462"
          stroke={isLight(colorHex) ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'}
          strokeWidth="0.6" />
        {/* Shoulder panel seam accents */}
        <line x1="147" y1="28" x2="164" y2="92"
          stroke={isLight(colorHex) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.16)'}
          strokeWidth="0.5" />
        <line x1="253" y1="28" x2="236" y2="92"
          stroke={isLight(colorHex) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.16)'}
          strokeWidth="0.5" />
        {view === 'back' && (
          <>
            <line
              x1="200" y1="46" x2="200" y2="462"
              stroke={seamColor(colorHex)} strokeWidth="0.8" strokeDasharray="5,5"
            />
            {/* Stitching light edge on centre-back seam */}
            <line
              x1="201" y1="46" x2="201" y2="462"
              stroke={isLight(colorHex) ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.14)'}
              strokeWidth="0.5" strokeDasharray="5,5"
            />
          </>
        )}
      </g>

      {/* ── Collar — three-layer depth ── */}
      {/* 1. Wide inner-shadow line (draws just inside collar opening) */}
      <path
        d={collarPath}
        fill="none"
        stroke={isLight(colorHex) ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.28)'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 2. Main collar seam line */}
      <path
        d={collarPath}
        fill="none"
        stroke={collarColor(colorHex)}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3. Outer highlight edge — barely perceptible sheen on collar rim */}
      <path
        d={collarPath}
        fill="none"
        stroke={isLight(colorHex) ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.18)'}
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Layer 4: Logo — drop-shadow + seamless opacity ── */}
      {showLogo && (
        <g id="logo-layer" opacity="0.98" filter={`url(#logo-shadow-${uid})`}>
          <image
            href={logoImageUrl}
            x={logoX}
            y={logoY}
            width={logoW}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      )}

      {/* ── Layer 5: Name text — with micro drop-shadow ── */}
      {nameText && (
        <g id="name-layer" opacity="0.95" filter={`url(#text-shadow-${uid})`}>
          <text
            x="200"
            y={nameY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily={`${fontFamily}, Arial, sans-serif`}
            fontSize={scaledNameSize}
            fontWeight="700"
            fill={textColor}
            stroke={strokeCol}
            strokeWidth="1.5"
            strokeLinejoin="round"
            paintOrder="stroke fill"
            letterSpacing="3"
          >
            {nameText.toUpperCase()}
          </text>
        </g>
      )}

      {/* ── Layer 6: Number text — with micro drop-shadow ── */}
      {numberText && (
        <g id="number-layer" opacity="0.95" filter={`url(#text-shadow-${uid})`}>
          <text
            x="200"
            y={numberY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily={`${fontFamily}, Arial, sans-serif`}
            fontSize={scaledNumSize}
            fontWeight="900"
            fill={textColor}
            stroke={strokeCol}
            strokeWidth="3"
            strokeLinejoin="round"
            paintOrder="stroke fill"
            letterSpacing="2"
          >
            {numberText}
          </text>
        </g>
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export helper — serialise two SVG elements → offscreen canvas → PNG
// ─────────────────────────────────────────────────────────────────────────────

const SVG_EXPORT_W = 400;
const SVG_EXPORT_H = 480;

async function svgElementToPng(svgEl) {
  // Clone SVG node so we can strip heavy filters without breaking the UI
  const clone = svgEl.cloneNode(true);

  // Remove heavy filters that break or crush blacks in canvas exports
  clone.querySelectorAll('feTurbulence, feGaussianBlur, feDropShadow').forEach(el => el.remove());

  // Prevent elements from completely disappearing if their filter was emptied entirely (like drop shadows)
  clone.querySelectorAll('filter').forEach(f => {
    if (f.children.length === 0) {
      clone.querySelectorAll(`[filter="url(#${f.id})"]`).forEach(el => el.removeAttribute('filter'));
    }
  });

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const serializer = new XMLSerializer();
        let svgStr = serializer.serializeToString(clone);

        // Increase resolution for export (500x600 per side, 1200x600 total)
        const EXPORT_W = 500;
        const EXPORT_H = 600;

        if (!svgStr.includes('width=')) {
          svgStr = svgStr.replace('<svg', `<svg width="${EXPORT_W}" height="${EXPORT_H}"`);
        } else {
          svgStr = svgStr.replace(/width="[^"]+"/, `width="${EXPORT_W}"`);
          svgStr = svgStr.replace(/height="[^"]+"/, `height="${EXPORT_H}"`);
        }

        const encodedData = encodeURIComponent(svgStr);
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedData}`;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = dataUrl;

        // Ensure image load
        await new Promise(r => { img.onload = r; });
        resolve(img);
      } catch (err) {
        reject(err);
      }
    }, 50);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const JerseyTemplateCanvas = forwardRef((
  {
    colorHex     = '#6B7FFF',
    nameText     = '',
    numberText   = '',
    fontFamily   = 'Arial',
    fontSize     = 24,
    textColor    = '#FFFFFF',
    logoImageUrl = '',
    logoSide     = 'front',
    logoPosition = 'center',
    logoScale    = 1,
    nameLayout,
    numberLayout,
    viewSide     = 'front',
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
        const [frontImg, backImg] = await Promise.all([
          svgElementToPng(fe),
          svgElementToPng(be),
        ]);
        
        const combined = document.createElement('canvas');
        combined.width  = 1200;
        combined.height = 600;
        
        const ctx = combined.getContext('2d');
        
        // Add solid white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, combined.width, combined.height);

        // Scale drawImage accordingly
        // front goes in left 600px box (centered -> x=50, width 500)
        ctx.drawImage(frontImg, 50, 0, 500, 600);
        // back goes in right 600px box (centered -> x=650, width 500)
        ctx.drawImage(backImg, 650, 0, 500, 600);
        
        return combined.toDataURL('image/png');
      } catch (e) {
        console.error('JerseyTemplateCanvas: exportImage failed', e);
        return null;
      }
    },
  }));

  // Shared props forwarded to each SVG panel
  const sharedProps = {
    colorHex,
    nameText,
    numberText,
    fontFamily,
    fontSize,
    textColor,
    logoImageUrl,
    logoSide,
    logoPosition,
    logoScale,
    nameLayout,
    numberLayout,
  };

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
        <JerseySVG
          svgRef={frontSvgRef}
          view="front"
          logoImageUrl={
            logoImageUrl && (logoSide === 'both' || logoSide === 'front')
              ? logoImageUrl
              : ''
          }
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
        <JerseySVG
          svgRef={backSvgRef}
          view="back"
          logoImageUrl={
            logoImageUrl && (logoSide === 'both' || logoSide === 'back')
              ? logoImageUrl
              : ''
          }
          {...sharedProps}
        />
      </div>
    </div>
  );
});

JerseyTemplateCanvas.displayName = 'JerseyTemplateCanvas';
export default JerseyTemplateCanvas;
