'use client';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import TiendaCard from '@/components/landing/TiendaCard';

const LIMIT = 12;

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

export default function TiendasClient({ inicial, rubros = [] }) {
  const [tiendas, setTiendas] = useState(inicial?.tiendas || []);
  const [total, setTotal] = useState(inicial?.total ?? (inicial?.tiendas || []).length);
  const [q, setQ] = useState('');
  const [rubro, setRubro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const topRef = useRef(null);
  const [filtrosAbierto, setFiltrosAbierto] = useState(false);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));

  // Se re-pide al cambiar búsqueda, rubro o página (el primer render usa lo del servidor).
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String((pagina - 1) * LIMIT) });
    if (q) params.set('q', q);
    if (rubro) params.set('rubro', rubro);
    setCargando(true);
    const t = setTimeout(() => {
      api(`/api/tiendas?${params}`, { auth: false })
        .then((d) => { setTiendas(d.tiendas || []); if (typeof d.total === 'number') setTotal(d.total); })
        .catch(() => {})
        .finally(() => setCargando(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, rubro, pagina]);

  function buscar(v) { setQ(v); setPagina(1); }
  function elegirRubro(slug) { setRubro(slug); setPagina(1); }

  function irA(n) {
    const destino = Math.min(Math.max(1, n), totalPaginas);
    if (destino === pagina) return;
    setPagina(destino);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <div className="mkt-filtros-toggle">
        <button className="btn btn-soft btn-sm" onClick={() => setFiltrosAbierto((v) => !v)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          {filtrosAbierto ? 'Ocultar filtros' : 'Filtros y rubros'}
        </button>
      </div>
      <div className="mkt-layout" ref={topRef}>
      {/* Barra lateral: buscador + rubros */}
      <aside className={`mkt-side ${filtrosAbierto ? 'abierto' : ''}`}>
        <input className="input" placeholder="Buscar tienda…" value={q} onChange={(e) => buscar(e.target.value)} />
        <div>
          <div className="mkt-side-title">Rubros</div>
          <div className="mkt-cats">
            <button className={`mkt-cat ${rubro === '' ? 'active' : ''}`} onClick={() => elegirRubro('')}>Todos</button>
            {rubros.map((r) => (
              <button key={r.slug} className={`mkt-cat ${rubro === r.slug ? 'active' : ''}`} onClick={() => elegirRubro(r.slug)}>{r.nombre}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* Grilla de tiendas */}
      <div className="mkt-main">
        {tiendas.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 44, opacity: cargando ? 0.5 : 1 }}>
            <p className="muted" style={{ margin: 0 }}>{cargando ? 'Buscando…' : 'No hay tiendas que coincidan.'}</p>
          </div>
        ) : (
          <>
            <div className="row" style={{ marginBottom: 14 }}>
              <span className="muted tiny">{total} tienda{total !== 1 ? 's' : ''}{totalPaginas > 1 ? ` · página ${pagina} de ${totalPaginas}` : ''}</span>
            </div>

            <div className="grid grid-cards" style={{ opacity: cargando ? 0.6 : 1, transition: 'opacity .2s' }}>
              {tiendas.map((t) => <TiendaCard key={t.slug} t={t} />)}
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
    </>
  );
}
