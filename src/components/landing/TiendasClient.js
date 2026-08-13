'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Verificado from '@/components/Verificado';

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

export default function TiendasClient({ inicial, rubros = [] }) {
  const [tiendas, setTiendas] = useState(inicial?.tiendas || []);
  const [total, setTotal] = useState(inicial?.total ?? (inicial?.tiendas || []).length);
  const [q, setQ] = useState('');
  const [rubro, setRubro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [filtros, setFiltros] = useState(false);
  const topRef = useRef(null);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMIT));

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
    <div className="mkt2" ref={topRef}>
      <button type="button" className="filtros-toggle btn btn-soft btn-sm" onClick={() => setFiltros((v) => !v)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        {filtros ? 'Ocultar filtros' : 'Filtros y rubros'}
      </button>
      {/* Sidebar */}
      <aside className={`mkt2-side ${filtros ? 'abierto' : ''}`}>
        <div className="card mkt2-filtros">
          <div className="mkt2-sec">
            <div className="input-busca">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
              <input className="input" placeholder="Buscar tienda…" value={q} onChange={(e) => buscar(e.target.value)} />
            </div>
          </div>

          <div className="mkt2-sec">
            <div className="mkt2-title">Rubros</div>
            <div className="mkt-cats">
              <button className={`mkt-cat ${rubro === '' ? 'active' : ''}`} onClick={() => elegirRubro('')}>Todos</button>
              {rubros.map((r) => (
                <button key={r.slug} className={`mkt-cat ${rubro === r.slug ? 'active' : ''}`} onClick={() => elegirRubro(r.slug)}>{r.nombre}</button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="mkt2-main">
        <div className="card tienda-toolbar">
          <span className="muted tiny"><b style={{ color: 'var(--text)' }}>{total}</b> tienda{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</span>
          {totalPaginas > 1 && <span className="muted tiny">Página {pagina} de {totalPaginas}</span>}
        </div>

        {tiendas.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 44, opacity: cargando ? 0.5 : 1 }}>
            <p className="muted" style={{ margin: 0 }}>{cargando ? 'Buscando…' : 'No hay tiendas que coincidan.'}</p>
          </div>
        ) : (
          <>
            <div className="dir-grid" style={{ opacity: cargando ? 0.6 : 1, transition: 'opacity .2s' }}>
              {tiendas.map((t) => {
                const inicial = (t.nombre || '?').trim().charAt(0).toUpperCase();
                const n = Number(t.productos) || 0;
                return (
                  <div className="card dir-card" key={t.slug}>
                    {Number(t.destacada) ? <span className="dir-destacado">DESTACADO</span> : null}
                    <span className="dir-logo" style={t.logo_url ? { backgroundImage: `url(${t.logo_url})` } : undefined}>
                      {!t.logo_url && inicial}
                    </span>
                    <div className="dir-nombre">{t.nombre}{Number(t.verificada) ? <Verificado size={15} /> : null}</div>
                    {t.rubros ? <div className="dir-rubros">{t.rubros}</div> : null}
                    <div className="muted tiny">{n} producto{n !== 1 ? 's' : ''}</div>
                    <Link className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 12 }} href={`/t/${t.slug}`}>Ver tienda</Link>
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
