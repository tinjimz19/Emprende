'use client';
import { useState } from 'react';
import { usd, precioBs, API_BASE, getClienteToken, METODOS_ENVIO } from '@/lib/api';
import { clearCart, updateQty, removeItem } from '@/lib/cart';

const LABEL_PAGO = { pago_movil: 'Pago móvil', transferencia: 'Transferencia', zelle: 'Zelle', usdt: 'USDT (Binance)', efectivo: 'Efectivo' };

// Extrae la lista de métodos de pago [{ tipo, datos }] desde tienda.datos_pago (JSON).
// Admite el formato nuevo { metodos: [...] } y formatos viejos por compatibilidad.
function metodosDe(raw) {
  if (!raw) return [];
  let o;
  try { o = JSON.parse(raw); } catch { return []; }
  if (Array.isArray(o?.metodos)) return o.metodos.filter((m) => m && m.tipo);
  if (Array.isArray(o)) return o.filter((m) => m && m.tipo);
  if (o && typeof o === 'object') {
    return Object.entries(o).filter(([, v]) => v && String(v).trim()).map(([k, v]) => ({ tipo: k, datos: String(v) }));
  }
  return [];
}

/**
 * Panel deslizante del carrito / checkout de una tienda.
 * Reutilizable: se usa tanto en el catálogo de la tienda como en el detalle del producto.
 */
export default function CarritoDrawer({ slug, tienda, cart, total, tasa, cuenta, onClose }) {
  // Solo se ofrecen los tipos de pago que la tienda tiene registrados.
  const metodosPagoTienda = metodosDe(tienda?.datos_pago);
  const tiposDisponibles = [...new Set(metodosPagoTienda.map((m) => m.tipo))];
  const opcionesPago = tiposDisponibles.length ? tiposDisponibles : ['pago_movil', 'transferencia', 'zelle', 'usdt', 'efectivo'];

  const [datos, setDatos] = useState({
    cliente_nombre: cuenta?.nombre || '', cliente_telefono: cuenta?.telefono || '', metodo_pago: opcionesPago[0], nota: '',
  });
  const [comprobante, setComprobante] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState('');

  const pagosSel = metodosPagoTienda.filter((m) => m.tipo === datos?.metodo_pago);

  // Envío: la tienda ofrece ciertos métodos; el costo solo aplica a "delivery".
  const metodosDisponibles = tienda?.metodos_envio || [];
  const [metodoEnvio, setMetodoEnvio] = useState(metodosDisponibles[0] || '');
  const costoEnvio = metodoEnvio === 'delivery' ? Number(tienda?.costo_delivery || 0) : 0;
  const totalFinal = Number(total) + costoEnvio;

  async function confirmar() {
    if (cart.length === 0) return;
    // El comprobante es obligatorio para invitados (sin cuenta), opcional si está registrado.
    if (!cuenta && !comprobante) {
      setError('Adjunta el comprobante de pago para completar tu pedido.');
      return;
    }
    setEnviando(true); setError('');
    try {
      const fd = new FormData();
      fd.append('cliente_nombre', datos.cliente_nombre || '');
      fd.append('cliente_telefono', datos.cliente_telefono || '');
      fd.append('metodo_pago', datos.metodo_pago);
      fd.append('metodo_envio', metodoEnvio || '');
      fd.append('nota', datos.nota || '');
      fd.append('items', JSON.stringify(cart.map((i) => ({ producto_id: i.producto_id, variante_id: i.variante_id, cantidad: i.cantidad }))));
      if (comprobante) fd.append('comprobante', comprobante);

      // Token de comprador (si hay sesión) para anclar el pedido a la cuenta.
      const token = getClienteToken();
      const res = await fetch(`${API_BASE}/api/publico/${slug}/pedido`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      let json;
      try { json = await res.json(); } catch { json = { ok: false, error: `Error ${res.status}` }; }
      if (!res.ok || json.ok === false) throw new Error(json.error || `Error ${res.status}`);
      setPedido(json.data.pedido);
      clearCart(slug);
    } catch (e) { setError(e.message); }
    finally { setEnviando(false); }
  }

  function waLink() {
    if (!tienda.whatsapp) return null;
    const lineas = (pedido?.items || cart).map((i) => `• ${i.nombre} x${i.cantidad}`).join('\n');
    let envioTxt = metodoEnvio ? `\nEnvío: ${METODOS_ENVIO[metodoEnvio] || metodoEnvio}` : '';
    if (metodoEnvio === 'origen' && tienda?.direccion) envioTxt += ` (Retiro en: ${tienda.direccion})`;
    const msg = `Hola *${tienda.nombre}*! Quiero confirmar mi pedido ${pedido ? pedido.codigo : ''}:\n${lineas}${envioTxt}\nTotal: ${usd(pedido ? pedido.total : totalFinal)}`;
    return `https://wa.me/${tienda.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="row"><h3 style={{ margin: 0 }}>Tu pedido</h3><div className="spacer" /><button className="btn btn-soft btn-icon" onClick={onClose}>✕</button></div>

        {pedido ? (
          <div style={{ marginTop: 18 }}>
            <div className="alert ok-box">¡Pedido <b>{pedido.codigo}</b> recibido! Confírmalo por WhatsApp con la tienda.</div>
            {waLink() && <a className="btn btn-wa btn-block" style={{ marginTop: 14 }} href={waLink()} target="_blank" rel="noreferrer">Enviar por WhatsApp</a>}
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={onClose}>Seguir viendo</button>
          </div>
        ) : cart.length === 0 ? (
          <p className="muted" style={{ marginTop: 24 }}>Tu carrito está vacío.</p>
        ) : (
          <>
            <div style={{ marginTop: 14 }}>
              {cart.map((i, idx) => (
                <div className="row" key={idx} style={{ borderBottom: '1px solid var(--border-soft)', padding: '12px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{i.nombre}</div>
                    <div className="price" style={{ fontSize: 14 }}>{usd(i.precio)}</div>
                  </div>
                  <input className="input" type="number" min={1} value={i.cantidad} style={{ width: 66 }} onChange={(e) => updateQty(slug, idx, Number(e.target.value))} />
                  <button className="btn btn-soft btn-icon" onClick={() => removeItem(slug, idx)}>✕</button>
                </div>
              ))}
            </div>
            <div className="row" style={{ margin: '16px 0 2px' }}>
              <span className="muted">Subtotal</span><div className="spacer" /><span>{usd(total)}</span>
            </div>
            {costoEnvio > 0 && (
              <div className="row" style={{ margin: '2px 0' }}>
                <span className="muted">Envío (Delivery)</span><div className="spacer" /><span>{usd(costoEnvio)}</span>
              </div>
            )}
            <div className="row" style={{ margin: '6px 0 2px' }}>
              <b style={{ fontSize: 17 }}>Total</b><div className="spacer" /><b className="price" style={{ fontSize: 19 }}>{usd(totalFinal)}</b>
            </div>
            {precioBs(totalFinal, tasa) && <div className="price-bs" style={{ textAlign: 'right' }}>{precioBs(totalFinal, tasa)}</div>}

            {error && <div className="alert error" style={{ margin: '12px 0' }}>{error}</div>}
            <hr className="divider" />
            {cuenta
              ? <p className="muted tiny" style={{ marginTop: 0 }}>Comprando como <b>{cuenta.nombre}</b> · este pedido se guardará en tu cuenta.</p>
              : <p className="muted tiny" style={{ marginTop: 0 }}><a href="/cliente/entrar" style={{ color: 'var(--brand)', fontWeight: 600 }}>Inicia sesión</a> para guardar tu pedido en tu cuenta (opcional).</p>}
            <div className="field"><label>Tu nombre</label>
              <input className="input" value={datos.cliente_nombre} onChange={(e) => setDatos({ ...datos, cliente_nombre: e.target.value })} /></div>
            <div className="field"><label>Tu WhatsApp / teléfono</label>
              <input className="input" value={datos.cliente_telefono} onChange={(e) => setDatos({ ...datos, cliente_telefono: e.target.value })} /></div>
            <div className="field"><label>Método de pago</label>
              <select className="input" value={datos.metodo_pago} onChange={(e) => setDatos({ ...datos, metodo_pago: e.target.value })}>
                {opcionesPago.map((k) => <option key={k} value={k}>{LABEL_PAGO[k] || k}</option>)}
              </select></div>
            {pagosSel.length > 0 ? (
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 14px', margin: '4px 0 12px' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Datos para pagar por {LABEL_PAGO[datos.metodo_pago] || 'este método'}</div>
                {pagosSel.map((m, i) => (
                  <div
                    key={i}
                    className="muted"
                    style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', marginTop: i > 0 ? 6 : 4, paddingTop: i > 0 ? 6 : 0, borderTop: i > 0 ? '1px solid var(--border-soft)' : 'none' }}
                  >
                    {m.datos}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted tiny" style={{ margin: '4px 0 12px' }}>
                La tienda coordinará contigo los datos para pagar por {LABEL_PAGO[datos.metodo_pago] || 'este método'} vía WhatsApp.
              </p>
            )}
            {metodosDisponibles.length > 0 && (
              <div className="field"><label>Método de envío</label>
                <select className="input" value={metodoEnvio} onChange={(e) => setMetodoEnvio(e.target.value)}>
                  {metodosDisponibles.map((m) => <option key={m} value={m}>{METODOS_ENVIO[m] || m}</option>)}
                </select>
                {metodoEnvio === 'delivery' && (
                  <p className="muted tiny" style={{ margin: '6px 0 0' }}>
                    {costoEnvio > 0 ? `Costo de delivery: ${usd(costoEnvio)} (se suma al total)` : 'Delivery sin costo adicional.'}
                  </p>
                )}
                {metodoEnvio === 'origen' && (
                  <p className="muted tiny" style={{ margin: '6px 0 0' }}>
                    {tienda?.direccion ? <>Retiras en: <b>{tienda.direccion}</b></> : 'La tienda te indicará la dirección de retiro.'}
                  </p>
                )}
              </div>
            )}
            <div className="field">
              <label>Comprobante de pago {cuenta ? <span className="muted tiny">(opcional)</span> : <span className="muted tiny">(obligatorio)</span>}</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setComprobante(e.target.files?.[0] || null)} />
              {comprobante
                ? <p className="muted tiny" style={{ margin: '6px 0 0' }}>Adjunto: {comprobante.name}</p>
                : !cuenta && <p className="muted tiny" style={{ margin: '6px 0 0' }}>Como invitado, adjunta la captura de tu pago para confirmar el pedido.</p>}
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={enviando} onClick={confirmar}>
              {enviando ? 'Enviando…' : 'Confirmar pedido'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
