'use client';

/**
 * Insignia de "tienda verificada": círculo festoneado con un check.
 * Se coloca junto al nombre de la tienda en todos lados.
 */
export default function Verificado({ size = 16, conTexto = false, title = 'Tienda verificada' }) {
  return (
    <span
      className="verif-badge"
      title={title}
      aria-label={title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle', flex: 'none' }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="var(--brand)"
          d="M22.5 12c0-1.58-.88-2.95-2.15-3.6.15-.44.24-.9.24-1.4 0-2.21-1.71-4-3.82-4-.47 0-.92.08-1.34.25C14.82 1.92 13.51 1 12 1S9.18 1.92 8.56 3.25C8.15 3.08 7.7 3 7.23 3 5.12 3 3.41 4.79 3.41 7c0 .5.08.96.24 1.4C2.38 9.05 1.5 10.42 1.5 12s.88 2.95 2.15 3.6c-.16.44-.24.9-.24 1.4 0 2.21 1.71 4 3.82 4 .47 0 .92-.08 1.33-.25C9.18 22.08 10.49 23 12 23s2.82-.92 3.44-2.25c.42.17.87.25 1.34.25 2.11 0 3.82-1.79 3.82-4 0-.5-.09-.96-.24-1.4 1.27-.65 2.14-2.02 2.14-3.6z"
        />
        <path
          fill="#fff"
          d="M10.6 15.4l-2.9-2.9 1.27-1.27 1.63 1.63 4-4 1.27 1.27z"
        />
      </svg>
      {conTexto && <span style={{ fontSize: size * 0.82, fontWeight: 600, color: 'var(--brand)' }}>Verificada</span>}
    </span>
  );
}
