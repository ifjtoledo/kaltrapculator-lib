import { describe, expect, it } from 'vitest';
import {
    formatNumberForDisplay,
    formatNumberForHost,
    normalizeHostValue,
    parseRawNumber,
    sanitizeRawInput,
    type HostConfig,
} from './number-format';

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
    it('displays currency mode with symbol and locale grouping', () => {
        expect(formatNumberForDisplay(1200, currencyConfig)).toBe('$ 1.200');
        expect(formatNumberForDisplay(1200.5, currencyConfig)).toBe('$ 1.200,5');
    });

    it('displays numeric mode WITH grouping for clarity', () => {
        expect(formatNumberForDisplay(1200, numericConfig)).toBe('1.200');
        expect(formatNumberForDisplay(1200.5, numericConfig)).toBe('1.200,5');
    });

    it('displays numeric-strict mode WITH grouping as integer', () => {
        expect(formatNumberForDisplay(1200.9, strictConfig)).toBe('1.200');
        expect(formatNumberForDisplay(-1500.8, { ...strictConfig, allowNegative: true })).toBe('-1.500');
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

/* ─── Full round-trip tests per mode ─── */

describe('Round-trip: currency mode', () => {
    it('round-trips small values', () => {
        const raw = sanitizeRawInput('500', currencyConfig);
        const num = parseRawNumber(raw)!;
        const injected = formatNumberForHost(num, currencyConfig);
        expect(injected).toBe('$ 500');
        const reopened = normalizeHostValue(injected, currencyConfig);
        expect(parseRawNumber(reopened)).toBe(500);
    });

    it('round-trips thousands', () => {
        const raw = sanitizeRawInput('11000', currencyConfig);
        const num = parseRawNumber(raw)!;
        const injected = formatNumberForHost(num, currencyConfig);
        expect(injected).toBe('$ 11.000');
        const reopened = normalizeHostValue(injected, currencyConfig);
        expect(parseRawNumber(reopened)).toBe(11000);
    });

    it('round-trips millions with decimals', () => {
        const raw = sanitizeRawInput('1500000.75', currencyConfig);
        const num = parseRawNumber(raw)!;
        const injected = formatNumberForHost(num, currencyConfig);
        expect(injected).toBe('$ 1.500.000,75');
        const reopened = normalizeHostValue(injected, currencyConfig);
        expect(parseRawNumber(reopened)).toBe(1500000.75);
    });
});

describe('Round-trip: numeric mode', () => {
    it('round-trips thousands without grouping corruption', () => {
        const raw = sanitizeRawInput('11000', numericConfig);
        const num = parseRawNumber(raw)!;
        const injected = formatNumberForHost(num, numericConfig);
        expect(injected).toBe('11000');
        const reopened = normalizeHostValue(injected, numericConfig);
        expect(parseRawNumber(reopened)).toBe(11000);
    });

    it('round-trips decimals', () => {
        const raw = sanitizeRawInput('11000.5', numericConfig);
        const num = parseRawNumber(raw)!;
        const injected = formatNumberForHost(num, numericConfig);
        expect(injected).toBe('11000.5');
        const reopened = normalizeHostValue(injected, numericConfig);
        expect(parseRawNumber(reopened)).toBe(11000.5);
    });
});

describe('Round-trip: numeric-strict mode', () => {
    it('round-trips integers', () => {
        const raw = sanitizeRawInput('11000', strictConfig);
        const num = parseRawNumber(raw)!;
        const injected = formatNumberForHost(num, strictConfig);
        expect(injected).toBe('11000');
        const reopened = normalizeHostValue(injected, strictConfig);
        expect(parseRawNumber(reopened)).toBe(11000);
    });

    it('truncates decimals in strict mode sanitization', () => {
        const raw = sanitizeRawInput('11000.99', strictConfig);
        expect(raw).toBe('1100099');
    });
});
