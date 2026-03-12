function mustQuery<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Missing required element: ${selector}`);
    }
    return element;
}

const hostInput = mustQuery<HTMLInputElement>('input[data-claptrap]');
const widgetShell = mustQuery<HTMLElement>('.widget');
const timelineList = mustQuery<HTMLOListElement>('.widget__timeline-list');
const draftInput = mustQuery<HTMLInputElement>('.widget__draft-input');
const previewValue = mustQuery<HTMLOutputElement>('.widget__preview-value');
const cancelButton = mustQuery<HTMLButtonElement>('[data-action="cancel"]');
const applyButton = mustQuery<HTMLButtonElement>('[data-action="apply"]');

const operatorItems = Array.from(
    document.querySelectorAll<HTMLElement>('.widget__operator-item')
);

if (!operatorItems.length) {
    throw new Error('At least one operator is required.');
}

const currency = hostInput.dataset.claptrapCurrency ?? '$';
const locale = hostInput.dataset.claptrapLocale ?? 'es-CO';
const decimals = Number.parseInt(hostInput.dataset.claptrapDecimals ?? '2', 10);
const allowNegative = hostInput.dataset.claptrapAllowNegative === 'true';

type Level = {
    value: number;
    operator: string;
};

let operatorIndex = Math.max(
    0,
    operatorItems.findIndex((item) => item.classList.contains('widget__operator-item--active'))
);
let rawDraft = '';
let enterStreak = 0;
let isOpen = false;
let levels: Level[] = [];

function resetApplyState() {
    enterStreak = 0;
    widgetShell.classList.remove('widget--ready-to-apply');
}

function markReadyToApply() {
    enterStreak = 1;
    widgetShell.classList.add('widget--ready-to-apply');
}

function sanitizeNumeric(value: string): string {
    let sanitized = value.replace(/[^\d.,-]/g, '').replace(/,/g, '.');

    if (!allowNegative) {
        sanitized = sanitized.replace(/-/g, '');
    } else {
        sanitized = sanitized.replace(/(?!^)-/g, '');
    }

    const firstDot = sanitized.indexOf('.');
    if (firstDot !== -1) {
        const intPart = sanitized.slice(0, firstDot + 1);
        const rest = sanitized.slice(firstDot + 1).replace(/\./g, '');
        sanitized = intPart + rest;
    }

    if (decimals >= 0 && firstDot !== -1) {
        const [whole, fraction = ''] = sanitized.split('.');
        sanitized = `${whole}.${fraction.slice(0, decimals)}`;
    }

    return sanitized;
}

function formatCurrency(raw: string): string {
    if (!raw || raw === '-' || raw === '.' || raw === '-.') {
        return `${currency} 0`;
    }

    const numeric = Number(raw);
    if (Number.isNaN(numeric)) {
        return `${currency} 0`;
    }

    const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.max(0, decimals),
    });

    return `${currency} ${formatter.format(numeric)}`;
}

function formatCurrencyFromNumber(value: number): string {
    const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.max(0, decimals),
    });
    return `${currency} ${formatter.format(value)}`;
}

function parseRawNumber(raw: string): number | null {
    if (!raw || raw === '-' || raw === '.' || raw === '-.') {
        return null;
    }

    const numeric = Number(raw);
    if (Number.isNaN(numeric)) {
        return null;
    }

    return numeric;
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
        const prevOperator = levels[index - 1].operator;
        result = applyOperation(result, prevOperator, levels[index].value);
    }

    if (draftValue !== null) {
        const tailOperator = levels[levels.length - 1].operator;
        result = applyOperation(result, tailOperator, draftValue);
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
        value.textContent = formatCurrencyFromNumber(level.value);

        const op = document.createElement('span');
        op.className = 'widget__timeline-op';
        op.textContent = level.operator;

        item.append(value, op);
        timelineList.append(item);
    });
}

function currentOperator(): string {
    return operatorItems[operatorIndex]?.dataset.op ?? '%';
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
    draftInput.value = rawDraft ? formatCurrency(rawDraft) : '';
    previewValue.textContent = formatCurrencyFromNumber(computePreviewNumber());
}

function pushLevel(): void {
    const value = parseRawNumber(rawDraft);
    if (value === null) {
        return;
    }

    levels.push({
        value,
        operator: currentOperator(),
    });

    renderTimeline();

    rawDraft = '';
    syncPreview();
    resetApplyState();
}

function openWidget(): void {
    if (isOpen) {
        return;
    }

    isOpen = true;
    widgetShell.hidden = false;
    resetApplyState();
    levels = [];
    renderTimeline();

    rawDraft = sanitizeNumeric(hostInput.value);
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
    resetApplyState();
}

function applyToHost(): void {
    hostInput.value = previewValue.textContent ?? `${currency} 0`;
    closeWidget();
    hostInput.dispatchEvent(new Event('input', { bubbles: true }));
    hostInput.dispatchEvent(new Event('change', { bubbles: true }));
}

hostInput.addEventListener('focus', openWidget);
hostInput.addEventListener('click', openWidget);

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
    rawDraft = sanitizeNumeric(draftInput.value);
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
        hostInput.focus();
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
        draftInput.focus();
        return;
    }

    if (event.key === 'Enter') {
        event.preventDefault();
        if (hasDraftValue()) {
            // Enter confirma el nivel actual y ejecuta el paso secuencial.
            pushLevel();
        } else if (enterStreak === 0) {
            markReadyToApply();
        } else {
            applyToHost();
        }
        return;
    }

    if (event.key !== 'Tab') {
        resetApplyState();
    }
});

syncPreview();
paintOperator(operatorIndex);
