
import { puter } from "@heyputer/puter.js";


export const isSecure = () => (window.location.protocol === 'https:')

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

export const handleKeyDown = async (e: React.KeyboardEvent, nextFieldRef: React.RefObject<HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement | null> | null, callback: (() => Promise<void>) | null = null) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission
    if (callback != null) {
      await callback();
    }
    else if (nextFieldRef != null && nextFieldRef.current != null) {
      nextFieldRef.current?.focus();
    }
  }
};
