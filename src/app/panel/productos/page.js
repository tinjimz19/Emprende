'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, usd } from '@/lib/api';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      const p = await api('/api/productos');
      setProductos(p.productos);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);

  async function eliminar(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar este producto? Se borran también sus imágenes y variantes.')) return;
    try { await api(`/api/productos/${id}`, { method: 'DELETE' }); await cargar(); }
    catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="row">
        <h1 style={{ margin: 0 }}>Productos</h1>
        <div className="spacer" />
        <Link className="btn btn-primary btn-sm" href="/panel/productos/nuevo">+ Nuevo producto</Link>
      </div>
      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      <div className="card" style={{ marginTop: 18, padding: 0 }}>
        <table className="table">
          <thead>
            <tr><th></th><th>Producto</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={6} className="muted" style={{ padding: 24 }}>Cargando…</td></tr>
            )}
            {!cargando && productos.length === 0 && (
              <tr><td colSpan={6} className="muted" style={{ padding: 24 }}>
                Aún no tienes productos. <Link href="/panel/productos/nuevo" style={{ color: 'var(--brand)' }}>Crea el primero</Link>.
              </td></tr>
            )}
            {productos.map((p) => (
              <tr key={p.id} className="row-link" onClick={() => { location.href = `/panel/productos/${p.id}`; }}>
                <td style={{ width: 56 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: p.imagen ? `var(--surface-2) url(${p.imagen}) center/cover` : 'var(--surface-2)' }} />
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {p.categoria_nombre || 'Sin categoría'}
                    {Number(p.num_variantes) > 0 ? ` · ${p.num_variantes} variantes` : ''}
                    {Number(p.num_imagenes) > 0 ? ` · ${p.num_imagenes} fotos` : ''}
                  </div>
                </td>
                <td className="price">{usd(p.precio)}</td>
                <td>{Number(p.tiene_variantes) ? '—' : (Number(p.stock) > 0 ? p.stock : '')}</td>
                <td><span className="badge">{p.estado}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link className="btn btn-ghost btn-sm" href={`/panel/productos/${p.id}`} onClick={(e) => e.stopPropagation()}>Editar</Link>{' '}
                  <button className="btn btn-ghost btn-sm" onClick={(e) => eliminar(e, p.id)} style={{ color: 'var(--danger)' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
