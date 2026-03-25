import { describe, expect, it } from 'vitest';
import {
    formatNumberForDisplay,
    formatNumberForHost,
    formatRawForDraftInput,
    normalizeHostValue,
    parseRawNumber,
    sanitizeRawInput,
    type HostConfig,
} from './number-format.ts';

const currencyConfig: HostConfig = {
    mode: 'currency',
    currency: '$',
    locale: 'es-CO',
    decimals: 2,
    allowNegative: false,
};

const numericConfig: HostConfig = {
    mode: 'numeric',
    currency: '$',
    locale: 'es-CO',
    decimals: 2,
    allowNegative: false,
};

const strictConfig: HostConfig = {
    mode: 'numeric-strict',
    currency: '$',
    locale: 'es-CO',
    decimals: 0,
    allowNegative: false,
};

describe('sanitizeRawInput', () => {
    it('normalizes decimal input for currency mode with precision clamp', () => {
        expect(sanitizeRawInput('$ 1.234,56', currencyConfig)).toBe('1.23');
        expect(sanitizeRawInput('1234,56', currencyConfig)).toBe('1234.56');
    });

    it('enforces negative rules', () => {
        expect(sanitizeRawInput('-1200', currencyConfig)).toBe('1200');
        expect(sanitizeRawInput('-1200', { ...currencyConfig, allowNegative: true })).toBe('-1200');
        expect(sanitizeRawInput('1-2-3', { ...currencyConfig, allowNegative: true })).toBe('123');
    });

    it('forces integer-only payload on numeric-strict mode', () => {
        expect(sanitizeRawInput('12.34', strictConfig)).toBe('1234');
        expect(sanitizeRawInput('1,234.50', strictConfig)).toBe('123450');
    });
});

describe('normalizeHostValue', () => {
    it('parses thousands and decimal separators from currency host values', () => {
        expect(normalizeHostValue('$ 1.200', currencyConfig)).toBe('1200');
        expect(normalizeHostValue('$ 1.200,5', currencyConfig)).toBe('1200.5');
        expect(normalizeHostValue('$ 1,200.75', currencyConfig)).toBe('1200.75');
    });

    it('handles empty and strange host payloads safely', () => {
        expect(normalizeHostValue('', currencyConfig)).toBe('');
        expect(normalizeHostValue('abc', currencyConfig)).toBe('');
        expect(normalizeHostValue('$ --..', currencyConfig)).toBe('');
    });

    it('normalizes pure numeric mode without symbols or grouping', () => {
        expect(normalizeHostValue('1200.5', numericConfig)).toBe('1200.5');
        expect(normalizeHostValue('1,200.5', numericConfig)).toBe('1.20');
    });

    it('normalizes numeric-strict mode to integers', () => {
        expect(normalizeHostValue('1200.75', strictConfig)).toBe('120075');
    });
});

describe('formatNumberForHost', () => {
    it('formats currency mode with symbol and locale grouping', () => {
        expect(formatNumberForHost(1200, currencyConfig)).toBe('$ 1.200');
        expect(formatNumberForHost(1200.5, currencyConfig)).toBe('$ 1.200,5');
    });

    it('formats numeric mode without grouping symbol', () => {
        expect(formatNumberForHost(1200, numericConfig)).toBe('1200');
        expect(formatNumberForHost(1200.5, numericConfig)).toBe('1200.5');
    });

    it('formats numeric-strict mode as integer output', () => {
        expect(formatNumberForHost(1200.9, strictConfig)).toBe('1200');
        expect(formatNumberForHost(-15.8, { ...strictConfig, allowNegative: true })).toBe('-15');
    });
});

describe('formatNumberForDisplay', () => {
    it('displays currency mode with symbol and locale grouping (visual guide)', () => {
        expect(formatNumberForDisplay(1200, currencyConfig)).toBe('$ 1.200');
        expect(formatNumberForDisplay(1200.5, currencyConfig)).toBe('$ 1.200,5');
    });

    it('displays numeric mode WITH grouping for clarity (visual guide)', () => {
        expect(formatNumberForDisplay(1200, numericConfig)).toBe('1.200');
        expect(formatNumberForDisplay(1200.5, numericConfig)).toBe('1.200,5');
    });

    it('displays numeric-strict mode WITH grouping as integer (visual guide)', () => {
        expect(formatNumberForDisplay(1200.9, strictConfig)).toBe('1.200');
        expect(formatNumberForDisplay(-1500.8, { ...strictConfig, allowNegative: true })).toBe('-1.500');
    });
});

describe('formatRawForDraftInput', () => {
    it('formats for draft input WITHOUT currency symbol (editing view)', () => {
        // Draft input debe mostrar SIN símbolo y SIN separadores para facilitar escritura
        expect(formatRawForDraftInput('1200', currencyConfig)).toBe('1200.00');
        expect(formatRawForDraftInput('1200.5', currencyConfig)).toBe('1200.50');
    });

    it('formats numeric mode WITHOUT grouping for draft input', () => {
        // Numeric mode en draft: solo números, sin separadores
        expect(formatRawForDraftInput('1200', numericConfig)).toBe('1200.00');
        expect(formatRawForDraftInput('1200.5', numericConfig)).toBe('1200.50');
    });

    it('formats numeric-strict as integer WITHOUT symbol for draft input', () => {
        // Numeric-strict: solo enteros, sin símbolo
        expect(formatRawForDraftInput('1200.9', strictConfig)).toBe('1200');
        expect(formatRawForDraftInput('-1500.8', { ...strictConfig, allowNegative: true })).toBe('-1500');
    });

    it('returns empty string for invalid input in draft mode', () => {
        expect(formatRawForDraftInput('', currencyConfig)).toBe('');
        expect(formatRawForDraftInput('abc', currencyConfig)).toBe('');
    });
});

describe('parseRawNumber', () => {
    it('returns null for empty-like values', () => {
        expect(parseRawNumber('')).toBeNull();
        expect(parseRawNumber('-')).toBeNull();
        expect(parseRawNumber('.')).toBeNull();
        expect(parseRawNumber('-.')).toBeNull();
    });

    it('parses valid numeric payloads', () => {
        expect(parseRawNumber('1200')).toBe(1200);
        expect(parseRawNumber('1200.5')).toBe(1200.5);
    });
});

/* ─── Full round-trip tests per mode ────────────────────────────────────── */

describe('Round-trip: currency mode (type="text", es-CO)', () => {
    it('sanitize → parse → formatForHost → normalizeBack for small values', () => {
        const raw = sanitizeRawInput('500', currencyConfig);
        expect(raw).toBe('500');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(500);
        const injected = formatNumberForHost(num, currencyConfig);
        expect(injected).toBe('$ 500');
        const reopened = normalizeHostValue(injected, currencyConfig);
        expect(reopened).toBe('500');
        expect(parseRawNumber(reopened)).toBe(500);
    });

    it('sanitize → parse → formatForHost → normalizeBack for thousands', () => {
        const raw = sanitizeRawInput('11000', currencyConfig);
        expect(raw).toBe('11000');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(11000);
        const injected = formatNumberForHost(num, currencyConfig);
        expect(injected).toBe('$ 11.000');
        const reopened = normalizeHostValue(injected, currencyConfig);
        expect(reopened).toBe('11000');
        expect(parseRawNumber(reopened)).toBe(11000);
    });

    it('sanitize → parse → formatForHost → normalizeBack for millions with decimals', () => {
        const raw = sanitizeRawInput('1500000.75', currencyConfig);
        expect(raw).toBe('1500000.75');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(1500000.75);
        const injected = formatNumberForHost(num, currencyConfig);
        expect(injected).toBe('$ 1.500.000,75');
        const reopened = normalizeHostValue(injected, currencyConfig);
        expect(reopened).toBe('1500000.75');
        expect(parseRawNumber(reopened)).toBe(1500000.75);
    });

    it('display shows full visual guide with symbol and grouping', () => {
        expect(formatNumberForDisplay(11000, currencyConfig)).toBe('$ 11.000');
        expect(formatNumberForDisplay(1500000.75, currencyConfig)).toBe('$ 1.500.000,75');
    });
});

describe('Round-trip: numeric mode (type="number" step="0.01")', () => {
    it('sanitize → parse → formatForHost → normalizeBack for small values', () => {
        const raw = sanitizeRawInput('500', numericConfig);
        expect(raw).toBe('500');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(500);
        const injected = formatNumberForHost(num, numericConfig);
        expect(injected).toBe('500');
        const reopened = normalizeHostValue(injected, numericConfig);
        expect(reopened).toBe('500');
        expect(parseRawNumber(reopened)).toBe(500);
    });

    it('sanitize → parse → formatForHost → normalizeBack for thousands', () => {
        const raw = sanitizeRawInput('11000', numericConfig);
        expect(raw).toBe('11000');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(11000);
        const injected = formatNumberForHost(num, numericConfig);
        // CRITICAL: numeric mode must NOT have dot separators (type="number" reads dot as decimal)
        expect(injected).toBe('11000');
        const reopened = normalizeHostValue(injected, numericConfig);
        expect(reopened).toBe('11000');
        expect(parseRawNumber(reopened)).toBe(11000);
    });

    it('sanitize → parse → formatForHost → normalizeBack for decimals', () => {
        const raw = sanitizeRawInput('11000.5', numericConfig);
        expect(raw).toBe('11000.5');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(11000.5);
        const injected = formatNumberForHost(num, numericConfig);
        expect(injected).toBe('11000.5');
        const reopened = normalizeHostValue(injected, numericConfig);
        expect(reopened).toBe('11000.5');
        expect(parseRawNumber(reopened)).toBe(11000.5);
    });

    it('sanitize → parse → formatForHost → normalizeBack for millions', () => {
        const raw = sanitizeRawInput('1500000', numericConfig);
        expect(raw).toBe('1500000');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(1500000);
        const injected = formatNumberForHost(num, numericConfig);
        expect(injected).toBe('1500000');
        const reopened = normalizeHostValue(injected, numericConfig);
        expect(reopened).toBe('1500000');
        expect(parseRawNumber(reopened)).toBe(1500000);
    });

    it('display shows grouping for visual guide (but host injection does NOT)', () => {
        expect(formatNumberForDisplay(11000, numericConfig)).toBe('11.000');
        expect(formatNumberForDisplay(1500000.75, numericConfig)).toBe('1.500.000,75');
        // Host injection is clean
        expect(formatNumberForHost(11000, numericConfig)).toBe('11000');
        expect(formatNumberForHost(1500000.75, numericConfig)).toBe('1500000.75');
    });
});

describe('Round-trip: numeric-strict mode (type="number" step="1")', () => {
    it('sanitize → parse → formatForHost → normalizeBack for small values', () => {
        const raw = sanitizeRawInput('42', strictConfig);
        expect(raw).toBe('42');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(42);
        const injected = formatNumberForHost(num, strictConfig);
        expect(injected).toBe('42');
        const reopened = normalizeHostValue(injected, strictConfig);
        expect(reopened).toBe('42');
        expect(parseRawNumber(reopened)).toBe(42);
    });

    it('sanitize → parse → formatForHost → normalizeBack for thousands', () => {
        const raw = sanitizeRawInput('11000', strictConfig);
        expect(raw).toBe('11000');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(11000);
        const injected = formatNumberForHost(num, strictConfig);
        expect(injected).toBe('11000');
        const reopened = normalizeHostValue(injected, strictConfig);
        expect(reopened).toBe('11000');
        expect(parseRawNumber(reopened)).toBe(11000);
    });

    it('sanitize → parse → formatForHost → normalizeBack for millions', () => {
        const raw = sanitizeRawInput('1500000', strictConfig);
        expect(raw).toBe('1500000');
        const num = parseRawNumber(raw)!;
        expect(num).toBe(1500000);
        const injected = formatNumberForHost(num, strictConfig);
        expect(injected).toBe('1500000');
        const reopened = normalizeHostValue(injected, strictConfig);
        expect(reopened).toBe('1500000');
        expect(parseRawNumber(reopened)).toBe(1500000);
    });

    it('truncates decimals in strict mode', () => {
        const raw = sanitizeRawInput('11000.99', strictConfig);
        expect(raw).toBe('1100099'); // dots stripped in strict mode
    });

    it('display shows grouping for visual guide (but host injection does NOT)', () => {
        expect(formatNumberForDisplay(11000, strictConfig)).toBe('11.000');
        expect(formatNumberForDisplay(1500000, strictConfig)).toBe('1.500.000');
        // Host injection is clean
        expect(formatNumberForHost(11000, strictConfig)).toBe('11000');
        expect(formatNumberForHost(1500000, strictConfig)).toBe('1500000');
    });
});
