'use client';
import { useEffect, useState } from 'react';
import { api, usd } from '@/lib/api';

const ESTADOS = ['pendiente', 'confirmado', 'pagado', 'entregado', 'cancelado'];
const LABEL_ENVIO = { delivery: 'Delivery', origen: 'Entrega en origen', mrw: 'MRW', zoom: 'ZOOM', acordado: 'Entrega acordada' };

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState('');
  const [tienda, setTienda] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [aviso, setAviso] = useState(null); // { codigo, items: [{item, disponible, solicitado}] }

  async function cargar() {
    try { setPedidos((await api('/api/pedidos')).pedidos); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); }, []);
  useEffect(() => { api('/api/tienda').then((d) => setTienda(d.tienda)).catch(() => {}); }, []);

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
    L.push('');
    L.push(`*Total: ${usd(p.total)}*`);
    if (p.metodo_envio) L.push(`Método de envío: ${LABEL_ENVIO[p.metodo_envio] || p.metodo_envio}`);
    L.push(`Estado actual: ${p.estado}`);
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

      <div className="grid" style={{ gridTemplateColumns: sel ? '1fr 340px' : '1fr', marginTop: 12 }}>
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Código</th><th>Cliente</th><th>Estado</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
            <tbody>
              {pedidos.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 24 }}>Aún no hay pedidos.</td></tr>}
              {pedidos.map((p) => (
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

        {sel && (
          <div className="card">
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
                <tr><td style={{ fontWeight: 700 }}>Total</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{usd(sel.total)}</td></tr>
              </tbody>
            </table>
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
    </>
  );
}
