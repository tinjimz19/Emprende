'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import ProductoCard from '@/components/landing/ProductoCard';

const LIMIT = 9;

// Lista de páginas a mostrar con elipsis (ej: 1 … 4 5 6 … 20).
function rangoPaginas(actual, total) {
  const out = [];
  let prev = 0;
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || (n >= actual - 1 && n <= actual + 1)) {
      if (prev && n - prev > 1) out.push('…');
      out.push(n);
      prev = n;
    }
  }
  return out;
}

export default function MarketplaceClient({ inicial, categoriaInicial = '' }) {
  const [productos, setProductos] = useState(inicial?.productos || []);
  const [total, setTotal] = useState(inicial?.total ?? (inicial?.productos || []).length);
  const [categorias] = useState(inicial?.categorias || []);
  const [cat, setCat] = useState(categoriaInicial || '');
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const topRef = useRef(null);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));

  // Se re-pide al cambiar categoría, búsqueda o página (el primer render usa lo del servidor).
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String((pagina - 1) * LIMIT) });
    if (cat) params.set('categoria', cat);
    if (q) params.set('q', q);
    setCargando(true);
    const t = setTimeout(() => {
      api(`/api/vitrina?${params}`, { auth: false })
        .then((d) => { setProductos(d.productos || []); if (typeof d.total === 'number') setTotal(d.total); })
        .catch(() => {}) // ante fallo de red conserva lo visible
        .finally(() => setCargando(false));
    }, 250);
    return () => clearTimeout(t);
  }, [cat, q, pagina]);

  // Cambiar categoría o búsqueda vuelve a la página 1.
  function elegirCat(c) { setCat(c); setPagina(1); }
  function buscar(v) { setQ(v); setPagina(1); }

  function irA(n) {
    const destino = Math.min(Math.max(1, n), totalPaginas);
    if (destino === pagina) return;
    setPagina(destino);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="mkt-layout" ref={topRef}>
      {/* Barra lateral: buscador + categorías */}
      <aside className="mkt-side">
        <input className="input" placeholder="Buscar…" value={q} onChange={(e) => buscar(e.target.value)} />
        <div>
          <div className="mkt-side-title">Categorías</div>
          <div className="mkt-cats">
            <button className={`mkt-cat ${cat === '' ? 'active' : ''}`} onClick={() => elegirCat('')}>Todo</button>
            {categorias.map((c) => (
              <button key={c} className={`mkt-cat ${cat === c ? 'active' : ''}`} onClick={() => elegirCat(c)}>{c}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* Grilla de productos */}
      <div className="mkt-main">
        {productos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 44, opacity: cargando ? 0.5 : 1 }}>
            <p className="muted" style={{ margin: 0 }}>{cargando ? 'Buscando…' : 'No hay productos que coincidan.'}</p>
          </div>
        ) : (
          <>
            <div className="row" style={{ marginBottom: 14 }}>
              <span className="muted tiny">{total} producto{total !== 1 ? 's' : ''}{totalPaginas > 1 ? ` · página ${pagina} de ${totalPaginas}` : ''}</span>
            </div>

            <div className="grid grid-cards" style={{ opacity: cargando ? 0.6 : 1, transition: 'opacity .2s' }}>
              {productos.map((p) => <ProductoCard key={`${p.tienda_slug}-${p.id}`} p={p} />)}
            </div>

            {totalPaginas > 1 && (
              <div className="pager">
                <button className="pager-btn" disabled={pagina === 1} onClick={() => irA(pagina - 1)} aria-label="Anterior">‹</button>
                {rangoPaginas(pagina, totalPaginas).map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="pager-ellipsis">…</span>
                  : <button key={n} className={`pager-btn ${n === pagina ? 'active' : ''}`} onClick={() => irA(n)}>{n}</button>)}
                <button className="pager-btn" disabled={pagina === totalPaginas} onClick={() => irA(pagina + 1)} aria-label="Siguiente">›</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
