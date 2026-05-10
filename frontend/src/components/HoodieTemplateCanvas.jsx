import { useEffect, useImperativeHandle, useMemo, useRef, forwardRef, useState } from 'react';
import { resolveAssetUrl } from '../utils/productImage';
import { resolveFontFamily } from './FontSelector';

const BASE_URL = import.meta.env.BASE_URL || '/';
const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 500;
const VIEW_ORDER = ['front', 'back', 'left', 'right'];
const VIEW_LABELS = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
};

function getTextureSrc(view) {
  return resolveAssetUrl(`/assets/hoodie-${view}.png`, BASE_URL);
}

function getMaskSrc(view) {
  return resolveAssetUrl(`/assets/hoodie-mask-${view}.png`, BASE_URL);
}

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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function svgToImage(svgEl, width, height) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const clone = svgEl.cloneNode(true);
        clone.setAttribute('width', String(width));
        clone.setAttribute('height', String(height));

        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(clone);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = (error) => { URL.revokeObjectURL(url); reject(error); };
        img.src = url;
      } catch (error) {
        reject(error);
      }
    }, 50);
  });
}

async function compositeHoodieToImage(textureSrc, maskSrc, colorHex, svgEl) {
  const [textureImg, maskImg] = await Promise.all([
    loadImage(textureSrc),
    loadImage(maskSrc),
  ]);
  const exportWidth = textureImg.naturalWidth || textureImg.width || 1024;
  const exportHeight = textureImg.naturalHeight || textureImg.height || 1024;
  const elementsImg = await svgToImage(svgEl, exportWidth, exportHeight);

  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext('2d');

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = exportWidth;
  colorCanvas.height = exportHeight;
  const colorCtx = colorCanvas.getContext('2d');

  colorCtx.fillStyle = colorHex;
  colorCtx.fillRect(0, 0, exportWidth, exportHeight);
  colorCtx.globalCompositeOperation = 'destination-in';
  colorCtx.drawImage(maskImg, 0, 0, exportWidth, exportHeight);

  ctx.drawImage(textureImg, 0, 0, exportWidth, exportHeight);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(colorCanvas, 0, 0);
  ctx.restore();
  ctx.drawImage(elementsImg, 0, 0, exportWidth, exportHeight);

  return canvas;
}

function HoodiePanel({
  svgRef,
  view,
  colorHex,
  design = { elements: [] },
  selectedElementId = null,
  onSelectElement,
  onUpdateElement,
}) {
  const textureSrc = getTextureSrc(view);
  const maskSrc = getMaskSrc(view);
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
    <div className="hoodie-view-panel">
      <div className="hoodie-view-badge">{VIEW_LABELS[view]} View</div>
      <div
        className="hoodie-wrapper"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onSelectElement?.(view, null);
          }
        }}
      >
        <div
          className="hoodie-mask"
          style={{
            '--mask-color': colorHex,
            '--mask-image': `url("${maskSrc}")`,
          }}
        />

        <img
          className="hoodie-texture"
          src={textureSrc}
          alt={`Hoodie ${view}`}
          draggable={false}
        />

        <svg
          ref={svgRef}
          className="hoodie-elements"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          aria-label={`Hoodie ${view} elements`}
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
            <filter id={`hoodie-text-shadow-${view}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>
          {currentElements.map((el) => {
            const transform = buildElementTransform(el);

            if (el.type === 'text') {
              const curvePath = buildTextCurvePath(el);
              const pathId = curvePath ? `hoodie-curve-${view}-${el.id}` : null;

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
                        filter={`url(#hoodie-text-shadow-${view})`}
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
                      filter={`url(#hoodie-text-shadow-${view})`}
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
    </div>
  );
}

const HoodieTemplateCanvas = forwardRef(({
  colorHex = '#888888',
  viewSide = 'front',
  frontDesign = { elements: [] },
  backDesign = { elements: [] },
  leftDesign = { elements: [] },
  rightDesign = { elements: [] },
  selectedElementId = null,
  onSelectElement,
  onUpdateElement,
  onViewChange,
  onDisplayViewChange,
}, ref) => {
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
          VIEW_ORDER.map((view) => compositeHoodieToImage(
            getTextureSrc(view),
            getMaskSrc(view),
            colorHex,
            svgRefs[view].current,
          ))
        );

        const cellWidth = Math.max(...panelCanvases.map((canvas) => canvas.width));
        const cellHeight = Math.max(...panelCanvases.map((canvas) => canvas.height));
        const combined = document.createElement('canvas');
        combined.width = cellWidth * 2;
        combined.height = cellHeight * 2;

        const ctx = combined.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, combined.width, combined.height);

        panelCanvases.forEach((panelCanvas, index) => {
          const column = index % 2;
          const row = Math.floor(index / 2);
          const x = column * cellWidth + ((cellWidth - panelCanvas.width) / 2);
          const y = row * cellHeight + ((cellHeight - panelCanvas.height) / 2);
          ctx.drawImage(panelCanvas, x, y, panelCanvas.width, panelCanvas.height);
        });

        return combined.toDataURL('image/png');
      } catch (error) {
        console.error('HoodieTemplateCanvas: exportImage failed', error);
        return null;
      }
    },
  }));

  const sharedProps = useMemo(() => ({
    colorHex,
    selectedElementId,
    onSelectElement,
    onUpdateElement,
  }), [colorHex, onSelectElement, onUpdateElement, selectedElementId]);

  return (
    <div className={`hoodie-template-views ${displayView === 'all' ? 'is-all-view' : ''}`}>
      <div className="hoodie-active-stage">
        {VIEW_ORDER.map((view) => {
          const isVisible = displayView === 'all' || displayView === view;
          return (
            <div
              key={view}
              className={`hoodie-view-stage ${isVisible ? 'is-active' : 'is-hidden'}`}
              aria-hidden={!isVisible}
            >
              <HoodiePanel
                svgRef={svgRefs[view]}
                view={view}
                design={designs[view]}
                {...sharedProps}
              />
            </div>
          );
        })}
      </div>

      <div className="jersey-view-dock" aria-label="Select hoodie view">
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

HoodieTemplateCanvas.displayName = 'HoodieTemplateCanvas';
export default HoodieTemplateCanvas;
