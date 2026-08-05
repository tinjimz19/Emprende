'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, usd } from '@/lib/api';

const POR_PAGINA = 10;

function fmtFecha(f) {
  if (!f) return '—';
  const s = String(f).slice(0, 10).split('-');
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : String(f);
}

export default function TopClientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    (async () => {
      setCargando(true);
      try { setClientes((await api('/api/top-clientes')).clientes || []); }
      catch (e) { setError(e.message); }
      finally { setCargando(false); }
    })();
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(clientes.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * POR_PAGINA;
  const visibles = useMemo(() => clientes.slice(inicio, inicio + POR_PAGINA), [clientes, inicio]);

  return (
    <>
      <div className="row">
        <h1 style={{ margin: 0 }}>Top Clientes</h1>
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>
        Tus clientes ordenados por compras completadas (pedidos pagados o entregados).
      </p>
      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      <div className="card prod-tabla-desktop" style={{ marginTop: 14, padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>#</th>
              <th>Cliente</th>
              <th style={{ textAlign: 'center' }}>Compras completadas</th>
              <th style={{ textAlign: 'right' }}>Total gastado</th>
              <th>Último pedido</th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={5} className="muted" style={{ padding: 24 }}>Cargando…</td></tr>}
            {!cargando && clientes.length === 0 && (
              <tr><td colSpan={5} className="muted" style={{ padding: 24 }}>
                Aún no tienes clientes con compras completadas. Cuando marques pedidos como pagados o entregados, aparecerán aquí.
              </td></tr>
            )}
            {visibles.map((c, i) => {
              const pos = inicio + i + 1;
              const top = pos <= 3;
              return (
                <tr key={pos}>
                  <td>
                    <span className="badge" style={top
                      ? { background: '#FF453A', color: '#fff', fontWeight: 800 }
                      : { background: 'var(--surface-2)', color: 'var(--text-2)', fontWeight: 700 }}>
                      {pos}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.nombre || 'Sin nombre'}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {c.telefono || c.email || 'Sin contacto'}
                      {c.cuenta_id ? ' · cuenta registrada' : ''}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{c.completadas}</td>
                  <td className="price" style={{ textAlign: 'right' }}>{usd(c.total_gastado)}</td>
                  <td>{fmtFecha(c.ultimo)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="prod-movil" style={{ marginTop: 14 }}>
        {cargando && <div className="muted" style={{ padding: 14 }}>Cargando…</div>}
        {!cargando && clientes.length === 0 && <div className="muted" style={{ padding: 14 }}>Aún no tienes clientes con compras completadas.</div>}
        {visibles.map((c, i) => {
          const pos = inicio + i + 1;
          const top = pos <= 3;
          return (
            <div className="pm-card" key={pos}>
              <span className="badge" style={top
                ? { background: '#FF453A', color: '#fff', fontWeight: 800, flex: 'none' }
                : { background: 'var(--surface-2)', color: 'var(--text-2)', fontWeight: 700, flex: 'none' }}>{pos}</span>
              <div className="pm-body">
                <div className="pm-name">{c.nombre || 'Sin nombre'}</div>
                <div className="pm-meta">{c.telefono || c.email || 'Sin contacto'}{c.cuenta_id ? ' · cuenta' : ''}</div>
                <div className="pm-row2">
                  <span className="muted tiny">{c.completadas} compras</span>
                  <span className="price">{usd(c.total_gastado)}</span>
                  <span className="muted tiny">Últ.: {fmtFecha(c.ultimo)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {clientes.length > POR_PAGINA && (
        <div className="row" style={{ marginTop: 16, gap: 4, alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: 13 }}>
            {inicio + 1}–{Math.min(inicio + POR_PAGINA, clientes.length)} de {clientes.length}
          </span>
          <div className="spacer" />
          <button className="btn btn-ghost btn-sm" onClick={() => setPagina((n) => Math.max(1, n - 1))} disabled={paginaSegura <= 1}>← Anterior</button>
          <span className="muted" style={{ fontSize: 13, padding: '0 6px' }}>Página {paginaSegura} de {totalPaginas}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))} disabled={paginaSegura >= totalPaginas}>Siguiente →</button>
        </div>
      )}
    </>
  );
}
