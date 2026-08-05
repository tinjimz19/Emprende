'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, usd } from '@/lib/api';

// Fecha local (no UTC) en formato YYYY-MM-DD.
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDia(iso) {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const METODOS = {
  pago_movil: 'Pago móvil', transferencia: 'Transferencia', zelle: 'Zelle',
  usdt: 'USDT', efectivo: 'Efectivo', otro: 'Otro',
};
const nombreMetodo = (m) => METODOS[m] || m;

export default function Reportes() {
  const hoy = useMemo(() => new Date(), []);
  const [desde, setDesde] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return ymd(d); });
  const [hasta, setHasta] = useState(() => ymd(new Date()));
  const [preset, setPreset] = useState('30');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  function aplicarPreset(p) {
    setPreset(p);
    const fin = new Date();
    let ini = new Date();
    if (p === 'hoy') ini = new Date();
    else if (p === '7') ini.setDate(fin.getDate() - 6);
    else if (p === '30') ini.setDate(fin.getDate() - 29);
    else if (p === 'mes') ini = new Date(fin.getFullYear(), fin.getMonth(), 1);
    setDesde(ymd(ini));
    setHasta(ymd(fin));
  }

  useEffect(() => {
    setCargando(true);
    api(`/api/reportes/resumen?desde=${desde}&hasta=${hasta}`)
      .then((d) => { setData(d); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [desde, hasta]);

  const maxDia = useMemo(() => Math.max(1, ...(data?.por_dia || []).map((d) => d.total)), [data]);
  const maxTop = useMemo(() => Math.max(1, ...(data?.top_productos || []).map((t) => t.cantidad)), [data]);
  const totalMetodos = useMemo(() => (data?.por_metodo || []).reduce((s, m) => s + m.total, 0), [data]);

  const k = data?.kpis;

  return (
    <>
      <div className="row" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ margin: 0 }}>Reportes</h1>
        <div className="spacer" />
        <div className="row" style={{ gap: 6 }}>
          {[['hoy', 'Hoy'], ['7', '7 días'], ['30', '30 días'], ['mes', 'Este mes']].map(([p, txt]) => (
            <button key={p} className={`chip ${preset === p ? 'active' : ''}`} onClick={() => aplicarPreset(p)}>{txt}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 6, alignItems: 'center' }}>
          <input className="input input-sm" type="date" value={desde} max={hasta} onChange={(e) => { setPreset(''); setDesde(e.target.value); }} style={{ width: 150 }} />
          <span className="muted">–</span>
          <input className="input input-sm" type="date" value={hasta} min={desde} max={ymd(hoy)} onChange={(e) => { setPreset(''); setHasta(e.target.value); }} style={{ width: 150 }} />
        </div>
      </div>

      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      {/* KPIs */}
      <div className="grid grid-stats" style={{ marginTop: 20 }}>
        <div className="card stat"><div className="label">Ventas</div><div className="n" style={{ color: 'var(--brand)' }}>{usd(k?.ventas_total || 0)}</div></div>
        <div className="card stat"><div className="label">Pedidos vendidos</div><div className="n">{k?.num_ventas ?? 0}</div></div>
        <div className="card stat"><div className="label">Ticket promedio</div><div className="n">{usd(k?.ticket_promedio || 0)}</div></div>
        <div className="card stat"><div className="label">Ingresos</div><div className="n" style={{ color: 'var(--ok)' }}>{usd(k?.ingresos || 0)}</div></div>
        <div className="card stat"><div className="label">Gastos</div><div className="n" style={{ color: 'var(--danger)' }}>{usd(k?.gastos || 0)}</div></div>
        <div className="card stat"><div className="label">Ganancia</div><div className="n" style={{ color: (k?.ganancia || 0) < 0 ? 'var(--danger)' : 'var(--ok)' }}>{usd(k?.ganancia || 0)}</div></div>
      </div>

      {/* Ventas por día */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ alignItems: 'baseline' }}>
          <h3 style={{ margin: 0 }}>Ventas por día</h3>
          <div className="spacer" />
          <span className="muted tiny">{fmtDia(desde)} – {fmtDia(hasta)}</span>
        </div>
        {cargando ? (
          <p className="muted" style={{ marginTop: 16 }}>Cargando…</p>
        ) : (data?.por_dia?.length ? (
          <>
            <div className="rep-chart" style={{ marginTop: 16 }}>
              {data.por_dia.map((d) => (
                <div key={d.fecha} className="rep-bar-wrap" title={`${fmtDia(d.fecha)} · ${usd(d.total)} · ${d.pedidos} pedido(s)`}>
                  <div className="rep-bar" style={{ height: `${(d.total / maxDia) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
              <span className="muted tiny">{fmtDia(desde)}</span>
              <span className="muted tiny">máx {usd(maxDia)}/día</span>
              <span className="muted tiny">{fmtDia(hasta)}</span>
            </div>
          </>
        ) : <p className="muted" style={{ marginTop: 16 }}>Sin ventas en este período.</p>)}
      </div>

      <div className="grid col-2-phone-1" style={{ gridTemplateColumns: '1.4fr 1fr', marginTop: 18, alignItems: 'start' }}>
        {/* Top productos */}
        <div className="card prod-tabla-desktop" style={{ padding: 0 }}>
          <h3 style={{ margin: 0, padding: '18px 22px 4px' }}>Productos más vendidos</h3>
          <table className="table">
            <thead><tr><th>Producto</th><th style={{ width: 130 }}>Vendidos</th><th style={{ textAlign: 'right' }}>Ingreso</th></tr></thead>
            <tbody>
              {(!data?.top_productos?.length) && <tr><td colSpan={3} className="muted" style={{ padding: 22 }}>Sin datos en este período.</td></tr>}
              {data?.top_productos?.map((t, i) => (
                <tr key={i}>
                  <td>{t.nombre}</td>
                  <td>
                    <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                      <div className="rep-minibar"><div style={{ width: `${(t.cantidad / maxTop) * 100}%` }} /></div>
                      <span style={{ fontWeight: 600, minWidth: 20 }}>{t.cantidad}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{usd(t.ingreso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="prod-movil">
          <h3 style={{ margin: '2px 0 0' }}>Productos más vendidos</h3>
          {(!data?.top_productos?.length) && <div className="card"><p className="muted" style={{ margin: 0 }}>Sin datos en este período.</p></div>}
          {data?.top_productos?.map((t, i) => (
            <div className="pm-card" key={i}>
              <div className="pm-body">
                <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                  <span className="pm-name">{t.nombre}</span>
                  <div className="spacer" />
                  <span className="price" style={{ whiteSpace: 'nowrap' }}>{usd(t.ingreso)}</span>
                </div>
                <div className="row" style={{ gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'nowrap' }}>
                  <div className="rep-minibar" style={{ flex: 1 }}><div style={{ width: `${(t.cantidad / maxTop) * 100}%` }} /></div>
                  <span className="muted tiny" style={{ whiteSpace: 'nowrap' }}>{t.cantidad} vendidos</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Métodos de pago + estados */}
        <div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Métodos de pago</h3>
            {(!data?.por_metodo?.length) && <p className="muted tiny">Sin ventas en este período.</p>}
            {data?.por_metodo?.map((m) => (
              <div key={m.metodo} style={{ marginBottom: 12 }}>
                <div className="row" style={{ fontSize: 13, marginBottom: 4 }}>
                  <span>{nombreMetodo(m.metodo)}</span>
                  <div className="spacer" />
                  <span className="muted">{usd(m.total)} · {m.pedidos}</span>
                </div>
                <div className="rep-track"><div className="rep-fill" style={{ width: `${totalMetodos ? (m.total / totalMetodos) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <h3 style={{ marginTop: 0 }}>Pedidos por estado</h3>
            {(!data?.por_estado?.length) && <p className="muted tiny">Sin pedidos en este período.</p>}
            {data?.por_estado?.map((e) => (
              <div className="row" key={e.estado} style={{ padding: '5px 0', fontSize: 14 }}>
                <span className="badge">{e.estado}</span>
                <div className="spacer" />
                <span style={{ fontWeight: 600 }}>{e.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
