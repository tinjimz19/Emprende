'use client';
import { useRef, useState } from 'react';
import { api, subirArchivo } from '@/lib/api';

export default function GaleriaEditor({ productoId, imagenes, onChange, onError }) {
  const [imgs, setImgs] = useState(imagenes || []);
  const [subiendo, setSubiendo] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const inputRef = useRef(null);

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
        const r = await subirArchivo(`/api/productos/${productoId}/imagenes`, file, 'imagen');
        if (r?.imagen) acumuladas.push(r.imagen);
        actualizar([...acumuladas]);
      }
    } catch (e) { onError?.(e.message); }
    finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
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

        <label className={`galeria-subir ${subiendo ? 'ocupado' : ''}`}>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden
            onChange={(e) => onArchivos(e.target.files)} disabled={subiendo} />
          <span style={{ fontSize: 26, lineHeight: 1 }}>{subiendo ? '…' : '+'}</span>
          <span className="tiny muted">{subiendo ? 'Subiendo…' : 'Agregar fotos'}</span>
        </label>
      </div>
      <p className="muted tiny" style={{ marginTop: 10 }}>
        Arrastra para reordenar (o usa ★ y las flechas). La primera imagen es la portada.
      </p>
    </div>
  );
}
