'use client';
import { useEffect, useState } from 'react';
import { getClienteToken } from '@/lib/api';
import { estaEnFavoritos, alternarFavorito, cargarFavoritos, suscribirFavoritos } from '@/lib/favoritos';

/**
 * Corazón para marcar/desmarcar un producto como favorito.
 * Solo se muestra a compradores con sesión iniciada (requiere cuenta).
 * `flotante`: se posiciona en la esquina de la tarjeta (thumb con position:relative).
 */
export default function BotonFavorito({ id, flotante = false, size = 20 }) {
  const [montado, setMontado] = useState(false);
  const [, redibujar] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    setMontado(true);
    if (!getClienteToken()) return;
    cargarFavoritos();
    const off = suscribirFavoritos(() => redibujar((n) => n + 1));
    return off;
  }, []);

  if (!montado || !getClienteToken()) return null;

  const activo = estaEnFavoritos(id);

  async function click(e) {
    e.preventDefault();
    e.stopPropagation();
    if (ocupado) return;
    setOcupado(true);
    try { await alternarFavorito(id); } catch {}
    finally { setOcupado(false); }
  }

  const clases = `fav-btn${flotante ? ' fav-btn-flotante' : ''}${activo ? ' on' : ''}`;

  return (
    <button
      type="button"
      className={clases}
      onClick={click}
      aria-pressed={activo}
      aria-label={activo ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      title={activo ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
