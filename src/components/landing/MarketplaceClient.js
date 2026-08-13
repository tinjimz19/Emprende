'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, usd, precioBs } from '@/lib/api';
import BotonFavorito from '@/components/BotonFavorito';
import Verificado from '@/components/Verificado';
import BotonTiendasCerca from '@/components/BotonTiendasCerca';

const LIMIT = 12;

// Lista de páginas con elipsis (ej: 1 … 4 5 6 … 20).
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

const IconTienda = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
    <path d="M3 9l1-5h16l1 5"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>
  </svg>
);
const IconCart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
);

export default function MarketplaceClient({ inicial, categoriaInicial = '' }) {
  const [productos, setProductos] = useState(inicial?.productos || []);
  const [total, setTotal] = useState(inicial?.total ?? (inicial?.productos || []).length);
  const [categorias] = useState(inicial?.categorias || []);
  const [cat, setCat] = useState(categoriaInicial || '');
  const [orden, setOrden] = useState('recomendados');
  const [minIn, setMinIn] = useState('');
  const [maxIn, setMaxIn] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState(false);
  const topRef = useRef(null);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));

  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String((pagina - 1) * LIMIT) });
    if (cat) params.set('categoria', cat);
    if (q) params.set('q', q);
    if (orden && orden !== 'recomendados') params.set('orden', orden);
    if (precioMin !== '') params.set('precio_min', precioMin);
    if (precioMax !== '') params.set('precio_max', precioMax);
    setCargando(true);
    const t = setTimeout(() => {
      api(`/api/vitrina?${params}`, { auth: false })
        .then((d) => { setProductos(d.productos || []); if (typeof d.total === 'number') setTotal(d.total); })
        .catch(() => {})
        .finally(() => setCargando(false));
    }, 150);
    return () => clearTimeout(t);
  }, [cat, q, orden, precioMin, precioMax, pagina]);

  function elegirCat(c) { setCat(c); setPagina(1); }
  function buscar(v) { setQ(v); setPagina(1); }
  function aplicarPrecio() { setPrecioMin(minIn.trim()); setPrecioMax(maxIn.trim()); setPagina(1); }

  function irA(n) {
    const destino = Math.min(Math.max(1, n), totalPaginas);
    if (destino === pagina) return;
    setPagina(destino);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const cats = ['', ...categorias];

  return (
    <div className="mkt2" ref={topRef}>
      <button type="button" className="filtros-toggle btn btn-soft btn-sm" onClick={() => setFiltros((v) => !v)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        {filtros ? 'Ocultar filtros' : 'Filtros'}
      </button>
      {/* Sidebar de filtros */}
      <aside className={`mkt2-side ${filtros ? 'abierto' : ''}`}>
        <div className="card mkt2-filtros">
          <div className="mkt2-sec">
            <div className="input-busca">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input className="input" placeholder="Filtrar productos…" value={q} onChange={(e) => buscar(e.target.value)} />
            </div>
          </div>

          <div className="mkt2-sec">
            <div className="mkt2-title">Categorías</div>
            <div className="mkt-cats">
              {cats.map((c) => (
                <button key={c || 'todo'} className={`mkt-cat ${cat === c ? 'active' : ''}`} onClick={() => elegirCat(c)}>
                  {c === '' ? 'Todo' : c}
                </button>
              ))}
            </div>
          </div>

          <div className="mkt2-sec">
            <div className="mkt2-title">Precio</div>
            <div className="mkt2-precio">
              <input className="input" inputMode="numeric" placeholder="Mín" value={minIn} onChange={(e) => setMinIn(e.target.value.replace(/[^0-9.]/g, ''))} />
              <span className="muted">-</span>
              <input className="input" inputMode="numeric" placeholder="Máx" value={maxIn} onChange={(e) => setMaxIn(e.target.value.replace(/[^0-9.]/g, ''))} />
            </div>
            <button className="btn btn-soft btn-sm btn-block" style={{ marginTop: 10 }} onClick={aplicarPrecio}>Aplicar</button>
          </div>

          <div className="mkt2-sec">
            <div className="mkt2-title">Tiendas</div>
            <BotonTiendasCerca className="btn btn-soft btn-sm btn-block" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="mkt2-main">
        <div className="card tienda-toolbar">
          <span className="muted tiny">Mostrando <b style={{ color: 'var(--text)' }}>{total}</b> producto{total !== 1 ? 's' : ''}</span>
          <div className="tt-orden">
            <span className="muted tiny" style={{ whiteSpace: 'nowrap' }}>Ordenar por:</span>
            <select className="input" value={orden} onChange={(e) => { setOrden(e.target.value); setPagina(1); }}>
              <option value="recomendados">Recomendados</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
              <option value="nuevos">Más recientes</option>
            </select>
          </div>
        </div>

        {productos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 44, opacity: cargando ? 0.5 : 1 }}>
            <p className="muted" style={{ margin: 0 }}>{cargando ? 'Buscando…' : 'No hay productos que coincidan.'}</p>
          </div>
        ) : (
          <>
            <div className="tienda-grid" style={{ opacity: cargando ? 0.6 : 1, transition: 'opacity .2s' }}>
              {productos.map((p) => {
                const enOferta = p.precio_oferta != null && Number(p.precio) > Number(p.precio_oferta);
                const precio = p.precio_oferta != null ? p.precio_oferta : p.precio;
                const prodHref = `/t/${p.tienda_slug}/${p.slug}`;
                return (
                  <div className="card prod-card" key={`${p.tienda_slug}-${p.id}`}>
                    <Link href={prodHref}>
                      <span className="thumb" style={{ backgroundImage: p.imagen ? `url(${p.imagen})` : 'none' }}>
                        {enOferta && <span className="mkt2-oferta">OFERTA</span>}
                        <BotonFavorito id={p.id} flotante />
                      </span>
                    </Link>
                    <div className="body">
                      <Link className="mkt2-tienda" href={`/t/${p.tienda_slug}`}>
                        <IconTienda />
                        <span>{p.tienda_nombre}</span>
                        {Number(p.tienda_verificada) ? <Verificado size={13} /> : null}
                      </Link>
                      <Link href={prodHref}><p className="name">{p.nombre}</p></Link>
                      <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                        <span className="price">{usd(precio)}</span>
                        {enOferta && <span className="price-old">{usd(p.precio)}</span>}
                      </div>
                      {precioBs(precio, p.tasa_bs) && <div className="price-bs">{precioBs(precio, p.tasa_bs)}</div>}
                      <Link className="btn btn-primary btn-sm btn-block" style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }} href={prodHref}>
                        <IconCart /> Agregar
                      </Link>
                    </div>
                  </div>
                );
              })}
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
