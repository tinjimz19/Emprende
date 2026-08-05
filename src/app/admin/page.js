'use client';
import { useEffect, useState } from 'react';
import { api, usd, API_BASE, getToken } from '@/lib/api';
import Verificado from '@/components/Verificado';

const ESTADO_BADGE = {
  activa: 'badge-ok',
  pendiente: 'badge-warn',
  suspendida: 'badge-danger',
};

const PAGO_CAMPOS = [
  ['pago_movil', 'Pago móvil', '0412-0000000 · V-00.000.000 · Banco'],
  ['zelle', 'Zelle', 'correo@ejemplo.com'],
  ['usdt', 'USDT (TRC20)', 'dirección de la wallet'],
  ['binance', 'Binance Pay', 'ID / correo de Binance'],
  ['pago_nota', 'Nota', 'Instrucción adicional para el dueño'],
];

export default function AdminHome() {
  const [metricas, setMetricas] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [verifs, setVerifs] = useState([]);
  const [elims, setElims] = useState([]);
  const [visor, setVisor] = useState(null);
  const [cfgPago, setCfgPago] = useState(null);
  const [guardandoCfg, setGuardandoCfg] = useState(false);
  const [okCfg, setOkCfg] = useState('');
  const [planes, setPlanes] = useState([]);
  const [okPlan, setOkPlan] = useState('');
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');
  const [respaldando, setRespaldando] = useState(false);

  async function respaldar() {
    setRespaldando(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/respaldo`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error('No se pudo generar el respaldo');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emprende-respaldo-${new Date().toISOString().slice(0, 10)}.sql`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
    finally { setRespaldando(false); }
  }

  async function cargar() {
    try {
      const [m, t, s, c, pl, v, el] = await Promise.all([
        api('/api/admin/metricas'),
        api(`/api/admin/tiendas${filtro ? `?estado=${filtro}` : ''}`),
        api('/api/admin/suscripciones?estado=pendiente'),
        api('/api/config-pago', { auth: false }),
        api('/api/admin/planes'),
        api('/api/admin/verificaciones?estado=pendiente'),
        api('/api/admin/eliminaciones'),
      ]);
      setMetricas(m);
      setTiendas(t.tiendas);
      setPagos(s.pagos);
      setVerifs(v.verificaciones);
      setElims(el.eliminaciones);
      setCfgPago((prev) => prev ?? c.pago);
      setPlanes(pl.planes);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); }, [filtro]);

  function setPlanCampo(codigo, campo, valor) {
    setPlanes((prev) => prev.map((p) => (p.codigo === codigo ? { ...p, [campo]: valor } : p)));
  }

  async function guardarPlan(p) {
    setOkPlan('');
    try {
      await api(`/api/admin/planes/${p.codigo}`, {
        method: 'PATCH',
        body: {
          nombre: p.nombre,
          precio_mensual: p.precio_mensual,
          max_productos: p.max_productos === '' || p.max_productos === null ? null : p.max_productos,
          max_fotos: p.max_fotos,
          max_destacados: p.max_destacados === '' || p.max_destacados === null ? null : p.max_destacados,
          activo: Number(p.activo) === 1 ? 1 : 0,
        },
      });
      setOkPlan(`Plan ${p.nombre} guardado ✓`);
      setTimeout(() => setOkPlan(''), 2500);
    } catch (e) { setError(e.message); }
  }

  async function cambiar(id, estado) {
    try {
      await api(`/api/admin/tiendas/${id}/estado`, { method: 'PATCH', body: { estado } });
      await cargar();
    } catch (e) { setError(e.message); }
  }

  async function guardarCfgPago(e) {
    e.preventDefault();
    setGuardandoCfg(true); setOkCfg('');
    try {
      const r = await api('/api/admin/config-pago', { method: 'PATCH', body: cfgPago });
      setCfgPago(r.pago);
      setOkCfg('Datos de cobro guardados ✓');
      setTimeout(() => setOkCfg(''), 2500);
    } catch (e) { setError(e.message); }
    finally { setGuardandoCfg(false); }
  }

  async function revisarPago(id, estado) {
    let nota = null;
    if (estado === 'rechazado') nota = prompt('Motivo del rechazo (opcional):') || '';
    try {
      await api(`/api/admin/suscripciones/${id}`, { method: 'PATCH', body: { estado, nota_admin: nota } });
      await cargar();
    } catch (e) { setError(e.message); }
  }

  async function verArchivo(id, tipo) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/verificaciones/${id}/archivo?tipo=${tipo}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('No se pudo abrir el archivo');
      const blob = await res.blob();
      setVisor({ url: URL.createObjectURL(blob), titulo: tipo === 'selfie' ? 'Selfie' : 'Cédula' });
    } catch (e) { setError(e.message); }
  }
  function cerrarVisor() {
    if (visor?.url) URL.revokeObjectURL(visor.url);
    setVisor(null);
  }

  async function purgar(id, nombre) {
    if (!confirm(`¿Eliminar permanentemente la tienda "${nombre}"? Esto borra todo y NO se puede deshacer.`)) return;
    try { await api(`/api/admin/eliminaciones/${id}/purgar`, { method: 'POST' }); await cargar(); }
    catch (e) { setError(e.message); }
  }

  async function revisarVerif(v, estado) {
    let motivo = '';
    if (estado === 'verificada') {
      if (!confirm(`¿Verificar la identidad de "${v.tienda_nombre}"? La tienda podrá publicar sus productos y mostrará la insignia de verificado.`)) return;
    } else {
      motivo = prompt('Motivo del rechazo (el dueño lo verá):') || '';
      if (!motivo.trim()) return;
    }
    try {
      await api(`/api/admin/verificaciones/${v.id}`, { method: 'PATCH', body: { estado, motivo } });
      await cargar();
    } catch (e) { setError(e.message); }
  }

  if (error) return <div className="alert error">{error}</div>;

  const cards = metricas ? [
    ['Tiendas activas', metricas.tiendas.activas, 'var(--ok)'],
    ['Pendientes', metricas.tiendas.pendientes, 'var(--warn)'],
    ['Suspendidas', metricas.tiendas.suspendidas, 'var(--danger)'],
    ['Productos', metricas.productos, 'var(--text)'],
    ['Pedidos', metricas.pedidos.cantidad, 'var(--brand)'],
  ] : [];

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Plataforma</h1>
      <p className="muted tiny" style={{ marginTop: -4 }}>Aprueba, suspende y supervisa las tiendas.</p>
      <div className="row" style={{ margin: '10px 0 0' }}>
        <button className="btn btn-soft btn-sm" onClick={respaldar} disabled={respaldando} title="Descargar un respaldo .sql de toda la base de datos">
          {respaldando ? 'Generando…' : '⬇ Respaldar base de datos'}
        </button>
      </div>

      <div className="grid grid-stats" style={{ marginTop: 22 }}>
        {cards.map(([l, n, c]) => (
          <div className="card stat" key={l}>
            <div className="label">{l}</div>
            <div className="n" style={{ color: c }}>{n}</div>
          </div>
        ))}
      </div>

      <div className="row" style={{ margin: '26px 0 12px' }}>
        <h3 style={{ margin: 0 }}>Pagos de suscripción pendientes</h3>
        {pagos.length > 0 && <span className="badge badge-warn" style={{ marginLeft: 10 }}>{pagos.length}</span>}
      </div>
      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr><th>Tienda</th><th>Plan</th><th>Meses</th><th>Método</th><th>Ref.</th><th>Comprob.</th><th style={{ textAlign: 'right' }}>Monto</th><th></th></tr>
          </thead>
          <tbody>
            {pagos.length === 0 && <tr><td colSpan={8} className="muted" style={{ padding: 22 }}>No hay pagos pendientes de verificar.</td></tr>}
            {pagos.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.tienda_nombre}</div>
                  <div className="muted tiny">actual: {p.plan_actual}{p.vence_at ? ` · vence ${p.vence_at}` : ''}</div>
                </td>
                <td><span className="badge badge-brand">{p.plan_nombre || p.plan_codigo}</span></td>
                <td>{p.meses}</td>
                <td className="tiny">{p.metodo_pago || '—'}</td>
                <td className="tiny">{p.referencia || '—'}</td>
                <td className="tiny">{p.comprobante_url ? <a href={p.comprobante_url} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>ver</a> : '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{usd(p.monto)}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => revisarPago(p.id, 'confirmado')}>Confirmar</button>{' '}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => revisarPago(p.id, 'rechazado')}>Rechazar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ margin: '26px 0 12px' }}>
        <h3 style={{ margin: 0 }}>Verificaciones pendientes</h3>
        {verifs.length > 0 && <span className="badge badge-warn" style={{ marginLeft: 10 }}>{verifs.length}</span>}
      </div>
      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr><th>Tienda</th><th>Cédula #</th><th>Documentos</th><th>Enviada</th><th></th></tr>
          </thead>
          <tbody>
            {verifs.length === 0 && <tr><td colSpan={5} className="muted" style={{ padding: 22 }}>No hay verificaciones pendientes.</td></tr>}
            {verifs.map((v) => (
              <tr key={v.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{v.tienda_nombre}</div>
                  <a className="muted tiny" href={`/t/${v.tienda_slug}`} target="_blank" rel="noreferrer">/t/{v.tienda_slug} ↗</a>
                </td>
                <td className="tiny">{v.numero_cedula || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => verArchivo(v.id, 'documento')}>Ver cédula</button>{' '}
                  <button className="btn btn-ghost btn-sm" onClick={() => verArchivo(v.id, 'selfie')}>Ver selfie</button>
                </td>
                <td className="tiny">{(v.created_at || '').slice(0, 16)}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => revisarVerif(v, 'verificada')}>Verificar</button>{' '}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => revisarVerif(v, 'rechazada')}>Rechazar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ margin: '26px 0 12px' }}>
        <h3 style={{ margin: 0 }}>Solicitudes de eliminación</h3>
        {elims.length > 0 && <span className="badge badge-danger" style={{ marginLeft: 10 }}>{elims.length}</span>}
      </div>
      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr><th>Tienda</th><th>Productos</th><th>Pedidos</th><th>Se elimina</th><th></th></tr>
          </thead>
          <tbody>
            {elims.length === 0 && <tr><td colSpan={5} className="muted" style={{ padding: 22 }}>No hay solicitudes de eliminación.</td></tr>}
            {elims.map((e) => (
              <tr key={e.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{e.nombre}</div>
                  <a className="muted tiny" href={`/t/${e.slug}`} target="_blank" rel="noreferrer">/t/{e.slug} ↗</a>
                </td>
                <td>{e.productos}</td>
                <td>{e.pedidos}</td>
                <td className="tiny">
                  {(e.eliminar_at || '').slice(0, 10)}{' '}
                  {Number(e.vencida) ? <span className="badge badge-danger">Vencida</span> : <span className="badge">En espera</span>}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => purgar(e.id, e.nombre)}>Eliminar ahora</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row" style={{ alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Datos de cobro de la plataforma</h3>
          <div className="spacer" />
          {okCfg && <span className="muted" style={{ color: 'var(--ok)', fontSize: 13 }}>{okCfg}</span>}
        </div>
        <p className="muted tiny" style={{ marginTop: 4 }}>Estos datos ve el dueño para pagar su suscripción. Deja en blanco lo que no uses.</p>
        {cfgPago && (
          <form onSubmit={guardarCfgPago} style={{ marginTop: 8 }}>
            {PAGO_CAMPOS.map(([k, label, ph]) => (
              <div className="field" key={k} style={{ marginBottom: 10 }}>
                <label>{label}</label>
                <input className="input" value={cfgPago[k] || ''} placeholder={ph}
                  onChange={(e) => setCfgPago({ ...cfgPago, [k]: e.target.value })} />
              </div>
            ))}
            <button className="btn btn-primary" disabled={guardandoCfg}>{guardandoCfg ? 'Guardando…' : 'Guardar datos de cobro'}</button>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="row" style={{ alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Planes de membresía</h3>
          <div className="spacer" />
          {okPlan && <span className="muted" style={{ color: 'var(--ok)', fontSize: 13 }}>{okPlan}</span>}
        </div>
        <p className="muted tiny" style={{ marginTop: 4 }}>Edita nombre, precio y límites de cada plan. Deja vacío "Máx. productos" o "Máx. destacados" para <b>ilimitado</b>.</p>
        <div className="grid grid-cards" style={{ marginTop: 12 }}>
          {planes.map((p) => (
            <div className="card" key={p.codigo} style={{ background: 'var(--surface-2)' }}>
              <div className="row" style={{ alignItems: 'center', marginBottom: 8 }}>
                <span className="badge badge-brand">{p.codigo}</span>
                <div className="spacer" />
                <label className="row muted tiny" style={{ gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={Number(p.activo) === 1} onChange={(e) => setPlanCampo(p.codigo, 'activo', e.target.checked ? 1 : 0)} />
                  Activo
                </label>
              </div>
              <div className="field" style={{ marginBottom: 8 }}><label>Nombre</label>
                <input className="input" value={p.nombre || ''} onChange={(e) => setPlanCampo(p.codigo, 'nombre', e.target.value)} /></div>
              <div className="field" style={{ marginBottom: 8 }}><label>Precio mensual ($)</label>
                <input className="input" type="number" min="0" step="0.01" value={p.precio_mensual ?? ''} onChange={(e) => setPlanCampo(p.codigo, 'precio_mensual', e.target.value)} /></div>
              <div className="field" style={{ marginBottom: 8 }}><label>Máx. productos</label>
                <input className="input" type="number" min="0" placeholder="Ilimitado" value={p.max_productos ?? ''} onChange={(e) => setPlanCampo(p.codigo, 'max_productos', e.target.value)} /></div>
              <div className="field" style={{ marginBottom: 8 }}><label>Máx. fotos por producto</label>
                <input className="input" type="number" min="1" value={p.max_fotos ?? ''} onChange={(e) => setPlanCampo(p.codigo, 'max_fotos', e.target.value)} /></div>
              <div className="field" style={{ marginBottom: 12 }}><label>Máx. destacados</label>
                <input className="input" type="number" min="0" placeholder="Ilimitado" value={p.max_destacados ?? ''} onChange={(e) => setPlanCampo(p.codigo, 'max_destacados', e.target.value)} /></div>
              <button className="btn btn-primary btn-block btn-sm" onClick={() => guardarPlan(p)}>Guardar</button>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ margin: '26px 0 16px' }}>
        <h3 style={{ margin: 0 }}>Tiendas</h3>
        <div className="spacer" />
        {['', 'pendiente', 'activa', 'suspendida'].map((f) => (
          <button key={f || 'todas'} className={`chip ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
            {f === '' ? 'Todas' : f}
          </button>
        ))}
      </div>

      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr><th>Tienda</th><th>Dueño</th><th>Productos</th><th>Pedidos</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {tiendas.length === 0 && <tr><td colSpan={6} className="muted" style={{ padding: 26 }}>No hay tiendas para este filtro.</td></tr>}
            {tiendas.map((t) => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{t.nombre}{t.verificacion_estado === 'verificada' && <Verificado size={15} />}</div>
                  <a className="muted tiny" href={`/t/${t.slug}`} target="_blank" rel="noreferrer">/t/{t.slug} ↗</a>
                </td>
                <td>
                  <div>{t.dueno_nombre || '—'}</div>
                  <div className="muted tiny">{t.dueno_email || ''}</div>
                </td>
                <td>{t.productos}</td>
                <td>{t.pedidos}</td>
                <td><span className={`badge ${ESTADO_BADGE[t.estado] || ''}`}>{t.estado}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {t.estado !== 'activa' && (
                    <button className="btn btn-primary btn-sm" onClick={() => cambiar(t.id, 'activa')}>Aprobar</button>
                  )}{' '}
                  {t.estado !== 'suspendida' ? (
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => cambiar(t.id, 'suspendida')}>Suspender</button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => cambiar(t.id, 'activa')}>Reactivar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visor && (
        <div onClick={cerrarVisor} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 560, width: '100%' }}>
            <div className="row" style={{ alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>{visor.titulo}</h3>
              <div className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={cerrarVisor}>✕</button>
            </div>
            <img src={visor.url} alt={visor.titulo} style={{ width: '100%', borderRadius: 10, display: 'block' }} />
          </div>
        </div>
      )}
    </>
  );
}
