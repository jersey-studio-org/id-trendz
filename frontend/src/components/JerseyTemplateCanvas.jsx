import { useEffect, useMemo, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { resolveAssetUrl } from '../utils/productImage';
import { resolveFontFamily } from './FontSelector';

const BASE_URL = import.meta.env.BASE_URL || '/';
const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 480;
const EXPORT_W = 500;
const EXPORT_H = 600;

const VIEW_ORDER = ['front', 'back', 'left', 'right'];
const VIEW_LABELS = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
};
function normalizeNeckType(neckType) {
  if (neckType === 'vneck' || neckType === 'v-neck' || neckType === 'v') return 'vneck';
  if (neckType === 'collared' || neckType === 'collar') return 'collared';
  return 'round';
}

function normalizeSleeveType(sleeveType) {
  return sleeveType === 'full' || sleeveType === 'full-sleeve' ? 'full' : 'half';
}

function getTextureSrc(view, neckType, sleeveType) {
  const neck = normalizeNeckType(neckType);
  const sleeve = normalizeSleeveType(sleeveType);
  const legacyRoundHalf = neck === 'round' && sleeve === 'half';
  const filename = legacyRoundHalf
    ? `jersey-${view}.png`
    : `jersey-${neck}-${sleeve}-${view}.png`;

  return resolveAssetUrl(`/assets/${filename}`, BASE_URL);
}

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

const isLight = (hex) => hexLuminance(hex) > 0.35;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampElementSize(element, nextSize) {
  const minSize = element.type === 'logo' ? 24 : 14;
  const maxSize = element.type === 'logo' ? 220 : 120;
  return clamp(Math.round(nextSize), minSize, maxSize);
}

function estimateTextWidth(text, fontSize) {
  return Math.max((text?.length || 1) * fontSize * 0.62, fontSize * 1.8);
}

function buildElementTransform(element) {
  const rotation = Number.isFinite(Number(element.rotation)) ? Number(element.rotation) : 0;
  const skewX = Number.isFinite(Number(element.skewX)) ? Number(element.skewX) : 0;
  const skewY = Number.isFinite(Number(element.skewY)) ? Number(element.skewY) : 0;
  const scaleX = Number.isFinite(Number(element.scaleX)) ? Number(element.scaleX) : 1;
  const scaleY = Number.isFinite(Number(element.scaleY)) ? Number(element.scaleY) : 1;

  return [
    `translate(${element.x} ${element.y})`,
    `rotate(${rotation})`,
    `skewX(${skewX})`,
    `skewY(${skewY})`,
    `scale(${scaleX} ${scaleY})`,
  ].join(' ');
}

function buildTextCurvePath(element) {
  const curveAmount = Number.isFinite(Number(element.curve)) ? Number(element.curve) : 0;
  if (Math.abs(curveAmount) < 1) return null;

  const halfWidth = estimateTextWidth(element.value, element.size) / 2;
  const controlY = -(curveAmount / 100) * Math.max(element.size * 2.4, 28);

  return `M ${-halfWidth} 0 Q 0 ${controlY} ${halfWidth} 0`;
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

function JerseyPanel({
  svgRef,
  view,
  neckType,
  sleeveType,
  colorHex,
  design = { elements: [] },
  selectedElementId = null,
  onSelectElement,
  onUpdateElement,
}) {
  const textureSrc = getTextureSrc(view, neckType, sleeveType);
  const currentElements = design.elements || [];
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
      <div
        className="jersey-mask"
        style={{
          '--mask-color': colorHex,
          '--mask-image': `url("${textureSrc}")`,
        }}
      />

      <img
        className="jersey-texture"
        src={textureSrc}
        alt={`Jersey ${view}`}
        draggable={false}
      />

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
          const transform = buildElementTransform(el);

          if (el.type === 'text') {
            const curvePath = buildTextCurvePath(el);
            const pathId = curvePath ? `jersey-curve-${view}-${el.id}` : null;

            return (
              <g
                key={el.id}
                transform={transform}
                style={{ cursor: 'grab', pointerEvents: 'auto', userSelect: 'none' }}
                onPointerDown={(event) => startDrag(event, el)}
              >
                {curvePath ? (
                  <>
                    <path id={pathId} d={curvePath} fill="none" />
                    <text
                      textAnchor="middle"
                      fill={el.color}
                      fontSize={el.size}
                      fontWeight="bold"
                      fontFamily={resolveFontFamily(el.font || 'Arial')}
                      letterSpacing="2"
                      dominantBaseline="middle"
                      filter={`url(#jersey-text-shadow-${view})`}
                    >
                      <textPath href={`#${pathId}`} startOffset="50%">
                        {el.value}
                      </textPath>
                    </text>
                  </>
                ) : (
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill={el.color}
                    fontSize={el.size}
                    fontWeight="bold"
                    fontFamily={resolveFontFamily(el.font || 'Arial')}
                    letterSpacing="2"
                    dominantBaseline="middle"
                    filter={`url(#jersey-text-shadow-${view})`}
                  >
                    {el.value}
                  </text>
                )}
              </g>
            );
          }

          if (el.type === 'logo') {
            return (
              <g
                key={el.id}
                transform={transform}
                style={{ cursor: 'grab', pointerEvents: 'auto' }}
                onPointerDown={(event) => startDrag(event, el)}
              >
                <image
                  href={el.value}
                  x={-el.size / 2}
                  y={-el.size / 2}
                  width={el.size}
                  height={el.size}
                  preserveAspectRatio="xMidYMid meet"
                />
              </g>
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function svgToImage(svgEl) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
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
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
      } catch (err) {
        reject(err);
      }
    }, 50);
  });
}

async function compositePanelToImage(textureSrc, colorHex, svgEl) {
  const [textureImg, elementsImg] = await Promise.all([
    loadImage(textureSrc),
    svgToImage(svgEl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext('2d');

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = EXPORT_W;
  colorCanvas.height = EXPORT_H;
  const colorCtx = colorCanvas.getContext('2d');

  colorCtx.fillStyle = colorHex;
  colorCtx.fillRect(0, 0, EXPORT_W, EXPORT_H);
  colorCtx.globalCompositeOperation = 'destination-in';
  colorCtx.drawImage(textureImg, 0, 0, EXPORT_W, EXPORT_H);

  ctx.drawImage(textureImg, 0, 0, EXPORT_W, EXPORT_H);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(colorCanvas, 0, 0);
  ctx.restore();
  ctx.drawImage(elementsImg, 0, 0, EXPORT_W, EXPORT_H);

  return canvas;
}

const JerseyTemplateCanvas = forwardRef((
  {
    colorHex = '#888888',
    viewSide = 'front',
    frontDesign = { elements: [] },
    backDesign = { elements: [] },
    leftDesign = { elements: [] },
    rightDesign = { elements: [] },
    neckType = 'round',
    sleeveType = 'half',
    selectedElementId = null,
    onSelectElement,
    onUpdateElement,
    onViewChange,
    onDisplayViewChange,
  },
  ref
) => {
  const frontSvgRef = useRef(null);
  const backSvgRef = useRef(null);
  const leftSvgRef = useRef(null);
  const rightSvgRef = useRef(null);

  const svgRefs = useMemo(() => ({
    front: frontSvgRef,
    back: backSvgRef,
    left: leftSvgRef,
    right: rightSvgRef,
  }), []);

  const designs = useMemo(() => ({
    front: frontDesign,
    back: backDesign,
    left: leftDesign,
    right: rightDesign,
  }), [backDesign, frontDesign, leftDesign, rightDesign]);
  const [displayView, setDisplayView] = useState(viewSide);

  useEffect(() => {
    setDisplayView(viewSide);
  }, [viewSide]);

  useImperativeHandle(ref, () => ({
    exportImage: async () => {
      if (VIEW_ORDER.some((view) => !svgRefs[view].current)) return null;

      try {
        const panelCanvases = await Promise.all(
          VIEW_ORDER.map((view) => compositePanelToImage(getTextureSrc(view, neckType, sleeveType), colorHex, svgRefs[view].current))
        );

        const combined = document.createElement('canvas');
        combined.width = 1200;
        combined.height = 1200;

        const ctx = combined.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, combined.width, combined.height);

        const positions = [
          { x: 50, y: 0 },
          { x: 650, y: 0 },
          { x: 50, y: 600 },
          { x: 650, y: 600 },
        ];

        panelCanvases.forEach((panelCanvas, index) => {
          ctx.drawImage(panelCanvas, positions[index].x, positions[index].y, EXPORT_W, EXPORT_H);
        });

        return combined.toDataURL('image/png');
      } catch (e) {
        console.error('JerseyTemplateCanvas: exportImage failed', e);
        return null;
      }
    },
  }));

  const sharedProps = useMemo(() => ({
    colorHex,
    neckType,
    sleeveType,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
  }), [colorHex, neckType, onSelectElement, onUpdateElement, selectedElementId, sleeveType]);

  return (
    <div className={`jersey-template-views ${displayView === 'all' ? 'is-all-view' : ''}`}>
      <div className="jersey-active-stage">
        {VIEW_ORDER.map((view) => {
          const isVisible = displayView === 'all' || displayView === view;
          return (
            <div
              key={view}
              className={`jersey-view-panel ${isVisible ? 'is-active' : 'is-hidden'}`}
              aria-hidden={!isVisible}
            >
              <JerseyPanel
                svgRef={svgRefs[view]}
                view={view}
                design={designs[view]}
                {...sharedProps}
              />
            </div>
          );
        })}
      </div>

      <div className="jersey-view-dock" aria-label="Select jersey view">
        <button
          type="button"
          className={`jersey-view-switch ${displayView === 'all' ? 'is-active' : ''}`}
          aria-pressed={displayView === 'all'}
          onClick={() => { setDisplayView('all'); onDisplayViewChange?.('all'); }}
        >
          <span className="jersey-view-switch-dot" aria-hidden="true" />
          <span>All</span>
        </button>
        {VIEW_ORDER.map((view) => {
          const isActive = displayView === view;
          return (
            <button
              key={view}
              type="button"
              className={`jersey-view-switch ${isActive ? 'is-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => {
                setDisplayView(view);
                onViewChange?.(view);
                onDisplayViewChange?.(view);
              }}
            >
              <span className="jersey-view-switch-dot" aria-hidden="true" />
              <span>{VIEW_LABELS[view]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

JerseyTemplateCanvas.displayName = 'JerseyTemplateCanvas';
export default JerseyTemplateCanvas;

