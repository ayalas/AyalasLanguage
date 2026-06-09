import axios from "axios";
import { puter } from "@heyputer/puter.js";

export const isSecure = () => (window.location.protocol === 'https:')

export async function initializePuter() {
  if (isSecure()) {
    if (!puter.auth.isSignedIn()) {
      // Note: browser popups usually require a direct user click event, 
      // but you can check status or trigger it here if allowed by your flow.
      await puter.auth.signIn();
    }
  }
}

export function errorHandler(err: unknown, func: (arg: string) => void) {
  if (!err) return;

  // 1. Check for Axios-specific errors first
  if (axios.isAxiosError(err)) {
    // If the server responded with an error status code (4xx, 5xx)
    if (err.response) {
      // Safely handle different response data shapes (string vs object)
      const data = err.response.data;
      const message = typeof data === 'string'
        ? data
        : (data as any)?.message || JSON.stringify(data);

      func(message);
    }
    // If the request was made but no response was received (network issues)
    else if (err.request) {
      func("No response received from the server.");
    }
    // Something went wrong setting up the request
    else {
      func(err.message);
    }
  }
  // 2. Check for native JavaScript errors
  else if (err instanceof Error) {
    func(err.message);
  }
  // 3. Fallback for unexpected thrown values (strings, numbers, etc.)
  else {
    func(String(err));
  }
}

export function removeLastCharIfMatch(str: string | undefined, charToRemove: string) {
  if (str && str.endsWith(charToRemove)) {
    return str.slice(0, -1);
  }
  return str;
}

export function getRandomizedSequence(n: number) {
  if (typeof n !== 'number' || n <= 0 || !Number.isInteger(n)) {
    throw new Error("Input must be a positive integer greater than zero.");
  }

  const arr = Array.from({ length: n }, (_, index) => index);

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function checkPasswordStrength(password: string) {
  const checks = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
  };

  const isValid = Object.values(checks).every(Boolean);

  return {
    isValid,
    checks
  };
}

export function generatePasswordFeedback(checks: Record<string, boolean>) {
  const errorMessages: Record<string, string> = {
    hasMinLength: "At least 8 characters long",
    hasUppercase: "At least one uppercase letter (A-Z)",
    hasLowercase: "At least one lowercase letter (a-z)",
    hasNumber: "At least one number (0-9)",
    hasSpecialChar: "At least one special character (e.g., !@#$%^&*)",
  };

  const missingRequirements = Object.keys(checks)
    .filter((key) => !checks[key])
    .map((key) => errorMessages[key]);

  if (missingRequirements.length === 0) {
    return {
      isValid: true,
      message: "Password looks great!",
      missing: [] as string[]
    };
  }

  return {
    isValid: false,
    message: `Your password needs the following:\n• ${missingRequirements.join('\n• ')}`,
    missing: missingRequirements
  };
}

export function isValidEmail(email: string | undefined) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(trimmedEmail);
}

export function downloadFile(blob: Blob, name: string) {
  const localUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = localUrl;
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(localUrl);
}
