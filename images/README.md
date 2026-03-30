# Centralized Images Directory

All images for the Jersey Website are now organized in this root-level `images` folder with clear, descriptive naming and organization by type.

## Folder Structure

```
images/
├── branding/              # Logo and branding assets
│   ├── logo-main.png      # Primary company logo (PNG format)
│   ├── logo-placeholder.png
│   └── logo.svg           # Vector logo fallback
├── hero/                  # Hero section banner assets
│   ├── hero-main.png      # Primary hero banner image
│   ├── hero-placeholder.png
│   └── backgrounds/       # Optional hero background overlays
│       ├── background-fabric-texture.jpg
│       ├── background-sport-athlete.jpg
│       ├── background-running-sports.jpg
│       └── background-sports-team.jpg
├── products/              # Product catalog jersey images
│   ├── jersey-1-collared-red.jpeg
│   ├── jersey-2-collared-blue.jpeg
│   ├── jersey-3-collared-black.jpeg
│   ├── jersey-4-collared-white.jpeg
│   ├── jersey-5-collared-navy.jpeg
│   ├── jersey-6-noncollared-red.jpeg
│   ├── jersey-7-noncollared-blue.jpeg
│   ├── jersey-8-noncollared-black.jpeg
│   └── jersey-9-noncollared-white.jpeg
└── templates/             # Customization mask/template overlays
    ├── mask-full.svg      # Full jersey customization template
    └── mask-half.svg      # Half jersey customization template
```

## Image Naming Convention

Images follow a consistent naming pattern for easy identification:

- **Branding**: `logo-[variant].ext` (e.g., `logo-main.png`)
- **Hero**: `hero-[type].ext` (e.g., `hero-main.png`)
- **Backgrounds**: `background-[description].jpg` (e.g., `background-fabric-texture.jpg`)
- **Products**: `jersey-[number]-[type]-[color].jpeg` (e.g., `jersey-1-collared-red.jpeg`)
- **Templates**: `mask-[coverage].svg` (e.g., `mask-full.svg`)

## Asset Usage

### React Component Imports

React components use the `@images` alias to import assets:

```jsx
// Header.jsx - Branding
import logoPng from '@images/branding/logo-main.png';
import logoSvg from '@images/branding/logo.svg';

// Hero.jsx - Hero banners
import heroImage from '@images/hero/hero-main.png';

// JerseyCanvas.jsx - Customization templates
import maskFullSvg from '@images/templates/mask-full.svg';
```

### Runtime Data References

Product catalog (`frontend/public/products.json`) references images via REST paths:

```json
{
  "images": ["/images/products/jersey-1-collared-red.jpeg"],
  "thumbnails": ["/images/products/jersey-1-collared-red.jpeg"]
}
```

## Adding New Images

When adding new images:

1. **Place the file** in the appropriate subfolder
2. **Rename descriptively** following the naming convention
3. **Update references**:
   - For React imports: add to the component with `@images/...` path
   - For product data: update `frontend/public/products.json`
4. **Test locally**: Run `npm run dev:frontend` and verify images load

## Build & Deployment

During frontend build (`npm run deploy:frontend`):
- React component imports are bundled with hashes (e.g., `logo-DAfHl7oq.png`)
- Runtime paths in `products.json` are preserved as `/images/...`
- All referenced images must be present in this folder

## Specifications

### Image Formats

| Type | Format | Recommendation |
|------|--------|-----------------|
| Logos, Templates | SVG or PNG | SVG for scalability, PNG as fallback |
| Hero Banners | PNG, JPG | PNG for quality, JPG for size |
| Backgrounds | JPG | Best for photographic content |
| Products | JPEG | Optimized for web, ~300-500 KB |

### Optimization Guidelines

- **Product images**: 1200×900px, < 500 KB
- **Hero images**: 1920×1080px, < 800 KB
- **Backgrounds**: 1920×1080px, < 600 KB
- **Logos**: Minimal size, vector preferred (< 50 KB)

## Related Configuration

- **Vite Alias**: `@images` → `../images` (from `frontend/`)
- **Component Imports**: Use `@images/...` for bundled assets
- **Product Data**: Use `/images/...` for runtime paths
- **Public Serving**: Development server maps `/images` to this root folder

## Legacy References

Previous image locations (now deprecated):
- `frontend/src/assets/product-images/` → Use `images/products/` instead
- `frontend/public/product-images/` → Use `images/products/` instead
- `frontend/src/assets/branding/` → Use `images/branding/` instead
- `frontend/src/assets/hero/` → Use `images/hero/` instead
- `frontend/src/assets/masks/` → Use `images/templates/` instead
