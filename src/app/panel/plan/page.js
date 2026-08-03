'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, usd, enviarFormulario } from '@/lib/api';

// Etiquetas de los datos de cobro configurables de la plataforma.
const PAGO_LABELS = { pago_movil: 'Pago móvil', zelle: 'Zelle', usdt: 'USDT (TRC20)', binance: 'Binance Pay' };
const METODOS = [
  ['pago_movil', 'Pago móvil'], ['transferencia', 'Transferencia'],
  ['zelle', 'Zelle'], ['usdt', 'USDT'], ['binance', 'Binance Pay'],
];

const limiteTxt = (v, singular, plural) =>
  v === null ? `${plural} ilimitados` : (v === 0 ? `Sin ${plural}` : `${v} ${v === 1 ? singular : plural}`);

function estadoPago(e) {
  if (e === 'confirmado') return <span className="badge badge-ok">confirmado</span>;
  if (e === 'rechazado') return <span className="badge badge-danger">rechazado</span>;
  return <span className="badge badge-warn">pendiente</span>;
}

export default function PlanPage() {
  const [mi, setMi] = useState(null);
  const [planes, setPlanes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({ plan_id: '', meses: 1, metodo_pago: 'pago_movil', referencia: '', monto: '' });
  const [comprobante, setComprobante] = useState(null);
  const [datosPago, setDatosPago] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    try {
      const [m, p, h, c] = await Promise.all([
        api('/api/mi-plan'), api('/api/planes'), api('/api/suscripcion/pagos'), api('/api/config-pago', { auth: false }),
      ]);
      setMi(m); setPlanes(p.planes); setPagos(h.pagos); setDatosPago(c.pago || {});
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); }, []);

  const planSel = useMemo(() => planes.find((p) => p.id === form.plan_id) || null, [planes, form.plan_id]);
  const montoSugerido = planSel ? (planSel.precio_mensual * (Number(form.meses) || 1)) : 0;

  function elegir(planId) {
    setForm((f) => ({ ...f, plan_id: planId, monto: '' }));
    setOk('');
    if (typeof document !== 'undefined') document.getElementById('form-pago')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function reportar(e) {
    e.preventDefault();
    setError(''); setOk(''); setEnviando(true);
    try {
      await enviarFormulario('/api/suscripcion/pago', {
        plan_id: form.plan_id,
        meses: Number(form.meses),
        metodo_pago: form.metodo_pago,
        referencia: form.referencia,
        monto: form.monto === '' ? '' : Number(form.monto),
      }, comprobante, 'comprobante', 'POST');
      setOk('¡Pago reportado! Queda pendiente de verificación. Te activaremos el plan al confirmarlo.');
      setForm((f) => ({ ...f, referencia: '', monto: '' }));
      setComprobante(null);
      await cargar();
    } catch (e) { setError(e.message); }
    finally { setEnviando(false); }
  }

  if (!mi) return <div className="muted" style={{ paddingTop: 20 }}>{error ? <span className="error">{error}</span> : 'Cargando…'}</div>;

  const uso = mi.uso;
  const pctProductos = uso.max_productos ? Math.min(100, (uso.productos / uso.max_productos) * 100) : (uso.productos > 0 ? 100 : 0);
  const pctDestacados = uso.max_destacados ? Math.min(100, (uso.destacados / uso.max_destacados) * 100) : (uso.destacados > 0 ? 100 : 0);
  const pagados = planes.filter((p) => p.precio_mensual > 0);

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Plan y membresía</h1>
      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      {ok && <div className="ok-box" style={{ marginTop: 12 }}>{ok}</div>}

      {/* Plan actual + uso */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="muted tiny">Tu plan actual</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{mi.plan.nombre}</div>
          </div>
          <div className="spacer" />
          {mi.vence_at
            ? <div className="muted tiny" style={{ textAlign: 'right' }}>
                {mi.vencido ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Venció el {mi.vence_at}</span>
                  : <>Vigente hasta <b>{mi.vence_at}</b>{mi.dias_restantes != null && ` · ${mi.dias_restantes} día(s)`}</>}
              </div>
            : <div className="muted tiny">Plan gratuito, sin vencimiento</div>}
        </div>
        {mi.vencido && (
          <div className="warn-box" style={{ marginTop: 12 }}>
            Tu plan pagado venció, así que rigen los límites del plan {mi.plan.nombre}. Renueva abajo para recuperar tus beneficios.
          </div>
        )}

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 16 }}>
          <div>
            <div className="row" style={{ fontSize: 13, marginBottom: 4 }}>
              <span>Productos</span><div className="spacer" />
              <span className="muted">{uso.productos}{uso.max_productos ? ` / ${uso.max_productos}` : ' · ilimitado'}</span>
            </div>
            <div className="rep-track"><div className="rep-fill" style={{ width: `${pctProductos}%` }} /></div>
          </div>
          <div>
            <div className="row" style={{ fontSize: 13, marginBottom: 4 }}>
              <span>Destacados</span><div className="spacer" />
              <span className="muted">{uso.destacados}{uso.max_destacados != null ? ` / ${uso.max_destacados}` : ' · ilimitado'}</span>
            </div>
            <div className="rep-track"><div className="rep-fill" style={{ width: `${pctDestacados}%` }} /></div>
          </div>
        </div>
        <p className="muted tiny" style={{ marginTop: 12 }}>Fotos por producto en tu plan: {uso.max_fotos}.</p>
      </div>

      {/* Planes disponibles */}
      <h3 style={{ margin: '26px 0 0' }}>Planes</h3>
      <div className="grid grid-cards" style={{ marginTop: 12 }}>
        {planes.map((p) => {
          const actual = p.id === mi.plan_guardado && !mi.vencido;
          return (
            <div className={`card plan-card ${actual ? 'plan-actual' : ''}`} key={p.id}>
              {actual && <span className="badge badge-brand" style={{ position: 'absolute', top: 14, right: 14 }}>Actual</span>}
              <div style={{ fontSize: 17, fontWeight: 700 }}>{p.nombre}</div>
              <div className="price" style={{ fontSize: 26, marginTop: 4 }}>
                {p.precio_mensual > 0 ? usd(p.precio_mensual) : 'Gratis'}
                {p.precio_mensual > 0 && <span className="muted tiny" style={{ fontWeight: 400 }}> /mes</span>}
              </div>
              <ul className="plan-features">
                <li>{limiteTxt(p.max_productos, 'producto', 'productos')}</li>
                <li>{p.max_fotos} fotos por producto</li>
                <li>{limiteTxt(p.max_destacados, 'destacado', 'destacados')}</li>
              </ul>
              {p.precio_mensual > 0 && !actual && (
                <button className="btn btn-primary btn-block btn-sm" onClick={() => elegir(p.id)}>
                  {mi.plan_guardado === p.id ? 'Renovar' : 'Elegir'}
                </button>
              )}
              {actual && <div className="muted tiny" style={{ textAlign: 'center', marginTop: 6 }}>Tu plan vigente</div>}
            </div>
          );
        })}
      </div>

      {/* Reportar pago */}
      <div className="card" id="form-pago" style={{ marginTop: 22 }}>
        <h3 style={{ marginTop: 0 }}>Reportar un pago</h3>
        <p className="muted tiny" style={{ marginTop: -6 }}>
          Paga a los datos de Emprende y reporta aquí tu referencia. Un administrador la verifica y activa tu plan.
        </p>

        <div className="card" style={{ background: 'var(--surface-2)', boxShadow: 'none', marginBottom: 16 }}>
          {Object.keys(PAGO_LABELS).filter((k) => datosPago[k]).length === 0 ? (
            <p className="muted tiny" style={{ margin: 0 }}>El administrador aún no cargó los datos de pago. Escríbenos para coordinar tu pago.</p>
          ) : (
            Object.entries(PAGO_LABELS).map(([k, label]) => datosPago[k] ? (
              <div className="row" key={k} style={{ fontSize: 13, padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: 120 }}>{label}</span>
                <span className="muted">{datosPago[k]}</span>
              </div>
            ) : null)
          )}
          {datosPago.pago_nota && <p className="muted tiny" style={{ margin: '8px 0 0' }}>{datosPago.pago_nota}</p>}
        </div>

        <form onSubmit={reportar}>
          <div className="row" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 160px', marginBottom: 0 }}>
              <label>Plan</label>
              <select className="input" value={form.plan_id} required onChange={(e) => setForm({ ...form, plan_id: e.target.value === '' ? '' : Number(e.target.value) })}>
                <option value="">— Elige —</option>
                {pagados.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({usd(p.precio_mensual)}/mes)</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: '0 0 90px', marginBottom: 0 }}>
              <label>Meses</label>
              <input className="input" type="number" min="1" max="12" value={form.meses} onChange={(e) => setForm({ ...form, meses: e.target.value })} />
            </div>
            <div className="field" style={{ flex: '1 1 150px', marginBottom: 0 }}>
              <label>Método</label>
              <select className="input" value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}>
                {METODOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: '1 1 160px', marginBottom: 0 }}>
              <label>Referencia</label>
              <input className="input" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} placeholder="N.º de referencia" required />
            </div>
            <div className="field" style={{ flex: '0 0 130px', marginBottom: 0 }}>
              <label>Monto ($)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                placeholder={montoSugerido ? String(montoSugerido.toFixed(2)) : '0.00'} />
            </div>
          </div>
          <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
            <label>Comprobante (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setComprobante(e.target.files[0] || null)} />
            {comprobante && <span className="muted tiny" style={{ marginLeft: 8 }}>{comprobante.name}</span>}
          </div>
          {planSel && <p className="muted tiny" style={{ marginTop: 10 }}>Sugerido: {usd(montoSugerido)} por {form.meses} mes(es) de {planSel.nombre}. Deja el monto vacío para usar el sugerido.</p>}
          <button className="btn btn-primary" disabled={enviando || !form.plan_id} style={{ marginTop: 12 }}>
            {enviando ? 'Enviando…' : 'Reportar pago'}
          </button>
        </form>
      </div>

      {/* Historial */}
      <div className="card" style={{ marginTop: 22, marginBottom: 40, padding: 0 }}>
        <h3 style={{ margin: 0, padding: '18px 22px 4px' }}>Historial de pagos</h3>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Plan</th><th>Meses</th><th>Método</th><th>Ref.</th><th>Comprob.</th><th style={{ textAlign: 'right' }}>Monto</th><th>Estado</th></tr></thead>
          <tbody>
            {pagos.length === 0 && <tr><td colSpan={8} className="muted" style={{ padding: 22 }}>Aún no has reportado pagos.</td></tr>}
            {pagos.map((p) => (
              <tr key={p.id}>
                <td className="tiny">{(p.created_at || '').slice(0, 10)}</td>
                <td>{p.plan_nombre || p.plan_codigo}</td>
                <td>{p.meses}</td>
                <td className="tiny">{p.metodo_pago || '—'}</td>
                <td className="tiny">{p.referencia || '—'}</td>
                <td className="tiny">{p.comprobante_url ? <a href={p.comprobante_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>ver</a> : '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{usd(p.monto)}</td>
                <td>{estadoPago(p.estado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
