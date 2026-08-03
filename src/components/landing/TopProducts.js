'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductoCard from '@/components/landing/ProductoCard';

export default function TopProducts({ inicial }) {
  const [productos, setProductos] = useState(inicial?.productos || []);
  const [categorias] = useState(inicial?.categorias || []);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [cargando, setCargando] = useState(false);

  // No recargamos en el primer render: se usan los productos que vienen del servidor
  // (así se ven en cualquier dispositivo). Solo se re-pide al filtrar o buscar.
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    const params = new URLSearchParams({ limit: '12' });
    if (cat) params.set('categoria', cat);
    if (q) params.set('q', q);
    setCargando(true);
    const t = setTimeout(() => {
      api(`/api/vitrina?${params}`, { auth: false })
        .then((d) => setProductos(d.productos))
        .catch(() => {}) // ante un fallo de red conserva lo que ya se muestra, no lo vacía
        .finally(() => setCargando(false));
    }, 250);
    return () => clearTimeout(t);
  }, [cat, q]);

  return (
    <div id="productos">
      {/* Solo el encabezado (lo de la captura) en dos columnas */}
      <div className="mkt-head">
        <div className="mkt-head-l">
          <span className="eyebrow">Mercado</span>
          <h2>Explora productos de todas las tiendas</h2>
          <p className="muted">Descubre lo que venden los emprendedores de Cumaná y compra directo con ellos por WhatsApp.</p>
        </div>
        <div className="mkt-head-r">
          <input className="input" placeholder="Buscar en toda la plataforma…" value={q}
            onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {categorias.length > 0 && (
        <div className="filters">
          <button className={`chip ${cat === '' ? 'active' : ''}`} onClick={() => setCat('')}>Todo</button>
          {categorias.map((c) => (
            <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      )}

      {productos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 44, opacity: cargando ? 0.5 : 1 }}>
          <p className="muted" style={{ margin: 0 }}>
            {cargando ? 'Buscando…' : 'Aún no hay productos para mostrar aquí. ¡Sé de las primeras tiendas en aparecer!'}
          </p>
          {!cargando && <Link className="btn btn-primary" href="/registro" style={{ marginTop: 16 }}>Crear mi tienda</Link>}
        </div>
      ) : (
        <div className="grid grid-cards" style={{ opacity: cargando ? 0.6 : 1, transition: 'opacity .2s' }}>
          {productos.map((p) => <ProductoCard key={`${p.tienda_slug}-${p.id}`} p={p} />)}
        </div>
      )}

      {productos.length > 0 && (
        <div className="row" style={{ justifyContent: 'center', marginTop: 30 }}>
          <Link className="btn btn-primary btn-lg" href="/marketplace">Ver todo el marketplace</Link>
        </div>
      )}

      <style jsx>{`
        .mkt-head {
          display: grid;
          grid-template-columns: 70% 30%;
          gap: 30px;
          align-items: end;
          margin: 0 0 30px;
        }
        .mkt-head-l .eyebrow { display: block; margin-bottom: 8px; }
        .mkt-head-l h2 {
          font-size: clamp(24px, 3vw, 38px);
          letter-spacing: -.02em;
          line-height: 1.08;
          margin: 0 0 10px;
        }
        .mkt-head-l p { font-size: 15px; line-height: 1.55; margin: 0; }
        .mkt-head-r { display: flex; flex-direction: column; justify-content: flex-end; }
        @media (max-width: 720px) {
          .mkt-head { grid-template-columns: 1fr; gap: 14px; margin-bottom: 22px; text-align: left; }
        }
      `}</style>
    </div>
  );
}
