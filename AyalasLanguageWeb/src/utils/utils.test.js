import { it, expect, describe } from 'vitest';
import { removeLastCharIfMatch } from './utils';

describe('removeLastCharIfMatch function', () => {
    it('removes last ;', () => {
        expect(removeLastCharIfMatch("dsd;", ';')).toBe('dsd');
    });

    it('Does not remove when absent', () => {
        expect(removeLastCharIfMatch("dsd", ';')).toBe('dsd');
    });

    it('handles empty', () => {
        expect(removeLastCharIfMatch("", ';')).toBe("");
    })

    it('handles null', () => {
        expect(removeLastCharIfMatch(null, ';')).toBe(null);
    })
})