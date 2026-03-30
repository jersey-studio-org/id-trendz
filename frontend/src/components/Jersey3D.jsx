import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Jersey3D - 3D jersey preview using WebGL (Three.js)
 * 
 * Props:
 * - baseImageUrl: URL of the base jersey image
 * - colorHex: Hex color for jersey tinting
 * - nameText: Text to display as name
 * - numberText: Text to display as number
 * - fontFamily: Font family for text
 * - fontSize: Font size for name
 * - textColor: Color for text
 * - logoImageUrl: Optional uploaded logo image URL (data URL)
 * - logoSide: 'front' | 'back' | 'both'
 * - logoPosition: 'center' | 'left-chest' | 'upper'
 * - logoScale: Relative logo scale multiplier
 * - sleeveStyle: 'full' or 'half' for sleeve style
 * 
 * Features:
 * - WebGL detection with graceful fallback
 * - Simple low-poly jersey geometry
 * - Canvas texture mapping for dynamic updates
 * - Orbit controls for rotation/zoom
 * - Auto-rotate animation when idle
 * - Performance monitoring
 */
const Jersey3D = forwardRef(({
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
}, ref) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const jerseyMeshRef = useRef(null);
  const canvasTextureRef = useRef(null);
  const textureCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isWebGLSupportedRef = useRef(false);
  const imageRef = useRef(null);
  const logoImageRef = useRef(null);
  const autoRotateTimeoutRef = useRef(null);
  const isAutoRotatingRef = useRef(true);
  const lastUpdateTimeRef = useRef(0);
  const renderTimeoutRef = useRef(null);

  // Check WebGL support using Three.js detection
  useEffect(() => {
    try {
      // Try to create a WebGL context
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      isWebGLSupportedRef.current = !!gl;
      if (!gl) {
        console.warn('WebGL not supported, falling back to 2D canvas');
      } else {
        // Additional check: try to create a WebGL renderer
        try {
          const testRenderer = new THREE.WebGLRenderer({ antialias: false });
          testRenderer.dispose();
        } catch (e) {
          isWebGLSupportedRef.current = false;
          console.warn('WebGL renderer creation failed:', e);
        }
      }
    } catch (e) {
      isWebGLSupportedRef.current = false;
      console.warn('WebGL check failed:', e);
    }
  }, []);

  // Expose exportImage method via ref (exports 2D canvas texture)
  useImperativeHandle(ref, () => ({
    exportImage: () => {
      if (textureCanvasRef.current) {
        return textureCanvasRef.current.toDataURL('image/png');
      }
      return null;
    },
  }));

  // Load base image
  useEffect(() => {
    if (!baseImageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      updateTexture();
    };
    img.onerror = () => {
      console.error('Failed to load base image:', baseImageUrl);
    };
    img.src = baseImageUrl;
  }, [baseImageUrl]);

  // Load uploaded logo image
  useEffect(() => {
    if (!logoImageUrl) {
      logoImageRef.current = null;
      updateTexture();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImageRef.current = img;
      updateTexture();
    };
    img.onerror = () => {
      logoImageRef.current = null;
      console.warn('Failed to load uploaded logo image for 3D texture');
      updateTexture();
    };
    img.src = logoImageUrl;
  }, [logoImageUrl]);

  // Create texture canvas and update texture
  const updateTexture = () => {
    if (!textureCanvasRef.current || !imageRef.current) return;

    const canvas = textureCanvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const width = 512 * dpr;
    const height = 512 * dpr;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale context for retina
    ctx.scale(dpr, dpr);
    const displayWidth = 512;
    const displayHeight = 512;

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw base image
    const img = imageRef.current;
    const imgAspect = img.width / img.height;
    const canvasAspect = displayWidth / displayHeight;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > canvasAspect) {
      drawHeight = displayHeight;
      drawWidth = displayHeight * imgAspect;
      drawX = (displayWidth - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = displayWidth;
      drawHeight = displayWidth / imgAspect;
      drawX = 0;
      drawY = (displayHeight - drawHeight) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Apply color tint
    if (colorHex && colorHex !== 'transparent' && colorHex !== '') {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = colorHex;

      if (sleeveStyle === 'half') {
        ctx.beginPath();
        ctx.rect(drawX + drawWidth * 0.2, drawY, drawWidth * 0.6, drawHeight);
        ctx.ellipse(
          drawX + drawWidth * 0.15,
          drawY + drawHeight * 0.25,
          drawWidth * 0.08,
          drawHeight * 0.15,
          0, 0, Math.PI * 2
        );
        ctx.ellipse(
          drawX + drawWidth * 0.85,
          drawY + drawHeight * 0.25,
          drawWidth * 0.08,
          drawHeight * 0.15,
          0, 0, Math.PI * 2
        );
        ctx.fill('evenodd');
      } else {
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
      }
      ctx.restore();
    }

    // Draw uploaded logo
    if (logoImageRef.current) {
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
        const zone = sideZones[logoPosition] || sideZones.center;
        const logo = logoImageRef.current;
        const logoAspect = logo.width / logo.height;
        const zoneWidth = drawWidth * zone.width * Math.max(0.6, Math.min(1.8, logoScale));
        const zoneHeight = zoneWidth / logoAspect;
        const x = drawX + drawWidth * zone.x - zoneWidth / 2;
        const y = drawY + drawHeight * zone.y - zoneHeight / 2;
        ctx.drawImage(logo, x, y, zoneWidth, zoneHeight);
      };

      if (logoSide === 'both') {
        drawLogoInZone('front');
        drawLogoInZone('back');
      } else {
        drawLogoInZone(logoSide === 'back' ? 'back' : 'front');
      }
    }

    // Draw text (name and number) on back only
    if (nameText || numberText) {
      ctx.save();

      // Load font if needed
      if (fontFamily && fontFamily !== 'Arial' && !fontFamily.startsWith('"')) {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700;800&display=swap`;
        link.rel = 'stylesheet';
        if (!document.head.querySelector(`link[href*="${fontFamily}"]`)) {
          document.head.appendChild(link);
        }
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = textColor;
      ctx.strokeStyle = '#000000';

      const backZone = {
        name: { x: 0.5, y: 0.40, size: 1.0, width: 0.68 },
        number: { x: 0.5, y: 0.58, size: 2.25, width: 0.62 },
      };

      const drawFittedText = (text, zone, weight = 'bold') => {
        if (!text) return;
        const x = drawX + drawWidth * zone.x;
        const y = drawY + drawHeight * zone.y;
        const maxWidth = drawWidth * zone.width;
        let size = fontSize * zone.size;

        ctx.font = `${weight} ${size}px ${fontFamily}, Arial, sans-serif`;
        while (ctx.measureText(text).width > maxWidth && size > 10) {
          size -= 1;
          ctx.font = `${weight} ${size}px ${fontFamily}, Arial, sans-serif`;
        }

        ctx.lineWidth = Math.max(2, size * 0.09);
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = Math.max(4, size * 0.2);
        ctx.shadowOffsetY = Math.max(1, size * 0.06);

        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      };

      drawFittedText(numberText, backZone.number, '800');
      drawFittedText(nameText, backZone.name, '700');

      ctx.restore();
    }

    // Update Three.js texture
    if (canvasTextureRef.current) {
      canvasTextureRef.current.needsUpdate = true;
    }
  };

  // Create simple jersey geometry (curved plane that looks like a shirt)
  // 
  // TO REPLACE WITH A 3D MODEL FILE:
  // 1. Place a GLTF/GLB model file at: frontend/public/3d/shirt.glb
  // 2. Install GLTFLoader: npm install three/examples/jsm/loaders/GLTFLoader
  // 3. Replace this function with async model loading:
  //    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  //    const loader = new GLTFLoader();
  //    const gltf = await loader.loadAsync('/3d/shirt.glb');
  //    return gltf.scene; // or gltf.scene.children[0] depending on model structure
  // 4. Update the mesh creation code to use the loaded model instead of geometry
  // 5. Ensure the model is low-poly (< 5000 triangles) for performance
  // 6. Model should be UV-mapped with texture coordinates for proper texture application
  const createJerseyGeometry = () => {
    // Create a curved plane for the front of the jersey
    const segments = 16;
    const geometry = new THREE.PlaneGeometry(2, 2.4, segments, segments);

    // Add slight curvature to make it look more like a shirt
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      // Create a subtle curve (front-facing)
      const z = Math.sin(x * 0.5) * 0.1 + Math.sin(y * 0.3) * 0.05;
      positions.setZ(i, z);
    }

    geometry.computeVertexNormals();
    return geometry;
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!isWebGLSupportedRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Create texture canvas
    if (!textureCanvasRef.current) {
      textureCanvasRef.current = document.createElement('canvas');
    }

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 4);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = false; // Disable shadows for performance
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 2, 2);
    scene.add(directionalLight);

    // Create jersey geometry
    const geometry = createJerseyGeometry();

    // Create canvas texture
    const canvasTexture = new THREE.CanvasTexture(textureCanvasRef.current);
    canvasTexture.wrapS = THREE.RepeatWrapping;
    canvasTexture.wrapT = THREE.RepeatWrapping;
    canvasTexture.flipY = false;
    canvasTextureRef.current = canvasTexture;

    // Create material with fabric-like properties
    const material = new THREE.MeshStandardMaterial({
      map: canvasTexture,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    // Create mesh
    const jerseyMesh = new THREE.Mesh(geometry, material);
    jerseyMesh.rotation.y = Math.PI; // Face the camera initially
    scene.add(jerseyMesh);
    jerseyMeshRef.current = jerseyMesh;

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.5;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 + 0.3; // Prevent flipping
    controls.minPolarAngle = Math.PI / 2 - 0.3;
    controlsRef.current = controls;

    // Handle controls interaction (pause auto-rotate)
    const onControlStart = () => {
      isAutoRotatingRef.current = false;
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }
      // Resume auto-rotate after 3 seconds of inactivity
      autoRotateTimeoutRef.current = setTimeout(() => {
        isAutoRotatingRef.current = true;
      }, 3000);
    };

    controls.addEventListener('start', onControlStart);

    // Initial texture update
    updateTexture();

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Auto-rotate when idle
      if (isAutoRotatingRef.current && controls) {
        jerseyMesh.rotation.y += 0.005;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onControlStart);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      canvasTexture.dispose();
    };
  }, []); // Only run once on mount

  // Update texture when props change
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    renderTimeoutRef.current = setTimeout(() => {
      updateTexture();
    }, 100);
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
  ]);

  // Show fallback message if WebGL is not supported
  if (!isWebGLSupportedRef.current) {
    return (
      <div className="jersey-3d-fallback">
        <div className="fallback-message">
          <p>3D preview not supported — using 2D preview instead.</p>
          <p className="fallback-note">Your browser or device doesn't support WebGL.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="jersey-3d-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    />
  );
});

Jersey3D.displayName = 'Jersey3D';

export default Jersey3D;

