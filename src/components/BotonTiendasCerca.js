'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import Verificado from '@/components/Verificado';

const CUMANA = [10.4536, -64.1740];
const LEAF = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4';

function cargarLeaflet() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    if (window.L) return resolve(window.L);
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = `${LEAF}/leaflet.min.css`;
      document.head.appendChild(link);
    }
    let sc = document.getElementById('leaflet-js');
    if (sc) { sc.addEventListener('load', () => resolve(window.L)); return; }
    sc = document.createElement('script');
    sc.id = 'leaflet-js';
    sc.src = `${LEAF}/leaflet.min.js`;
    sc.onload = () => resolve(window.L);
    document.body.appendChild(sc);
  });
}

function distanciaKm(a, b) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

const MAX_TIENDAS = 20;

// Ordena por cercanía (si hay ubicación del comprador) y toma las 20 más cercanas.
function ordenar(tiendas, yo) {
  return (tiendas || [])
    .map((t) => ({ ...t, dist: yo ? distanciaKm(yo, [Number(t.lat), Number(t.lng)]) : null }))
    .sort((x, y) => (x.dist ?? 1e9) - (y.dist ?? 1e9))
    .slice(0, MAX_TIENDAS);
}

export default function BotonTiendasCerca({ className = 'btn btn-soft btn-sm', nombre = 'Tiendas cerca' }) {
  const [abierto, setAbierto] = useState(false);
  const [tiendas, setTiendas] = useState(null);
  const [yo, setYo] = useState(null);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const mapObj = useRef(null);

  async function abrir() {
    setAbierto(true);
    setError('');
    if (tiendas === null) {
      try {
        const d = await api('/api/publico/tiendas-mapa', { auth: false });
        setTiendas(d.tiendas || []);
      } catch (e) { setError(e.message); setTiendas([]); }
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation && !yo) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setYo([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }

  function cerrar() {
    setAbierto(false);
    if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }
  }

  useEffect(() => {
    if (!abierto || tiendas === null) return;
    let cancel = false;
    cargarLeaflet().then((L) => {
      if (cancel || !L || !mapRef.current) return;
      const icon = L.icon({
        iconUrl: `${LEAF}/images/marker-icon.png`,
        iconRetinaUrl: `${LEAF}/images/marker-icon-2x.png`,
        shadowUrl: `${LEAF}/images/marker-shadow.png`,
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      if (!mapObj.current) {
        mapObj.current = L.map(mapRef.current);
        L.tileLayer(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, {
          maxZoom: 19, attribution: '© OpenStreetMap',
        }).addTo(mapObj.current);
      }
      const map = mapObj.current;
      map.eachLayer((layer) => { if (layer instanceof L.Marker || layer instanceof L.CircleMarker) map.removeLayer(layer); });
      const puntos = [];
      ordenar(tiendas, yo).forEach((t) => {
        const lat = Number(t.lat), lng = Number(t.lng);
        if (!lat || !lng) return;
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<b>${t.nombre}</b><br><a href="/t/${t.slug}">Ver tienda</a>`);
        puntos.push([lat, lng]);
      });
      if (yo) {
        L.circleMarker(yo, { radius: 8, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 }).addTo(map).bindPopup('Tu ubicación');
        puntos.push(yo);
      }
      if (puntos.length) map.fitBounds(puntos, { padding: [30, 30], maxZoom: 15 });
      else map.setView(CUMANA, 13);
      setTimeout(() => map.invalidateSize(), 120);
    });
    return () => { cancel = true; };
  }, [abierto, tiendas, yo]);

  const lista = ordenar(tiendas, yo);

  return (
    <>
      <button type="button" className={className} onClick={abrir} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        {nombre}
      </button>
      {abierto && typeof document !== 'undefined' && createPortal(
        <div onClick={cerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 1040, maxWidth: '100%', maxHeight: '92vh', overflow: 'auto' }}>
            <div className="row" style={{ alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, flexWrap: 'wrap' }}>
                <img src="/hero/emprende-logo.png" alt="Emprende" className="logo-img logo-tema" style={{ height: 22, width: 'auto' }} />
                <span>Emprende</span>
                <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>— Tiendas cercanas a ti</span>
              </h3>
              <div className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={cerrar}>✕</button>
            </div>
            {error && <div className="error" style={{ marginBottom: 10 }}>{error}</div>}
            {tiendas === null && !error && <p className="muted" style={{ margin: 0 }}>Cargando mapa…</p>}
            {tiendas && tiendas.length === 0 && !error && (
              <p className="muted" style={{ margin: 0 }}>Todavía no hay tiendas con ubicación en el mapa.</p>
            )}
            {tiendas && tiendas.length > 0 && (
              <div className="tc-mapwrap">
                <div ref={mapRef} className="tc-map" />
                <div className="tc-lista">
                  {!yo && <p className="muted tiny" style={{ margin: '0 0 8px' }}>Permite tu ubicación para ver cuáles están más cerca de ti.</p>}
                  {lista.map((t) => (
                    <a key={t.id} href={`/t/${t.slug}`} className="tc-item">
                      <span className="tc-logo" style={t.logo_url ? { backgroundImage: `url(${t.logo_url})` } : undefined}>{!t.logo_url && (t.nombre || '?').charAt(0).toUpperCase()}</span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="tc-name">{t.nombre} <Verificado size={13} />{t.dist != null && <span className="muted tiny" style={{ fontWeight: 400 }}> · a {t.dist < 1 ? Math.round(t.dist * 1000) + ' m' : t.dist.toFixed(1) + ' km'}</span>}</span>
                        {t.direccion && <span className="muted tiny tc-dir">{t.direccion}</span>}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
