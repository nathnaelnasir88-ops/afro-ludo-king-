import React, { useEffect, useState } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowGuide(true);
          }
        }}
        className="flex items-center gap-2 rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-amber-400/60 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        aria-label="Install Cross-Platform App for iOS and Android"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
        <span>{isIOS ? 'Install on iOS' : 'iOS / Android App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Cross-Platform Mobile Installation Guide"
        >
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Download className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-display tracking-wide">
                  Cross-Platform Mobile Play
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close mobile guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div className="rounded-lg bg-slate-950/90 border border-slate-800 p-3.5">
                <p className="font-semibold text-amber-300">Apple iOS (iPhone & iPad)</p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  1. Open this game in <strong>Safari</strong>.<br />
                  2. Tap the <strong>Share</strong> icon in the bottom bar.<br />
                  3. Select <strong>Add to Home Screen</strong> to launch in fullscreen standalone mode.
                </p>
              </div>

              <div className="rounded-lg bg-slate-950/90 border border-slate-800 p-3.5">
                <p className="font-semibold text-emerald-300">Android Devices (Chrome / Edge)</p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  1. Tap the browser menu (<strong>⋮</strong>) or install prompt.<br />
                  2. Select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.<br />
                  3. Play seamlessly across iOS, Android, and Desktop using any 6-character Room Code.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
