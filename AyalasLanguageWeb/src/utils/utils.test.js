import { it, expect, describe } from 'vitest';
import { removeLastCharIfMatch, getMissingParts, getRandomizedSequence } from './utils';

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

    it('handles empty parts', () => {
        expect(getMissingParts(" Vi mødes klokken fem", [" Vi mødes ", " klokken fem"]))
        .toEqual([""]);
    })

    it('handles Studenten læser på universitetet', () => {
        expect(getMissingParts("Studenten læser på universitetet", ['Studenten læser ', ' universitetet']))
        .toEqual(["på"]);
    });
})

describe('getRandomizedSequence', () => {
  // --- Happy Path Tests ---
  it('should return an array of the correct length', () => {
    const result = getRandomizedSequence(5);
    expect(result).toHaveLength(5);
  });

  it('should contain all whole numbers from 0 up to n-1', () => {
    const n = 10;
    const result = getRandomizedSequence(n);
    
    // Sort it to easily check if all expected numbers are present
    const sortedResult = [...result].sort((a, b) => a - b);
    const expected = Array.from({ length: n }, (_, i) => i);
    
    expect(sortedResult).toEqual(expected);
  });

  it('should randomize the order of elements', () => {
    const n = 100; // Larger number to virtually eliminate accidental identical sequences
    const result1 = getRandomizedSequence(n);
    const result2 = getRandomizedSequence(n);

    // It is statistically astronomical for two 100-element shuffles to be identical
    expect(result1).not.toEqual(result2);
  });

  // --- Edge Case Tests ---
  it('should work when n is 1', () => {
    const result = getRandomizedSequence(1);
    expect(result).toEqual([0]);
  });

  // --- Input Validation Tests ---
  it('should throw an error for zero or negative numbers', () => {
    expect(() => getRandomizedSequence(0)).toThrow();
    expect(() => getRandomizedSequence(-5)).toThrow();
  });

  it('should throw an error for non-integer numbers', () => {
    expect(() => getRandomizedSequence(5.5)).toThrow();
  });

  it('should throw an error for non-number types', () => {
    expect(() => getRandomizedSequence('5')).toThrow();
    expect(() => getRandomizedSequence(null)).toThrow();
    expect(() => getRandomizedSequence()).toThrow();
  });
});