import { it, expect, describe } from 'vitest';
import { isValidEmail, removeLastCharIfMatch, getMissingParts, getRandomizedSequence, checkPasswordStrength } from './utils';

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

describe('checkPasswordStrength() - UI Checklist Approach', () => {
  it('should return all checks as true for a valid password', () => {
    const { isValid, checks } = checkPasswordStrength('Valid123!');
    expect(isValid).toBe(true);
    expect(checks).toEqual({
      hasMinLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSpecialChar: true,
    });
  });

  it('should pinpoint exactly what is missing in the checks object', () => {
    const { isValid, checks } = checkPasswordStrength('abc'); // Too short, no upper, no number, no special
    expect(isValid).toBe(false);
    expect(checks).toEqual({
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: true,
      hasNumber: false,
      hasSpecialChar: false,
    });
  });

  it('should handle alternative special characters', () => {
    // Testing characters beyond the basic set like brackets and punctuation
    const { checks } = checkPasswordStrength('Valid123[');
    expect(checks.hasSpecialChar).toBe(true);
  });
});

describe('isValidEmail()', () => {
  
  // --- Valid Cases ---
  describe('Valid Emails', () => {
    it('should return true for standard valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('john.doe@company.co.uk')).toBe(true);
    });

    it('should handle valid special characters in the local part', () => {
      expect(isValidEmail('user.name+tag@example.com')).toBe(true);
      expect(isValidEmail('user_name@example.com')).toBe(true);
      expect(isValidEmail('user-name@example.com')).toBe(true);
      expect(isValidEmail('1234567890@example.com')).toBe(true);
    });

    it('should handle domains with subdomains', () => {
      expect(isValidEmail('user@subdomain.example.com')).toBe(true);
    });

    it('should handle and trim leading/trailing whitespace', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });
  });

  // --- Invalid Cases ---
  describe('Invalid Emails', () => {
    it('should return false if the @ symbol is missing', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should return false if the domain is missing', () => {
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
    });

    it('should return false if the username/local part is missing', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should return false if the TLD is missing or too short', () => {
      expect(isValidEmail('user@example')).toBe(false);
      expect(isValidEmail('user@example.')).toBe(false);
      expect(isValidEmail('user@example.c')).toBe(false); // TLDs must be at least 2 chars
    });

    it('should return false for multiple @ symbols', () => {
      expect(isValidEmail('user@failed@example.com')).toBe(false);
    });

    it('should return false for spaces within the email', () => {
      expect(isValidEmail('user name@example.com')).toBe(false);
      expect(isValidEmail('user@exam ple.com')).toBe(false);
    });
  });

  // --- Edge & Falsy Cases ---
  describe('Edge Cases and Bad Inputs', () => {
    it('should return false for empty strings', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });

    it('should safely return false for non-string inputs', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(12345)).toBe(false);
      expect(isValidEmail({})).toBe(false);
    });
  });
});