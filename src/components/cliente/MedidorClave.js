'use client';

// Fuerza 0..4 según longitud y variedad de caracteres.
export function fuerzaClave(c) {
  if (!c) return 0;
  let s = 0;
  if (c.length >= 6) s++;
  if (c.length >= 10) s++;
  if (/[a-z]/.test(c) && /[A-Z]/.test(c)) s++;
  if (/\d/.test(c)) s++;
  if (/[^a-zA-Z0-9]/.test(c)) s++;
  return Math.min(4, s);
}

const LABELS = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];
const COLORS = ['var(--danger)', 'var(--danger)', 'var(--warn)', 'var(--ok)', 'var(--ok)'];

export default function MedidorClave({ clave }) {
  if (!clave) return null;
  const f = fuerzaClave(clave);
  return (
    <div className="clave-meter" style={{ marginTop: 8 }}>
      <div className="clave-track">
        <div className="clave-fill" style={{ width: `${((f + 1) / 5) * 100}%`, background: COLORS[f] }} />
      </div>
      <span className="tiny" style={{ color: COLORS[f], fontWeight: 600 }}>{LABELS[f]}</span>
    </div>
  );
}
