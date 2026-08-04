'use client';
import { useEffect, useState } from 'react';

/**
 * Registra el service worker y ofrece un botón flotante "Instalar app"
 * cuando el navegador lo permite (evento beforeinstallprompt).
 */
export default function PWA() {
  const [prompt, setPrompt] = useState(null);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setPrompt(null); setOculto(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    try {
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) setOculto(true);
    } catch (e) {}
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!prompt || oculto) return null;

  async function instalar() {
    prompt.prompt();
    try { await prompt.userChoice; } catch (e) {}
    setPrompt(null);
  }

  return (
    <button onClick={instalar} className="pwa-install" aria-label="Instalar app">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><polyline points="7 10 12 15 17 10" /><path d="M5 21h14" /></svg>
      Instalar app
      <style jsx>{`
        .pwa-install {
          position: fixed; left: 16px; bottom: 16px; z-index: 900;
          display: inline-flex; align-items: center; gap: 7px;
          background: #FF453A; color: #fff; border: none; border-radius: 999px;
          padding: 11px 16px; font-weight: 700; font-size: 14px; cursor: pointer;
          box-shadow: 0 6px 20px rgba(0,0,0,.22);
        }
        .pwa-install:hover { filter: brightness(1.06); }
        .pwa-install:active { transform: scale(0.97); }
      `}</style>
    </button>
  );
}
