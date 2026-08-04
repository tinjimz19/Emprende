'use client';
import { useEffect, useState } from 'react';
import { getClienteToken } from '@/lib/api';
import { sigueTienda, alternarSeguir, cargarSeguidas, suscribirSeguidas } from '@/lib/seguir';

/**
 * Botón Seguir / Siguiendo para una tienda.
 * Solo se muestra a compradores con sesión iniciada (requiere cuenta).
 * Al seguir, el comprador recibe aviso de los productos nuevos de la tienda.
 * El texto "Te avisamos…" va posicionado en absoluto para no alterar la
 * alineación del botón con los que estén a su lado.
 */
export default function BotonSeguir({ id, size = 'sm', mostrarAviso = true }) {
  const [montado, setMontado] = useState(false);
  const [, redibujar] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    setMontado(true);
    if (!getClienteToken()) return;
    cargarSeguidas();
    const off = suscribirSeguidas(() => redibujar((n) => n + 1));
    return off;
  }, []);

  if (!montado || !getClienteToken()) return null;

  const activo = sigueTienda(id);

  async function click() {
    if (ocupado) return;
    setOcupado(true);
    try { await alternarSeguir(id); } catch {}
    finally { setOcupado(false); }
  }

  const campana = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );

  return (
    <span className="seguir-wrap" style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className={`btn ${activo ? 'btn-soft' : 'btn-primary'} btn-${size}`}
        onClick={click}
        disabled={ocupado}
        aria-pressed={activo}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
        title={activo ? 'Dejar de seguir esta tienda' : 'Seguir esta tienda y recibir avisos de productos nuevos'}
      >
        {campana}
        {activo ? 'Siguiendo' : 'Seguir'}
      </button>
      {mostrarAviso && !activo && (
        <span className="seguir-aviso muted tiny">Te avisamos de sus productos nuevos</span>
      )}
    </span>
  );
}
