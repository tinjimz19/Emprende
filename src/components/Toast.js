'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Aviso tipo "toast" que entra deslizándose desde arriba (centrado) y se va solo.
 * Se renderiza en un portal a document.body para que ningún contenedor lo recorte.
 */
export default function Toast({ visible, mensaje, onHide, duracion = 2600 }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onHide && onHide(), duracion);
    return () => clearTimeout(t);
  }, [visible, duracion]); // eslint-disable-line react-hooks/exhaustive-deps

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={`toast ${visible ? 'show' : ''}`} role="status" aria-live="polite">
      <span className="toast-ic">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      </span>
      {mensaje}
    </div>,
    document.body
  );
}
