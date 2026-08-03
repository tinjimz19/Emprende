'use client';
import { useRouter } from 'next/navigation';

/**
 * Botón "Volver": regresa a la página anterior del historial.
 * Si no hay historial (entrada directa por enlace), va al `fallback`.
 */
export default function BotonVolver({ fallback = '/', label = 'Volver' }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-soft btn-sm"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      {label}
    </button>
  );
}
