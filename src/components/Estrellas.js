'use client';

const PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

/** Estrellas de solo lectura (muestra el promedio redondeado). */
export function Stars({ valor = 0, size = 15 }) {
  const v = Math.round(Number(valor) || 0);
  return (
    <span style={{ display: 'inline-flex', gap: 1, color: '#f5a623', lineHeight: 0 }} aria-label={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= v ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
          <path d={PATH} />
        </svg>
      ))}
    </span>
  );
}

/** Estrellas interactivas para elegir una calificación. */
export function StarInput({ valor = 0, onChange }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} estrella${n !== 1 ? 's' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0, color: n <= valor ? '#f5a623' : 'var(--border)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill={n <= valor ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path d={PATH} />
          </svg>
        </button>
      ))}
    </span>
  );
}
