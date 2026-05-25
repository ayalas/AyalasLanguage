import { it, expect, describe } from 'vitest';
import { removeLastCharIfMatch, getMissingParts } from './utils';

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

describe('getMissingParts function', () => {
    it('returns the missing parts', () => {
        expect(getMissingParts("you are special. very special. I want to acknowlede that to you", ["you are ", ". very ", ". I want ", " acknowlede that ", " you"]))
        .toEqual(["special", "special", "to", "to"]);
    });
})