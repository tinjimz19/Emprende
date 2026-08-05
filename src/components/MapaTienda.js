'use client';
import { useMemo } from 'react';

/**
 * Mapa incrustado de Google (sin API key) con la ubicación de la tienda.
 * - Si `ubicacion` trae coordenadas o una URL de Maps con coordenadas, clava el pin exacto.
 * - Si no, ubica la dirección de texto (puede ser aproximado con direcciones informales).
 * - El botón "Cómo llegar" abre la URL pegada, o una búsqueda de la dirección/coordenadas.
 * No renderiza nada si no hay ni dirección ni ubicación.
 */
function parseCoords(v) {
  if (!v) return null;
  const s = String(v).trim();
  let m = s.match(/^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (m) return { lat: m[1], lng: m[2] };
  m = s.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/)
    || s.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/)
    || s.match(/[?&](?:q|query|ll|destination)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return { lat: m[1], lng: m[2] };
  return null;
}
const esUrl = (v) => /^https?:\/\//i.test(String(v || '').trim());

export default function MapaTienda({ direccion, ubicacion, titulo = 'Ubicación', altura = 260, mostrarTitulo = true }) {
  const { embed, abrir } = useMemo(() => {
    const coords = parseCoords(ubicacion);
    const query = coords ? `${coords.lat},${coords.lng}` : (direccion || '').trim();
    if (!query) return { embed: null, abrir: null };
    return {
      embed: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`,
      abrir: esUrl(ubicacion)
        ? String(ubicacion).trim()
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    };
  }, [direccion, ubicacion]);

  if (!embed) return null;

  return (
    <div className="mapa-tienda">
      {mostrarTitulo && <h3 style={{ margin: '0 0 10px' }}>{titulo}</h3>}
      {direccion && (
        <p className="muted tiny" style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          {direccion}
        </p>
      )}
      <div className="mapa-frame" style={{ height: altura }}>
        <iframe src={embed} title={titulo} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen style={{ border: 0, width: '100%', height: '100%', display: 'block' }} />
      </div>
      <a className="btn btn-soft btn-sm" href={abrir} target="_blank" rel="noreferrer" style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 20l-5.447 2.724A1 1 0 0 1 2 21.83V7.618a1 1 0 0 1 .553-.894L9 3.5m0 16.5 6-3m-6 3V3.5m6 13.5 5.447 2.724A1 1 0 0 0 22 16.382V2.17a1 1 0 0 0-.553-.894L15 4.5m0 12V4.5m0 0-6-1" /></svg>
        Cómo llegar
      </a>
    </div>
  );
}
