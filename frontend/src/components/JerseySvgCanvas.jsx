import { useEffect, useImperativeHandle, useMemo, useRef, forwardRef } from 'react';

const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 480;
const EXPORT_W = 500;
const EXPORT_H = 600;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function svgToImage(svgEl) {
  return new Promise((resolve, reject) => {
    try {
      const clone = svgEl.cloneNode(true);
      clone.setAttribute('width', String(EXPORT_W));
      clone.setAttribute('height', String(EXPORT_H));

      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(clone);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

async function panelToCanvas(svgEl) {
  const svgImage = await svgToImage(svgEl);
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
  ctx.drawImage(svgImage, 0, 0, EXPORT_W, EXPORT_H);
  return canvas;
}

function JerseyBase({ view, colorHex }) {
  const seamStroke = '#d4d4d8';
  const outlineStroke = '#a1a1aa';
  const shadowStroke = '#ffffff';
  const collarStroke = '#8f8f97';
  const collarInner = '#f8fafc';
  const cuffFill = 'rgba(255,255,255,0.18)';
  const hemFill = 'rgba(255,255,255,0.16)';

  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={`shirtShade-${view}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="70%" stopColor="#000000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`sideShadow-${view}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.10" />
          <stop offset="18%" stopColor="#000000" stopOpacity="0.02" />
          <stop offset="82%" stopColor="#000000" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
        </linearGradient>
      </defs>

      <path
        d="M126 62 C141 44 163 34 200 34 C237 34 259 44 274 62 L294 80 C306 90 320 98 333 104 C343 109 349 116 353 129 L364 168 C366 176 367 184 367 193 L367 216 C367 227 360 236 350 239 L314 252 C301 256 289 248 286 235 L277 190 C274 174 268 158 259 144 L250 130 L250 440 C250 452 240 462 228 462 L172 462 C160 462 150 452 150 440 L150 130 L141 144 C132 158 126 174 123 190 L114 235 C111 248 99 256 86 252 L50 239 C40 236 33 227 33 216 L33 193 C33 184 34 176 36 168 L47 129 C51 116 57 109 67 104 C80 98 94 90 106 80 Z"
        fill={colorHex}
        stroke={outlineStroke}
        strokeWidth="2"
      />
      <path
        d="M126 62 C141 44 163 34 200 34 C237 34 259 44 274 62 L294 80 C306 90 320 98 333 104 C343 109 349 116 353 129 L364 168 C366 176 367 184 367 193 L367 216 C367 227 360 236 350 239 L314 252 C301 256 289 248 286 235 L277 190 C274 174 268 158 259 144 L250 130 L250 440 C250 452 240 462 228 462 L172 462 C160 462 150 452 150 440 L150 130 L141 144 C132 158 126 174 123 190 L114 235 C111 248 99 256 86 252 L50 239 C40 236 33 227 33 216 L33 193 C33 184 34 176 36 168 L47 129 C51 116 57 109 67 104 C80 98 94 90 106 80 Z"
        fill={`url(#shirtShade-${view})`}
      />
      <path
        d="M126 62 C141 44 163 34 200 34 C237 34 259 44 274 62 L294 80 C306 90 320 98 333 104 C343 109 349 116 353 129 L364 168 C366 176 367 184 367 193 L367 216 C367 227 360 236 350 239 L314 252 C301 256 289 248 286 235 L277 190 C274 174 268 158 259 144 L250 130 L250 440 C250 452 240 462 228 462 L172 462 C160 462 150 452 150 440 L150 130 L141 144 C132 158 126 174 123 190 L114 235 C111 248 99 256 86 252 L50 239 C40 236 33 227 33 216 L33 193 C33 184 34 176 36 168 L47 129 C51 116 57 109 67 104 C80 98 94 90 106 80 Z"
        fill={`url(#sideShadow-${view})`}
      />

      <path
        d="M160 47 C169 61 183 69 200 69 C217 69 231 61 240 47"
        fill="none"
        stroke={collarStroke}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M169 49 C177 59 188 64 200 64 C212 64 223 59 231 49"
        fill="none"
        stroke={collarInner}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M65 208 C80 214 95 218 110 222"
        fill="none"
        stroke={cuffFill}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M290 222 C305 218 320 214 335 208"
        fill="none"
        stroke={cuffFill}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M166 451 C182 455 218 455 234 451"
        fill="none"
        stroke={hemFill}
        strokeWidth="10"
        strokeLinecap="round"
      />

      <path d="M126 62 L150 130" fill="none" stroke={seamStroke} strokeWidth="1.5" />
      <path d="M274 62 L250 130" fill="none" stroke={seamStroke} strokeWidth="1.5" />
      <path d="M150 130 C152 220 152 350 150 440" fill="none" stroke={seamStroke} strokeWidth="1.2" />
      <path d="M250 130 C248 220 248 350 250 440" fill="none" stroke={seamStroke} strokeWidth="1.2" />
      <path d="M106 80 C120 92 132 108 141 144" fill="none" stroke={shadowStroke} strokeWidth="1.1" opacity="0.7" />
      <path d="M294 80 C280 92 268 108 259 144" fill="none" stroke={shadowStroke} strokeWidth="1.1" opacity="0.7" />
      <path d="M167 108 C179 116 190 119 200 119 C210 119 221 116 233 108" fill="none" stroke={shadowStroke} strokeWidth="1.1" opacity="0.6" />
      <path d="M175 165 C184 176 191 195 193 218" fill="none" stroke={shadowStroke} strokeWidth="1" opacity="0.4" />
      <path d="M225 165 C216 176 209 195 207 218" fill="none" stroke={shadowStroke} strokeWidth="1" opacity="0.4" />

      {view === 'back' && (
        <line
          x1="200"
          y1="69"
          x2="200"
          y2="448"
          stroke="#ececec"
          strokeWidth="1"
          strokeDasharray="6 5"
        />
      )}
    </g>
  );
}

function JerseyPanel({
  svgRef,
  view,
  colorHex,
  frontDesign = { elements: [] },
  backDesign = { elements: [] },
  onSelectElement,
  onUpdateElement,
}) {
  const currentElements = view === 'front'
    ? (frontDesign.elements || [])
    : (backDesign.elements || []);
  const dragStateRef = useRef(null);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const dragState = dragStateRef.current;
      const svgEl = svgRef.current;
      if (!dragState || !svgEl) return;

      event.preventDefault();
      const coords = getSvgCoordinates(svgEl, event.clientX, event.clientY);
      onUpdateElement?.(view, dragState.elementId, {
        x: clamp(coords.x - dragState.offsetX, 0, VIEWBOX_WIDTH),
        y: clamp(coords.y - dragState.offsetY, 0, VIEWBOX_HEIGHT),
      });
    };

    const stopDragging = () => {
      dragStateRef.current = null;
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
      <svg
        ref={svgRef}
        className="jersey-elements"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        aria-label={`Jersey ${view} preview`}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onSelectElement?.(view, null);
          }
        }}
      >
        <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="#f8fafc" />
        <JerseyBase view={view} colorHex={colorHex} />

        {currentElements.map((element) => {
          if (element.type === 'text' || element.type === 'number') {
            const fontSize = element.type === 'number' ? element.size * 1.5 : element.size;
            return (
              <text
                key={element.id}
                x={element.x}
                y={element.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={element.color}
                fontSize={fontSize}
                fontWeight="bold"
                letterSpacing="2"
                style={{ cursor: 'grab', pointerEvents: 'auto', userSelect: 'none' }}
                onPointerDown={(event) => startDrag(event, element)}
              >
                {element.value}
              </text>
            );
          }

          if (element.type === 'logo') {
            return (
              <image
                key={element.id}
                href={element.value}
                x={element.x - element.size / 2}
                y={element.y - element.size / 2}
                width={element.size}
                height={element.size}
                preserveAspectRatio="xMidYMid meet"
                style={{ cursor: 'grab', pointerEvents: 'auto' }}
                onPointerDown={(event) => startDrag(event, element)}
              />
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
}

const JerseySvgCanvas = forwardRef(({
  colorHex = '#888888',
  viewSide = 'front',
  frontDesign = { elements: [] },
  backDesign = { elements: [] },
  onSelectElement,
  onUpdateElement,
}, ref) => {
  const frontSvgRef = useRef(null);
  const backSvgRef = useRef(null);

  useImperativeHandle(ref, () => ({
    exportImage: async () => {
      const frontSvg = frontSvgRef.current;
      const backSvg = backSvgRef.current;
      if (!frontSvg || !backSvg) return null;

      try {
        const [frontCanvas, backCanvas] = await Promise.all([
          panelToCanvas(frontSvg),
          panelToCanvas(backSvg),
        ]);

        const combined = document.createElement('canvas');
        combined.width = 1200;
        combined.height = 600;
        const ctx = combined.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, combined.width, combined.height);
        ctx.drawImage(frontCanvas, 50, 0, EXPORT_W, EXPORT_H);
        ctx.drawImage(backCanvas, 650, 0, EXPORT_W, EXPORT_H);

        return combined.toDataURL('image/png');
      } catch (error) {
        console.error('JerseySvgCanvas: exportImage failed', error);
        return null;
      }
    },
  }));

  const sharedProps = useMemo(() => ({
    colorHex,
    frontDesign,
    backDesign,
    onSelectElement,
    onUpdateElement,
  }), [backDesign, colorHex, frontDesign, onSelectElement, onUpdateElement]);

  return (
    <div className="jersey-template-views">
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

JerseySvgCanvas.displayName = 'JerseySvgCanvas';

export default JerseySvgCanvas;
