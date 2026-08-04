'use client';

const PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function Fila({ size, lleno }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, lineHeight: 0 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={lleno ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
          <path d={PATH} />
        </svg>
      ))}
    </span>
  );
}

/** Estrellas de solo lectura con relleno fraccionado (muestra medias estrellas). */
export function Stars({ valor = 0, size = 15 }) {
  const v = Math.max(0, Math.min(5, Number(valor) || 0));
  const pct = (v / 5) * 100;
  return (
    <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }} aria-label={`${v} de 5`}>
      <span style={{ color: 'var(--border)' }}><Fila size={size} lleno={false} /></span>
      <span style={{ position: 'absolute', top: 0, left: 0, width: `${pct}%`, overflow: 'hidden', whiteSpace: 'nowrap', color: '#f5a623' }}>
        <Fila size={size} lleno />
      </span>
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
