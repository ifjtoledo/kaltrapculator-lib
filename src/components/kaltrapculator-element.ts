import {
  formatNumberForDisplay,
  formatNumberForHost,
  normalizeHostValue,
  parseRawNumber,
  sanitizeRawInput,
  type HostConfig,
  type HostMode,
} from '../core/number-format';

export type KaltrapTheme = 'dark' | 'light' | 'borderlands';
type CalcMode = 'basic' | 'full';
type Level = { value: number; operatorToPrev: string | null };

const THEME_KEY = 'kaltrap-theme';

const WIDGET_CSS = /* css */ `
*,
*::before,
*::after {
    box-sizing: border-box;
}

:host {
    --radius: 14px;
    --radius-inner: 8px;

    --border: 1px solid #2c2c2c;
    --surface: #1e1e1e;
    --surface-2: #181818;
    --text: #f0f0f0;
    --muted: #909090;
    --focus: #4d9fe1;
    --apply-bg: #4d9fe1;
    --apply-text: #111111;
    --frame: #2a2a2a;
    --frame-highlight: rgba(255, 255, 255, 0.07);
    --frame-shadow: rgba(0, 0, 0, 0.5);
    --inset-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(0, 0, 0, 0.18);
    --screen-glow: none;
    display: block;
    font-family: "Open Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

:host([theme="light"]) {
    --border: 1px solid #c0c0c0;
    --surface: #ddd9d4;
    --surface-2: #d0ccc6;
    --text: #222222;
    --muted: #6b6b6b;
    --focus: #2b7fd4;
    --apply-bg: #2b7fd4;
    --apply-text: #ffffff;
    --frame: #c4bfb8;
    --frame-highlight: rgba(255, 255, 255, 0.5);
    --frame-shadow: rgba(0, 0, 0, 0.18);
    --inset-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(0, 0, 0, 0.06);
    --screen-glow: none;
}

:host([theme="borderlands"]) {
    --border: 1px solid #384860;
    --surface: #1a2535;
    --surface-2: #111b28;
    --text: #e8dfd0;
    --muted: #8a94a0;
    --focus: #e8952a;
    --apply-bg: #e8952a;
    --apply-text: #0e1520;
    --frame: #243040;
    --frame-highlight: rgba(232, 149, 42, 0.08);
    --frame-shadow: rgba(0, 0, 0, 0.55);
    --inset-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.2);
    --screen-glow: 0 0 14px rgba(232, 149, 42, 0.05);
}

.overlay {
    position: fixed;
    inset: 0;
    background: rgba(3, 6, 12, 0.72);
    backdrop-filter: blur(2px);
    z-index: 99;
}

.widget {
    width: min(360px, 92vw);
    max-height: min(560px, 88vh);
    overflow: auto;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
    border: none;
    border-radius: var(--radius);
    background: var(--frame, var(--surface));
    padding: 12px;
    display: grid;
    gap: 8px;
    box-shadow:
        inset 1px 1px 0 var(--frame-highlight),
        inset -1px -1px 0 var(--frame-shadow),
        0 10px 40px rgba(0, 0, 0, 0.5),
        0 2px 8px rgba(0, 0, 0, 0.3);
    color: var(--text);
}

.widget--ready {
    box-shadow:
        inset 1px 1px 0 var(--frame-highlight),
        inset -1px -1px 0 var(--frame-shadow),
        0 0 0 2px var(--focus),
        0 0 16px rgba(77, 159, 225, 0.18),
        0 8px 32px rgba(0, 0, 0, 0.45);
}

.section {
    border: none;
    border-radius: var(--radius-inner, 8px);
    padding: 10px 12px;
    background: var(--surface-2);
    box-shadow: var(--inset-shadow);
}

.draft-input {
    width: 100%;
    min-height: 46px;
    padding: 0 12px;
    border: none;
    border-radius: var(--radius-inner, 8px);
    font-family: inherit;
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    background: var(--surface-2);
    color: var(--text);
    box-shadow: var(--inset-shadow);
}

.draft-input:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
}

.timeline-list {
    margin: 0;
    padding-left: 14px;
    display: grid;
    gap: 4px;
}

.timeline-item {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: 0.85rem;
    color: var(--muted);
    letter-spacing: 0.03em;
}

.timeline-value {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.active-level {
    display: grid;
    gap: 0;
}

.operator-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(40px, 1fr));
    gap: 6px;
}

.operator-item {
    min-height: 34px;
    display: grid;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 6px;
    user-select: none;
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    opacity: 0.5;
    background: transparent;
    cursor: pointer;
    transition: opacity 80ms, background 80ms, border-color 80ms;
}

.operator-item:hover {
    opacity: 0.8;
    background: rgba(255, 255, 255, 0.04);
}

.operator-item--active {
    opacity: 1;
    border-color: var(--focus);
    background: rgba(77, 159, 225, 0.14);
    color: var(--text);
    font-weight: 700;
}

.preview-value {
    display: block;
    margin-top: 0;
    font-size: clamp(1.8rem, 5.5vw, 2.4rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: 0.01em;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--text);
}

.actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 2px;
}

.actions button:not(.theme-dot) {
    min-height: 32px;
    min-width: 48px;
    padding: 0 14px;
    border: none;
    border-radius: 8px;
    background: var(--surface-2);
    color: var(--text);
    opacity: 0.7;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    transition: opacity 80ms;
}

.actions button:not(.theme-dot):hover {
    opacity: 1;
}

.actions button:not(.theme-dot):focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
}

.btn-apply {
    background: var(--apply-bg, #4d9fe1) !important;
    color: var(--apply-text, #121212) !important;
    opacity: 1 !important;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.theme-picker {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-right: auto;
}

.theme-dot {
    width: 9px;
    height: 9px;
    min-width: 9px;
    min-height: 9px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    padding: 0;
    cursor: pointer;
    transition: border-color 100ms, transform 100ms;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.theme-dot:hover {
    transform: scale(1.4);
}

.theme-dot--active {
    border-color: var(--focus);
    transform: scale(1.3);
    box-shadow: 0 0 4px rgba(77, 159, 225, 0.3);
}

.theme-dot--dark {
    background: #1e1e1e;
    border-color: rgba(255, 255, 255, 0.2);
}

.theme-dot--dark.theme-dot--active {
    border-color: var(--focus);
}

.theme-dot--light {
    background: #e8e4df;
}

.theme-dot--borderlands {
    background: #e8952a;
}

[hidden] {
    display: none !important;
}
`;

function readHostConfig(host: HTMLInputElement): HostConfig {
  const mode = (host.dataset.kaltrapMode as HostMode | undefined) ?? 'currency';
  const parsedDecimals = Number.parseInt(host.dataset.kaltrapDecimals ?? '2', 10);

  return {
    mode: mode === 'numeric' || mode === 'numeric-strict' ? mode : 'currency',
    currency: host.dataset.kaltrapCurrency ?? '$',
    locale: host.dataset.kaltrapLocale ?? 'es-CO',
    decimals: Number.isNaN(parsedDecimals) ? 2 : Math.max(0, parsedDecimals),
    allowNegative: host.dataset.kaltrapAllowNegative === 'true',
  };
}

export class KaltrapCulatorElement extends HTMLElement {
  static observedAttributes = ['theme'];

  private _root!: ShadowRoot;
  private _widget!: HTMLElement;
  private _overlay!: HTMLElement;
  private _draftInput!: HTMLInputElement;
  private _previewValue!: HTMLOutputElement;
  private _timelineSection!: HTMLElement;
  private _timelineList!: HTMLOListElement;
  private _operatorPicker!: HTMLElement;
  private _operatorItems: HTMLElement[] = [];
  private _themeDots: HTMLButtonElement[] = [];

  private _hostInputs: HTMLInputElement[] = [];
  private _activeHost: HTMLInputElement | null = null;
  private _levels: Level[] = [];
  private _rawDraft = '';
  private _operatorIndex = 0;
  private _isOpen = false;
  private _readyToApply = false;

  private _boundHostPointerDown = new Map<HTMLInputElement, (e: PointerEvent) => void>();
  private _boundHostKeyDown = new Map<HTMLInputElement, (e: KeyboardEvent) => void>();

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this._buildDOM();
    this._cacheElements();
    this._restoreTheme();
    this._bindInternalEvents();
    this._discoverHosts();
  }

  disconnectedCallback(): void {
    this._unbindHosts();
  }

  attributeChangedCallback(name: string, _old: string | null, val: string | null): void {
    if (name === 'theme' && val) {
      this._applyThemeUI(val as KaltrapTheme);
    }
  }

  /* ─── Public API ─── */

  get theme(): KaltrapTheme {
    return (this.getAttribute('theme') as KaltrapTheme) || 'dark';
  }

  set theme(val: KaltrapTheme) {
    this.setAttribute('theme', val);
  }

  /** Re-scan the document for host inputs. Call after dynamic DOM changes. */
  refresh(): void {
    this._unbindHosts();
    this._discoverHosts();
  }

  /* ─── DOM construction ─── */

  private _buildDOM(): void {
    const style = document.createElement('style');
    style.textContent = WIDGET_CSS;
    this._root.appendChild(style);

    const tpl = document.createElement('template');
    tpl.innerHTML = `
<div class="overlay" hidden></div>
<div class="widget" role="dialog" aria-modal="true" aria-label="Kaltrapculator" hidden>
    <section class="section timeline" aria-label="Confirmed levels" hidden>
        <ol class="timeline-list"></ol>
    </section>

    <section class="section active-level" aria-label="Active level">
        <input class="draft-input" type="text" inputmode="decimal" autocomplete="off"
               aria-label="Active value" placeholder="0" />
    </section>

    <section class="section operator-picker" aria-label="Operator selection">
        <ul class="operator-list" role="listbox" aria-label="Operators">
            <li class="operator-item operator-item--active" role="option" aria-selected="true" data-op="+">+</li>
            <li class="operator-item" role="option" aria-selected="false" data-op="-">-</li>
            <li class="operator-item" role="option" aria-selected="false" data-op="*">*</li>
            <li class="operator-item" role="option" aria-selected="false" data-op="/">/</li>
            <li class="operator-item" role="option" aria-selected="false" data-op="%">%</li>
        </ul>
    </section>

    <section class="section preview" aria-live="polite" aria-label="Preview result">
        <output class="preview-value">0</output>
    </section>

    <footer class="actions">
        <span class="theme-picker" aria-label="Theme selector">
            <button type="button" class="theme-dot theme-dot--dark theme-dot--active"
                    data-theme="dark" aria-label="Dark theme" title="Dark"></button>
            <button type="button" class="theme-dot theme-dot--light"
                    data-theme="light" aria-label="Light theme" title="Light"></button>
            <button type="button" class="theme-dot theme-dot--borderlands"
                    data-theme="borderlands" aria-label="Borderlands theme" title="Borderlands"></button>
        </span>
        <button type="button" class="btn-cancel" data-action="cancel" aria-label="Cancel" title="Cancel">\u2716</button>
        <button type="button" class="btn-apply" data-action="apply" aria-label="Apply" title="Apply">\u2714</button>
    </footer>
</div>`;
    this._root.appendChild(tpl.content.cloneNode(true));
  }

  private _cacheElements(): void {
    const q = <T extends Element>(s: string) => this._root.querySelector<T>(s)!;
    this._widget = q<HTMLElement>('.widget');
    this._overlay = q<HTMLElement>('.overlay');
    this._draftInput = q<HTMLInputElement>('.draft-input');
    this._previewValue = q<HTMLOutputElement>('.preview-value');
    this._timelineSection = q<HTMLElement>('.timeline');
    this._timelineList = q<HTMLOListElement>('.timeline-list');
    this._operatorPicker = q<HTMLElement>('.operator-picker');
    this._operatorItems = Array.from(this._root.querySelectorAll<HTMLElement>('.operator-item'));
    this._themeDots = Array.from(this._root.querySelectorAll<HTMLButtonElement>('.theme-dot'));
  }

  /* ─── Host discovery ─── */

  private _discoverHosts(): void {
    const selector = this.getAttribute('host-selector') || 'input[data-kaltrap]';
    this._hostInputs = Array.from(document.querySelectorAll<HTMLInputElement>(selector));

    for (const host of this._hostInputs) {
      const onPointer = (e: PointerEvent) => {
        e.preventDefault();
        this._activeHost = host;
        this._open();
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          this._activeHost = host;
          this._open();
        }
      };
      host.addEventListener('pointerdown', onPointer);
      host.addEventListener('keydown', onKey);
      this._boundHostPointerDown.set(host, onPointer);
      this._boundHostKeyDown.set(host, onKey);
    }
  }

  private _unbindHosts(): void {
    for (const [host, handler] of this._boundHostPointerDown) {
      host.removeEventListener('pointerdown', handler);
    }
    for (const [host, handler] of this._boundHostKeyDown) {
      host.removeEventListener('keydown', handler);
    }
    this._boundHostPointerDown.clear();
    this._boundHostKeyDown.clear();
    this._hostInputs = [];
  }

  /* ─── Theme ─── */

  private _restoreTheme(): void {
    const attr = this.getAttribute('theme');
    if (attr) {
      this._applyThemeUI(attr as KaltrapTheme);
      return;
    }
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) {
        this.setAttribute('theme', saved);
        return;
      }
    } catch { /* silent */ }
    this.setAttribute('theme', 'dark');
  }

  private _applyThemeUI(theme: string): void {
    for (const dot of this._themeDots) {
      dot.classList.toggle('theme-dot--active', dot.dataset.theme === theme);
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch { /* silent */ }
    if (this._isOpen) {
      this._draftInput.focus();
    }
  }

  /* ─── Internal events ─── */

  private _bindInternalEvents(): void {
    for (const dot of this._themeDots) {
      dot.addEventListener('click', () => {
        const t = dot.dataset.theme;
        if (t) this.theme = t as KaltrapTheme;
      });
    }

    this._root.querySelector('[data-action="cancel"]')!
      .addEventListener('click', () => this._close());
    this._root.querySelector('[data-action="apply"]')!
      .addEventListener('click', () => this._applyToHost());

    this._operatorItems.forEach((item, idx) => {
      item.addEventListener('click', () => {
        this._operatorIndex = idx;
        this._paintOperator();
        this._syncPreview();
        this._resetApply();
      });
    });

    this._draftInput.addEventListener('input', () => {
      this._rawDraft = sanitizeRawInput(this._draftInput.value, this._config());
      this._syncPreview();
      this._resetApply();
    });

    this._overlay.addEventListener('click', () => this._close());

    this._widget.addEventListener('keydown', (e: KeyboardEvent) => this._onWidgetKey(e));
  }

  /* ─── Config helpers ─── */

  private _config(): HostConfig {
    return this._activeHost
      ? readHostConfig(this._activeHost)
      : { mode: 'currency', currency: '$', locale: 'es-CO', decimals: 2, allowNegative: false };
  }

  private _calcMode(): CalcMode {
    return this._activeHost?.dataset.kaltrapCalc === 'full' ? 'full' : 'basic';
  }

  private _isFullMode(): boolean {
    return this._calcMode() === 'full';
  }

  /* ─── Open / Close ─── */

  private _open(): void {
    if (this._isOpen || !this._activeHost) return;
    this._isOpen = true;
    this._widget.hidden = false;
    this._overlay.hidden = false;
    this._activeHost.setAttribute('aria-expanded', 'true');
    this._resetApply();
    this._levels = [];
    this._renderTimeline();

    const config = this._config();
    this._rawDraft = normalizeHostValue(this._activeHost.value, config);
    this._draftInput.placeholder = config.mode === 'currency' ? `${config.currency} 0` : '0';
    this._applyCalcModeUI();
    this._syncPreview();
    this._paintOperator();

    requestAnimationFrame(() => {
      this._draftInput.focus();
      this._draftInput.select();
    });

    this.dispatchEvent(new CustomEvent('kaltrap-open', { bubbles: true }));
  }

  private _close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._widget.hidden = true;
    this._overlay.hidden = true;
    this._resetApply();
    if (this._activeHost) {
      this._activeHost.setAttribute('aria-expanded', 'false');
      this._activeHost.focus();
    }
    this.dispatchEvent(new CustomEvent('kaltrap-close', { bubbles: true }));
  }

  /* ─── Calc mode UI ─── */

  private _applyCalcModeUI(): void {
    const full = this._isFullMode();
    this._operatorPicker.hidden = !full;
    this._timelineSection.hidden = !full || this._levels.length === 0;
  }

  /* ─── Operators ─── */

  private _paintOperator(): void {
    this._operatorItems.forEach((item, idx) => {
      const active = idx === this._operatorIndex;
      item.classList.toggle('operator-item--active', active);
      item.setAttribute('aria-selected', String(active));
    });
  }

  private _moveOperator(step: -1 | 1): void {
    const len = this._operatorItems.length;
    this._operatorIndex = (this._operatorIndex + step + len) % len;
    this._paintOperator();
    this._syncPreview();
    this._resetApply();
  }

  private _currentOperator(): string {
    return this._operatorItems[this._operatorIndex]?.dataset.op ?? '+';
  }

  /* ─── Arithmetic engine ─── */

  private _applyOperation(left: number, op: string, right: number): number {
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right === 0 ? left : left / right;
      case '%': return left * (right / 100);
      default: return right;
    }
  }

  private _computePreview(): number {
    const draftValue = parseRawNumber(this._rawDraft);

    if (this._levels.length === 0) return draftValue ?? 0;

    let result = this._levels[0].value;
    for (let i = 1; i < this._levels.length; i++) {
      const op = this._levels[i].operatorToPrev ?? '+';
      result = this._applyOperation(result, op, this._levels[i].value);
    }

    if (draftValue !== null) {
      result = this._applyOperation(result, this._currentOperator(), draftValue);
    }

    return result;
  }

  private _hasDraftValue(): boolean {
    return parseRawNumber(this._rawDraft) !== null;
  }

  /* ─── Timeline ─── */

  private _renderTimeline(): void {
    this._timelineList.innerHTML = '';

    if (this._isFullMode()) {
      this._timelineSection.hidden = this._levels.length === 0;
    }

    for (const level of this._levels) {
      const item = document.createElement('li');
      item.className = 'timeline-item';

      const val = document.createElement('span');
      val.className = 'timeline-value';
      val.textContent = formatNumberForDisplay(level.value, this._config());
      item.append(val);

      if (level.operatorToPrev) {
        const op = document.createElement('span');
        op.className = 'timeline-op';
        op.textContent = level.operatorToPrev;
        item.append(op);
      }

      this._timelineList.append(item);
    }
  }

  /* ─── Preview ─── */

  private _syncPreview(): void {
    this._draftInput.value = this._rawDraft;
    this._previewValue.textContent = formatNumberForDisplay(
      this._computePreview(),
      this._config(),
    );
  }

  /* ─── Level management ─── */

  private _pushLevel(): void {
    const value = parseRawNumber(this._rawDraft);
    if (value === null) return;

    this._levels.push({
      value,
      operatorToPrev: this._levels.length === 0 ? null : this._currentOperator(),
    });

    this._renderTimeline();
    this._rawDraft = '';
    this._syncPreview();
    this._resetApply();
  }

  private _popLastLevel(): void {
    if (this._levels.length === 0) return;
    this._levels.pop();
    this._renderTimeline();
    this._syncPreview();
    this._resetApply();
  }

  /* ─── Apply state ─── */

  private _resetApply(): void {
    this._readyToApply = false;
    this._widget.classList.remove('widget--ready');
  }

  private _markReady(): void {
    this._readyToApply = true;
    this._widget.classList.add('widget--ready');
  }

  /* ─── Apply to host ─── */

  private _applyToHost(): void {
    if (!this._activeHost) return;
    const result = this._computePreview();
    this._activeHost.value = formatNumberForHost(result, this._config());
    this._close();
    this._activeHost.dispatchEvent(new Event('input', { bubbles: true }));
    this._activeHost.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ─── Keyboard handler ─── */

  private _onWidgetKey(e: KeyboardEvent): void {
    if (!this._isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this._close();
      return;
    }

    if (e.key === 'ArrowLeft') {
      if (!this._isFullMode()) return;
      e.preventDefault();
      this._moveOperator(-1);
      return;
    }

    if (e.key === 'ArrowRight') {
      if (!this._isFullMode()) return;
      e.preventDefault();
      this._moveOperator(1);
      return;
    }

    if (e.key === 'ArrowDown') {
      if (!this._isFullMode()) return;
      e.preventDefault();
      this._pushLevel();
      this._draftInput.focus();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      if (!this._isFullMode()) {
        if (this._hasDraftValue()) this._applyToHost();
        return;
      }

      if (this._hasDraftValue()) {
        this._pushLevel();
        this._markReady();
      } else if (this._levels.length > 0) {
        if (!this._readyToApply) {
          this._markReady();
        } else {
          this._applyToHost();
        }
      }
      return;
    }

    if (e.key === 'Backspace' && !this._hasDraftValue()) {
      if (!this._isFullMode()) return;
      e.preventDefault();
      this._popLastLevel();
      this._draftInput.focus();
      return;
    }

    if (e.key !== 'Tab') {
      this._resetApply();
    }
  }
}
