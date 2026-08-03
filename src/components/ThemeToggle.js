'use client';
import { useEffect, useState } from 'react';

// Aplica el tema al <html> y lo guarda.
function aplicar(tema) {
  const root = document.documentElement;
  if (tema === 'dark' || tema === 'light') {
    root.setAttribute('data-theme', tema);
  } else {
    root.removeAttribute('data-theme');
  }
  try { localStorage.setItem('emprende_theme', tema); } catch {}
}

function temaActual() {
  if (typeof window === 'undefined') return 'light';
  const guardado = localStorage.getItem('emprende_theme');
  if (guardado === 'dark' || guardado === 'light') return guardado;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [tema, setTema] = useState('light');
  const [listo, setListo] = useState(false);

  useEffect(() => { setTema(temaActual()); setListo(true); }, []);

  function alternar() {
    const nuevo = tema === 'dark' ? 'light' : 'dark';
    setTema(nuevo);
    aplicar(nuevo);
  }

  return (
    <button
      className="theme-toggle"
      onClick={alternar}
      aria-label={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      suppressHydrationWarning
    >
      {listo && tema === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
