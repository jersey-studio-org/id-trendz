# Jersey Studio

Jersey Studio is a React + Vite app for browsing jerseys, customizing front and back artwork, and exporting or adding that design to cart.

## What Is In The Repo

- `frontend/` contains the shipped web app.
- `backend/` is a lightweight mock/data workspace used during local development.
- `.github/workflows/static.yml` runs frontend tests and the production build for GitHub Pages.

## Frontend Overview

The active customization flow uses the PNG-based renderer in [frontend/src/components/JerseyTemplateCanvas.jsx](/C:/repos/jersey-studio/jersey-studio/frontend/src/components/JerseyTemplateCanvas.jsx). Product, cart, image, and API shaping logic is kept in small utilities under [frontend/src/utils](/C:/repos/jersey-studio/jersey-studio/frontend/src/utils) so behavior is easier to test and maintain.

Key areas:

- [frontend/src/pages/CustomizePage.jsx](/C:/repos/jersey-studio/jersey-studio/frontend/src/pages/CustomizePage.jsx) for the customization UI
- [frontend/src/pages/CartPage.jsx](/C:/repos/jersey-studio/jersey-studio/frontend/src/pages/CartPage.jsx) for cart, totals, export, and checkout formatting
- [frontend/src/hooks/useCart.jsx](/C:/repos/jersey-studio/jersey-studio/frontend/src/hooks/useCart.jsx) for persisted cart state
- [frontend/src/hooks/useApi.js](/C:/repos/jersey-studio/jersey-studio/frontend/src/hooks/useApi.js) for API/products fallback loading

## Local Development

Install dependencies once from the repo root:

```bash
npm install
```

Start the frontend dev server:

```bash
npm run dev:frontend
```

Build the frontend:

```bash
npm run deploy:frontend
```

Run frontend unit tests:

```bash
npm run test:frontend
```

Preview the production bundle locally:

```bash
npm run preview:frontend
```

## Tests

Frontend unit tests live in [frontend/tests](/C:/repos/jersey-studio/jersey-studio/frontend/tests) and cover the shared logic that drives the active app:

- canvas color and text helpers
- debounce behavior
- jersey option normalization
- cart normalization, totals, and option formatting
- API base-path and product fallback helpers
- product image URL resolution

The frontend workspace runs them with:

```bash
node --test tests
```

## GitHub Pages

[.github/workflows/static.yml](/C:/repos/jersey-studio/jersey-studio/.github/workflows/static.yml) runs on both `pull_request` and pushes to `main` and `master`.

The build job now does this in order:

1. installs dependencies
2. sets the Vite base path
3. runs `npm run test:frontend`
4. runs `npm run deploy:frontend`
5. uploads the built `frontend/dist` artifact

That means pull requests hit the unit-test gate before the Pages build is allowed to complete.

## Cleanup Notes

The repo has been trimmed to the active preview path. Unused experimental jersey renderers and duplicate template assets were removed so the live code path is easier to follow.
