import axios from "axios";

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