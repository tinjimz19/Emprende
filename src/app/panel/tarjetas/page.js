'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';

const BRAND = '#FF453A';
const LOGO_EMPRENDE = '/hero/emprende-logo.png';

const PLANTILLAS = [
  { key: 'minimal', label: 'Minimal' },
  { key: 'bloque', label: 'Bloque rojo' },
  { key: 'foto', label: 'Con foto' },
  { key: 'festivo', label: 'Festivo' },
];

const PRESETS = [
  '¡Visita mi tienda en línea!',
  'Escanea el código y descubre mis productos.',
  '¡Te espero en {tienda}! Compra fácil.',
  'Nuevos productos disponibles. Ven a conocerlos.',
];

// Carga html2canvas desde CDN una sola vez (para exportar a PNG).
function cargarHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.html2canvas) return resolve(window.html2canvas);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => reject(new Error('No se pudo cargar el generador de imágenes.'));
    document.body.appendChild(s);
  });
}

function descargarCanvas(canvas, nombre) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function Sello({ dark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.92 }}>
      <img src={LOGO_EMPRENDE} alt="" width={18} height={18} style={{ display: 'block', filter: dark ? 'brightness(0) invert(1)' : 'none' }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: '.01em', color: dark ? '#fff' : 'var(--text-2, #555)' }}>
        Hecho con Emprende Cumaná
      </span>
    </div>
  );
}

// La tarjeta (340x480). Recibe todo resuelto por props para que preview,
// impresión y exportación compartan exactamente el mismo render.
function Tarjeta({ d }) {
  const { plantilla, color, nombre, mensaje, url, qr, logo, foto, cupon, whatsapp, direccion } = d;
  const enlace = String(url || '').replace(/^https?:\/\//, '');

  const Detalles = ({ dark }) => {
    const c = dark ? 'rgba(255,255,255,.92)' : '#3a3f4a';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, alignItems: 'center', maxWidth: '100%' }}>
        {cupon && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            alignSelf: 'center', border: `1.5px dashed ${dark ? 'rgba(255,255,255,.7)' : color}`,
            color: dark ? '#fff' : color, borderRadius: 8, padding: '4px 12px', fontWeight: 800,
            fontSize: 13, letterSpacing: '.02em',
          }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
            {cupon}
          </div>
        )}
        {whatsapp && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: c }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ flex: 'none' }}><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.35-.5.05-.95.24-3.2-.67-2.7-1.06-4.42-3.8-4.55-3.98-.13-.18-1.1-1.46-1.1-2.78 0-1.33.7-1.98.94-2.25.24-.27.53-.34.71-.34.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.81 2 .88 2.14.07.14.12.31.02.5-.1.19-.15.29-.3.45-.15.16-.31.36-.44.48-.15.14-.3.3-.13.58.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.14.25.09 1.62.76 1.9.9.28.14.46.21.53.32.07.11.07.65-.17 1.33z" /></svg>
            {whatsapp}
          </div>
        )}
        {direccion && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: c, maxWidth: '92%' }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{direccion}</span>
          </div>
        )}
      </div>
    );
  };

  const QR = ({ size = 118 }) => (
    <div style={{ background: '#fff', padding: 8, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,.12)' }}>
      {qr
        ? <img src={qr} alt="QR" width={size} height={size} style={{ display: 'block' }} />
        : <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', color: '#999', fontSize: 11 }}>QR</div>}
    </div>
  );

  const LogoTienda = ({ s = 74, borde }) => (
    logo
      ? <img src={logo} alt={nombre} width={s} height={s}
          style={{ width: s, height: s, borderRadius: '50%', objectFit: 'cover', background: '#fff', border: borde ? `3px solid ${borde}` : 'none' }} />
      : <div style={{ width: s, height: s, borderRadius: '50%', background: '#fff', color, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: s * 0.42, border: borde ? `3px solid ${borde}` : 'none' }}>
          {(nombre || '?').trim().charAt(0).toUpperCase()}
        </div>
  );

  const base = {
    width: 340, height: 480, borderRadius: 18, overflow: 'hidden', position: 'relative',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: 'flex', flexDirection: 'column',
  };

  if (plantilla === 'bloque') {
    return (
      <div style={{ ...base, background: '#fff', border: '1px solid #eee' }}>
        <div style={{ background: color, padding: '26px 22px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <LogoTienda s={78} borde="rgba(255,255,255,.85)" />
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, textAlign: 'center', letterSpacing: '-.01em', lineHeight: 1.15 }}>{nombre}</div>
        </div>
        <div style={{ flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <p style={{ margin: '2px 0 0', fontSize: 15.5, color: '#2a2f3a', lineHeight: 1.5, fontWeight: 500 }}>{mensaje}</p>
          <Detalles dark={false} />
          <div style={{ flex: 1 }} />
          <QR />
          <div style={{ fontSize: 13, color: '#8a90a0', marginTop: 8, fontWeight: 500 }}>{enlace}</div>
          <div style={{ marginTop: 8 }}><Sello dark={false} /></div>
        </div>
      </div>
    );
  }

  if (plantilla === 'foto') {
    return (
      <div style={{ ...base, background: foto ? `#222 url(${foto}) center/cover` : color }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,.78) 100%)' }} />
        <div style={{ position: 'relative', flex: 1, padding: '22px 22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: '#fff' }}>
          <LogoTienda s={64} borde="rgba(255,255,255,.9)" />
          <div style={{ fontWeight: 800, fontSize: 21, marginTop: 8, textShadow: '0 1px 6px rgba(0,0,0,.5)' }}>{nombre}</div>
          <p style={{ margin: '6px 0 0', fontSize: 15, lineHeight: 1.45, textShadow: '0 1px 6px rgba(0,0,0,.5)', fontWeight: 500 }}>{mensaje}</p>
          <Detalles dark />
          <div style={{ flex: 1 }} />
          <QR />
          <div style={{ fontSize: 13, marginTop: 8, opacity: 0.95, fontWeight: 500 }}>{enlace}</div>
          <div style={{ marginTop: 8 }}><Sello dark /></div>
        </div>
      </div>
    );
  }

  if (plantilla === 'festivo') {
    return (
      <div style={{ ...base, background: color, color: '#fff', alignItems: 'center', textAlign: 'center', padding: '24px 22px 20px' }}>
        <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
        <div style={{ position: 'absolute', bottom: 60, right: -25, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.10)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', opacity: 0.9, marginBottom: 12 }}>Te invito a</div>
          <LogoTienda s={72} borde="rgba(255,255,255,.9)" />
          <div style={{ fontWeight: 800, fontSize: 24, marginTop: 8, lineHeight: 1.1 }}>{nombre}</div>
          <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.45, fontWeight: 500 }}>{mensaje}</p>
          <Detalles dark />
          <div style={{ flex: 1 }} />
          <QR />
          <div style={{ fontSize: 13, marginTop: 8, opacity: 0.95, fontWeight: 500 }}>{enlace}</div>
          <div style={{ marginTop: 8 }}><Sello dark /></div>
        </div>
      </div>
    );
  }

  // minimal (por defecto)
  return (
    <div style={{ ...base, background: '#fff', border: '1px solid #ececec', borderTop: `6px solid ${color}`, alignItems: 'center', textAlign: 'center', padding: '26px 24px 20px' }}>
      <LogoTienda s={76} />
      <div style={{ fontWeight: 800, fontSize: 22, marginTop: 10, color: '#1d222b', letterSpacing: '-.01em' }}>{nombre}</div>
      <p style={{ margin: '8px 0 0', fontSize: 15.5, color: '#3a3f4a', lineHeight: 1.5, fontWeight: 500 }}>{mensaje}</p>
      <Detalles dark={false} />
      <div style={{ flex: 1 }} />
      <QR />
      <div style={{ fontSize: 13, color: '#8a90a0', marginTop: 8, fontWeight: 500 }}>{enlace}</div>
      <div style={{ marginTop: 8 }}><Sello dark={false} /></div>
    </div>
  );
}

export default function Tarjetas() {
  const [tienda, setTienda] = useState(null);
  const [assets, setAssets] = useState({ logo: null, qr: null, url: '' });
  const [cupones, setCupones] = useState([]);
  const [error, setError] = useState('');
  const [exp, setExp] = useState(null); // 'png' mientras exporta
  const cardRef = useRef(null);
  const stageRef = useRef(null);
  const [escala, setEscala] = useState(1);

  const [plantilla, setPlantilla] = useState('bloque');
  const [temaTienda, setTemaTienda] = useState(false);
  const [mensaje, setMensaje] = useState('¡Visita mi tienda en línea!');
  const [conCupon, setConCupon] = useState(false);
  const [cuponCodigo, setCuponCodigo] = useState('');
  const [conWhatsapp, setConWhatsapp] = useState(false);
  const [conDireccion, setConDireccion] = useState(false);
  const [conFoto, setConFoto] = useState(true);

  useEffect(() => {
    api('/api/tienda').then((d) => setTienda(d.tienda)).catch((e) => setError(e.message));
    api('/api/tienda/tarjeta-assets').then((d) => setAssets(d)).catch(() => {});
    api('/api/cupones').then((d) => setCupones(d.cupones || [])).catch(() => {});
  }, []);

  const cuponesActivos = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return (cupones || []).filter((c) => Number(c.activo) === 1 && (!c.vence || String(c.vence).slice(0, 10) >= hoy));
  }, [cupones]);

  useEffect(() => {
    if (!cuponCodigo && cuponesActivos.length) setCuponCodigo(cuponesActivos[0].codigo);
  }, [cuponesActivos, cuponCodigo]);

  // Ajusta la vista previa (tarjeta de 340px fija) para que quepa en pantallas
  // angostas sin desbordar. La exportación usa cardRef a tamaño real, así que
  // el PNG mantiene su calidad.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const calc = () => {
      const cs = getComputedStyle(el);
      const pad = parseFloat(cs.paddingLeft || 0) + parseFloat(cs.paddingRight || 0);
      const avail = el.clientWidth - pad;
      if (avail > 0) setEscala(Math.min(1, avail / 340));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tienda]);

  if (error) return <div className="error" style={{ marginTop: 14 }}>{error}</div>;
  if (!tienda) return <p className="muted">Cargando…</p>;

  const color = temaTienda && tienda.color_primario ? tienda.color_primario : BRAND;
  const foto = tienda.portada_url || assets.logo || tienda.logo_url || null;
  const storeUrl = assets.url || (typeof window !== 'undefined' ? `${window.location.origin}/t/${tienda.slug}` : `/t/${tienda.slug}`);
  const qr = assets.qr || `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encodeURIComponent(storeUrl)}`;

  const cupSel = cuponesActivos.find((c) => c.codigo === cuponCodigo);
  const cupTexto = conCupon && cupSel
    ? `${cupSel.codigo} · ${Number(cupSel.tipo === 'porcentaje' ? cupSel.valor : cupSel.valor)}${cupSel.tipo === 'porcentaje' ? '% OFF' : '$ OFF'}`
    : (conCupon && cuponCodigo ? cuponCodigo : null);

  const data = {
    plantilla,
    color,
    nombre: tienda.nombre,
    mensaje: (mensaje || '').replace(/\{tienda\}/g, tienda.nombre),
    url: storeUrl,
    qr,
    logo: assets.logo || tienda.logo_url || null,
    foto: conFoto ? foto : null,
    cupon: cupTexto,
    whatsapp: conWhatsapp && tienda.whatsapp ? tienda.whatsapp : null,
    direccion: conDireccion && tienda.direccion ? tienda.direccion : null,
  };

  async function descargarPNG() {
    if (!cardRef.current) return;
    setError(''); setExp('png');
    try {
      const h2c = await cargarHtml2Canvas();
      const canvas = await h2c(cardRef.current, { scale: 3, backgroundColor: null, useCORS: true, logging: false });
      descargarCanvas(canvas, `tarjeta-${tienda.slug}.png`);
    } catch (e) { setError('No se pudo generar la imagen: ' + e.message); }
    finally { setExp(null); }
  }

  function imprimirHoja() {
    if (typeof window !== 'undefined') window.print();
  }

  return (
    <div className="tarj-wrap">
      <div className="row" style={{ alignItems: 'baseline' }}>
        <h1 style={{ margin: 0 }}>Tarjetas para compartir</h1>
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>
        Diseña una tarjeta con tu logo, un mensaje y el QR de tu tienda. Descárgala como imagen para WhatsApp o imprime una hoja para repartir.
      </p>

      <div className="tarj-grid">
        {/* Controles */}
        <div className="tarj-controls">
          <div className="card">
            <label className="tarj-lbl">Plantilla</label>
            <div className="tarj-chips">
              {PLANTILLAS.map((p) => (
                <button key={p.key} type="button" className={`chip ${plantilla === p.key ? 'active' : ''}`} onClick={() => setPlantilla(p.key)}>{p.label}</button>
              ))}
            </div>

            <label className="tarj-lbl" style={{ marginTop: 16 }}>Mensaje de invitación</label>
            <textarea rows={3} value={mensaje} maxLength={140} onChange={(e) => setMensaje(e.target.value)} />
            <div className="tarj-presets">
              {PRESETS.map((p, i) => (
                <button key={i} type="button" className="btn btn-ghost btn-sm" onClick={() => setMensaje(p)} title={p}>{p.length > 26 ? p.slice(0, 24) + '…' : p}</button>
              ))}
            </div>
            <p className="muted tiny" style={{ margin: '6px 0 0' }}>Puedes usar <b>{'{tienda}'}</b> y se reemplaza por el nombre de tu tienda.</p>

            <label className="tarj-lbl" style={{ marginTop: 16 }}>Color</label>
            <div className="tarj-chips">
              <button type="button" className={`chip ${!temaTienda ? 'active' : ''}`} onClick={() => setTemaTienda(false)}>Rojo Emprende</button>
              <button type="button" className={`chip ${temaTienda ? 'active' : ''}`} onClick={() => setTemaTienda(true)} disabled={!tienda.color_primario}>
                Color de mi tienda
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <label className="tarj-lbl">Incluir en la tarjeta</label>
            <label className="tarj-check"><input type="checkbox" checked={conFoto} onChange={(e) => setConFoto(e.target.checked)} /> Foto de la tienda (plantilla “Con foto”)</label>

            <label className="tarj-check"><input type="checkbox" checked={conCupon} onChange={(e) => setConCupon(e.target.checked)} disabled={cuponesActivos.length === 0} /> Cupón de bienvenida</label>
            {conCupon && cuponesActivos.length > 0 && (
              <select className="input" value={cuponCodigo} onChange={(e) => setCuponCodigo(e.target.value)} style={{ margin: '2px 0 8px 26px', width: 'calc(100% - 26px)' }}>
                {cuponesActivos.map((c) => (
                  <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.tipo === 'porcentaje' ? `${Number(c.valor)}%` : `$${Number(c.valor)}`}</option>
                ))}
              </select>
            )}
            {cuponesActivos.length === 0 && <p className="muted tiny" style={{ margin: '0 0 6px 26px' }}>No tienes cupones activos. Créalos en la sección Cupones.</p>}

            <label className="tarj-check"><input type="checkbox" checked={conWhatsapp} onChange={(e) => setConWhatsapp(e.target.checked)} disabled={!tienda.whatsapp} /> WhatsApp {tienda.whatsapp ? '' : '(sin número)'}</label>
            <label className="tarj-check"><input type="checkbox" checked={conDireccion} onChange={(e) => setConDireccion(e.target.checked)} disabled={!tienda.direccion} /> Dirección {tienda.direccion ? '' : '(sin dirección)'}</label>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <label className="tarj-lbl">Exportar</label>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={descargarPNG} disabled={exp === 'png'} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                {exp === 'png' ? 'Generando…' : 'Descargar PNG'}
              </button>
              <button className="btn btn-soft" onClick={imprimirHoja} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                Hoja imprimible
              </button>
            </div>
            <p className="muted tiny" style={{ margin: '8px 0 0' }}>PNG: una tarjeta lista para WhatsApp o redes. Hoja: 6 tarjetas por página tamaño carta con guías de corte.</p>
          </div>
        </div>

        {/* Vista previa */}
        <div className="tarj-preview">
          <div className="tarj-stage" ref={stageRef}>
            <div className="tarj-scaler" style={{ width: 340 * escala, height: 480 * escala }}>
              <div style={{ transform: `scale(${escala})`, transformOrigin: 'top left' }}>
                <div ref={cardRef}><Tarjeta d={data} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hoja imprimible (oculta en pantalla, visible solo al imprimir) */}
      <div className="hoja-print">
        <div className="hoja-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="tp-cell" key={i}><div className="tp-scale"><Tarjeta d={data} /></div></div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .tarj-grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 24px; align-items: start; margin-top: 18px; }
        .tarj-lbl { display: block; font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 8px; }
        .tarj-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .tarj-presets { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .tarj-check { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-top: 10px; cursor: pointer; }
        .tarj-preview { position: sticky; top: 20px; min-width: 0; }
        .tarj-stage { background: var(--surface-2); border: 1px solid var(--border-soft); border-radius: 16px; padding: 20px; display: grid; place-items: center; min-width: 0; overflow: hidden; }
        .tarj-scaler { position: relative; }
        @media (max-width: 900px) { .tarj-grid { grid-template-columns: 1fr; } .tarj-preview { position: static; } .tarj-stage { padding: 12px; } }
      `}</style>

      <style jsx global>{`
        .hoja-print { position: absolute; left: -99999px; top: 0; }
        @media print {
          body * { visibility: hidden !important; }
          .hoja-print, .hoja-print * { visibility: visible !important; }
          .hoja-print { position: absolute; left: 0; top: 0; width: 100%; }
          .hoja-grid { display: grid; grid-template-columns: repeat(2, auto); gap: 8mm; justify-content: center; }
          .tp-cell { width: 204px; height: 288px; border: 1px dashed #c4c4c4; box-sizing: content-box; }
          .tp-scale { transform: scale(0.6); transform-origin: top left; width: 340px; height: 480px; }
          @page { size: letter; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
