'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, usd } from '@/lib/api';

const ESTADOS = ['pendiente', 'confirmado', 'pagado', 'entregado', 'cancelado'];
const LABEL_ENVIO = { delivery: 'Delivery', origen: 'Entrega en origen', mrw: 'MRW', zoom: 'ZOOM', acordado: 'Entrega acordada' };
const MSG_ESTADO = {
  pendiente: 'Recibimos tu pedido y lo estamos procesando. 🙌',
  confirmado: '¡Tu pedido fue confirmado! ✅ Ya lo estamos preparando.',
  pagado: '¡Confirmamos tu pago! 🙏 Gracias. Estamos preparando tu pedido.',
  entregado: '¡Tu pedido fue entregado! 🎉 ¡Gracias por tu compra!',
  cancelado: 'Tu pedido fue cancelado. Si tienes alguna duda, escríbenos.',
};

// Chips de filtro (el primero muestra todos).
const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'confirmado', label: 'Confirmados' },
  { key: 'pagado', label: 'Pagados' },
  { key: 'entregado', label: 'Entregados' },
  { key: 'cancelado', label: 'Cancelados' },
];

const POR_PAGINA = 10;

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState('');
  const [tienda, setTienda] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [aviso, setAviso] = useState(null); // { codigo, items: [{item, disponible, solicitado}] }

  // Filtro / búsqueda / paginación
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  async function cargar() {
    try { setPedidos((await api('/api/pedidos')).pedidos); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); }, []);
  useEffect(() => { api('/api/tienda').then((d) => setTienda(d.tienda)).catch(() => {}); }, []);

  // Al cambiar filtro o búsqueda, vuelve a la primera página.
  useEffect(() => { setPagina(1); }, [filtro, busqueda]);

  // Conteos por estado.
  const conteo = useMemo(() => {
    const c = { todos: pedidos.length, pendiente: 0, confirmado: 0, pagado: 0, entregado: 0, cancelado: 0 };
    for (const p of pedidos) { if (c[p.estado] !== undefined) c[p.estado]++; }
    return c;
  }, [pedidos]);

  // Lista filtrada por estado + búsqueda (código o cliente).
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos
      .filter((p) => filtro === 'todos' || p.estado === filtro)
      .filter((p) => q === '' ||
        String(p.codigo || '').toLowerCase().includes(q) ||
        String(p.cliente_nombre || '').toLowerCase().includes(q));
  }, [pedidos, filtro, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  // Arma un mensaje de WhatsApp detallado con el resumen del pedido.
  function mensajePedido(p) {
    const L = [];
    L.push(p.cliente_nombre ? `¡Hola ${p.cliente_nombre}! 👋` : '¡Hola! 👋');
    L.push(tienda?.nombre
      ? `Te escribo de *${tienda.nombre}* sobre tu pedido *${p.codigo}*.`
      : `Te escribo sobre tu pedido *${p.codigo}*.`);
    L.push('');
    L.push('*Resumen de tu pedido:*');
    (p.items || []).forEach((i) => L.push(`• ${i.nombre} × ${i.cantidad} — ${usd(i.subtotal)}`));
    if (Number(p.costo_envio) > 0) L.push(`• Envío — ${usd(p.costo_envio)}`);
    if (Number(p.descuento) > 0) L.push(`• Descuento${p.cupon_codigo ? ` (${p.cupon_codigo})` : ''} — −${usd(p.descuento)}`);
    L.push('');
    L.push(`*Total: ${usd(p.total)}*`);
    if (p.metodo_envio) L.push(`Método de envío: ${LABEL_ENVIO[p.metodo_envio] || p.metodo_envio}`);
    if (MSG_ESTADO[p.estado]) L.push(MSG_ESTADO[p.estado]);
    L.push('');
    L.push('¿Coordinamos los detalles? 🙌');
    return L.join('\n');
  }

  async function ver(id) {
    try { setSel((await api(`/api/pedidos/${id}`)).pedido); }
    catch (e) { setError(e.message); }
  }

  async function cambiar(id, estado) {
    setError('');
    try {
      const res = await api(`/api/pedidos/${id}/estado`, { method: 'PATCH', body: { estado } });
      const advertencias = res?.advertencias || [];
      if (advertencias.length) {
        setAviso({ codigo: res?.pedido?.codigo || '', items: advertencias });
      } else {
        setAviso(null);
      }
      await cargar();
      if (sel?.id === id) await ver(id);
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Pedidos</h1>
      {error && <div className="error">{error}</div>}

      {aviso && (
        <div className="warn-box" style={{ marginBottom: 12 }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div>
              <strong>Stock insuficiente en {aviso.codigo}</strong>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Se descontó igual y el inventario quedó en negativo en:
              </div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 13 }}>
                {aviso.items.map((a, i) => (
                  <li key={i}>{a.item} — había {a.disponible}, pediste {a.solicitado}</li>
                ))}
              </ul>
            </div>
            <div className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={() => setAviso(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Filtros por estado + búsqueda */}
      <div className="ped-toolbar">
        <div className="ped-chips">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`chip ${filtro === f.key ? 'chip-on' : ''}`}
              onClick={() => setFiltro(f.key)}
            >
              {f.label} <span className="chip-n">{conteo[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="ped-search">
          <input
            className="input"
            type="search"
            placeholder="Buscar por código o cliente…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Código</th><th>Cliente</th><th>Estado</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {pedidos.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 24 }}>Aún no hay pedidos.</td></tr>}
              {pedidos.length > 0 && visibles.length === 0 && (
                <tr><td colSpan={4} className="muted" style={{ padding: 24 }}>No hay pedidos que coincidan con este filtro o búsqueda.</td></tr>
              )}
              {visibles.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => ver(p.id)}>
                  <td style={{ fontWeight: 600 }}>{p.codigo}</td>
                  <td>{p.cliente_nombre || '—'}<div className="muted" style={{ fontSize: 12 }}>{p.origen}</div></td>
                  <td><span className="badge">{p.estado}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{usd(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filtrados.length > POR_PAGINA && (
          <div className="ped-pag">
            <span className="muted" style={{ fontSize: 13 }}>
              {(paginaSegura - 1) * POR_PAGINA + 1}–{Math.min(paginaSegura * POR_PAGINA, filtrados.length)} de {filtrados.length}
            </span>
            <div className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={() => setPagina((n) => Math.max(1, n - 1))} disabled={paginaSegura <= 1}>← Anterior</button>
            <span className="muted" style={{ fontSize: 13, padding: '0 6px' }}>Página {paginaSegura} de {totalPaginas}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))} disabled={paginaSegura >= totalPaginas}>Siguiente →</button>
          </div>
        )}

        {sel && (
          <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="row">
              <h3 style={{ margin: 0 }}>{sel.codigo}</h3>
              <div className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>✕</button>
            </div>
            <p className="muted" style={{ margin: '6px 0 12px' }}>
              {sel.cliente_nombre || 'Sin nombre'} · {sel.cliente_telefono || 'sin teléfono'}
            </p>
            <table className="table">
              <tbody>
                {sel.items?.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                        {i.imagen ? (
                          <img
                            src={i.imagen}
                            alt={i.nombre}
                            onClick={() => setLightbox(i.imagen)}
                            style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', cursor: 'zoom-in', flex: 'none', border: '1px solid var(--border-soft)' }}
                          />
                        ) : (
                          <span style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--surface-2)', flex: 'none', display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--text-3)' }}>s/img</span>
                        )}
                        <span>{i.nombre} × {i.cantidad}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{usd(i.subtotal)}</td>
                  </tr>
                ))}
                {(sel.metodo_envio || Number(sel.costo_envio) > 0) && (
                  <>
                    <tr><td className="muted">Subtotal productos</td><td style={{ textAlign: 'right' }} className="muted">{usd(Number(sel.total) - Number(sel.costo_envio || 0))}</td></tr>
                    <tr><td className="muted">Envío · {LABEL_ENVIO[sel.metodo_envio] || sel.metodo_envio || 'Envío'}</td><td style={{ textAlign: 'right' }} className="muted">{Number(sel.costo_envio) > 0 ? usd(sel.costo_envio) : 'Gratis'}</td></tr>
                  </>
                )}
                {Number(sel.descuento) > 0 && (
                  <tr><td className="muted">Descuento{sel.cupon_codigo ? ` (${sel.cupon_codigo})` : ''}</td><td style={{ textAlign: 'right', color: '#1a7f43', fontWeight: 600 }}>−{usd(sel.descuento)}</td></tr>
                )}
                <tr><td style={{ fontWeight: 700 }}>Total</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{usd(sel.total)}</td></tr>
              </tbody>
            </table>
            {(sel.metodo_envio || sel.direccion) && (
              <div className="field" style={{ marginTop: 14 }}>
                <label>Entrega</label>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{LABEL_ENVIO[sel.metodo_envio] || sel.metodo_envio || '—'}</div>
                {sel.direccion && <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>{sel.direccion}</div>}
              </div>
            )}
            <div className="field" style={{ marginTop: 14 }}>
              <label>Estado del pedido</label>
              <select className="input" value={sel.estado} onChange={(e) => cambiar(sel.id, e.target.value)}>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            {sel.comprobante_url && (
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Comprobante de pago</label>
                <img
                  src={sel.comprobante_url}
                  alt="Comprobante de pago"
                  onClick={() => setLightbox(sel.comprobante_url)}
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in', border: '1px solid var(--border-soft)' }}
                />
              </div>
            )}
            {sel.cliente_telefono && (
              <a className="btn btn-wa btn-block" target="_blank" rel="noreferrer"
                href={`https://wa.me/${sel.cliente_telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensajePedido(sel))}`}>
                Escribir por WhatsApp
              </a>
            )}
          </div>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, cursor: 'zoom-out' }}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.5)' }} />
        </div>
      )}

      <style jsx>{`
        .ped-toolbar {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .ped-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .ped-search { margin-left: auto; min-width: 220px; flex: 1; max-width: 320px; }
        .ped-search .input { width: 100%; }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 13px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-2);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background .12s, border-color .12s, color .12s;
        }
        .chip:hover { border-color: var(--brand); color: var(--text); }
        .chip-n {
          font-size: 12px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 999px;
          background: var(--surface-2);
          color: var(--text-2);
        }
        .chip-on { background: var(--brand); border-color: var(--brand); color: #fff; }
        .chip-on .chip-n { background: rgba(255,255,255,.25); color: #fff; }
        .ped-pag {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .ped-search { margin-left: 0; max-width: none; }
        }
      `}</style>
    </>
  );
}
