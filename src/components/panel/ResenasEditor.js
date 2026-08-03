'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function Stars({ valor = 0 }) {
  const n = Math.round(Number(valor) || 0);
  return (
    <span className="stars" style={{ fontSize: 14 }} aria-label={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= n ? 'on' : ''}>★</span>)}
    </span>
  );
}

function fmtFecha(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ResenasEditor({ productoId, onError }) {
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const d = await api(`/api/comentarios?producto_id=${productoId}`);
      setComentarios(d.comentarios || []);
    } catch (e) { onError?.(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [productoId]);

  async function moderar(id, aprobado) {
    try {
      await api(`/api/comentarios/${id}`, { method: 'PATCH', body: { aprobado } });
      setComentarios((cs) => cs.map((c) => c.id === id ? { ...c, aprobado } : c));
    } catch (e) { onError?.(e.message); }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta reseña? No se puede deshacer.')) return;
    try {
      await api(`/api/comentarios/${id}`, { method: 'DELETE' });
      setComentarios((cs) => cs.filter((c) => c.id !== id));
    } catch (e) { onError?.(e.message); }
  }

  if (cargando) return <p className="muted tiny" style={{ margin: 0 }}>Cargando reseñas…</p>;
  if (comentarios.length === 0) return <p className="muted tiny" style={{ margin: 0 }}>Este producto aún no tiene reseñas.</p>;

  return (
    <div>
      {comentarios.map((c) => {
        const oculto = Number(c.aprobado) === 0;
        return (
          <div key={c.id} className="resena-mod" style={{ opacity: oculto ? 0.6 : 1 }}>
            <div className="row" style={{ alignItems: 'center', gap: 10 }}>
              <strong style={{ fontSize: 14 }}>{c.nombre}</strong>
              <Stars valor={c.calificacion} />
              {oculto && <span className="badge">oculto</span>}
              <div className="spacer" />
              <span className="muted tiny">{fmtFecha(c.created_at)}</span>
            </div>
            {c.comentario && <p style={{ margin: '6px 0 8px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>{c.comentario}</p>}
            <div className="row" style={{ gap: 8 }}>
              {oculto
                ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => moderar(c.id, 1)}>Mostrar</button>
                : <button type="button" className="btn btn-ghost btn-sm" onClick={() => moderar(c.id, 0)}>Ocultar</button>}
              <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => eliminar(c.id)}>Eliminar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
