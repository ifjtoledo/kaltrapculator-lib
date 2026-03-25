import {
    formatNumberForDisplay,
    formatNumberForHost,
    formatRawForDisplay,
    normalizeHostValue,
    parseRawNumber,
    sanitizeRawInput,
    type HostConfig,
    type HostMode,
} from './number-format';

function mustQuery<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Missing required element: ${selector}`);
    }
    return element;
}

const hostInputs = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[data-claptrap]')
);
const widgetShell = mustQuery<HTMLElement>('.widget');
const timelineList = mustQuery<HTMLOListElement>('.widget__timeline-list');
const draftInput = mustQuery<HTMLInputElement>('.widget__draft-input');
const previewValue = mustQuery<HTMLOutputElement>('.widget__preview-value');
const cancelButton = mustQuery<HTMLButtonElement>('[data-action="cancel"]');
const applyButton = mustQuery<HTMLButtonElement>('[data-action="apply"]');

const operatorItems = Array.from(
    document.querySelectorAll<HTMLElement>('.widget__operator-item')
);

const operatorPicker = document.querySelector<HTMLElement>('.widget__operator-picker');
const timelineSection = document.querySelector<HTMLElement>('.widget__timeline');

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.lab__tab'));
const panels = Array.from(document.querySelectorAll<HTMLElement>('.lab__panel'));

if (!operatorItems.length) {
    throw new Error('At least one operator is required.');
}

if (!hostInputs.length) {
    throw new Error('At least one host input with data-claptrap is required.');
}

type CalcMode = 'basic' | 'full';

type Level = {
    value: number;
    operatorToPrev: string | null;
};

let operatorIndex = Math.max(
    0,
    operatorItems.findIndex((item) => item.classList.contains('widget__operator-item--active'))
);
let rawDraft = '';
let isOpen = false;
let levels: Level[] = [];
let readyToApply = false;
let activeHostInput: HTMLInputElement = hostInputs[0];

function getCalcMode(): CalcMode {
    return activeHostInput.dataset.claptrapCalc === 'full' ? 'full' : 'basic';
}

function isFullMode(): boolean {
    return getCalcMode() === 'full';
}

function applyCalcModeUI(): void {
    const full = isFullMode();
    if (operatorPicker) operatorPicker.hidden = !full;
    if (timelineSection) timelineSection.hidden = !full;
}

function getHostConfig(host: HTMLInputElement): HostConfig {
    const mode = (host.dataset.claptrapMode as HostMode | undefined) ?? 'currency';
    const parsedDecimals = Number.parseInt(host.dataset.claptrapDecimals ?? '2', 10);

    return {
        mode: mode === 'numeric' || mode === 'numeric-strict' ? mode : 'currency',
        currency: host.dataset.claptrapCurrency ?? '$',
        locale: host.dataset.claptrapLocale ?? 'es-CO',
        decimals: Number.isNaN(parsedDecimals) ? 2 : Math.max(0, parsedDecimals),
        allowNegative: host.dataset.claptrapAllowNegative === 'true',
    };
}

function getActiveConfig(): HostConfig {
    return getHostConfig(activeHostInput);
}

function resetApplyState() {
    readyToApply = false;
    widgetShell.classList.remove('widget--ready-to-apply');
}

function markReadyToApply() {
    readyToApply = true;
    widgetShell.classList.add('widget--ready-to-apply');
}

function hasDraftValue(): boolean {
    return parseRawNumber(rawDraft) !== null;
}

function applyOperation(left: number, operator: string, right: number): number {
    switch (operator) {
        case '+':
            return left + right;
        case '-':
            return left - right;
        case '*':
            return left * right;
        case '/':
            return right === 0 ? left : left / right;
        case '%':
            return left * (right / 100);
        default:
            return right;
    }
}

function computePreviewNumber(): number {
    const draftValue = parseRawNumber(rawDraft);

    if (levels.length === 0) {
        return draftValue ?? 0;
    }

    let result = levels[0].value;

    for (let index = 1; index < levels.length; index += 1) {
        const operator = levels[index].operatorToPrev ?? '+';
        result = applyOperation(result, operator, levels[index].value);
    }

    if (draftValue !== null) {
        const draftOperator = currentOperator();
        result = applyOperation(result, draftOperator, draftValue);
    }

    return result;
}

function renderTimeline(): void {
    timelineList.innerHTML = '';

    levels.forEach((level) => {
        const item = document.createElement('li');
        item.className = 'widget__timeline-item';

        const value = document.createElement('span');
        value.className = 'widget__timeline-value';
        value.textContent = formatNumberForDisplay(level.value, getActiveConfig());

        item.append(value);

        // Solo mostrar operador si existe (no en el primer nivel)
        if (level.operatorToPrev) {
            const op = document.createElement('span');
            op.className = 'widget__operator-op';
            op.textContent = level.operatorToPrev;
            item.append(op);
        }

        timelineList.append(item);
    });
}

function currentOperator(): string {
    return operatorItems[operatorIndex]?.dataset.op ?? '+';
}

function paintOperator(index: number): void {
    operatorItems.forEach((item, idx) => {
        const isActive = idx === index;
        item.classList.toggle('widget__operator-item--active', isActive);
        item.setAttribute('aria-selected', String(isActive));
    });
}

function moveOperator(step: -1 | 1): void {
    operatorIndex = (operatorIndex + step + operatorItems.length) % operatorItems.length;
    paintOperator(operatorIndex);
    syncPreview();
    resetApplyState();
}

function syncPreview(): void {
    // Durante la edición, mostrar exactamente lo que el usuario escribió (sin reformateo)
    draftInput.value = rawDraft;
    // El preview abajo sí muestra el número formateado con guía visual
    previewValue.textContent = formatNumberForDisplay(computePreviewNumber(), getActiveConfig());
}

function pushLevel(): void {
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
    syncPreview();
    resetApplyState();
}

function popLastLevel(): void {
    if (levels.length === 0) {
        return;
    }

    levels.pop();
    renderTimeline();
    syncPreview();
    resetApplyState();
}

function openWidget(): void {
    if (isOpen) {
        return;
    }

    isOpen = true;
    widgetShell.hidden = false;
    document.body.classList.add('lab--modal-open');
    activeHostInput.setAttribute('aria-expanded', 'true');
    resetApplyState();
    levels = [];
    renderTimeline();

    rawDraft = normalizeHostValue(activeHostInput.value, getActiveConfig());
    draftInput.placeholder = getActiveConfig().mode === 'currency' ? '$ 0' : '0';
    applyCalcModeUI();
    syncPreview();

    paintOperator(operatorIndex);
    requestAnimationFrame(() => {
        draftInput.focus();
        draftInput.select();
    });
}

function closeWidget(): void {
    if (!isOpen) {
        return;
    }

    isOpen = false;
    widgetShell.hidden = true;
    document.body.classList.remove('lab--modal-open');
    activeHostInput.setAttribute('aria-expanded', 'false');
    resetApplyState();
}

function applyToHost(): void {
    const result = computePreviewNumber();
    activeHostInput.value = formatNumberForHost(result, getActiveConfig());
    closeWidget();
    activeHostInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeHostInput.dispatchEvent(new Event('change', { bubbles: true }));
}

hostInputs.forEach((host) => {
    host.addEventListener('pointerdown', (event: PointerEvent) => {
        event.preventDefault();
        activeHostInput = host;
        openWidget();
    });

    host.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
            event.preventDefault();
            activeHostInput = host;
            openWidget();
        }
    });
});

cancelButton.addEventListener('click', closeWidget);
applyButton.addEventListener('click', applyToHost);

operatorItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
        operatorIndex = idx;
        paintOperator(operatorIndex);
        syncPreview();
        resetApplyState();
    });
});

draftInput.addEventListener('input', () => {
    rawDraft = sanitizeRawInput(draftInput.value, getActiveConfig());
    syncPreview();
    resetApplyState();
});

widgetShell.addEventListener('keydown', (event: KeyboardEvent) => {
    if (!isOpen) {
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        closeWidget();
        activeHostInput.focus();
        return;
    }

    if (event.key === 'ArrowLeft') {
        if (!isFullMode()) return;
        event.preventDefault();
        moveOperator(-1);
        resetApplyState();
        return;
    }

    if (event.key === 'ArrowRight') {
        if (!isFullMode()) return;
        event.preventDefault();
        moveOperator(1);
        resetApplyState();
        return;
    }

    if (event.key === 'ArrowDown') {
        if (!isFullMode()) return;
        event.preventDefault();
        pushLevel();
        draftInput.focus();
        return;
    }

    if (event.key === 'Enter') {
        event.preventDefault();

        // Basic mode: single Enter inyecta directamente
        if (!isFullMode()) {
            if (hasDraftValue()) {
                applyToHost();
            }
            return;
        }

        if (hasDraftValue()) {
            // Enter con valor: confirma el nivel actual
            pushLevel();
            // Doble Enter inyecta: el primer Enter deja listo para aplicar.
            markReadyToApply();
        } else if (levels.length > 0) {
            // Enter vacío pero con niveles confirmados
            if (!readyToApply) {
                // Primer Enter vacío: marca como listo
                markReadyToApply();
            } else {
                // Segundo Enter (doble): inyecta lo que esté en preview
                applyToHost();
            }
        }
        // Si no hay valor en draft y no hay niveles, no hace nada
        return;
    }

    if (event.key === 'Backspace' && !hasDraftValue()) {
        if (!isFullMode()) return;
        event.preventDefault();
        popLastLevel();
        draftInput.focus();
        return;
    }

    if (event.key !== 'Tab') {
        resetApplyState();
    }
});

syncPreview();
paintOperator(operatorIndex);

tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        tabs.forEach((t) => {
            t.classList.remove('lab__tab--active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('lab__tab--active');
        tab.setAttribute('aria-selected', 'true');

        const targetId = tab.getAttribute('aria-controls');
        panels.forEach((p) => {
            const isTarget = p.id === targetId;
            p.hidden = !isTarget;
            p.classList.toggle('lab__panel--hidden', !isTarget);
        });
    });
});
