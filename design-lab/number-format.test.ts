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
        expect(formatRawForDraftInput('1200', currencyConfig)).toBe('1.200');
        expect(formatRawForDraftInput('1200.5', currencyConfig)).toBe('1.200,5');
    });

    it('formats numeric mode WITH grouping for draft input', () => {
        expect(formatRawForDraftInput('1200', numericConfig)).toBe('1.200');
        expect(formatRawForDraftInput('1200.5', numericConfig)).toBe('1.200,5');
    });

    it('formats numeric-strict as integer WITHOUT symbol for draft input', () => {
        expect(formatRawForDraftInput('1200.9', strictConfig)).toBe('1.200');
        expect(formatRawForDraftInput('-1500.8', { ...strictConfig, allowNegative: true })).toBe('-1.500');
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
