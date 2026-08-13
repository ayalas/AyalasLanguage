import { useState, useEffect } from 'react';

// TypeScript interface for the non-standard event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Check if the event already fired before the component mounted
    if ((window as any).deferredPrompt) {
      setInstallPrompt((window as any).deferredPrompt);
    }

    // 2. Listen for the event in case it hasn't fired yet
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    if (window && window.addEventListener) {
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const triggerInstall = async () => {
    // Use either the state or the global variable
    const prompt = installPrompt || (window as any).deferredPrompt;
    if (!prompt) return;
    
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      (window as any).deferredPrompt = null;
    }
  };

  return { isInstallable: !!installPrompt, triggerInstall };
};