import { puter } from "@heyputer/puter.js";

export const isSecure = () => false; //todo: handle https

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