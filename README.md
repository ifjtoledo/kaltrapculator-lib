# kaltrapculator-lib

Web Component library for a Claptrap-inspired calculator.

## Architecture

- `src/core/`: pure business logic (no DOM).
- `src/components/`: UI components and Web Components.
- `src/register.ts`: explicit custom element registration.
- `src/index.ts`: library public API entrypoint.
- `src/demo/`: local development playground entrypoint.
- `index.html`: demo page used by Vite in development.

This keeps the library API clean while preserving a fast visual workflow during development.

## Scripts

- `npm run dev`: start Vite dev server (demo).
- `npm run demo`: alias for `dev`.
- `npm run build`: build library bundles and TypeScript declarations.
- `npm run preview`: preview built output in a local server.

## Local development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Library usage

```ts
import { registerKaltrapCulator } from "kaltrapculator-lib";

registerKaltrapCulator();
```

```html
<kaltrap-culator></kaltrap-culator>
```

## Why this layout

- You can validate UX quickly in the demo.
- You can publish a clean library package without demo coupling.
- You can add tests for `src/core/` without touching UI.
