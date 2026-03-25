import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KaltrapCulatorElement } from './kaltrapculator-element';
import { registerKaltrapCulator } from '../register';

/* ─── Register the custom element once ─── */
registerKaltrapCulator();

/* ─── Helpers ─── */

function createHost(attrs: Record<string, string> = {}): HTMLInputElement {
    const input = document.createElement('input');
    input.setAttribute('data-kaltrap', '');
    input.type = attrs.type ?? 'text';
    input.readOnly = true;
    for (const [k, v] of Object.entries(attrs)) {
        if (k !== 'type') input.setAttribute(k, v);
    }
    document.body.appendChild(input);
    return input;
}

function createElement(): KaltrapCulatorElement {
    const el = document.createElement('kaltrap-culator') as KaltrapCulatorElement;
    document.body.appendChild(el);
    return el;
}

function shadow(el: KaltrapCulatorElement): ShadowRoot {
    return el.shadowRoot!;
}

function q<T extends Element>(el: KaltrapCulatorElement, selector: string): T {
    return shadow(el).querySelector<T>(selector)!;
}

function qAll<T extends Element>(el: KaltrapCulatorElement, selector: string): T[] {
    return Array.from(shadow(el).querySelectorAll<T>(selector));
}

function fireKey(target: EventTarget, key: string, opts: Partial<KeyboardEventInit> = {}): void {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }));
}

function firePointerDown(target: EventTarget): void {
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
}

function typeInDraft(el: KaltrapCulatorElement, text: string): void {
    const draft = q<HTMLInputElement>(el, '.draft-input');
    draft.value = text;
    draft.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ─── Suite ─── */

describe('KaltrapCulatorElement', () => {
    let el: KaltrapCulatorElement;
    let hostCurrency: HTMLInputElement;
    let hostNumeric: HTMLInputElement;
    let hostStrict: HTMLInputElement;

    beforeEach(() => {
        document.body.innerHTML = '';

        hostCurrency = createHost({
            type: 'text',
            'data-kaltrap-currency': '$',
            'data-kaltrap-decimals': '2',
            'data-kaltrap-locale': 'es-CO',
            'data-kaltrap-calc': 'full',
        });

        hostNumeric = createHost({
            type: 'number',
            step: '0.01',
            'data-kaltrap-mode': 'numeric',
            'data-kaltrap-decimals': '2',
            'data-kaltrap-locale': 'es-CO',
            'data-kaltrap-calc': 'full',
        });

        hostStrict = createHost({
            type: 'number',
            step: '1',
            'data-kaltrap-mode': 'numeric-strict',
            'data-kaltrap-decimals': '0',
            'data-kaltrap-locale': 'es-CO',
            'data-kaltrap-calc': 'basic',
        });

        el = createElement();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    /* ─── Rendering ─── */

    describe('Shadow DOM rendering', () => {
        it('creates shadow root with widget structure', () => {
            expect(shadow(el)).toBeTruthy();
            expect(q(el, '.widget')).toBeTruthy();
            expect(q(el, '.draft-input')).toBeTruthy();
            expect(q(el, '.preview-value')).toBeTruthy();
            expect(q(el, '.operator-picker')).toBeTruthy();
            expect(q(el, '.timeline')).toBeTruthy();
        });

        it('starts with widget hidden', () => {
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(true);
            expect(q<HTMLElement>(el, '.overlay').hidden).toBe(true);
        });

        it('renders 5 operator items', () => {
            const ops = qAll(el, '.operator-item');
            expect(ops).toHaveLength(5);
            expect(ops.map(o => o.dataset.op)).toEqual(['+', '-', '*', '/', '%']);
        });

        it('renders 3 theme dots', () => {
            const dots = qAll(el, '.theme-dot');
            expect(dots).toHaveLength(3);
        });
    });

    /* ─── Opening widget ─── */

    describe('Widget open/close', () => {
        it('opens on host pointerdown', () => {
            firePointerDown(hostCurrency);
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(false);
            expect(q<HTMLElement>(el, '.overlay').hidden).toBe(false);
        });

        it('opens on host Enter key', () => {
            fireKey(hostCurrency, 'Enter');
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(false);
        });

        it('opens on host Space key', () => {
            fireKey(hostCurrency, ' ');
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(false);
        });

        it('opens on host ArrowDown key', () => {
            fireKey(hostCurrency, 'ArrowDown');
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(false);
        });

        it('closes on Escape', () => {
            firePointerDown(hostCurrency);
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(false);

            fireKey(q(el, '.widget'), 'Escape');
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(true);
        });

        it('closes on cancel button click', () => {
            firePointerDown(hostCurrency);
            q<HTMLButtonElement>(el, '[data-action="cancel"]').click();
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(true);
        });

        it('closes on overlay click', () => {
            firePointerDown(hostCurrency);
            q<HTMLElement>(el, '.overlay').click();
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(true);
        });

        it('dispatches kaltrap-open and kaltrap-close events', () => {
            const openSpy = vi.fn();
            const closeSpy = vi.fn();
            el.addEventListener('kaltrap-open', openSpy);
            el.addEventListener('kaltrap-close', closeSpy);

            firePointerDown(hostCurrency);
            expect(openSpy).toHaveBeenCalledOnce();

            fireKey(q(el, '.widget'), 'Escape');
            expect(closeSpy).toHaveBeenCalledOnce();
        });
    });

    /* ─── Calc mode UI ─── */

    describe('Calc mode (basic vs full)', () => {
        it('shows operators and hides timeline in full mode', () => {
            firePointerDown(hostCurrency); // full mode
            expect(q<HTMLElement>(el, '.operator-picker').hidden).toBe(false);
            // Timeline hidden because no levels yet
            expect(q<HTMLElement>(el, '.timeline').hidden).toBe(true);
        });

        it('hides operators in basic mode', () => {
            firePointerDown(hostStrict); // basic mode
            expect(q<HTMLElement>(el, '.operator-picker').hidden).toBe(true);
        });
    });

    /* ─── Typing and preview ─── */

    describe('Typing and preview', () => {
        it('updates preview on draft input', () => {
            firePointerDown(hostCurrency);
            typeInDraft(el, '1200');
            expect(q(el, '.preview-value').textContent).toBe('$ 1.200');
        });

        it('sanitizes non-numeric characters', () => {
            firePointerDown(hostCurrency);
            typeInDraft(el, 'abc123def');
            expect(q<HTMLInputElement>(el, '.draft-input').value).toBe('123');
        });

        it('shows preview for numeric host mode without currency symbol', () => {
            firePointerDown(hostNumeric);
            typeInDraft(el, '5000');
            expect(q(el, '.preview-value').textContent).toBe('5.000');
        });
    });

    /* ─── Full mode: levels and operators ─── */

    describe('Full mode operations', () => {
        it('pushes a level on Enter and shows timeline', () => {
            firePointerDown(hostCurrency);
            typeInDraft(el, '100');
            fireKey(q(el, '.widget'), 'Enter');

            // Timeline should now be visible with 1 item
            expect(q<HTMLElement>(el, '.timeline').hidden).toBe(false);
            expect(qAll(el, '.timeline-item')).toHaveLength(1);
            // Draft should be cleared
            expect(q<HTMLInputElement>(el, '.draft-input').value).toBe('');
        });

        it('navigates operators with ArrowLeft/ArrowRight', () => {
            firePointerDown(hostCurrency);
            const ops = qAll<HTMLElement>(el, '.operator-item');
            expect(ops[0].classList.contains('operator-item--active')).toBe(true);

            fireKey(q(el, '.widget'), 'ArrowRight');
            expect(ops[1].classList.contains('operator-item--active')).toBe(true);

            fireKey(q(el, '.widget'), 'ArrowLeft');
            expect(ops[0].classList.contains('operator-item--active')).toBe(true);
        });

        it('pops last level on Backspace with empty draft', () => {
            firePointerDown(hostCurrency);
            typeInDraft(el, '100');
            fireKey(q(el, '.widget'), 'Enter');
            expect(qAll(el, '.timeline-item')).toHaveLength(1);

            // Clear draft and backspace
            typeInDraft(el, '');
            fireKey(q(el, '.widget'), 'Backspace');
            expect(qAll(el, '.timeline-item')).toHaveLength(0);
            expect(q<HTMLElement>(el, '.timeline').hidden).toBe(true);
        });

        it('computes addition across levels', () => {
            firePointerDown(hostCurrency);
            // Level 1: 100
            typeInDraft(el, '100');
            fireKey(q(el, '.widget'), 'Enter');

            // Level 2: + 50 (default operator is +)
            typeInDraft(el, '50');
            // Preview should show 150
            expect(q(el, '.preview-value').textContent).toBe('$ 150');
        });

        it('double-Enter applies to host', () => {
            firePointerDown(hostCurrency);
            typeInDraft(el, '1000');
            // First Enter: push level + mark ready
            fireKey(q(el, '.widget'), 'Enter');
            // Second Enter with empty draft: mark ready
            fireKey(q(el, '.widget'), 'Enter');
            // Third Enter: apply
            fireKey(q(el, '.widget'), 'Enter');

            expect(q<HTMLElement>(el, '.widget').hidden).toBe(true);
            expect(hostCurrency.value).toBe('$ 1.000');
        });

        it('pushes level on ArrowDown', () => {
            firePointerDown(hostCurrency);
            typeInDraft(el, '200');
            fireKey(q(el, '.widget'), 'ArrowDown');
            expect(qAll(el, '.timeline-item')).toHaveLength(1);
        });
    });

    /* ─── Basic mode ─── */

    describe('Basic mode', () => {
        it('injects on single Enter', () => {
            firePointerDown(hostStrict);
            typeInDraft(el, '42');
            fireKey(q(el, '.widget'), 'Enter');

            expect(q<HTMLElement>(el, '.widget').hidden).toBe(true);
            expect(hostStrict.value).toBe('42');
        });

        it('ignores ArrowLeft/Right in basic mode', () => {
            firePointerDown(hostStrict);
            const ops = qAll<HTMLElement>(el, '.operator-item');
            fireKey(q(el, '.widget'), 'ArrowRight');
            // Operator should not have moved (still first active from last full-mode use, but doesn't matter — operators are hidden)
            expect(q<HTMLElement>(el, '.operator-picker').hidden).toBe(true);
        });

        it('ignores ArrowDown in basic mode', () => {
            firePointerDown(hostStrict);
            typeInDraft(el, '100');
            fireKey(q(el, '.widget'), 'ArrowDown');
            // No level should be pushed
            expect(qAll(el, '.timeline-item')).toHaveLength(0);
        });
    });

    /* ─── Theme ─── */

    describe('Theme', () => {
        it('defaults to dark theme', () => {
            expect(el.theme).toBe('dark');
            expect(el.getAttribute('theme')).toBe('dark');
        });

        it('changes theme via property', () => {
            el.theme = 'light';
            expect(el.getAttribute('theme')).toBe('light');
        });

        it('changes theme via attribute', () => {
            el.setAttribute('theme', 'borderlands');
            expect(el.theme).toBe('borderlands');
        });

        it('updates active dot on theme change', () => {
            el.theme = 'borderlands';
            const dots = qAll<HTMLButtonElement>(el, '.theme-dot');
            const activeDot = dots.find(d => d.classList.contains('theme-dot--active'));
            expect(activeDot?.dataset.theme).toBe('borderlands');
        });

        it('changes theme on dot click', () => {
            const lightDot = qAll<HTMLButtonElement>(el, '.theme-dot').find(d => d.dataset.theme === 'light')!;
            lightDot.click();
            expect(el.theme).toBe('light');
        });

        it('persists theme in localStorage', () => {
            el.theme = 'borderlands';
            expect(localStorage.getItem('kaltrap-theme')).toBe('borderlands');
        });
    });

    /* ─── Round-trip: host value integrity ─── */

    describe('Round-trip host injection', () => {
        it('currency: injects formatted value and can re-read it', () => {
            firePointerDown(hostCurrency);
            typeInDraft(el, '11000');
            fireKey(q(el, '.widget'), 'Enter');
            fireKey(q(el, '.widget'), 'Enter');
            fireKey(q(el, '.widget'), 'Enter');

            expect(hostCurrency.value).toBe('$ 11.000');

            // Re-open and verify preview reads it back correctly
            firePointerDown(hostCurrency);
            expect(q(el, '.preview-value').textContent).toBe('$ 11.000');
        });

        it('numeric: injects clean number without grouping (no corruption)', () => {
            firePointerDown(hostNumeric);
            typeInDraft(el, '11000');
            fireKey(q(el, '.widget'), 'Enter');
            fireKey(q(el, '.widget'), 'Enter');
            fireKey(q(el, '.widget'), 'Enter');

            // CRITICAL: must be 11000, not 11.000 (which type=number reads as 11)
            expect(hostNumeric.value).toBe('11000');
        });

        it('numeric-strict: injects clean integer', () => {
            firePointerDown(hostStrict);
            typeInDraft(el, '500');
            fireKey(q(el, '.widget'), 'Enter');

            expect(hostStrict.value).toBe('500');
        });
    });

    /* ─── Apply button ─── */

    describe('Apply button', () => {
        it('applies value via click', () => {
            firePointerDown(hostCurrency);
            typeInDraft(el, '2500');
            q<HTMLButtonElement>(el, '[data-action="apply"]').click();

            expect(q<HTMLElement>(el, '.widget').hidden).toBe(true);
            expect(hostCurrency.value).toBe('$ 2.500');
        });
    });

    /* ─── Refresh ─── */

    describe('refresh()', () => {
        it('discovers new host inputs added after initial mount', () => {
            const newHost = createHost({
                type: 'text',
                'data-kaltrap-currency': '€',
                'data-kaltrap-calc': 'basic',
            });

            el.refresh();

            firePointerDown(newHost);
            expect(q<HTMLElement>(el, '.widget').hidden).toBe(false);

            typeInDraft(el, '999');
            fireKey(q(el, '.widget'), 'Enter');
            expect(newHost.value).toBe('€ 999');
        });
    });

    /* ─── Events dispatched on host ─── */

    describe('Host events on apply', () => {
        it('dispatches input and change events on host after apply', () => {
            const inputSpy = vi.fn();
            const changeSpy = vi.fn();
            hostCurrency.addEventListener('input', inputSpy);
            hostCurrency.addEventListener('change', changeSpy);

            firePointerDown(hostCurrency);
            typeInDraft(el, '100');
            q<HTMLButtonElement>(el, '[data-action="apply"]').click();

            expect(inputSpy).toHaveBeenCalledOnce();
            expect(changeSpy).toHaveBeenCalledOnce();
        });
    });
});
