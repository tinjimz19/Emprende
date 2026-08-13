'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import MapaTienda from '@/components/MapaTienda';

const IconPin = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

/** Botón "Ubicación" que abre el mapa de la tienda en una modal. */
export default function BotonUbicacion({ direccion, ubicacion, className = 'btn btn-soft btn-sm', nombre = 'Ubicación' }) {
  const [abierto, setAbierto] = useState(false);
  if (!direccion && !ubicacion) return null;
  return (
    <>
      <button type="button" className={className} onClick={() => setAbierto(true)}
        title={nombre || 'Ubicación'} aria-label={nombre || 'Ubicación'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: nombre ? 8 : 0 }}>
        <IconPin />{nombre ? ` ${nombre}` : ''}
      </button>
      {abierto && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setAbierto(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 760, maxWidth: '100%', maxHeight: '92vh', overflow: 'auto' }}>
            <div className="row" style={{ alignItems: 'center', marginBottom: 6 }}>
              <h3 style={{ margin: 0 }}>Ubicación</h3>
              <div className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={() => setAbierto(false)}>✕</button>
            </div>
            <MapaTienda direccion={direccion} ubicacion={ubicacion} mostrarTitulo={false} altura={440} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
