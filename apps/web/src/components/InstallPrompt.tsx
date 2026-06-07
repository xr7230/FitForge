import React, { useState, useEffect } from "react";

const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not recently dismissed
      const dismissed = localStorage.getItem("fitforge_pwa_dismissed");
      if (!dismissed || Date.now() - Number(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("fitforge_pwa_dismissed", String(Date.now()));
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-4 flex items-center gap-3 animate-slide-up">
        <span className="text-3xl">💪</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">添加到主屏幕</p>
          <p className="text-xs text-gray-500">随时随地打开小铁，训练不中断</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={handleInstall}
            className="px-3 py-1.5 bg-amber-400 text-white text-xs font-medium rounded-full hover:bg-amber-500 transition-colors">
            安装
          </button>
          <button onClick={handleDismiss}
            className="px-2 py-1.5 text-gray-300 text-xs hover:text-gray-500 transition-colors">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
