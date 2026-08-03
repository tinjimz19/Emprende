'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NuevoProducto() {
  const router = useRouter();
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: '', precio: '', precio_oferta: '', categoria_id: '',
    stock: '', descripcion: '', estado: 'activo', destacado: false,
  });

  async function cargarCategorias() {
    try { const c = await api('/api/categorias'); setCategorias(c.categorias); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { cargarCategorias(); }, []);

  function set(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  async function nuevaCategoria() {
    const nombre = prompt('Nombre de la categoría');
    if (!nombre) return;
    try {
      const r = await api('/api/categorias', { method: 'POST', body: { nombre } });
      await cargarCategorias();
      if (r?.categoria?.id) set('categoria_id', String(r.categoria.id));
    } catch (e) { setError(e.message); }
  }

  async function crear(e) {
    e.preventDefault();
    setError('');
    if (form.precio_oferta !== '' && Number(form.precio_oferta) >= Number(form.precio || 0)) {
      setError('El precio de oferta debe ser menor al precio normal.');
      return;
    }
    setGuardando(true);
    try {
      const r = await api('/api/productos', {
        method: 'POST',
        body: {
          ...form,
          precio: Number(form.precio || 0),
          precio_oferta: form.precio_oferta === '' ? null : Number(form.precio_oferta),
          stock: Number(form.stock || 0),
          destacado: form.destacado ? 1 : 0,
        },
      });
      // Ir a la edición para añadir fotos y variantes.
      router.push(`/panel/productos/${r.producto.id}?nuevo=1`);
    } catch (e) { setError(e.message); setGuardando(false); }
  }

  return (
    <>
      <div className="row">
        <div>
          <Link href="/panel/productos" className="muted" style={{ fontSize: 13 }}>← Productos</Link>
          <h1 style={{ margin: '4px 0 0' }}>Nuevo producto</h1>
        </div>
      </div>
      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      <form onSubmit={crear} className="card" style={{ marginTop: 18, maxWidth: 720 }}>
        <div className="field">
          <label>Nombre</label>
          <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required autoFocus />
        </div>

        <div className="row" style={{ alignItems: 'flex-end', gap: 12 }}>
          <div className="field" style={{ flex: '1 1 130px', marginBottom: 0 }}>
            <label>Precio ($)</label>
            <input className="input" type="number" step="0.01" min="0" value={form.precio} onChange={(e) => set('precio', e.target.value)} required />
          </div>
          <div className="field" style={{ flex: '1 1 130px', marginBottom: 0 }}>
            <label>Precio oferta ($)</label>
            <input className="input" type="number" step="0.01" min="0" value={form.precio_oferta} onChange={(e) => set('precio_oferta', e.target.value)} placeholder="opcional" />
          </div>
          <div className="field" style={{ flex: '1 1 110px', marginBottom: 0 }}>
            <label>Stock</label>
            <input className="input" type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" />
          </div>
        </div>
        <p className="muted tiny" style={{ marginTop: 6 }}>El stock aplica si el producto no maneja variantes. Las variantes (talla, color…) se agregan en el siguiente paso.</p>

        <div className="row" style={{ alignItems: 'flex-end', gap: 12, marginTop: 6 }}>
          <div className="field" style={{ flex: '2 1 200px', marginBottom: 0 }}>
            <label>Categoría</label>
            <div className="row" style={{ gap: 8 }}>
              <select className="input" value={form.categoria_id} onChange={(e) => set('categoria_id', e.target.value)}>
                <option value="">— Sin categoría —</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <button type="button" className="btn btn-ghost btn-sm" onClick={nuevaCategoria}>+ Categoría</button>
            </div>
          </div>
          <div className="field" style={{ flex: '1 1 140px', marginBottom: 0 }}>
            <label>Estado</label>
            <select className="input" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="borrador">Borrador</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Descripción</label>
          <textarea rows={3} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </div>

        <label className="row" style={{ gap: 8, cursor: 'pointer', marginTop: 4 }}>
          <input type="checkbox" checked={form.destacado} onChange={(e) => set('destacado', e.target.checked)} />
          <span>Destacar en la vitrina</span>
        </label>

        <div className="row" style={{ marginTop: 18, gap: 10 }}>
          <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Creando…' : 'Crear y continuar'}</button>
          <Link href="/panel/productos" className="btn btn-soft">Cancelar</Link>
        </div>
      </form>
    </>
  );
}
