import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALLED_KEY = "rugira-installed";

export type Platform = "android-chrome" | "ios-safari" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  if (iOS) return "ios-safari";
  if (/Android/.test(ua)) return "android-chrome";
  if (/Windows|Macintosh|Linux/.test(ua)) return "desktop";
  return "unknown";
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall() {
  const [ready, setReady] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setStandalone(isStandalone());
    setInstalled(isStandalone() || localStorage.getItem(INSTALLED_KEY) === "true");
    setInIframe(window.self !== window.top);
    setReady(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "true");
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // Already-installed detection on supporting browsers.
    const nav = navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    };
    nav.getInstalledRelatedApps?.().then((apps) => {
      if (apps.length > 0) onInstalled();
    }).catch(() => undefined);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return "unavailable" as const;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "true");
      setInstalled(true);
    }
    setPromptEvent(null);
    return outcome;
  }, [promptEvent]);

  const confirmManualInstall = useCallback(() => {
    localStorage.setItem(INSTALLED_KEY, "true");
    setInstalled(true);
  }, []);

  return {
    ready,
    canPrompt: promptEvent !== null,
    installed,
    standalone,
    platform,
    inIframe,
    install,
    confirmManualInstall,
  };
}

export const INSTALL_STEPS: Record<Platform, string[]> = {
  "ios-safari": [
    "Open RUGIRA in Safari (not in another app's browser).",
    "Tap the Share button in the toolbar.",
    "Choose \"Add to Home Screen\".",
    "Tap Add, then open RUGIRA from your home screen.",
  ],
  "android-chrome": [
    "Open RUGIRA in Chrome.",
    "Tap the three-dot menu at the top right.",
    "Choose \"Install app\" or \"Add to Home screen\".",
    "Confirm Install, then open RUGIRA from your app drawer.",
  ],
  desktop: [
    "Open RUGIRA in Chrome, Edge or Brave.",
    "Click the install icon at the right of the address bar.",
    "Click Install in the dialog.",
    "RUGIRA opens in its own window.",
  ],
  unknown: [
    "Open RUGIRA in a modern browser such as Chrome, Edge or Safari.",
    "Use the browser menu and pick Install app or Add to Home Screen.",
    "Confirm the installation.",
    "Launch RUGIRA from your home screen.",
  ],
};
