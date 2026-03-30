# Images Centralization Complete

## Summary

All images for the Jersey Website have been consolidated into a single root-level `images` folder with organized subfolders and descriptive naming.

## What Was Done

### 1. Centralized Image Storage

Created a unified `images/` directory at the project root with 5 organized subfolders:

```
images/
├── branding/        (3 files)  - Logos and brand assets
├── hero/           (2 files)  - Hero banners + backgrounds (4 files)
├── products/       (9 files)  - Jersey product catalog
└── templates/      (2 files)  - Customization masks
```

**Total: 20 images** consolidated from scattered locations across the project.

### 2. Descriptive Image Naming

All images have been renamed following consistent patterns:

| Category | Old Name | New Name | Example |
|----------|----------|----------|---------|
| Logos | `logo.png`, `logo-placeholder.png` | `logo-main.png`, `logo-placeholder.png` | — |
| Hero | `hero-image.png` | `hero-main.png` | — |
| Backgrounds | `pexels-micaasato-1198173.jpg` | `background-fabric-texture.jpg` | Clear purpose |
| Products | `WhatsApp Image 2025-11-14 at 9.27.47 PM (4).jpeg` | `jersey-1-collared-red.jpeg` | Type + color |
| Templates | `mask_full.svg` | `mask-full.svg` | Consistent format |

### 3. Code Updates

Updated all image references in the codebase:

- **Vite Config** (`frontend/vite.config.js`):
  - Added `@images` alias pointing to root `images/` folder
  - Added custom Vite plugin to serve `/images` route during development

- **Component Imports**:
  - `Header.jsx`: Updated logo imports to use `@images/branding/`
  - `Hero.jsx`: Updated hero imports to use `@images/hero/`
  - `JerseyCanvas.jsx`: Updated mask imports to use `@images/templates/`

- **Product Data** (`frontend/public/products.json`):
  - Updated all 9 product image paths from `/product-images/[old-name]` to `/images/products/[new-name]`

### 4. Build Verification

✓ Frontend builds successfully with all new image references
✓ Hashed image names in output (`hero-main-CNkFzOsi.png`, `logo-main-DAfHl7oq.png`)
✓ All imports resolve correctly
✓ Runtime data paths configured properly

## Folder Structure Reference

```
project-root/
├── images/                          ← NEW: All project images
│   ├── README.md                    ← Image documentation
│   ├── branding/
│   │   ├── logo-main.png
│   │   ├── logo-placeholder.png
│   │   └── logo.svg
│   ├── hero/
│   │   ├── hero-main.png
│   │   ├── hero-placeholder.png
│   │   └── backgrounds/
│   │       ├── background-fabric-texture.jpg
│   │       ├── background-sport-athlete.jpg
│   │       ├── background-running-sports.jpg
│   │       └── background-sports-team.jpg
│   ├── products/
│   │   ├── jersey-1-collared-red.jpeg
│   │   ├── jersey-2-collared-blue.jpeg
│   │   ├── jersey-3-collared-black.jpeg
│   │   ├── jersey-4-collared-white.jpeg
│   │   ├── jersey-5-collared-navy.jpeg
│   │   ├── jersey-6-noncollared-red.jpeg
│   │   ├── jersey-7-noncollared-blue.jpeg
│   │   ├── jersey-8-noncollared-black.jpeg
│   │   └── jersey-9-noncollared-white.jpeg
│   └── templates/
│       ├── mask-full.svg
│       └── mask-half.svg
├── frontend/
│   ├── src/
│   ├── public/
│   │   └── products.json            ← Updated with new paths
│   └── vite.config.js               ← Updated with @images alias
├── launch.ps1
├── package.json
└── README.md
```

## Usage

### For React Components

Use the `@images` alias:

```jsx
import logo from '@images/branding/logo-main.png';
import heroImage from '@images/hero/hero-main.png';
import maskFull from '@images/templates/mask-full.svg';
```

### For Product Data

Reference images via REST paths:

```json
{
  "images": ["/images/products/jersey-1-collared-red.jpeg"]
}
```

### Adding New Images

1. Place file in appropriate subfolder
2. Rename following the convention (e.g., `jersey-10-collared-green.jpeg`)
3. Update component imports or product data
4. Run `npm run dev:frontend` to verify local

## Development

- **Dev Server**: `npm run dev:frontend` 
  - Serves `/images` from root images folder via custom Vite plugin
  - Auto-opens at `http://localhost:5173`

- **Build**: `npm run deploy:frontend`
  - Bundles React components with hashed image names
  - Preserves `/images/...` paths in product data

## Deprecated Locations

These folder locations are no longer used:

- ❌ `frontend/src/assets/product-images/`
- ❌ `frontend/public/product-images/` (runtime folder)
- ❌ `frontend/src/assets/branding/`
- ❌ `frontend/src/assets/hero/`
- ❌ `frontend/src/assets/masks/`

All images now reside in the centralized `/images` root folder.

## Next Steps

- Deploy the updated frontend using `.\launch.ps1 -Deploy`
- Test image loading in production build
- Update any additional image references if needed
- Maintain descriptive naming convention for future images
