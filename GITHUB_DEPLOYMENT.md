# GitHub Deployment Checklist & Files to Commit

## Pre-Deployment Checklist

- [ ] Update `.github/workflows/deploy.yml` if already present
- [ ] Node.js version requirement: 16.0.0+ (specified in root package.json)
- [ ] npm version: 7.0.0+ or higher
- [ ] All dependencies installed: `npm install`
- [ ] Development build tested: `npm run dev:frontend`
- [ ] Production build tested: `npm run deploy:frontend`
- [ ] No sensitive data in `.env` files (should be in `.gitignore`)

## Files to Commit to Git

### Required Configuration Files

| File | Purpose | Commit |
|------|---------|--------|
| `package.json` | Root workspace configuration | ✅ YES |
| `package-lock.json` | Lock file for reproducible builds | ✅ YES |
| `frontend/package.json` | Frontend dependencies & scripts | ✅ YES |
| `frontend/package-lock.json` | Frontend lock file | ✅ YES |
| `frontend/vite.config.js` | Vite build configuration for GitHub Pages | ✅ YES |
| `frontend/index.html` | HTML entry point | ✅ YES |
| `.gitignore` | Files to exclude from git | ✅ YES |
| `README.md` | Project documentation | ✅ YES |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD pipeline | ✅ YES |

### Source Code - Frontend

| Directory | Files | Purpose | Commit |
|-----------|-------|---------|--------|
| `frontend/src/` | `**/*.jsx`, `**/*.js`, `**/*.css` | React components, utilities, styles | ✅ YES |
| `frontend/src/assets/` | All SVG, PNG, images | Static assets (templates, branding, hero) | ✅ YES |
| `frontend/public/` | `index.html`, `products.json` | Public server files | ✅ YES |
| `frontend/public/product-images/` | Product images (PNG, JPG) | Product catalog images | ✅ YES |
| `frontend/public/backgrounds/` | Background images | Background assets | ✅ YES |
| `scripts/` | `*.ps1`, `*.sh` | Build helper scripts | ✅ YES (optional) |

### Optional Documentation

| File | Purpose | Commit |
|------|---------|--------|
| `IMAGES_CENTRALIZATION.md` | Image asset documentation | ✅ YES (optional) |
| `LICENSE` | License file (if applicable) | ✅ YES |
| `.editorconfig` | Editor code style configuration | ✅ YES |

### Backend (Optional)

| Directory | Purpose | Commit |
|-----------|---------|--------|
| `backend/` | Node.js backend code | ✅ YES (if deploying API) |

### DON'T Commit

| Path/File | Reason |
|-----------|--------|
| `node_modules/` | Recreated from package.json |
| `frontend/dist/` | Generated build output |
| `.env`, `.env.local` | Contains secrets/sensitive data |
| `package-lock.json.bak` | Temporary backup files |
| `*.log` | Build logs |
| `.DS_Store`, `Thumbs.db` | OS-specific files |

## Git Workflow for Deployment

### Step 1: Prepare Repository

```bash
# Clone or navigate to your repository
cd jersy-website

# Ensure .gitignore is up-to-date
git status

# These should appear in untracked/ignored files:
# - node_modules/
# - frontend/dist/
# - .env
```

### Step 2: Stage and Commit Source Code

```bash
# Stage only source files (not build output)
git add .gitignore
git add README.md
git add package.json package-lock.json
git add frontend/
git add scripts/
git add .github/
git add IMAGES_CENTRALIZATION.md
git add backend/  # if applicable

# Review staged files
git status

# Commit
git commit -m "feat: Prepare for GitHub Pages deployment

- Update .gitignore for build artifacts
- Add GitHub Actions CI/CD pipeline
- Update README with deployment instructions
- Configure Vite for GitHub Pages base path support"
```

### Step 3: Push to Remote

```bash
# For first-time setup
git branch -M main  # Ensure main branch is default
git remote add origin https://github.com/yourusername/jersy-website.git

# Push code
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
   - GitHub Actions will automatically deploy from `main` branch
4. Workflow will automatically run on push

### Step 5: (Optional) Set Custom Base Path

If deploying to a project repository (not user site), update before build:

**PowerShell:**
```powershell
$env:VITE_BASE="/<repo-name>/"
npm run deploy:frontend
git add -A
git commit -m "Build with base path for GitHub Pages"
git push
```

**Bash/Shell:**
```bash
export VITE_BASE="/<repo-name>/"
npm run deploy:frontend
git add -A
git commit -m "Build with base path for GitHub Pages"
git push
```

## Deployment Verification

After pushing to GitHub:

1. **Check Actions tab**: `https://github.com/yourusername/jersy-website/actions`
2. **Workflow status**: Should show green checkmark for deployment
3. **Live site**: Available at:
   - User site: `https://yourusername.github.io`
   - Project site: `https://yourusername.github.io/jersy-website`
4. **Settings**: Verify in **Settings** → **Pages** that site is published

## Environment Variables for Builds

### VITE_BASE (for custom base path)
- **Default**: `/` (for user/org sites)
- **Set for project repos**: `/<repo-name>/`
- **Example**: 
  ```bash
  VITE_BASE=/jersy-website/ npm run deploy:frontend
  ```

## Build Output Reference

```
frontend/dist/
├── index.html                 # Main HTML entry
├── assets/
│   ├── index-XXXXXXXX.js      # Main app bundle
│   ├── index-XXXXXXXX.css     # Main CSS bundle
│   ├── jersey-front-XXXX.svg  # Jersey template SVG
│   ├── jersey-back-XXXX.svg   # Jersey template SVG
│   ├── logo-main-XXXX.png     # Branding logo
│   └── ... (chunked assets)
```

**Total build size**: ~2 MB (with hero images)
**Files to deploy**: Everything in `frontend/dist/`

## Troubleshooting

### Build fails locally
- Ensure Node.js 16+: `node --version`
- Clear cache: `npm ci`
- Rebuild: `npm run deploy:frontend`

### GitHub Actions fails
- Check Actions logs: **Actions** → workflow run → logs
- Verify Node.js and npm versions in `deploy.yml`
- Re-run workflow: **Run workflow** button

### Site shows 404
- Check GitHub Pages settings (source should be "GitHub Actions")
- Verify base path matches deployment location
- Clear browser cache (hard refresh)

### Images not loading
- Verify `@images` alias in `frontend/vite.config.js`
- Check asset import paths use relative paths
- For GitHub Pages, `VITE_BASE` must match repo structure

## Size & Performance

| Metric | Value |
|--------|-------|
| Build time | ~1-2 seconds |
| Output size | ~300-500 KB (gzipped) |
| First load | < 2 seconds on 4G |
| Images | ~1.8 MB uncompressed |

GitHub Pages provides free hosting with a 1 GB storage limit per repository.
