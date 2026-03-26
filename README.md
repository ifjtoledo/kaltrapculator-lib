# &lt;kaltrap-culator&gt;

A zero-dependency Web Component that turns any `<input>` into a calculator-assisted field.  
Type, chain operations, preview results in real time — all from the keyboard.

**5.9 KB gzipped** &middot; ES + UMD &middot; Shadow DOM &middot; 3 themes &middot; Full + Basic modes &middot; i18n-ready

---

## Features

- **Keyboard-first** — open with Enter/Space/ArrowDown, navigate operators with arrows, confirm with Enter, undo with Backspace.
- **Two modes** — `full` (chain multiple operations: `100 + 20% - 5`) or `basic` (type → Enter → done).
- **Number formatting** — locale-aware display with currency symbols, thousand separators, and decimal control.
- **Three built-in themes** — `dark`, `light`, `borderlands`. Switches live, persists in localStorage.
- **Shadow DOM** — styles are fully encapsulated; won't clash with your app CSS.
- **Zero dependencies** — ships a single ES module + UMD fallback with full TypeScript declarations.
- **Framework-agnostic** — works in vanilla HTML, React, Vue, Angular, Svelte, or any framework that supports custom elements.

---

## Install

```bash
npm install kaltrapculator-lib
```

Or use a CDN (UMD):

```html
<script src="https://unpkg.com/kaltrapculator-lib"></script>
<script>
  KaltrapCulator.registerKaltrapCulator();
</script>
```

---

## Quick Start

### 1. Register the element

```ts
import { registerKaltrapCulator } from 'kaltrapculator-lib';

registerKaltrapCulator();
```

### 2. Mark your inputs

Add `data-kaltrap` to any `<input>` you want the calculator to attach to:

```html
<input
  type="text"
  data-kaltrap
  data-kaltrap-currency="$"
  data-kaltrap-decimals="2"
  data-kaltrap-locale="es-CO"
  data-kaltrap-calc="full"
  readonly
/>
```

### 3. Drop the element anywhere

```html
<kaltrap-culator></kaltrap-culator>
```

That's it. The element automatically discovers every `input[data-kaltrap]` on the page and binds keyboard/pointer listeners.

---

## How It Works

```
┌─────────────┐     Enter/Space/↓     ┌──────────────────────┐
│  Host Input  │ ──────────────────▶  │   <kaltrap-culator>  │
│  (your page) │                       │     Shadow DOM        │
└─────────────┘                       │                      │
       ▲                              │  ┌── timeline ─────┐ │
       │  result injected             │  │ 100              │ │
       │  on double Enter             │  │ + 20%            │ │
       │                              │  └──────────────────┘ │
       │                              │  [ draft input: 5   ] │
       │                              │  [+ ] [- ] [* ] [/ ] [%]│
       │                              │  Preview: $ 115       │
       │                              │  [cancel]    [apply]  │
       └──────────────────────────── │                      │
                                      └──────────────────────┘
```

**Full mode (`data-kaltrap-calc="full"`):**
1. Focus a host input → press **Enter** → calculator opens.
2. Type a number → it appears in the draft input with live preview.
3. Press **Enter** → confirms the value as a "level" in the timeline.
4. Change operator with **←/→**, type next number, press **Enter** again.
5. Press **Enter** once more (when draft is empty) → injects the result into the host input.
6. Press **Escape** or click Cancel to discard.

**Basic mode (`data-kaltrap-calc="basic"`):**
1. Focus → **Enter** → calculator opens (no timeline, no operators).
2. Type a number → single **Enter** injects immediately.

---

## Host Input Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-kaltrap` | flag | — | **Required.** Marks the input for discovery. |
| `data-kaltrap-calc` | `'full'` \| `'basic'` | `'basic'` | Calculator mode. |
| `data-kaltrap-currency` | `string` | `'$'` | Currency symbol shown in preview/injection (only for currency mode). |
| `data-kaltrap-mode` | `'currency'` \| `'numeric'` \| `'numeric-strict'` | `'currency'` | How the value is formatted. |
| `data-kaltrap-decimals` | `number` | `2` | Max decimal places allowed. |
| `data-kaltrap-locale` | `string` | `'es-CO'` | BCP 47 locale for `Intl.NumberFormat`. |
| `data-kaltrap-allow-negative` | `'true'` \| `'false'` | `'false'` | Whether negative values are allowed. |

### Mode details

| Mode | Injection format | Example |
|------|-----------------|---------|
| `currency` | `$ 11.000` (locale-formatted with symbol) | `type="text"` |
| `numeric` | `11000.5` (plain decimal, no grouping) | `type="number" step="0.01"` |
| `numeric-strict` | `11000` (integer only, truncated) | `type="number" step="1"` |

---

## Element Attributes & Properties

### `<kaltrap-culator>` attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `'dark'` \| `'light'` \| `'borderlands'` | `'dark'` | Active theme. Persisted in `localStorage`. |
| `host-selector` | CSS selector | `'input[data-kaltrap]'` | Custom selector to find host inputs. |

### JavaScript API

```ts
const el = document.querySelector('kaltrap-culator');

// Change theme programmatically
el.theme = 'borderlands';

// Re-scan the DOM after dynamically adding inputs
el.refresh();
```

### Events

| Event | Bubbles | Detail | When |
|-------|---------|--------|------|
| `kaltrap-open` | yes | — | Calculator modal opens |
| `kaltrap-close` | yes | — | Calculator modal closes |

```ts
document.querySelector('kaltrap-culator')
  .addEventListener('kaltrap-open', () => {
    console.log('Calculator opened');
  });
```

---

## Keyboard Reference

| Key | Full mode | Basic mode |
|-----|-----------|------------|
| **Enter** / **Space** / **↓** | Open on host input | Open on host input |
| **Escape** | Close (discard) | Close (discard) |
| **←** / **→** | Cycle operator (+, -, *, /, %) | *(ignored)* |
| **↓** (inside widget) | Quick-confirm level | *(ignored)* |
| **Enter** (with draft) | Confirm level to timeline | Inject and close |
| **Enter** (empty draft, levels exist) | Inject result to host | — |
| **Backspace** (empty draft) | Undo last level | *(ignored)* |

---

## Themes

Switch themes from the dot buttons in the widget footer, or set programmatically:

```ts
el.theme = 'light';
```

| Theme | Look |
|-------|------|
| `dark` | Dark surfaces, blue accent |
| `light` | Warm beige, classic feel |
| `borderlands` | Dark blue-grey, orange accent |

The active theme is persisted in `localStorage` under the key `kaltrap-theme`.

---

## Advanced Usage

### Custom host selector

```html
<kaltrap-culator host-selector=".my-calculator-inputs"></kaltrap-culator>
```

### Dynamic inputs

If you add inputs to the DOM after page load, call `refresh()`:

```ts
document.body.insertAdjacentHTML('beforeend',
  '<input data-kaltrap data-kaltrap-calc="basic" readonly />'
);
document.querySelector('kaltrap-culator').refresh();
```

### Using the formatting utilities directly

The library also exports the pure formatting functions (no DOM needed):

```ts
import {
  formatNumberForDisplay,
  formatNumberForHost,
  parseRawNumber,
  sanitizeRawInput,
  normalizeHostValue,
} from 'kaltrapculator-lib';

formatNumberForDisplay(11000, {
  mode: 'currency', currency: '$', locale: 'es-CO', decimals: 2, allowNegative: false
});
// → "$ 11.000"

formatNumberForHost(11000, {
  mode: 'numeric', currency: '$', locale: 'es-CO', decimals: 2, allowNegative: false
});
// → "11000"
```

### Framework examples

**React:**

```tsx
import { useEffect } from 'react';
import { registerKaltrapCulator } from 'kaltrapculator-lib';

registerKaltrapCulator();

export function PriceField() {
  return (
    <>
      <input
        data-kaltrap
        data-kaltrap-currency="$"
        data-kaltrap-decimals="2"
        data-kaltrap-calc="full"
        readOnly
      />
      <kaltrap-culator />
    </>
  );
}
```

**Vue:**

```vue
<script setup>
import { registerKaltrapCulator } from 'kaltrapculator-lib';
registerKaltrapCulator();
</script>

<template>
  <input
    data-kaltrap
    data-kaltrap-currency="€"
    data-kaltrap-locale="de-DE"
    data-kaltrap-decimals="2"
    data-kaltrap-calc="full"
    readonly
  />
  <kaltrap-culator theme="light" />
</template>
```

---

## TypeScript

Full type declarations are included. Key exports:

```ts
import type { KaltrapTheme, HostConfig, HostMode } from 'kaltrapculator-lib';
import { KaltrapCulatorElement } from 'kaltrapculator-lib';
```

---

## Browser Support

Works in all modern browsers that support:
- Custom Elements v1
- Shadow DOM v1
- `Intl.NumberFormat`

Chrome 67+, Firefox 63+, Safari 13.1+, Edge 79+.

---

## Bundle Size

| Format | Size | Gzipped |
|--------|------|---------|
| ES Module | ~22 KB | ~5.9 KB |
| UMD | ~19 KB | ~5.5 KB |

---

## Development

```bash
git clone https://github.com/ifjtoledo/kaltrapculator-lib.git
cd kaltrapculator-lib
npm install

npm run dev          # Demo playground
npm run design       # Design lab (library consumer showcase)
npm run test         # Run 148 tests
npm run test:watch   # Watch mode
npm run build        # Build ES + UMD + .d.ts
```

### Project structure

```
src/
  core/number-format.ts      # Pure formatting utilities (no DOM)
  components/
    kaltrapculator-element.ts # <kaltrap-culator> custom element
  register.ts                # Custom element registration
  index.ts                   # Public API entrypoint
design-lab/                  # Live showcase consuming the library
```

---

## License

MIT
