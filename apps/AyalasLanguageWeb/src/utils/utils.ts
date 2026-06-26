import axios from "axios";
import { puter } from "@heyputer/puter.js";
import { type CreateLogRequest, type LogType } from "@ayalaslanguage/types/log"

export const isSecure = () => (window.location.protocol === 'https:')

export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;

  // This checks if the PRIMARY input mechanism is coarse (a finger)
  // This is the most reliable way to detect "mobile-like" behavior
  const isMobileQuery = window.matchMedia("(pointer: coarse)").matches;

  return isMobileQuery;
};

export async function initializePuter() {
  if (isSecure()) {
    if (!puter.auth.isSignedIn()) {
      // Note: browser popups usually require a direct user click event, 
      // but you can check status or trigger it here if allowed by your flow.
      const res = await puter.auth.signIn();
      return res.success;
    }
    else {
      return true;
    }
  }
  return false;
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return Boolean(value); // Fallback for native booleans
}

export async function writeToLog<T>(logType: LogType, obj: T) {
  try {

    const req:CreateLogRequest = {
      LogType: logType,
      Description: JSON.stringify(obj)
    };
    await axios.post('/api/creator/log', req);
  }
  catch (err) {
    console.log('error writing to log', err);
  }
}

export function parseLLMResponse(rawString: string) {
  // Regex looks for ```json [content] ``` or just ``` [content] ```
  const regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = rawString.match(regex);

  // If a match is found, use the captured group, otherwise try the raw string
  const cleanJson = match ? match[1] : rawString;

  return JSON.parse(cleanJson.trim());
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
