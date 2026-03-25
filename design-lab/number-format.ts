export type HostMode = 'currency' | 'numeric' | 'numeric-strict';

export type HostConfig = {
    mode: HostMode;
    currency: string;
    locale: string;
    decimals: number;
    allowNegative: boolean;
};

function normalizedDecimals(value: number): number {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
        return 0;
    }
    return Math.max(0, Math.floor(value));
}

export function sanitizeRawInput(value: string, config: HostConfig): string {
    const raw = value ?? '';
    let sanitized = raw.replace(/[^\d.,-]/g, '');

    if (!config.allowNegative) {
        sanitized = sanitized.replace(/-/g, '');
    } else {
        sanitized = sanitized.replace(/(?!^)-/g, '');
    }

    if (config.mode === 'numeric-strict') {
        return sanitized.replace(/[.,]/g, '');
    }

    sanitized = sanitized.replace(/,/g, '.');

    const firstDot = sanitized.indexOf('.');
    if (firstDot !== -1) {
        const intPart = sanitized.slice(0, firstDot + 1);
        const rest = sanitized.slice(firstDot + 1).replace(/\./g, '');
        sanitized = intPart + rest;
    }

    const decimals = normalizedDecimals(config.decimals);
    if (firstDot !== -1) {
        const [whole, fraction = ''] = sanitized.split('.');
        sanitized = `${whole}.${fraction.slice(0, decimals)}`;
    }

    return sanitized;
}

export function normalizeHostValue(value: string, config: HostConfig): string {
    const stripped = (value ?? '').replace(/[^\d.,-]/g, '').trim();
    if (!stripped) {
        return '';
    }

    if (config.mode === 'numeric' || config.mode === 'numeric-strict') {
        return sanitizeRawInput(stripped, config);
    }

    const decimals = normalizedDecimals(config.decimals);
    const lastDot = stripped.lastIndexOf('.');
    const lastComma = stripped.lastIndexOf(',');
    let decimalSeparator: '.' | ',' | null = null;

    if (lastDot !== -1 && lastComma !== -1) {
        decimalSeparator = lastDot > lastComma ? '.' : ',';
    } else if (lastDot !== -1 || lastComma !== -1) {
        const sep: '.' | ',' = lastDot !== -1 ? '.' : ',';
        const sepIndex = sep === '.' ? lastDot : lastComma;
        const right = stripped.slice(sepIndex + 1).replace(/[^\d]/g, '');
        const hasSingleSeparator = stripped.split(sep).length === 2;
        const canBeDecimal = right.length > 0 && right.length <= decimals;

        if (hasSingleSeparator && canBeDecimal) {
            decimalSeparator = sep;
        }
    }

    if (!decimalSeparator) {
        return sanitizeRawInput(stripped.replace(/[.,]/g, ''), config);
    }

    const decimalIndex = stripped.lastIndexOf(decimalSeparator);
    const intPart = stripped.slice(0, decimalIndex).replace(/[^\d-]/g, '');
    const fractionPart = stripped.slice(decimalIndex + 1).replace(/[^\d]/g, '');

    return sanitizeRawInput(`${intPart}.${fractionPart}`, config);
}

export function formatNumberForHost(value: number, config: HostConfig): string {
    if (!Number.isFinite(value)) {
        return config.mode === 'currency' ? `${config.currency} 0` : '0';
    }

    const decimals = normalizedDecimals(config.decimals);

    if (config.mode === 'numeric-strict') {
        return String(Math.trunc(value));
    }

    if (config.mode === 'numeric') {
        return new Intl.NumberFormat('en-US', {
            useGrouping: false,
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
        }).format(value);
    }

    const formatter = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });

    return `${config.currency} ${formatter.format(value)}`;
}

export function formatNumberForDisplay(value: number, config: HostConfig): string {
    if (!Number.isFinite(value)) {
        return config.mode === 'currency' ? `${config.currency} 0` : '0';
    }

    const decimals = normalizedDecimals(config.decimals);

    if (config.mode === 'numeric-strict') {
        return new Intl.NumberFormat(config.locale, {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.trunc(value));
    }

    if (config.mode === 'numeric') {
        return new Intl.NumberFormat(config.locale, {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
        }).format(value);
    }

    const formatter = new Intl.NumberFormat(config.locale, {
        useGrouping: true,
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });

    return `${config.currency} ${formatter.format(value)}`;
}

export function formatRawForDisplay(raw: string, config: HostConfig): string {
    const numeric = parseRawNumber(raw);
    if (numeric === null) {
        return config.mode === 'currency' ? `${config.currency} 0` : '0';
    }
    return formatNumberForDisplay(numeric, config);
}

export function formatRawForDraftInput(raw: string, config: HostConfig): string {
    if (!raw) {
        return '';
    }
    // Devuelve el número puro, sin símbolo ni separadores
    // Solo para que el usuario pueda escribir libremente en el input
    const decimals = normalizedDecimals(config.decimals);
    const numeric = parseRawNumber(raw);

    if (numeric === null) {
        return ''; // No 'raw', devolver vacío
    }

    // Si está en modo strict, truncar a entero
    if (config.mode === 'numeric-strict') {
        return String(Math.trunc(numeric));
    }

    // Para otros modos, mostrar con máximo de decimales pero sin separadores
    if (decimals === 0) {
        return String(Math.trunc(numeric));
    }

    return numeric.toFixed(decimals);
}

export function parseRawNumber(raw: string): number | null {
    if (!raw || raw === '-' || raw === '.' || raw === '-.') {
        return null;
    }

    const numeric = Number(raw);
    if (Number.isNaN(numeric)) {
        return null;
    }

    return numeric;
}
