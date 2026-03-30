# Jersey Websites

A modern, interactive jersey customization platform built with React, Vite, and Three.js. Users can customize jerseys by selecting colors, adding text (name/number), uploading logos, and previewing designs in real-time.

## Features

- **Interactive Jersey Preview**: Front and back jersey preview with real-time customization
- **Color Selection**: Choose from predefined colors or custom hex/RGB colors
- **Text Customization**: Add name and number (back of jersey)
- **Logo Upload**: Upload your own logo with position and scale controls
- **Responsive Design**: Works on desktop and mobile devices
- **Product Catalog**: Browse and customize different jersey products

## Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- npm 7.0.0 or higher

### Installation

Clone the repository and install dependencies from the project root:

```bash
git clone https://github.com/yourusername/jersy-website.git
cd jersy-website
npm install
```

### Development Server

Start the development server:

```bash
npm run dev:frontend
```

The application will open at `http://localhost:5173` and automatically reload on changes.

### Production Build

Build the frontend for production:

```bash
npm run deploy:frontend
```

Build output is created at `frontend/dist/` and is ready for deployment.

## GitHub Pages Deployment

### Option 1: User/Organization Site
If deploying to `username.github.io` (user or organization site):

1. Build the project:
   ```bash
   npm run deploy:frontend
   ```

2. Commit and push the `frontend/dist` contents to your GitHub Pages repository:
   ```bash
   cd frontend/dist
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

### Option 2: Project Repository Site
If deploying to `username.github.io/repo-name` (project site):

1. Set the base path and build:
   ```bash
   $env:VITE_BASE="/<repo-name>/"
   npm run deploy:frontend
   ```

   On Linux/macOS:
   ```bash
   export VITE_BASE="/<repo-name>/"
   npm run deploy:frontend
   ```

2. Commit and push to your repository, then enable GitHub Pages in repo settings

### Automated Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run deploy:frontend
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

Then in your GitHub repo settings:
- Go to **Settings** → **Pages**
- Set **Source** to "Deploy from a branch"
- Set **Branch** to `gh-pages` and folder to `/ (root)`

## Project Structure

```
jersy-website/
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components (landing, customization)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   │   ├── assets/             # Static assets (templates, images)
│   │   │   ├── templates/      # Jersey SVG templates
│   │   │   ├── branding/       # Logo and branding assets
│   │   │   ├── hero/           # Hero section images
│   │   │   └── product-images/ # Product catalog images
│   │   ├── styles/             # CSS files
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Entry point
│   ├── public/                 # Static public files served as-is
│   │   ├── products.json       # Product catalog metadata
│   │   ├── product-images/     # Runtime product images
│   │   └── backgrounds/        # Background images
│   ├── package.json
│   ├── vite.config.js          # Vite configuration
│   └── dist/                   # Production build (generated)
├── backend/                    # Node.js backend API (optional)
├── images/                     # Central image repository
├── scripts/                    # Utility scripts
│   ├── copy-images.ps1        # Copy product images to runtime
│   └── copy-hero.ps1          # Copy hero images to assets
├── package.json               # Root workspace configuration
└── README.md                  # This file
```

## Asset Organization

### Product Images
- **Runtime location**: `frontend/public/product-images/`
- **Purpose**: Referenced in `frontend/public/products.json` for the product catalog
- **Usage**: Used in `LandingPage.jsx` to display product cards

### Branding Assets
- **Location**: `frontend/src/assets/branding/`
- **Purpose**: Logo and brand images imported directly in React components
- **Usage**: Imported in `Header.jsx`, `Footer.jsx`

### Jersey Templates
- **Location**: `frontend/src/assets/templates/`
- **Purpose**: SVG templates for custom jersey designs
- **Usage**: Loaded by `JerseyTemplateCanvas.jsx` during customization

### Hero Images
- **Location**: `frontend/src/assets/hero/`
- **Purpose**: Large hero section background images
- **Usage**: Imported in `Hero.jsx`

### Backgrounds
- **Location**: `frontend/public/backgrounds/`
- **Purpose**: General background assets
- **Usage**: Referenced in CSS or component styles

## Available Scripts

### Root Level (npm workspace)
```bash
npm install              # Install all dependencies
npm run dev:frontend     # Start development server
npm run deploy:frontend  # Build for production
npm run preview:frontend # Preview production build locally
npm run start:all        # Start frontend dev + backend mock simultaneously
```

### Frontend Specific (from `frontend/` directory)
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview built app
```

## Customization

### Adding New Products
Edit `frontend/public/products.json` to add new jersey products with colors, fonts, sizes, etc.

### Changing Colors
The color picker in `CustomizePage.jsx` supports:
- Quick swatches (Black, White, and product palette colors)
- Native color wheel picker
- Hex color code input
- RGB channel inputs

### Jersey Templates
Modify `frontend/src/assets/templates/jersey-front.svg` and `jersey-back.svg` to change the jersey design.

## Performance

The build is optimized with:
- Code splitting for lazy-loaded routes
- Image optimization and asset hashing
- Minified CSS and JavaScript
- Tree-shaking of unused code
- Source maps excluded in production

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.
