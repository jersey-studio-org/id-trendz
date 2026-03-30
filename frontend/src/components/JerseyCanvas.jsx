// POLISH UPDATE - Enhanced JerseyCanvas with mask support, improved text alignment, and collar option
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { calculateFontScale, getContrastColor } from '../utils/canvasHelpers';
import maskFullSvg from '@images/templates/mask-full.svg';
import maskHalfSvg from '@images/templates/mask-half.svg';

/**
 * JerseyCanvas - Canvas-based jersey customization preview component
 * 
 * Props:
 * - baseImageUrl: URL of the base jersey image
 * - colorHex: Hex color for jersey tinting
 * - nameText: Text to display as name (e.g., "Prakhar")
 * - numberText: Text to display as number (e.g., "55")
 * - fontFamily: Font family for text
 * - fontSize: Font size for name (number will be larger)
 * - textColor: Color for text
 * - logoImageUrl: Optional uploaded logo image URL (data URL)
 * - logoSide: 'front' | 'back' | 'both'
 * - logoPosition: 'center' | 'left-chest' | 'upper'
 * - logoScale: Relative logo scale multiplier
 * - sleeveStyle: 'full' or 'half' for sleeve style
 * - collarStyle: 'regular' or 'collared' for collar style
 */
const JerseyCanvas = forwardRef(({
  baseImageUrl,
  colorHex,
  nameText = '',
  numberText = '',
  fontFamily = 'Arial',
  fontSize = 24,
  textColor = '#FFFFFF',
  logoImageUrl = '',
  logoSide = 'front',
  logoPosition = 'center',
  logoScale = 1,
  sleeveStyle = 'full',
  collarStyle = 'regular',
}, ref) => {
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const maskImageRef = useRef(null);
  const logoImageRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const isImageLoadedRef = useRef(false);
  const isMaskLoadedRef = useRef(false);
  const isLogoLoadedRef = useRef(false);
  const errorRef = useRef(null);
  const renderFnRef = useRef(null);

  // Expose exportImage method via ref
  useImperativeHandle(ref, () => ({
    exportImage: () => {
      // Ensure we have the latest rendered canvas
      if (!isImageLoadedRef.current || !imageRef.current) {
        console.warn('Cannot export: image not loaded');
        return null;
      }
      // Force synchronous render to ensure offscreen canvas is up to date
      render(true);
      
      // Use offscreen canvas if available, otherwise use visible canvas
      const canvasToExport = offscreenCanvasRef.current;
      if (!canvasToExport) {
        // Fallback to visible canvas
        const canvas = canvasRef.current;
        if (!canvas) {
          console.warn('Cannot export: canvas not available');
          return null;
        }
        return canvas.toDataURL('image/png');
      }
      return canvasToExport.toDataURL('image/png');
    },
  }));

  // Load base image
  useEffect(() => {
    if (!baseImageUrl) {
      isImageLoadedRef.current = false;
      errorRef.current = 'No image URL provided';
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      isImageLoadedRef.current = true;
      errorRef.current = null;
      render();
    };
    img.onerror = () => {
      isImageLoadedRef.current = false;
      errorRef.current = 'Failed to load image';
      console.error('Failed to load base image:', baseImageUrl);
      render(); // Render error state
    };
    img.src = baseImageUrl;
  }, [baseImageUrl]);

  // Load mask image based on sleeve and collar style
  useEffect(() => {
    const maskUrl = sleeveStyle === 'half' ? maskHalfSvg : maskFullSvg;
    const maskImg = new Image();
    maskImg.crossOrigin = 'anonymous';
    maskImg.onload = () => {
      maskImageRef.current = maskImg;
      isMaskLoadedRef.current = true;
      render();
    };
    maskImg.onerror = () => {
      console.warn('Failed to load mask, using default');
      isMaskLoadedRef.current = false;
      render();
    };
    maskImg.src = maskUrl;
  }, [sleeveStyle, collarStyle]);

  // Load uploaded logo image
  useEffect(() => {
    if (!logoImageUrl) {
      logoImageRef.current = null;
      isLogoLoadedRef.current = false;
      render();
      return;
    }

    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      logoImageRef.current = logoImg;
      isLogoLoadedRef.current = true;
      render();
    };
    logoImg.onerror = () => {
      logoImageRef.current = null;
      isLogoLoadedRef.current = false;
      console.warn('Failed to load uploaded logo image');
      render();
    };
    logoImg.src = logoImageUrl;
  }, [logoImageUrl]);

  // Render function (can be called synchronously for export)
  const render = (sync = false) => {
    const doRender = () => {
      // Use current props from closure
      const currentColorHex = colorHex;
      const currentNameText = nameText;
      const currentNumberText = numberText;
      const currentFontFamily = fontFamily;
      const currentFontSize = fontSize;
      const currentTextColor = textColor;
      const currentLogoSide = logoSide;
      const currentLogoPosition = logoPosition;
      const currentLogoScale = logoScale;
      const currentSleeveStyle = sleeveStyle;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      let width = rect.width;
      let height = rect.height;

      // If canvas has no size yet, use a default
      if (width === 0 || height === 0) {
        width = 400;
        height = 400;
      }

      // Set display size (CSS pixels)
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Create offscreen canvas for high-quality rendering
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      offscreen.width = width * dpr;
      offscreen.height = height * dpr;

      const ctx = canvas.getContext('2d');
      const offscreenCtx = offscreen.getContext('2d');

      if (!ctx || !offscreenCtx) {
        errorRef.current = 'Canvas context not available';
        return;
      }

      // Scale context for retina
      ctx.scale(dpr, dpr);
      offscreenCtx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      offscreenCtx.clearRect(0, 0, width, height);

      // Draw error state if image failed to load
      if (!isImageLoadedRef.current || !imageRef.current) {
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#6B7280';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Preview unavailable — try a different browser', width / 2, height / 2);
        return;
      }

      const img = imageRef.current;
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > canvasAspect) {
        // Image is wider
        drawHeight = height;
        drawWidth = height * imgAspect;
        drawX = (width - drawWidth) / 2;
        drawY = 0;
      } else {
        // Image is taller
        drawWidth = width;
        drawHeight = width / imgAspect;
        drawX = 0;
        drawY = (height - drawHeight) / 2;
      }

      // Draw base image to offscreen canvas
      offscreenCtx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // POLISH UPDATE - Apply color tint using mask to only color jersey area
      if (currentColorHex && currentColorHex !== 'transparent' && currentColorHex !== '') {
        offscreenCtx.save();
        
        // Create a temporary canvas for the color layer
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = width * dpr;
        colorCanvas.height = height * dpr;
        const colorCtx = colorCanvas.getContext('2d');
        colorCtx.scale(dpr, dpr);
        
        // Fill with color
        colorCtx.fillStyle = currentColorHex;
        colorCtx.fillRect(drawX, drawY, drawWidth, drawHeight);
        
        // Apply mask if available
        if (isMaskLoadedRef.current && maskImageRef.current) {
          colorCtx.globalCompositeOperation = 'destination-in';
          colorCtx.drawImage(
            maskImageRef.current,
            drawX, drawY, drawWidth, drawHeight
          );
        }
        
        // Blend the colored layer onto the jersey with multiply
        offscreenCtx.globalCompositeOperation = 'multiply';
        offscreenCtx.globalAlpha = 0.5;
        offscreenCtx.drawImage(colorCanvas, 0, 0);
        
        offscreenCtx.restore();
      }

      // Draw uploaded logo
      if (isLogoLoadedRef.current && logoImageRef.current) {
        const logoZones = {
          front: {
            center: { x: 0.5, y: 0.45, width: 0.24 },
            'left-chest': { x: 0.36, y: 0.34, width: 0.14 },
            upper: { x: 0.5, y: 0.3, width: 0.18 },
          },
          back: {
            center: { x: 0.5, y: 0.46, width: 0.24 },
            'left-chest': { x: 0.5, y: 0.38, width: 0.16 },
            upper: { x: 0.5, y: 0.28, width: 0.18 },
          },
        };

        const drawLogoInZone = (sideKey) => {
          const sideZones = logoZones[sideKey] || logoZones.front;
          const zone = sideZones[currentLogoPosition] || sideZones.center;
          const logo = logoImageRef.current;
          const logoAspect = logo.width / logo.height;
          const zoneWidth = drawWidth * zone.width * Math.max(0.6, Math.min(1.8, currentLogoScale));
          const zoneHeight = zoneWidth / logoAspect;
          const x = drawX + drawWidth * zone.x - zoneWidth / 2;
          const y = drawY + drawHeight * zone.y - zoneHeight / 2;
          offscreenCtx.drawImage(logo, x, y, zoneWidth, zoneHeight);
        };

        if (currentLogoSide === 'both') {
          drawLogoInZone('front');
          drawLogoInZone('back');
        } else {
          drawLogoInZone(currentLogoSide === 'back' ? 'back' : 'front');
        }
      }

      // Draw text (name and number) on back only
      if (currentNameText || currentNumberText) {
        offscreenCtx.save();

        // Load font dynamically if it's a Google Font
        if (currentFontFamily && currentFontFamily !== 'Arial' && !currentFontFamily.startsWith('"')) {
          // Try to load Google Font
          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(currentFontFamily)}:wght@400;700;800&display=swap`;
          link.rel = 'stylesheet';
          if (!document.head.querySelector(`link[href*="${currentFontFamily}"]`)) {
            document.head.appendChild(link);
          }
        }

        offscreenCtx.textAlign = 'center';
        offscreenCtx.textBaseline = 'middle';
        
        // Calculate font scale based on canvas size
        const fontScale = calculateFontScale(width);
        const scaledFontSize = currentFontSize * fontScale;
        
        // Auto-determine stroke color for contrast
        const strokeColor = getContrastColor(currentTextColor);
        offscreenCtx.fillStyle = currentTextColor;
        offscreenCtx.strokeStyle = strokeColor;

        const backZone = {
          name: { x: 0.5, y: 0.40, size: 1.0, width: 0.68 },
          number: { x: 0.5, y: 0.58, size: 2.25, width: 0.62 },
        };

        const drawFittedText = (text, zone, weight = 'bold') => {
          if (!text) return;

          const x = drawX + drawWidth * zone.x;
          const y = drawY + drawHeight * zone.y;
          const maxWidth = drawWidth * zone.width;
          let size = scaledFontSize * zone.size;

          offscreenCtx.font = `${weight} ${size}px ${currentFontFamily}, Arial, sans-serif`;
          while (offscreenCtx.measureText(text).width > maxWidth && size > 10) {
            size -= 1;
            offscreenCtx.font = `${weight} ${size}px ${currentFontFamily}, Arial, sans-serif`;
          }

          offscreenCtx.lineWidth = Math.max(2, size * 0.09);
          offscreenCtx.shadowColor = 'rgba(0,0,0,0.35)';
          offscreenCtx.shadowBlur = Math.max(4, size * 0.2);
          offscreenCtx.shadowOffsetY = Math.max(1, size * 0.06);

          offscreenCtx.strokeText(text, x, y);
          offscreenCtx.fillText(text, x, y);

          offscreenCtx.shadowBlur = 0;
          offscreenCtx.shadowOffsetY = 0;
        };

        drawFittedText(currentNumberText, backZone.number, '800');
        drawFittedText(currentNameText, backZone.name, '700');

        offscreenCtx.restore();
      }

      // Copy offscreen canvas to visible canvas
      // Reset transform before drawing
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(offscreen, 0, 0);
    };

    if (sync) {
      // For export, render immediately
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      doRender();
    } else {
      // Debounce regular renders
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      renderTimeoutRef.current = setTimeout(doRender, 100);
    }
  };

  // Store latest render function in ref
  renderFnRef.current = render;

  // Handle canvas resize using ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      // Use ref to get latest render function
      if (renderFnRef.current) {
        renderFnRef.current();
      }
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Re-render when props change
  useEffect(() => {
    render();
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [
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
    sleeveStyle,
    collarStyle,
  ]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        aria-label="Jersey customization preview"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          borderRadius: 'var(--radius-sm)',
        }}
      />
      <noscript>
        <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
          Preview unavailable — JavaScript is required for customization preview.
        </div>
      </noscript>
    </div>
  );
});

JerseyCanvas.displayName = 'JerseyCanvas';

export default JerseyCanvas;

