'use client';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api, subirArchivo } from '@/lib/api';
import { comprimirImagen } from '@/lib/imagen';

export default function GaleriaEditor({ productoId, imagenes, onChange, onError }) {
  const [imgs, setImgs] = useState(imagenes || []);
  const [subiendo, setSubiendo] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [esMovil, setEsMovil] = useState(false);
  const [menu, setMenu] = useState(false);
  const galeriaRef = useRef(null);
  const camaraRef = useRef(null);

  // Solo en dispositivos táctiles (móvil/tablet) ofrecemos "cámara vs galería".
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const set = () => setEsMovil(mq.matches);
    set();
    mq.addEventListener?.('change', set);
    return () => mq.removeEventListener?.('change', set);
  }, []);

  function actualizar(nuevas) {
    setImgs(nuevas);
    onChange?.(nuevas);
  }

  async function onArchivos(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setSubiendo(true);
    onError?.('');
    const acumuladas = [...imgs];
    try {
      for (const file of files) {
        const optim = await comprimirImagen(file, { maxLado: 1600, calidad: 0.82, tipo: 'image/webp', alfa: true });
        const r = await subirArchivo(`/api/productos/${productoId}/imagenes`, optim, 'imagen');
        if (r?.imagen) acumuladas.push(r.imagen);
        actualizar([...acumuladas]);
      }
    } catch (e) { onError?.(e.message); }
    finally {
      setSubiendo(false);
      if (galeriaRef.current) galeriaRef.current.value = '';
      if (camaraRef.current) camaraRef.current.value = '';
    }
  }

  // Al tocar "+": en móvil abre el menú; en escritorio va directo a la galería.
  function abrirSubida() {
    if (subiendo) return;
    if (esMovil) setMenu(true);
    else galeriaRef.current?.click();
  }

  async function eliminar(imgId) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await api(`/api/imagenes/${imgId}`, { method: 'DELETE' });
      actualizar(imgs.filter((i) => i.id !== imgId));
    } catch (e) { onError?.(e.message); }
  }

  async function persistirOrden(lista) {
    try {
      await api(`/api/productos/${productoId}/imagenes/orden`, {
        method: 'PUT',
        body: { orden: lista.map((i) => i.id) },
      });
    } catch (e) { onError?.(e.message); }
  }

  // Reordena moviendo el elemento en `desde` a la posición `hasta`.
  function reordenar(desde, hasta) {
    if (desde === hasta || desde == null || hasta == null) return imgs;
    const nuevas = [...imgs];
    const [item] = nuevas.splice(desde, 1);
    nuevas.splice(hasta, 0, item);
    setImgs(nuevas);
    onChange?.(nuevas);
    return nuevas;
  }

  function mover(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= imgs.length) return;
    const nuevas = reordenar(idx, j);
    persistirOrden(nuevas);
  }

  function hacerPortada(idx) {
    if (idx === 0) return;
    const nuevas = reordenar(idx, 0);
    persistirOrden(nuevas);
  }

  // --- Arrastrar y soltar ---
  function onDragStart(idx) { setDragIdx(idx); }
  function onDragOver(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    reordenar(dragIdx, idx);
    setDragIdx(idx);
  }
  function onDrop() {
    if (dragIdx !== null) persistirOrden(imgs);
    setDragIdx(null);
  }

  const opcionBtn = {
    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
    padding: '15px 14px', border: '1px solid var(--border)', borderRadius: 12,
    background: 'var(--surface)', color: 'inherit', font: 'inherit', fontSize: 16,
    cursor: 'pointer', textAlign: 'left', marginBottom: 10,
  };

  return (
    <div>
      <div className="galeria-grid">
        {imgs.map((im, idx) => (
          <div
            key={im.id}
            className={`galeria-item ${dragIdx === idx ? 'arrastrando' : ''}`}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDrop={onDrop}
            onDragEnd={onDrop}
          >
            <img src={im.url_card || im.url_thumb} alt="" draggable={false} />
            {idx === 0 && <span className="galeria-portada">Portada</span>}
            <div className="galeria-acciones">
              <button type="button" title="Mover antes" onClick={() => mover(idx, -1)} disabled={idx === 0}>‹</button>
              {idx !== 0 && <button type="button" title="Hacer portada" onClick={() => hacerPortada(idx)}>★</button>}
              <button type="button" title="Mover después" onClick={() => mover(idx, 1)} disabled={idx === imgs.length - 1}>›</button>
              <button type="button" title="Eliminar" className="galeria-del" onClick={() => eliminar(im.id)}>✕</button>
            </div>
          </div>
        ))}

        <button type="button" className={`galeria-subir ${subiendo ? 'ocupado' : ''}`}
          style={{ width: '100%' }} disabled={subiendo} onClick={abrirSubida}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>{subiendo ? '…' : '+'}</span>
          <span className="tiny muted">{subiendo ? 'Subiendo…' : 'Agregar fotos'}</span>
        </button>

        {/* Inputs ocultos: galería (varias) y cámara (una sola foto). */}
        <input ref={galeriaRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => onArchivos(e.target.files)} disabled={subiendo} />
        <input ref={camaraRef} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => onArchivos(e.target.files)} disabled={subiendo} />
      </div>

      <p className="muted tiny" style={{ marginTop: 10 }}>
        Arrastra para reordenar (o usa ★ y las flechas). La primera imagen es la portada.
      </p>

      {menu && esMovil && createPortal(
        <div onClick={() => setMenu(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', background: 'var(--surface)', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: '10px 16px calc(16px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 34px rgba(0,0,0,0.28)' }}>
            <div style={{ width: 42, height: 4, borderRadius: 2, background: 'var(--border)', margin: '2px auto 14px' }} />
            <button type="button" style={opcionBtn} onClick={() => { setMenu(false); camaraRef.current?.click(); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Tomar foto
            </button>
            <button type="button" style={opcionBtn} onClick={() => { setMenu(false); galeriaRef.current?.click(); }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Cargar de galería
            </button>
            <button type="button" onClick={() => setMenu(false)}
              style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 12, background: 'transparent', color: 'var(--text-2)', font: 'inherit', fontSize: 15, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
