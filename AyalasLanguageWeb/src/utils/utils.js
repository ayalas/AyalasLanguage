export function removeLastCharIfMatch(str, charToRemove) {
  // Check if the string ends with the specified character
  if (str && str.endsWith(charToRemove)) {
    return str.slice(0, -1);
  }
  
  // Return original string if it doesn't match
  return str;
}

export function getRandomizedSequence(n) {
  if (typeof n !== 'number' || n <= 0 || !Number.isInteger(n)) {
    throw new Error("Input must be a positive integer greater than zero.");
  }

  // 1. Create an array from 0 to n-1
  const arr = Array.from({ length: n }, (_, index) => index);

  // 2. Shuffle the array using the Fisher-Yates algorithm
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements arr[i] and arr[j]
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function getMissingParts(fullString, segments) {
    const missingParts = [];
    let currentIndex = 0;

    for (let i = 0; i < segments.length - 1; i++) {
        const currentSegment = segments[i];
        const nextSegment = segments[i + 1];

        // 1. Find where the current segment starts
        const segmentStart = fullString.indexOf(currentSegment, currentIndex);
        if (segmentStart === -1) continue; // Safety guard
        
        // 2. Move to the end of the current segment
        const missingStart = segmentStart + currentSegment.length;

        // 3. Find where the next segment begins
        const missingEnd = fullString.indexOf(nextSegment, missingStart);
        
        // Safety guard: If the next segment isn't found, we can't determine the gap
        if (missingEnd === -1) {
            missingParts.push(""); 
            continue;
        }

        // 4. Extract the piece in between
        const missingWord = fullString.substring(missingStart, missingEnd);
        missingParts.push(missingWord);

        // 5. Update pointer to the START of the next segment (fixes the "lazy pointer" bug)
        currentIndex = missingEnd;
    }

    return missingParts;
}

export function checkPasswordStrength(password) {
  const checks = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    // Fixed regex with properly escaped brackets \[ and \]
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
  };

  // The password is valid only if every single check passes
  const isValid = Object.values(checks).every(Boolean);

  return {
    isValid,
    checks // Returns an object showing true/false for each rule
  };
}

export function generatePasswordFeedback(checks) {
  // Map the internal variable names to user-friendly phrasing
  const errorMessages = {
    hasMinLength: "At least 8 characters long",
    hasUppercase: "At least one uppercase letter (A-Z)",
    hasLowercase: "At least one lowercase letter (a-z)",
    hasNumber: "At least one number (0-9)",
    hasSpecialChar: "At least one special character (e.g., !@#$%^&*)",
  };

  // Find all keys where the check failed (is false)
  const missingRequirements = Object.keys(checks)
    .filter((key) => !checks[key])
    .map((key) => errorMessages[key]);

  // If nothing is missing, the password is good to go
  if (missingRequirements.length === 0) {
    return {
      isValid: true,
      message: "Password looks great!",
      missing: []
    };
  }

  // Otherwise, construct a readable message
  return {
    isValid: false,
    message: `Your password needs the following:\n• ${missingRequirements.join('\n• ')}`,
    missing: missingRequirements // Returned as an array too, in case you want to map it to UI list items
  };
}

// emailValidator.js

/**
 * Validates whether a given string is a properly formatted email address.
 * @param {string} email - The string to validate
 * @returns {boolean} - True if the email is valid, false otherwise
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace to handle accidental user padding
  const trimmedEmail = email.trim();

  // A robust regex for standard email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(trimmedEmail);
}
