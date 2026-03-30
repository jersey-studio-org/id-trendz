# Design System Documentation

This document describes the design tokens and utility classes used throughout the application.

## Design Tokens

### Colors

```css
--bg: #ffffff                    /* Background color */
--surface: #ffffff               /* Surface/card background */
--text: #0f172a                  /* Primary text color */
--muted: #6b7280                 /* Muted/secondary text */
--accent: #7c3aed                /* Primary accent (purple) */
--accent-2: #06b6d4              /* Secondary accent (cyan) */
```

### Spacing & Layout

```css
--max-width: 1280px              /* Maximum container width */
--gap: 24px                      /* Default gap between grid items */
--card-radius: 12px              /* Border radius for cards */
--radius-pill: 999px             /* Pill-shaped border radius */
```

### Shadows

```css
--shadow-soft: 0 8px 24px rgba(15,23,42,0.06)
--shadow-strong: 0 18px 40px rgba(15,23,42,0.10)
```

## Utility Classes

### Layout

- `.site-container` - Max-width container with responsive padding
- `.grid` - Grid layout with default gap

### Components

- `.card` - Card component base (background, border-radius, shadow)
- `.card-body` - Card content area
- `.card-footer` - Card footer area (anchored to bottom)

### Buttons

- `.button-primary` - Primary action button (accent background)
- `.button-secondary` - Secondary action button (text-primary background)

### Typography

- `.section-heading` - Section heading with responsive font-size
- `.muted-text` - Muted/secondary text color
- `.hero-headline` - Large hero headline (clamp 32px-56px)
- `.hero-subtext` - Hero description text

### Interactive Elements

- `.swatch` - Color swatch button (circular, 36px)

## Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Accessibility

- All buttons have `:focus-visible` outlines
- Images have ALT text
- Keyboard navigation support
- ARIA labels on interactive elements
- Reduced motion support via `@media (prefers-reduced-motion: reduce)`

## Typography Scale

The base font is **Inter**, with system font fallbacks:
- Font family: `'Inter', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`
- Base size: 16px (browser default)
- Line height: 1.6

### Heading Sizes

- Hero headline: `clamp(32px, 5vw, 56px)`
- Section heading: `clamp(28px, 5vw, 48px)`
- Card title: 18px (font-weight: 600)

## Usage Examples

### Card Component

```jsx
<article className="card">
  <ProductImage src={image} alt="Product" />
  <div className="card-body">
    <h3>Product Title</h3>
    <div className="price">$49.99</div>
  </div>
  <div className="card-footer">
    <button className="button-primary">Action</button>
  </div>
</article>
```

### Container

```jsx
<div className="site-container">
  {/* Content */}
</div>
```

### Section Heading

```jsx
<h2 className="section-heading">Section Title</h2>
```

## Extending the Design System

To add new tokens:

1. Add CSS variables to `:root` in `styles.css`
2. Document in this README
3. Use variables consistently across components

To create new utility classes:

1. Follow naming convention (e.g., `.utility-name`)
2. Use design tokens (variables) instead of hardcoded values
3. Include responsive variants with `@media` queries
4. Add focus states for accessibility

## Notes

- All spacing uses the `--gap` variable or multiples of it
- Colors use the semantic variable names (e.g., `var(--accent)`, not `#7c3aed`)
- Shadows are defined as variables for consistency
- Border radius uses `--card-radius` or `--radius-pill` for buttons/swatches

