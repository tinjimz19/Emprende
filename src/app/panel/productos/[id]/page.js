'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import GaleriaEditor from '@/components/panel/GaleriaEditor';
import VariantesEditor from '@/components/panel/VariantesEditor';
import ResenasEditor from '@/components/panel/ResenasEditor';

export default function EditarProducto() {
  const { id } = useParams();
  const esNuevo = useSearchParams().get('nuevo') === '1';

  const [prod, setProd] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    try {
      const [p, c] = await Promise.all([api(`/api/productos/${id}`), api('/api/categorias')]);
      setProd(p.producto);
      setCategorias(c.categorias);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [id]);

  function set(campo, valor) { setProd((p) => ({ ...p, [campo]: valor })); }

  async function guardarDatos(e) {
    e.preventDefault();
    setError(''); setOk('');
    if (prod.precio_oferta !== '' && prod.precio_oferta != null && Number(prod.precio_oferta) >= Number(prod.precio || 0)) {
      setError('El precio de oferta debe ser menor al precio normal.');
      return;
    }
    setGuardando(true);
    try {
      await api(`/api/productos/${id}`, {
        method: 'PUT',
        body: {
          nombre: prod.nombre,
          precio: Number(prod.precio || 0),
          precio_oferta: prod.precio_oferta === '' || prod.precio_oferta == null ? null : Number(prod.precio_oferta),
          categoria_id: prod.categoria_id || null,
          stock: Number(prod.stock || 0),
          estado: prod.estado,
          destacado: prod.destacado ? 1 : 0,
          descripcion: prod.descripcion || '',
        },
      });
      setOk('Datos guardados ✓');
      setTimeout(() => setOk(''), 2500);
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  if (error && !prod) return (
    <>
      <Link href="/panel/productos" className="muted" style={{ fontSize: 13 }}>← Productos</Link>
      <div className="error" style={{ marginTop: 14 }}>{error}</div>
    </>
  );
  if (!prod) return <div className="muted" style={{ paddingTop: 20 }}>Cargando…</div>;

  return (
    <>
      <div className="row">
        <div>
          <Link href="/panel/productos" className="muted" style={{ fontSize: 13 }}>← Productos</Link>
          <h1 style={{ margin: '4px 0 0' }}>{prod.nombre}</h1>
        </div>
        <div className="spacer" />
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <span className="muted tiny" title="Vistas únicas (por visitante/día)">👁 {Number(prod.vistas) || 0} vistas</span>
          <span className="badge">{prod.estado}</span>
        </div>
      </div>

      {esNuevo && <div className="ok-box" style={{ marginTop: 14 }}>Producto creado. Ahora agrégale fotos y, si aplica, variantes.</div>}
      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      {/* ---------- Datos ---------- */}
      <form onSubmit={guardarDatos} className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Datos generales</h3>
          <div className="spacer" />
          {ok && <span className="muted" style={{ color: 'var(--ok, var(--brand))', fontSize: 13 }}>{ok}</span>}
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Nombre</label>
          <input className="input" value={prod.nombre} onChange={(e) => set('nombre', e.target.value)} required />
        </div>

        <div className="row" style={{ alignItems: 'flex-end', gap: 12 }}>
          <div className="field" style={{ flex: '1 1 130px', marginBottom: 0 }}>
            <label>Precio ($)</label>
            <input className="input" type="number" step="0.01" min="0" value={prod.precio ?? ''} onChange={(e) => set('precio', e.target.value)} required />
          </div>
          <div className="field" style={{ flex: '1 1 130px', marginBottom: 0 }}>
            <label>Precio oferta ($)</label>
            <input className="input" type="number" step="0.01" min="0" value={prod.precio_oferta ?? ''} onChange={(e) => set('precio_oferta', e.target.value)} placeholder="opcional" />
          </div>
          <div className="field" style={{ flex: '1 1 110px', marginBottom: 0 }}>
            <label>Stock {Number(prod.tiene_variantes) ? '(por variante)' : ''}</label>
            <input className="input" type="number" min="0" value={prod.stock ?? ''} onChange={(e) => set('stock', e.target.value)} disabled={!!Number(prod.tiene_variantes)} />
          </div>
        </div>

        <div className="row" style={{ alignItems: 'flex-end', gap: 12, marginTop: 12 }}>
          <div className="field" style={{ flex: '2 1 200px', marginBottom: 0 }}>
            <label>Categoría</label>
            <select className="input" value={prod.categoria_id || ''} onChange={(e) => set('categoria_id', e.target.value)}>
              <option value="">— Sin categoría —</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: '1 1 140px', marginBottom: 0 }}>
            <label>Estado</label>
            <select className="input" value={prod.estado} onChange={(e) => set('estado', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="borrador">Borrador</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Descripción</label>
          <textarea rows={3} value={prod.descripcion || ''} onChange={(e) => set('descripcion', e.target.value)} />
        </div>

        <label className="row" style={{ gap: 8, cursor: 'pointer', marginTop: 4 }}>
          <input type="checkbox" checked={!!Number(prod.destacado)} onChange={(e) => set('destacado', e.target.checked ? 1 : 0)} />
          <span>Destacar en la vitrina</span>
        </label>

        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar datos'}</button>
        </div>
      </form>

      {/* ---------- Galería ---------- */}
      <div className="card" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Galería</h3>
        <GaleriaEditor
          productoId={id}
          imagenes={prod.imagenes || []}
          onChange={(imgs) => set('imagenes', imgs)}
          onError={setError}
        />
      </div>

      {/* ---------- Variantes ---------- */}
      <div className="card" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Variantes</h3>
        <VariantesEditor
          productoId={id}
          variantesIniciales={prod.variantes || []}
          imagenes={prod.imagenes || []}
          onChange={(vs) => setProd((p) => ({ ...p, variantes: vs, tiene_variantes: vs.length ? 1 : 0 }))}
          onError={setError}
        />
      </div>

      {/* ---------- Reseñas ---------- */}
      <div className="card" style={{ marginTop: 18, marginBottom: 40 }}>
        <h3 style={{ marginTop: 0 }}>Reseñas</h3>
        <p className="muted tiny" style={{ marginTop: -6 }}>Las reseñas de tus clientes. Puedes ocultar (dejan de verse en tu tienda) o eliminar las que no correspondan.</p>
        <ResenasEditor productoId={id} onError={setError} />
      </div>
    </>
  );
}
