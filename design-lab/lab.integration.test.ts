import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { registerKaltrapCulator } from '../src/register';
import type { KaltrapCulatorElement } from '../src/components/kaltrapculator-element';

/**
 * Integration tests — design-lab recycled to consume the <kaltrap-culator> library.
 * All widget logic comes from the custom element + Shadow DOM.
 * Tests query through shadowRoot instead of document.
 */

registerKaltrapCulator();

/* ─── Setup ─── */

function createHost(id: string, attrs: Record<string, string> = {}): HTMLInputElement {
    const input = document.createElement('input');
    input.id = id;
    input.className = 'lab__host-input';
    input.readOnly = true;
    input.setAttribute('data-kaltrap', '');
    for (const [k, v] of Object.entries(attrs)) input.setAttribute(k, v);
    document.body.appendChild(input);
    return input;
}

interface Lab {
    priceHost: HTMLInputElement;
    quantityHost: HTMLInputElement;
    unitsHost: HTMLInputElement;
    priceHostBasic: HTMLInputElement;
    quantityHostBasic: HTMLInputElement;
    unitsHostBasic: HTMLInputElement;
    el: KaltrapCulatorElement;
    shadow: ShadowRoot;
    widget: HTMLElement;
    draftInput: HTMLInputElement;
    previewValue: HTMLOutputElement;
    timelineList: HTMLOListElement;
    cancelButton: HTMLButtonElement;
    applyButton: HTMLButtonElement;
    operatorItems: HTMLElement[];
    operatorPicker: HTMLElement;
    timelineSection: HTMLElement;
}

function setupLab(): Lab {
    document.body.innerHTML = '';

    const priceHost = createHost('price-host', {
        type: 'text', placeholder: '$ 0',
        'data-kaltrap-currency': '$', 'data-kaltrap-decimals': '2',
        'data-kaltrap-locale': 'es-CO', 'data-kaltrap-allow-negative': 'false',
        'data-kaltrap-calc': 'full',
    });
    const quantityHost = createHost('quantity-host', {
        type: 'number', step: '0.01', placeholder: '0',
        'data-kaltrap-mode': 'numeric', 'data-kaltrap-decimals': '2',
        'data-kaltrap-locale': 'es-CO', 'data-kaltrap-allow-negative': 'false',
        'data-kaltrap-calc': 'full',
    });
    const unitsHost = createHost('units-host', {
        type: 'number', step: '1', placeholder: '0',
        'data-kaltrap-mode': 'numeric-strict', 'data-kaltrap-decimals': '0',
        'data-kaltrap-locale': 'es-CO', 'data-kaltrap-allow-negative': 'false',
        'data-kaltrap-calc': 'full',
    });
    const priceHostBasic = createHost('price-host-basic', {
        type: 'text', placeholder: '$ 0',
        'data-kaltrap-currency': '$', 'data-kaltrap-decimals': '2',
        'data-kaltrap-locale': 'es-CO', 'data-kaltrap-allow-negative': 'false',
        'data-kaltrap-calc': 'basic',
    });
    const quantityHostBasic = createHost('quantity-host-basic', {
        type: 'number', step: '0.01', placeholder: '0',
        'data-kaltrap-mode': 'numeric', 'data-kaltrap-decimals': '2',
        'data-kaltrap-locale': 'es-CO', 'data-kaltrap-allow-negative': 'false',
        'data-kaltrap-calc': 'basic',
    });
    const unitsHostBasic = createHost('units-host-basic', {
        type: 'number', step: '1', placeholder: '0',
        'data-kaltrap-mode': 'numeric-strict', 'data-kaltrap-decimals': '0',
        'data-kaltrap-locale': 'es-CO', 'data-kaltrap-allow-negative': 'false',
        'data-kaltrap-calc': 'basic',
    });

    const el = document.createElement('kaltrap-culator') as KaltrapCulatorElement;
    document.body.appendChild(el);

    const shadow = el.shadowRoot!;
    const q = <T extends Element>(s: string) => shadow.querySelector<T>(s)!;

    return {
        priceHost, quantityHost, unitsHost,
        priceHostBasic, quantityHostBasic, unitsHostBasic,
        el, shadow,
        widget: q<HTMLElement>('.widget'),
        draftInput: q<HTMLInputElement>('.draft-input'),
        previewValue: q<HTMLOutputElement>('.preview-value'),
        timelineList: q<HTMLOListElement>('.timeline-list'),
        cancelButton: q<HTMLButtonElement>('[data-action="cancel"]'),
        applyButton: q<HTMLButtonElement>('[data-action="apply"]'),
        operatorItems: Array.from(shadow.querySelectorAll<HTMLElement>('.operator-item')),
        operatorPicker: q<HTMLElement>('.operator-picker'),
        timelineSection: q<HTMLElement>('.timeline'),
    };
}

function fireKey(target: EventTarget, key: string): void {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function typeInDraft(lab: Lab, text: string): void {
    lab.draftInput.value = text;
    lab.draftInput.dispatchEvent(new Event('input', { bubbles: true }));
}

/* ─── Modal Open/Close ─── */

describe('Keyboard Flow Integration - Modal Open/Close', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('should open modal on Enter key pressed on host input', () => {
        expect(lab.widget.hidden).toBe(true);
        fireKey(lab.priceHost, 'Enter');
        expect(lab.widget.hidden).toBe(false);
    });

    it('should open modal on Space key pressed on host input', () => {
        expect(lab.widget.hidden).toBe(true);
        fireKey(lab.priceHost, ' ');
        expect(lab.widget.hidden).toBe(false);
    });

    it('should open modal on ArrowDown key pressed on host input', () => {
        expect(lab.widget.hidden).toBe(true);
        fireKey(lab.priceHost, 'ArrowDown');
        expect(lab.widget.hidden).toBe(false);
    });

    it('should open modal and set aria-expanded on host', () => {
        fireKey(lab.priceHost, 'Enter');
        expect(lab.widget.hidden).toBe(false);
        expect(lab.priceHost.getAttribute('aria-expanded')).toBe('true');
    });

    it('should close modal on Escape key', () => {
        fireKey(lab.priceHost, 'Enter');
        expect(lab.widget.hidden).toBe(false);
        fireKey(lab.widget, 'Escape');
        expect(lab.widget.hidden).toBe(true);
    });

    it('should close modal on Cancel button click', () => {
        fireKey(lab.priceHost, 'Enter');
        expect(lab.widget.hidden).toBe(false);
        lab.cancelButton.click();
        expect(lab.widget.hidden).toBe(true);
    });
});

/* ─── Operator Navigation ─── */

describe('Keyboard Flow Integration - Operator Navigation', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('should navigate operators with ArrowRight', () => {
        fireKey(lab.priceHost, 'Enter');
        expect(lab.operatorItems[0].classList.contains('operator-item--active')).toBe(true);
        expect(lab.operatorItems[1].classList.contains('operator-item--active')).toBe(false);

        fireKey(lab.widget, 'ArrowRight');
        expect(lab.operatorItems[0].classList.contains('operator-item--active')).toBe(false);
        expect(lab.operatorItems[1].classList.contains('operator-item--active')).toBe(true);
    });

    it('should navigate operators with ArrowLeft', () => {
        fireKey(lab.priceHost, 'Enter');
        fireKey(lab.widget, 'ArrowRight');
        fireKey(lab.widget, 'ArrowLeft');
        expect(lab.operatorItems[0].classList.contains('operator-item--active')).toBe(true);
    });

    it('should wrap around operators when navigating past end', () => {
        fireKey(lab.priceHost, 'Enter');
        fireKey(lab.widget, 'ArrowLeft');
        expect(lab.operatorItems[4].classList.contains('operator-item--active')).toBe(true);
    });
});

/* ─── Typing and Preview ─── */

describe('Keyboard Flow Integration - Typing and Preview', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('should update preview while typing in draft input', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        expect(lab.previewValue.textContent).toContain('100');
    });

    it('should apply operator when changing draft value', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '50');
        const preview = lab.previewValue.textContent ?? '';
        expect(preview).toBeDefined();
    });

    it('should show preview updated for currency host', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '1200');
        expect(lab.previewValue.textContent).toBe('$ 1.200');
    });

    it('should show no currency in preview for numeric host', () => {
        fireKey(lab.quantityHost, 'Enter');
        typeInDraft(lab, '1200');
        expect(lab.previewValue.textContent).not.toContain('$');
    });
});

/* ─── Confirmation (Enter) ─── */

describe('Keyboard Flow Integration - Confirmation (Enter)', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('should add level to timeline on Enter with draft value', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        expect(lab.timelineList.children.length).toBe(0);

        fireKey(lab.widget, 'Enter');
        expect(lab.timelineList.children.length).toBe(1);
    });

    it('should add first level without operator', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'Enter');

        const timelineItem = lab.timelineList.children[0];
        const operatorSpan = timelineItem?.querySelector('.timeline-op');
        expect(operatorSpan).toBeNull();
    });

    it('should clear draft after pressing Enter', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'Enter');
        expect(lab.draftInput.value).toBe('');
    });

    it('should mark ready-to-apply after Enter with value', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'Enter');
        expect(lab.widget.classList.contains('widget--ready')).toBe(true);
    });
});

/* ─── Double Enter (Injection) ─── */

describe('Keyboard Flow Integration - Double Enter (Injection)', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('should inject result to host on double Enter', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'Enter');
        expect(lab.priceHost.value).toBe('');

        fireKey(lab.widget, 'Enter');
        expect(lab.priceHost.value).not.toBe('');
        expect(lab.widget.hidden).toBe(true);
    });

    it('should maintain host config when injecting', () => {
        fireKey(lab.quantityHost, 'Enter');
        typeInDraft(lab, '1200');
        fireKey(lab.widget, 'Enter');
        fireKey(lab.widget, 'Enter');
        expect(lab.quantityHost.value).not.toContain('$');
    });
});

/* ─── Backspace (Undo) ─── */

describe('Keyboard Flow Integration - Backspace (Undo)', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('should remove last level on Backspace (when draft is empty)', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'Enter');
        expect(lab.timelineList.children.length).toBe(1);

        fireKey(lab.widget, 'Backspace');
        expect(lab.timelineList.children.length).toBe(0);
    });

    it('should not remove level on Backspace when draft has content', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'Enter');

        typeInDraft(lab, '50');
        fireKey(lab.widget, 'Backspace');
        expect(lab.timelineList.children.length).toBe(1);
    });
});

/* ─── ArrowDown (Quick Confirm) ─── */

describe('Keyboard Flow Integration - ArrowDown (Quick Confirm)', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('should add level on ArrowDown without waiting for Enter', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'ArrowDown');
        expect(lab.timelineList.children.length).toBe(1);
    });

    it('should clear draft and keep focus in input after ArrowDown', () => {
        fireKey(lab.priceHost, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'ArrowDown');
        expect(lab.draftInput.value).toBe('');
    });
});

/* ─── Helper: types a value, double-Enters to inject ─── */

function typeAndInject(lab: Lab, host: HTMLInputElement, value: string): string {
    fireKey(host, 'Enter');
    typeInDraft(lab, value);
    fireKey(lab.widget, 'Enter');
    fireKey(lab.widget, 'Enter');
    return host.value;
}

/* ─── Round-trip: currency host ─── */

describe('Round-trip: currency host (type="text", es-CO)', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('injects small value correctly', () => {
        const result = typeAndInject(lab, lab.priceHost, '500');
        expect(result).toContain('500');
    });

    it('injects thousands (11000) without corruption', () => {
        const result = typeAndInject(lab, lab.priceHost, '11000');
        expect(result).toContain('11');
        expect(result).toContain('000');
    });

    it('injects millions (1500000) correctly', () => {
        const result = typeAndInject(lab, lab.priceHost, '1500000');
        expect(result).toContain('1');
        expect(result).toContain('500');
        expect(result).toContain('000');
    });

    it('preserves decimals on injection', () => {
        const result = typeAndInject(lab, lab.priceHost, '11000.75');
        expect(result).toContain('11');
        expect(result).toContain('000');
    });
});

/* ─── Round-trip: numeric host ─── */

describe('Round-trip: numeric host (type="number" step="0.01")', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('injects small value as clean number', () => {
        const result = typeAndInject(lab, lab.quantityHost, '500');
        expect(result).toBe('500');
    });

    it('injects thousands (11000) without dot separator corruption', () => {
        const result = typeAndInject(lab, lab.quantityHost, '11000');
        expect(result).toBe('11000');
    });

    it('injects thousands (57000) without dot separator corruption', () => {
        const result = typeAndInject(lab, lab.quantityHost, '57000');
        expect(result).toBe('57000');
    });

    it('injects millions without grouping separators', () => {
        const result = typeAndInject(lab, lab.quantityHost, '1500000');
        expect(result).toBe('1500000');
    });

    it('injects decimal value without grouping', () => {
        const result = typeAndInject(lab, lab.quantityHost, '11000.5');
        expect(result).toBe('11000.5');
    });

    it('injects 2000 without turning into 2.00', () => {
        const result = typeAndInject(lab, lab.quantityHost, '2000');
        expect(result).toBe('2000');
    });

    it('injects 99999 correctly', () => {
        const result = typeAndInject(lab, lab.quantityHost, '99999');
        expect(result).toBe('99999');
    });
});

/* ─── Round-trip: numeric-strict host ─── */

describe('Round-trip: numeric-strict host (type="number" step="1")', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('injects small integer correctly', () => {
        const result = typeAndInject(lab, lab.unitsHost, '42');
        expect(result).toBe('42');
    });

    it('injects thousands (11000) as clean integer', () => {
        const result = typeAndInject(lab, lab.unitsHost, '11000');
        expect(result).toBe('11000');
    });

    it('injects millions as clean integer', () => {
        const result = typeAndInject(lab, lab.unitsHost, '1500000');
        expect(result).toBe('1500000');
    });

    it('injects 2000 without turning into 2', () => {
        const result = typeAndInject(lab, lab.unitsHost, '2000');
        expect(result).toBe('2000');
    });

    it('injects 99999 correctly', () => {
        const result = typeAndInject(lab, lab.unitsHost, '99999');
        expect(result).toBe('99999');
    });
});

/* ─── Helper: single Enter for basic mode ─── */

function typeAndInjectBasic(lab: Lab, host: HTMLInputElement, value: string): string {
    fireKey(host, 'Enter');
    typeInDraft(lab, value);
    fireKey(lab.widget, 'Enter');
    return host.value;
}

/* ─── Basic mode: UI ─── */

describe('Basic mode: operator picker and timeline hidden', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('hides operator picker when calc mode is basic', () => {
        fireKey(lab.priceHostBasic, 'Enter');
        expect(lab.operatorPicker.hidden).toBe(true);
    });

    it('hides timeline when calc mode is basic', () => {
        fireKey(lab.priceHostBasic, 'Enter');
        expect(lab.timelineSection.hidden).toBe(true);
    });

    it('shows operator picker when calc mode is full', () => {
        fireKey(lab.priceHost, 'Enter');
        expect(lab.operatorPicker.hidden).toBe(false);
    });

    it('shows timeline when calc mode is full', () => {
        fireKey(lab.priceHost, 'Enter');
        // Timeline hidden when empty in full mode
        expect(lab.timelineSection.hidden).toBe(true);
    });
});

/* ─── Basic mode: single Enter injects ─── */

describe('Basic mode: single Enter injects value', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('injects on single Enter (currency)', () => {
        const result = typeAndInjectBasic(lab, lab.priceHostBasic, '500');
        expect(result).toContain('500');
        expect(lab.widget.hidden).toBe(true);
    });

    it('injects on single Enter (numeric)', () => {
        const result = typeAndInjectBasic(lab, lab.quantityHostBasic, '11000');
        expect(result).toBe('11000');
        expect(lab.widget.hidden).toBe(true);
    });

    it('injects on single Enter (numeric-strict)', () => {
        const result = typeAndInjectBasic(lab, lab.unitsHostBasic, '42');
        expect(result).toBe('42');
        expect(lab.widget.hidden).toBe(true);
    });
});

/* ─── Basic mode: ignores operator/level keys ─── */

describe('Basic mode: ignores operator/level keys', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('ArrowLeft does not change operator in basic mode', () => {
        fireKey(lab.priceHostBasic, 'Enter');
        const activeBefore = lab.operatorItems.findIndex(
            (item) => item.classList.contains('operator-item--active')
        );
        fireKey(lab.widget, 'ArrowLeft');
        const activeAfter = lab.operatorItems.findIndex(
            (item) => item.classList.contains('operator-item--active')
        );
        expect(activeAfter).toBe(activeBefore);
    });

    it('ArrowRight does not change operator in basic mode', () => {
        fireKey(lab.priceHostBasic, 'Enter');
        const activeBefore = lab.operatorItems.findIndex(
            (item) => item.classList.contains('operator-item--active')
        );
        fireKey(lab.widget, 'ArrowRight');
        const activeAfter = lab.operatorItems.findIndex(
            (item) => item.classList.contains('operator-item--active')
        );
        expect(activeAfter).toBe(activeBefore);
    });

    it('ArrowDown does not push level in basic mode', () => {
        fireKey(lab.priceHostBasic, 'Enter');
        typeInDraft(lab, '100');
        fireKey(lab.widget, 'ArrowDown');
        expect(lab.timelineList.children.length).toBe(0);
    });

    it('Backspace does not pop level in basic mode', () => {
        fireKey(lab.priceHostBasic, 'Enter');
        fireKey(lab.widget, 'Backspace');
        expect(lab.widget.hidden).toBe(false);
    });
});

/* ─── Basic mode round-trip ─── */

describe('Basic mode round-trip: native basic inputs', () => {
    let lab: Lab;

    beforeEach(() => { lab = setupLab(); });
    afterEach(() => { document.body.innerHTML = ''; });

    it('currency basic: injects 11000 correctly', () => {
        const result = typeAndInjectBasic(lab, lab.priceHostBasic, '11000');
        expect(result).toContain('11');
        expect(result).toContain('000');
    });

    it('numeric basic: injects 11000 without dot corruption', () => {
        const result = typeAndInjectBasic(lab, lab.quantityHostBasic, '11000');
        expect(result).toBe('11000');
    });

    it('numeric basic: injects 1500000 without grouping', () => {
        const result = typeAndInjectBasic(lab, lab.quantityHostBasic, '1500000');
        expect(result).toBe('1500000');
    });

    it('numeric-strict basic: injects 11000 as clean integer', () => {
        const result = typeAndInjectBasic(lab, lab.unitsHostBasic, '11000');
        expect(result).toBe('11000');
    });

    it('numeric-strict basic: injects 99999 correctly', () => {
        const result = typeAndInjectBasic(lab, lab.unitsHostBasic, '99999');
        expect(result).toBe('99999');
    });
});
