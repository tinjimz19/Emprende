'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, usd, precioBs, METODOS_ENVIO } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

const PASOS = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'confirmado', label: 'Confirmado' },
  { key: 'pagado', label: 'Pagado' },
  { key: 'entregado', label: 'Entregado' },
];

function fmtFecha(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  );
}

function Timeline({ estado }) {
  if (estado === 'cancelado') {
    return (
      <div className="seg-cancel">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
        Este pedido fue cancelado. Si crees que es un error, contacta a la tienda.
      </div>
    );
  }
  const idx = PASOS.findIndex((p) => p.key === estado);
  const actual = idx < 0 ? 0 : idx;
  return (
    <div className="seg-timeline">
      {PASOS.map((p, i) => {
        const done = i < actual;
        const now = i === actual;
        return (
          <div className={`seg-step ${done ? 'done' : ''} ${now ? 'now' : ''}`} key={p.key}>
            {i > 0 && <span className="seg-bar" />}
            <span className="seg-dot">{done ? <Check /> : i + 1}</span>
            <span className="seg-lbl">{p.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Seguimiento() {
  const [codigo, setCodigo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  async function buscar(cod, tel) {
    const c = (cod ?? codigo).trim();
    const t = (tel ?? telefono).trim();
    if (!c || !t) { setError('Ingresa tu código y teléfono.'); return; }
    setCargando(true); setError(''); setPedido(null);
    try {
      const d = await api('/api/publico/seguimiento', { method: 'POST', auth: false, body: { codigo: c, telefono: t } });
      setPedido(d.pedido);
      setBuscado(true);
    } catch (e) { setError(e.message); setBuscado(true); }
    finally { setCargando(false); }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const c = p.get('codigo') || '';
    const t = p.get('tel') || '';
    if (c) setCodigo(c);
    if (t) setTelefono(t);
    if (c && t) buscar(c, t);
    // eslint-disable-next-line
  }, []);

  const waLink = pedido?.tienda_whatsapp
    ? `https://wa.me/${pedido.tienda_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola *${pedido.tienda_nombre}*! Escribo por mi pedido ${pedido.codigo}.`)}`
    : null;

  return (
    <>
      <header className="topbar">
        <div className="container inner">
          <Link href="/" className="tn-home" title="Ir al inicio"><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="tn-logo-img" /> Emprende</Link>
          <div className="spacer" />
          <ThemeToggle />
        </div>
      </header>

      <main className="container" style={{ maxWidth: 680, paddingTop: 30, paddingBottom: 70 }}>
        <h1 style={{ margin: 0 }}>Seguimiento de pedido</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
          Ingresa el código de tu pedido y el teléfono con el que compraste para ver su estado.
        </p>

        <form className="card" style={{ marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); buscar(); }}>
          <div className="seg-form">
            <div className="field" style={{ margin: 0 }}>
              <label>Código del pedido</label>
              <input className="input" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="PED-00001" />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Tu teléfono</label>
              <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="04121234567" />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 14 }} disabled={cargando}>
            {cargando ? 'Buscando…' : 'Ver mi pedido'}
          </button>
        </form>

        {error && <div className="alert error" style={{ marginTop: 16 }}>{error}</div>}
        {buscado && !error && !pedido && !cargando && (
          <div className="alert" style={{ marginTop: 16 }}>No encontramos ese pedido.</div>
        )}

        {pedido && (
          <div className="card" style={{ marginTop: 18 }}>
            <div className="row" style={{ alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Pedido {pedido.codigo}</h2>
              <div className="spacer" />
              <span className="muted tiny">{fmtFecha(pedido.created_at)}</span>
            </div>
            <p className="muted tiny" style={{ margin: '4px 0 0' }}>
              {pedido.tienda_nombre}
              {pedido.tienda_slug && <> · <Link href={`/t/${pedido.tienda_slug}`} style={{ color: 'var(--brand)' }}>ver tienda</Link></>}
            </p>

            <div style={{ marginTop: 18 }}><Timeline estado={pedido.estado} /></div>

            <h3 style={{ margin: '22px 0 8px', fontSize: 15 }}>Productos</h3>
            <div className="card" style={{ padding: 0 }}>
              <table className="table">
                <tbody>
                  {(pedido.items || []).map((it, i) => (
                    <tr key={i}>
                      <td>{it.nombre}</td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>× {it.cantidad}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{usd(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="seg-tot">
              <div className="row"><span className="muted">Subtotal</span><div className="spacer" /><span>{usd(pedido.subtotal)}</span></div>
              {Number(pedido.descuento) > 0 && (
                <div className="row"><span className="muted">Descuento{pedido.cupon_codigo ? ` (${pedido.cupon_codigo})` : ''}</span><div className="spacer" /><span style={{ color: '#1a7f43' }}>−{usd(pedido.descuento)}</span></div>
              )}
              {Number(pedido.costo_envio) > 0 && (
                <div className="row"><span className="muted">Envío{pedido.metodo_envio ? ` (${METODOS_ENVIO[pedido.metodo_envio] || pedido.metodo_envio})` : ''}</span><div className="spacer" /><span>{usd(pedido.costo_envio)}</span></div>
              )}
              <div className="row" style={{ marginTop: 4 }}><b>Total</b><div className="spacer" /><b className="price">{usd(pedido.total)}</b></div>
              {precioBs(pedido.total, pedido.tasa_bs) && <div className="row"><div className="spacer" /><span className="price-bs tiny">{precioBs(pedido.total, pedido.tasa_bs)}</span></div>}
            </div>

            {waLink && (
              <a className="btn btn-wa btn-block" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} href={waLink} target="_blank" rel="noreferrer">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.35c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.48-.01-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.25 3.74.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" /></svg>
                Escribir a {pedido.tienda_nombre} por WhatsApp
              </a>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        .seg-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 520px) { .seg-form { grid-template-columns: 1fr; } }
        .seg-tot { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
        .seg-cancel { display: flex; align-items: center; gap: 8px; background: var(--danger-soft); color: var(--danger); padding: 12px 14px; border-radius: 12px; font-size: 14px; }
        .seg-timeline { display: flex; }
        .seg-step { flex: 1; position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .seg-bar { position: absolute; top: 15px; right: 50%; width: 100%; height: 3px; background: var(--border); z-index: 0; }
        .seg-step.done .seg-bar, .seg-step.now .seg-bar { background: var(--brand); }
        .seg-dot { position: relative; z-index: 1; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); color: var(--text-3); font-weight: 700; font-size: 13px; border: 2px solid var(--border); }
        .seg-step.done .seg-dot { background: var(--brand); color: #fff; border-color: var(--brand); }
        .seg-step.now .seg-dot { background: var(--surface); color: var(--brand); border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-soft); }
        .seg-lbl { margin-top: 8px; font-size: 12.5px; font-weight: 600; color: var(--text-2); }
        .seg-step.done .seg-lbl, .seg-step.now .seg-lbl { color: var(--text); }
      `}</style>
    </>
  );
}
