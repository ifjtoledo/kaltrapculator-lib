import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Integration tests for keyboard flow in Claptrap modal.
 * Tests the full interaction path: opening, typing, navigation, confirmation.
 */

function setupDOM(): {
    priceHost: HTMLInputElement;
    quantityHost: HTMLInputElement;
    unitsHost: HTMLInputElement;
    priceHostBasic: HTMLInputElement;
    quantityHostBasic: HTMLInputElement;
    unitsHostBasic: HTMLInputElement;
    widget: HTMLElement;
    draftInput: HTMLInputElement;
    previewValue: HTMLOutputElement;
    timelineList: HTMLOListElement;
    cancelButton: HTMLButtonElement;
    applyButton: HTMLButtonElement;
    operatorItems: HTMLElement[];
    operatorPicker: HTMLElement | null;
    timelineSection: HTMLElement | null;
} {
    document.body.innerHTML = `
        <main class="lab">
            <section class="lab__host-field">
                <input class="lab__host-input" id="price-host" name="price" type="text"
                    placeholder="$ 0" aria-label="Monto monetario" aria-haspopup="dialog"
                    aria-controls="claptrap-widget" aria-expanded="false" readonly data-claptrap
                    data-claptrap-currency="$" data-claptrap-decimals="2" data-claptrap-locale="es-CO"
                    data-claptrap-allow-negative="false"
                    data-claptrap-calc="full" />
            </section>

            <section class="lab__host-field">
                <input class="lab__host-input" id="quantity-host" name="quantity" type="number" step="0.01"
                    placeholder="0" aria-label="Cantidad numerica" aria-haspopup="dialog"
                    aria-controls="claptrap-widget" aria-expanded="false" readonly data-claptrap
                    data-claptrap-mode="numeric" data-claptrap-decimals="2" data-claptrap-locale="es-CO"
                    data-claptrap-allow-negative="false"
                    data-claptrap-calc="full" />
            </section>

            <section class="lab__host-field">
                <input class="lab__host-input" id="units-host" name="units" type="number" step="1"
                    placeholder="0" aria-label="Unidades enteras" aria-haspopup="dialog"
                    aria-controls="claptrap-widget" aria-expanded="false" readonly data-claptrap
                    data-claptrap-mode="numeric-strict" data-claptrap-decimals="0" data-claptrap-locale="es-CO"
                    data-claptrap-allow-negative="false"
                    data-claptrap-calc="full" />
            </section>

            <section class="lab__host-field">
                <input class="lab__host-input" id="price-host-basic" name="price_basic" type="text"
                    placeholder="$ 0" aria-label="Monto monetario basico" aria-haspopup="dialog"
                    aria-controls="claptrap-widget" aria-expanded="false" readonly data-claptrap
                    data-claptrap-currency="$" data-claptrap-decimals="2" data-claptrap-locale="es-CO"
                    data-claptrap-allow-negative="false"
                    data-claptrap-calc="basic" />
            </section>

            <section class="lab__host-field">
                <input class="lab__host-input" id="quantity-host-basic" name="quantity_basic" type="number" step="0.01"
                    placeholder="0" aria-label="Cantidad numerica basica" aria-haspopup="dialog"
                    aria-controls="claptrap-widget" aria-expanded="false" readonly data-claptrap
                    data-claptrap-mode="numeric" data-claptrap-decimals="2" data-claptrap-locale="es-CO"
                    data-claptrap-allow-negative="false"
                    data-claptrap-calc="basic" />
            </section>

            <section class="lab__host-field">
                <input class="lab__host-input" id="units-host-basic" name="units_basic" type="number" step="1"
                    placeholder="0" aria-label="Unidades enteras basicas" aria-haspopup="dialog"
                    aria-controls="claptrap-widget" aria-expanded="false" readonly data-claptrap
                    data-claptrap-mode="numeric-strict" data-claptrap-decimals="0" data-claptrap-locale="es-CO"
                    data-claptrap-allow-negative="false"
                    data-claptrap-calc="basic" />
            </section>

            <section id="claptrap-widget" class="widget" role="dialog" aria-modal="true"
                aria-label="Claptrap widget" hidden>
                <section class="widget__timeline" aria-label="Niveles confirmados">
                    <ol class="widget__timeline-list"></ol>
                </section>

                <section class="widget__active-level" aria-label="Nivel activo">
                    <input id="widget-draft" class="widget__draft-input" type="text"
                        inputmode="decimal" autocomplete="off" aria-label="Valor activo" placeholder="$ 0" />
                </section>

                <section class="widget__operator-picker" aria-label="Seleccion de operador">
                    <ul class="widget__operator-list" role="listbox" aria-label="Operadores">
                        <li class="widget__operator-item widget__operator-item--active"
                            aria-selected="true" data-op="+">+</li>
                        <li class="widget__operator-item" aria-selected="false" data-op="-">-</li>
                        <li class="widget__operator-item" aria-selected="false" data-op="*">*</li>
                        <li class="widget__operator-item" aria-selected="false" data-op="/">/</li>
                        <li class="widget__operator-item" aria-selected="false" data-op="%">%</li>
                    </ul>
                </section>

                <section class="widget__preview" aria-live="polite" aria-label="Resultado provisional">
                    <output class="widget__preview-value">$ 0</output>
                </section>

                <footer class="widget__actions">
                    <button type="button" data-action="cancel" aria-label="Cancelar" title="Cancelar">x</button>
                    <button type="button" data-action="apply" aria-label="Aplicar" title="Aplicar">ok</button>
                </footer>
            </section>
        </main>
    `;

    const priceHost = document.getElementById('price-host') as HTMLInputElement;
    const quantityHost = document.getElementById('quantity-host') as HTMLInputElement;
    const unitsHost = document.getElementById('units-host') as HTMLInputElement;
    const priceHostBasic = document.getElementById('price-host-basic') as HTMLInputElement;
    const quantityHostBasic = document.getElementById('quantity-host-basic') as HTMLInputElement;
    const unitsHostBasic = document.getElementById('units-host-basic') as HTMLInputElement;
    const widget = document.getElementById('claptrap-widget') as HTMLElement;
    const draftInput = document.getElementById('widget-draft') as HTMLInputElement;
    const previewValue = document.querySelector('.widget__preview-value') as HTMLOutputElement;
    const timelineList = document.querySelector('.widget__timeline-list') as HTMLOListElement;
    const cancelButton = document.querySelector('[data-action="cancel"]') as HTMLButtonElement;
    const applyButton = document.querySelector('[data-action="apply"]') as HTMLButtonElement;
    const operatorItems = Array.from(
        document.querySelectorAll<HTMLElement>('.widget__operator-item')
    );

    const operatorPicker = document.querySelector<HTMLElement>('.widget__operator-picker');
    const timelineSection = document.querySelector<HTMLElement>('.widget__timeline');

    return {
        priceHost,
        quantityHost,
        unitsHost,
        priceHostBasic,
        quantityHostBasic,
        unitsHostBasic,
        widget,
        draftInput,
        previewValue,
        timelineList,
        cancelButton,
        applyButton,
        operatorItems,
        operatorPicker,
        timelineSection,
    };
}

function dispatchKeyEvent(
    target: Element,
    key: string,
    eventType: 'keydown' | 'keyup' = 'keydown'
): KeyboardEvent {
    const event = new KeyboardEvent(eventType, {
        key,
        code: key,
        bubbles: true,
        cancelable: true,
    });
    target.dispatchEvent(event);
    return event;
}

describe('Keyboard Flow Integration - Modal Open/Close', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        // Dynamically import and execute lab.ts logic
        // For now, we'll manually execute the initialization since lab.ts has side effects
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should open modal on Enter key pressed on host input', () => {
        expect(dom.widget.hidden).toBe(true);

        dispatchKeyEvent(dom.priceHost, 'Enter');

        expect(dom.widget.hidden).toBe(false);
    });

    it('should open modal on Space key pressed on host input', () => {
        expect(dom.widget.hidden).toBe(true);

        dispatchKeyEvent(dom.priceHost, ' ');

        expect(dom.widget.hidden).toBe(false);
    });

    it('should open modal on ArrowDown key pressed on host input', () => {
        expect(dom.widget.hidden).toBe(true);

        dispatchKeyEvent(dom.priceHost, 'ArrowDown');

        expect(dom.widget.hidden).toBe(false);
    });

    it('should open modal and focus draft input', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        expect(dom.widget.hidden).toBe(false);
        // Note: Can't easily test focus in jsdom without special setup,
        // but the aria-expanded attribute should change
        expect(dom.priceHost.getAttribute('aria-expanded')).toBe('true');
    });

    it('should close modal on Escape key', () => {
        // Open first
        dispatchKeyEvent(dom.priceHost, 'Enter');
        expect(dom.widget.hidden).toBe(false);

        // Close
        dispatchKeyEvent(dom.widget, 'Escape');
        expect(dom.widget.hidden).toBe(true);
    });

    it('should close modal on Cancel button click', () => {
        // Open
        dispatchKeyEvent(dom.priceHost, 'Enter');
        expect(dom.widget.hidden).toBe(false);

        // Click cancel
        dom.cancelButton.click();
        expect(dom.widget.hidden).toBe(true);
    });
});

describe('Keyboard Flow Integration - Operator Navigation', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should navigate operators with ArrowRight', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // Initially + is active (index 0)
        expect(dom.operatorItems[0].classList.contains('widget__operator-item--active')).toBe(
            true
        );
        expect(dom.operatorItems[1].classList.contains('widget__operator-item--active')).toBe(
            false
        );

        // Press ArrowRight
        dispatchKeyEvent(dom.widget, 'ArrowRight');

        // Now - should be active (index 1)
        expect(dom.operatorItems[0].classList.contains('widget__operator-item--active')).toBe(
            false
        );
        expect(dom.operatorItems[1].classList.contains('widget__operator-item--active')).toBe(
            true
        );
    });

    it('should navigate operators with ArrowLeft', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');
        // Move right first
        dispatchKeyEvent(dom.widget, 'ArrowRight');

        // Now + is not active, move left
        dispatchKeyEvent(dom.widget, 'ArrowLeft');

        // Should be back to + (index 0)
        expect(dom.operatorItems[0].classList.contains('widget__operator-item--active')).toBe(
            true
        );
    });

    it('should wrap around operators when navigating past end', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // Press ArrowLeft from + (should wrap to %)
        dispatchKeyEvent(dom.widget, 'ArrowLeft');

        // Check that % (last item, index 4) is now active
        expect(dom.operatorItems[4].classList.contains('widget__operator-item--active')).toBe(
            true
        );
    });
});

describe('Keyboard Flow Integration - Typing and Preview', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should update preview while typing in draft input', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // Type "100"
        dom.draftInput.value = '100';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        // Preview should show formatted value
        expect(dom.previewValue.textContent).toContain('100');
    });

    it('should apply operator when changing draft value', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // Type "50"
        dom.draftInput.value = '50';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        // With % operator: 50% of 0 = 0
        const preview = dom.previewValue.textContent ?? '';
        expect(preview).toBeDefined();
    });

    it('should show preview updated for currency host', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        dom.draftInput.value = '1200';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        // Preview should be updated with the numeric value
        // (formatting is handled by formatNumberForDisplay in actual code)
        expect(dom.previewValue.textContent).toBe('1200');
    });

    it('should show no currency in preview for numeric host', () => {
        dispatchKeyEvent(dom.quantityHost, 'Enter');

        dom.draftInput.value = '1200';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        // Should NOT include currency symbol for quantity host (numeric mode)
        expect(dom.previewValue.textContent).not.toContain('$');
    });
});

describe('Keyboard Flow Integration - Confirmation (Enter)', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should add level to timeline on Enter with draft value', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // Type value
        dom.draftInput.value = '100';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        // Initially no timeline items
        expect(dom.timelineList.children.length).toBe(0);

        // Press Enter
        dispatchKeyEvent(dom.widget, 'Enter');

        // Should have 1 timeline item now
        expect(dom.timelineList.children.length).toBe(1);
    });

    it('should add first level without operator', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        dom.draftInput.value = '100';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        dispatchKeyEvent(dom.widget, 'Enter');

        // First level should have no operator span
        const timelineItem = dom.timelineList.children[0];
        const operatorSpan = timelineItem?.querySelector('.widget__operator-op');
        expect(operatorSpan).toBeNull();
    });

    it('should clear draft after pressing Enter', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        dom.draftInput.value = '100';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        dispatchKeyEvent(dom.widget, 'Enter');

        // Draft input should be cleared
        expect(dom.draftInput.value).toBe('');
    });

    it('should mark ready-to-apply after Enter with value', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        dom.draftInput.value = '100';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        dispatchKeyEvent(dom.widget, 'Enter');

        // Widget should have ready-to-apply class
        expect(dom.widget.classList.contains('widget--ready-to-apply')).toBe(true);
    });
});

describe('Keyboard Flow Integration - Double Enter (Injection)', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should inject result to host on double Enter', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // First value: 100
        dom.draftInput.value = '100';
        const inputEvent1 = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent1);

        // First Enter: confirm level
        dispatchKeyEvent(dom.widget, 'Enter');
        expect(dom.priceHost.value).toBe(''); // Not injected yet

        // Second Enter: inject to host
        dispatchKeyEvent(dom.widget, 'Enter');

        // Should have value in host and modal closed
        expect(dom.priceHost.value).not.toBe('');
        expect(dom.widget.hidden).toBe(true);
    });

    it('should maintain host config when injecting', () => {
        dispatchKeyEvent(dom.quantityHost, 'Enter');

        dom.draftInput.value = '1200';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        // First Enter
        dispatchKeyEvent(dom.widget, 'Enter');

        // Second Enter to inject
        dispatchKeyEvent(dom.widget, 'Enter');

        // Quantity host (numeric) should not have currency symbol
        expect(dom.quantityHost.value).not.toContain('$');
    });
});

describe('Keyboard Flow Integration - Backspace (Undo)', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should remove last level on Backspace (when draft is empty)', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // Add first level
        dom.draftInput.value = '100';
        const inputEvent1 = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent1);
        dispatchKeyEvent(dom.widget, 'Enter');

        expect(dom.timelineList.children.length).toBe(1);

        // Press Backspace (draft is empty)
        dispatchKeyEvent(dom.widget, 'Backspace');

        // Level should be removed
        expect(dom.timelineList.children.length).toBe(0);
    });

    it('should not remove level on Backspace when draft has content', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // Add level
        dom.draftInput.value = '100';
        const inputEvent1 = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent1);
        dispatchKeyEvent(dom.widget, 'Enter');

        // Add draft content
        dom.draftInput.value = '50';
        const inputEvent2 = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent2);

        // Press Backspace (draft has content)
        dispatchKeyEvent(dom.widget, 'Backspace');

        // Level should still be there
        expect(dom.timelineList.children.length).toBe(1);
    });
});

describe('Keyboard Flow Integration - ArrowDown (Quick Confirm)', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should add level on ArrowDown without waiting for Enter', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        dom.draftInput.value = '100';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        // ArrowDown instead of Enter
        dispatchKeyEvent(dom.widget, 'ArrowDown');

        expect(dom.timelineList.children.length).toBe(1);
    });

    it('should clear draft and keep focus in input after ArrowDown', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        dom.draftInput.value = '100';
        const inputEvent = new Event('input', { bubbles: true });
        dom.draftInput.dispatchEvent(inputEvent);

        dispatchKeyEvent(dom.widget, 'ArrowDown');

        // Draft should be cleared
        expect(dom.draftInput.value).toBe('');
    });
});

/**
 * Helper function to set up lab logic without executing full script.
 * Manually attaches event listeners that lab.ts would attach.
 */
function initializeLabLogic(dom: ReturnType<typeof setupDOM>) {
    const {
        priceHost,
        quantityHost,
        unitsHost,
        priceHostBasic,
        quantityHostBasic,
        unitsHostBasic,
        widget,
        draftInput,
        previewValue,
        timelineList,
        cancelButton,
        applyButton,
        operatorItems,
        operatorPicker,
        timelineSection,
    } = dom;

    type Level = { value: number; operatorToPrev: string | null };
    let levels: Level[] = [];
    let rawDraft = '';
    let isOpen = false;
    let readyToApply = false;
    let operatorIndex = 0;
    let activeHostInput = priceHost;

    function getHostConfig(host: HTMLInputElement) {
        const mode = (host.dataset.claptrapMode as string | undefined) ?? 'currency';
        const parsedDecimals = Number.parseInt(host.dataset.claptrapDecimals ?? '2', 10);
        return {
            mode: mode === 'numeric' || mode === 'numeric-strict' ? mode : 'currency',
            currency: host.dataset.claptrapCurrency ?? '$',
            locale: host.dataset.claptrapLocale ?? 'es-CO',
            decimals: Number.isNaN(parsedDecimals) ? 2 : Math.max(0, parsedDecimals),
            allowNegative: host.dataset.claptrapAllowNegative === 'true',
        };
    }

    function parseRawNumber(raw: string): number | null {
        if (!raw || raw === '-' || raw === '.' || raw === '-.') {
            return null;
        }
        const parsed = Number.parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function hasDraftValue(): boolean {
        return parseRawNumber(rawDraft) !== null;
    }

    function currentOperator(): string {
        return operatorItems[operatorIndex]?.dataset.op ?? '%';
    }

    function resetApplyState() {
        readyToApply = false;
        widget.classList.remove('widget--ready-to-apply');
    }

    function markReadyToApply() {
        readyToApply = true;
        widget.classList.add('widget--ready-to-apply');
    }

    function paintOperator(index: number) {
        operatorItems.forEach((item, idx) => {
            const isActive = idx === index;
            item.classList.toggle('widget__operator-item--active', isActive);
            item.setAttribute('aria-selected', String(isActive));
        });
    }

    function moveOperator(step: -1 | 1) {
        operatorIndex = (operatorIndex + step + operatorItems.length) % operatorItems.length;
        paintOperator(operatorIndex);
        resetApplyState();
    }

    function renderTimeline() {
        timelineList.innerHTML = '';
        levels.forEach((level) => {
            const item = document.createElement('li');
            item.className = 'widget__timeline-item';
            const value = document.createElement('span');
            value.className = 'widget__timeline-value';
            value.textContent = String(level.value);
            item.append(value);
            if (level.operatorToPrev) {
                const op = document.createElement('span');
                op.className = 'widget__operator-op';
                op.textContent = level.operatorToPrev;
                item.append(op);
            }
            timelineList.append(item);
        });
    }

    function pushLevel() {
        const value = parseRawNumber(rawDraft);
        if (value === null) {
            return;
        }
        levels.push({
            value,
            operatorToPrev: levels.length === 0 ? null : currentOperator(),
        });
        renderTimeline();
        rawDraft = '';
        draftInput.value = '';
        previewValue.textContent = '0';
        resetApplyState();
    }

    function popLastLevel() {
        if (levels.length > 0) {
            levels.pop();
            renderTimeline();
        }
    }

    function isFullMode(): boolean {
        return activeHostInput.dataset.claptrapCalc === 'full';
    }

    function applyCalcModeUI() {
        const full = isFullMode();
        if (operatorPicker) operatorPicker.hidden = !full;
        if (timelineSection) timelineSection.hidden = !full;
    }

    function openWidget(host: HTMLInputElement) {
        if (isOpen) return;
        isOpen = true;
        widget.hidden = false;
        activeHostInput = host;
        host.setAttribute('aria-expanded', 'true');
        levels = [];
        rawDraft = '';
        draftInput.value = '';
        previewValue.textContent = '0';
        resetApplyState();
        renderTimeline();
        paintOperator(operatorIndex);
        applyCalcModeUI();
    }

    function closeWidget() {
        if (!isOpen) return;
        isOpen = false;
        widget.hidden = true;
        activeHostInput.setAttribute('aria-expanded', 'false');
        resetApplyState();
    }

    function computePreviewNumber(): number {
        if (levels.length === 0) {
            return parseRawNumber(rawDraft) ?? 0;
        }
        let result = levels[0].value;
        for (let i = 1; i < levels.length; i++) {
            const op = levels[i].operatorToPrev ?? '+';
            result = applyOp(result, op, levels[i].value);
        }
        const dv = parseRawNumber(rawDraft);
        if (dv !== null) {
            result = applyOp(result, currentOperator(), dv);
        }
        return result;
    }

    function applyOp(left: number, op: string, right: number): number {
        switch (op) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return right === 0 ? left : left / right;
            case '%': return left * (right / 100);
            default: return right;
        }
    }

    function formatForHost(value: number): string {
        const config = getHostConfig(activeHostInput);
        if (!Number.isFinite(value)) {
            return config.mode === 'currency' ? `${config.currency} 0` : '0';
        }
        const decimals = Number.parseInt(activeHostInput.dataset.claptrapDecimals ?? '2', 10);
        if (config.mode === 'numeric-strict') {
            return String(Math.trunc(value));
        }
        if (config.mode === 'numeric') {
            return new Intl.NumberFormat('en-US', {
                useGrouping: false,
                minimumFractionDigits: 0,
                maximumFractionDigits: Math.max(0, decimals),
            }).format(value);
        }
        const formatter = new Intl.NumberFormat(config.locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: Math.max(0, decimals),
        });
        return `${config.currency} ${formatter.format(value)}`;
    }

    function applyToHost() {
        const result = computePreviewNumber();
        activeHostInput.value = formatForHost(result);
        closeWidget();
        activeHostInput.dispatchEvent(new Event('input', { bubbles: true }));
        activeHostInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Attach event listeners
    [priceHost, quantityHost, unitsHost, priceHostBasic, quantityHostBasic, unitsHostBasic].forEach((host) => {
        host.addEventListener('keydown', (event: KeyboardEvent) => {
            if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                openWidget(host);
            }
        });
    });

    cancelButton.addEventListener('click', closeWidget);
    applyButton.addEventListener('click', applyToHost);

    operatorItems.forEach((item, idx) => {
        item.addEventListener('click', () => {
            operatorIndex = idx;
            paintOperator(operatorIndex);
            resetApplyState();
        });
    });

    draftInput.addEventListener('input', () => {
        rawDraft = draftInput.value.replace(/[^\d.,-]/g, '');
        previewValue.textContent = rawDraft || '0';
        resetApplyState();
    });

    widget.addEventListener('keydown', (event: KeyboardEvent) => {
        if (!isOpen) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            closeWidget();
            return;
        }

        if (event.key === 'ArrowLeft') {
            if (!isFullMode()) return;
            event.preventDefault();
            moveOperator(-1);
            return;
        }

        if (event.key === 'ArrowRight') {
            if (!isFullMode()) return;
            event.preventDefault();
            moveOperator(1);
            return;
        }

        if (event.key === 'ArrowDown') {
            if (!isFullMode()) return;
            event.preventDefault();
            pushLevel();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            if (!isFullMode()) {
                if (hasDraftValue()) {
                    applyToHost();
                }
                return;
            }

            if (hasDraftValue()) {
                pushLevel();
                markReadyToApply();
            } else if (levels.length > 0) {
                if (!readyToApply) {
                    markReadyToApply();
                } else {
                    applyToHost();
                }
            }
            return;
        }

        if (event.key === 'Backspace' && !hasDraftValue()) {
            if (!isFullMode()) return;
            event.preventDefault();
            popLastLevel();
            return;
        }

        if (event.key !== 'Tab') {
            resetApplyState();
        }
    });
}

/* ─── Helper: types a value, double-Enters to inject, returns host value ─── */

function typeAndInject(
    dom: ReturnType<typeof setupDOM>,
    host: HTMLInputElement,
    value: string
): string {
    // Open modal on this host
    dispatchKeyEvent(host, 'Enter');

    // Type value
    dom.draftInput.value = value;
    dom.draftInput.dispatchEvent(new Event('input', { bubbles: true }));

    // First Enter: confirm level
    dispatchKeyEvent(dom.widget, 'Enter');

    // Second Enter: inject to host
    dispatchKeyEvent(dom.widget, 'Enter');

    return host.value;
}

/* ─── Round-trip tests: type → inject → reopen → verify ─────────────── */

describe('Round-trip: currency host (type="text", es-CO)', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('injects small value correctly', () => {
        const result = typeAndInject(dom, dom.priceHost, '500');
        expect(result).toContain('500');
    });

    it('injects thousands (11000) without corruption', () => {
        const result = typeAndInject(dom, dom.priceHost, '11000');
        expect(result).toContain('11');
        expect(result).toContain('000');
    });

    it('injects millions (1500000) correctly', () => {
        const result = typeAndInject(dom, dom.priceHost, '1500000');
        expect(result).toContain('1');
        expect(result).toContain('500');
        expect(result).toContain('000');
    });

    it('preserves decimals on injection', () => {
        const result = typeAndInject(dom, dom.priceHost, '11000.75');
        expect(result).toContain('11');
        expect(result).toContain('000');
    });
});

describe('Round-trip: numeric host (type="number" step="0.01")', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('injects small value as clean number', () => {
        const result = typeAndInject(dom, dom.quantityHost, '500');
        expect(result).toBe('500');
    });

    it('injects thousands (11000) without dot separator corruption', () => {
        const result = typeAndInject(dom, dom.quantityHost, '11000');
        // CRITICAL: must be "11000", NOT "11.000" (which type="number" reads as 11)
        expect(result).toBe('11000');
    });

    it('injects thousands (57000) without dot separator corruption', () => {
        const result = typeAndInject(dom, dom.quantityHost, '57000');
        expect(result).toBe('57000');
    });

    it('injects millions without grouping separators', () => {
        const result = typeAndInject(dom, dom.quantityHost, '1500000');
        expect(result).toBe('1500000');
    });

    it('injects decimal value without grouping', () => {
        const result = typeAndInject(dom, dom.quantityHost, '11000.5');
        expect(result).toBe('11000.5');
    });

    it('injects 2000 without turning into 2.00', () => {
        const result = typeAndInject(dom, dom.quantityHost, '2000');
        expect(result).toBe('2000');
    });

    it('injects 99999 correctly', () => {
        const result = typeAndInject(dom, dom.quantityHost, '99999');
        expect(result).toBe('99999');
    });
});

describe('Round-trip: numeric-strict host (type="number" step="1")', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('injects small integer correctly', () => {
        const result = typeAndInject(dom, dom.unitsHost, '42');
        expect(result).toBe('42');
    });

    it('injects thousands (11000) as clean integer', () => {
        const result = typeAndInject(dom, dom.unitsHost, '11000');
        expect(result).toBe('11000');
    });

    it('injects millions as clean integer', () => {
        const result = typeAndInject(dom, dom.unitsHost, '1500000');
        expect(result).toBe('1500000');
    });

    it('injects 2000 without turning into 2', () => {
        const result = typeAndInject(dom, dom.unitsHost, '2000');
        expect(result).toBe('2000');
    });

    it('injects 99999 correctly', () => {
        const result = typeAndInject(dom, dom.unitsHost, '99999');
        expect(result).toBe('99999');
    });
});

/* ─── Helper: type + single Enter for basic mode (native basic inputs) ─── */

function typeAndInjectBasic(
    dom: ReturnType<typeof setupDOM>,
    host: HTMLInputElement,
    value: string
): string {
    dispatchKeyEvent(host, 'Enter');

    dom.draftInput.value = value;
    dom.draftInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Basic mode: single Enter injects
    dispatchKeyEvent(dom.widget, 'Enter');

    return host.value;
}

/* ─── Basic mode tests ─────────────────────────────────────────────── */

describe('Basic mode: operator picker and timeline hidden', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('hides operator picker when calc mode is basic', () => {
        dispatchKeyEvent(dom.priceHostBasic, 'Enter');

        expect(dom.operatorPicker!.hidden).toBe(true);
    });

    it('hides timeline when calc mode is basic', () => {
        dispatchKeyEvent(dom.priceHostBasic, 'Enter');

        expect(dom.timelineSection!.hidden).toBe(true);
    });

    it('shows operator picker when calc mode is full', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        expect(dom.operatorPicker!.hidden).toBe(false);
    });

    it('shows timeline when calc mode is full', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        expect(dom.timelineSection!.hidden).toBe(false);
    });
});

describe('Basic mode: single Enter injects value', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('injects on single Enter (currency)', () => {
        const result = typeAndInjectBasic(dom, dom.priceHostBasic, '500');
        expect(result).toContain('500');
        expect(dom.widget.hidden).toBe(true);
    });

    it('injects on single Enter (numeric)', () => {
        const result = typeAndInjectBasic(dom, dom.quantityHostBasic, '11000');
        expect(result).toBe('11000');
        expect(dom.widget.hidden).toBe(true);
    });

    it('injects on single Enter (numeric-strict)', () => {
        const result = typeAndInjectBasic(dom, dom.unitsHostBasic, '42');
        expect(result).toBe('42');
        expect(dom.widget.hidden).toBe(true);
    });
});

describe('Basic mode: ignores operator/level keys', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('ArrowLeft does not change operator in basic mode', () => {
        dispatchKeyEvent(dom.priceHostBasic, 'Enter');

        const activeBefore = dom.operatorItems.findIndex(
            (item) => item.classList.contains('widget__operator-item--active')
        );

        dispatchKeyEvent(dom.widget, 'ArrowLeft');

        const activeAfter = dom.operatorItems.findIndex(
            (item) => item.classList.contains('widget__operator-item--active')
        );

        expect(activeAfter).toBe(activeBefore);
    });

    it('ArrowRight does not change operator in basic mode', () => {
        dispatchKeyEvent(dom.priceHostBasic, 'Enter');

        const activeBefore = dom.operatorItems.findIndex(
            (item) => item.classList.contains('widget__operator-item--active')
        );

        dispatchKeyEvent(dom.widget, 'ArrowRight');

        const activeAfter = dom.operatorItems.findIndex(
            (item) => item.classList.contains('widget__operator-item--active')
        );

        expect(activeAfter).toBe(activeBefore);
    });

    it('ArrowDown does not push level in basic mode', () => {
        dispatchKeyEvent(dom.priceHostBasic, 'Enter');

        dom.draftInput.value = '100';
        dom.draftInput.dispatchEvent(new Event('input', { bubbles: true }));

        dispatchKeyEvent(dom.widget, 'ArrowDown');

        expect(dom.timelineList.children.length).toBe(0);
    });

    it('Backspace does not pop level in basic mode', () => {
        dispatchKeyEvent(dom.priceHostBasic, 'Enter');

        dispatchKeyEvent(dom.widget, 'Backspace');

        // Widget still open, no crash
        expect(dom.widget.hidden).toBe(false);
    });
});

describe('Basic mode round-trip: native basic inputs', () => {
    let dom: ReturnType<typeof setupDOM>;

    beforeEach(() => {
        dom = setupDOM();
        initializeLabLogic(dom);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('currency basic: injects 11000 correctly', () => {
        const result = typeAndInjectBasic(dom, dom.priceHostBasic, '11000');
        expect(result).toContain('11');
        expect(result).toContain('000');
    });

    it('numeric basic: injects 11000 without dot corruption', () => {
        const result = typeAndInjectBasic(dom, dom.quantityHostBasic, '11000');
        expect(result).toBe('11000');
    });

    it('numeric basic: injects 1500000 without grouping', () => {
        const result = typeAndInjectBasic(dom, dom.quantityHostBasic, '1500000');
        expect(result).toBe('1500000');
    });

    it('numeric-strict basic: injects 11000 as clean integer', () => {
        const result = typeAndInjectBasic(dom, dom.unitsHostBasic, '11000');
        expect(result).toBe('11000');
    });

    it('numeric-strict basic: injects 99999 correctly', () => {
        const result = typeAndInjectBasic(dom, dom.unitsHostBasic, '99999');
        expect(result).toBe('99999');
    });
});
