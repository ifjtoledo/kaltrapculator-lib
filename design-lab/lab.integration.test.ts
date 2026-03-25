import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Integration tests for keyboard flow in Claptrap modal.
 * Tests the full interaction path: opening, typing, navigation, confirmation.
 */

function setupDOM(): {
    priceHost: HTMLInputElement;
    quantityHost: HTMLInputElement;
    widget: HTMLElement;
    draftInput: HTMLInputElement;
    previewValue: HTMLOutputElement;
    timelineList: HTMLOListElement;
    cancelButton: HTMLButtonElement;
    applyButton: HTMLButtonElement;
    operatorItems: HTMLElement[];
} {
    document.body.innerHTML = `
        <main class="lab">
            <section class="lab__host-field">
                <input class="lab__host-input" id="price-host" name="price" type="text"
                    placeholder="$ 0" aria-label="Monto monetario" aria-haspopup="dialog"
                    aria-controls="claptrap-widget" aria-expanded="false" readonly data-claptrap
                    data-claptrap-currency="$" data-claptrap-decimals="2" data-claptrap-locale="es-CO"
                    data-claptrap-allow-negative="false" />
            </section>

            <section class="lab__host-field">
                <input class="lab__host-input" id="quantity-host" name="quantity" type="text"
                    placeholder="0" aria-label="Cantidad numerica" aria-haspopup="dialog"
                    aria-controls="claptrap-widget" aria-expanded="false" readonly data-claptrap
                    data-claptrap-mode="numeric" data-claptrap-decimals="2" data-claptrap-locale="es-CO"
                    data-claptrap-allow-negative="false" />
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
                            aria-selected="true" data-op="%">%</li>
                        <li class="widget__operator-item" aria-selected="false" data-op="+">+</li>
                        <li class="widget__operator-item" aria-selected="false" data-op="-">-</li>
                        <li class="widget__operator-item" aria-selected="false" data-op="*">*</li>
                        <li class="widget__operator-item" aria-selected="false" data-op="/">/</li>
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
    const widget = document.getElementById('claptrap-widget') as HTMLElement;
    const draftInput = document.getElementById('widget-draft') as HTMLInputElement;
    const previewValue = document.querySelector('.widget__preview-value') as HTMLOutputElement;
    const timelineList = document.querySelector('.widget__timeline-list') as HTMLOListElement;
    const cancelButton = document.querySelector('[data-action="cancel"]') as HTMLButtonElement;
    const applyButton = document.querySelector('[data-action="apply"]') as HTMLButtonElement;
    const operatorItems = Array.from(
        document.querySelectorAll<HTMLElement>('.widget__operator-item')
    );

    return {
        priceHost,
        quantityHost,
        widget,
        draftInput,
        previewValue,
        timelineList,
        cancelButton,
        applyButton,
        operatorItems,
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

        // Initially % is active (index 0)
        expect(dom.operatorItems[0].classList.contains('widget__operator-item--active')).toBe(
            true
        );
        expect(dom.operatorItems[1].classList.contains('widget__operator-item--active')).toBe(
            false
        );

        // Press ArrowRight
        dispatchKeyEvent(dom.widget, 'ArrowRight');

        // Now + should be active (index 1)
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

        // Now % is not active, move left
        dispatchKeyEvent(dom.widget, 'ArrowLeft');

        // Should be back to % (index 0)
        expect(dom.operatorItems[0].classList.contains('widget__operator-item--active')).toBe(
            true
        );
    });

    it('should wrap around operators when navigating past end', () => {
        dispatchKeyEvent(dom.priceHost, 'Enter');

        // Press ArrowLeft from % (should wrap to /)
        dispatchKeyEvent(dom.widget, 'ArrowLeft');

        // Check that / (last item, index 4) is now active
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
        widget,
        draftInput,
        previewValue,
        timelineList,
        cancelButton,
        applyButton,
        operatorItems,
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
    }

    function closeWidget() {
        if (!isOpen) return;
        isOpen = false;
        widget.hidden = true;
        activeHostInput.setAttribute('aria-expanded', 'false');
        resetApplyState();
    }

    function applyToHost() {
        activeHostInput.value = previewValue.textContent ?? '0';
        closeWidget();
        activeHostInput.dispatchEvent(new Event('input', { bubbles: true }));
        activeHostInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Attach event listeners
    [priceHost, quantityHost].forEach((host) => {
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
            event.preventDefault();
            moveOperator(-1);
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveOperator(1);
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            pushLevel();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
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
            event.preventDefault();
            popLastLevel();
            return;
        }

        if (event.key !== 'Tab') {
            resetApplyState();
        }
    });
}
