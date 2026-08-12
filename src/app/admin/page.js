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

// Sección plegable. En móvil se colapsa (mostrando el contador en el encabezado)
// para acortar el scroll; en escritorio se muestra siempre abierta.
function Colapsable({ titulo, badge, derecha, esMovil, children }) {
  const [abierto, setAbierto] = useState(true);
  useEffect(() => { setAbierto(!esMovil); }, [esMovil]);
  const toggle = () => { if (esMovil) setAbierto((a) => !a); };
  return (
    <>
      <div className="row" style={{ margin: '26px 0 12px', alignItems: 'center', gap: 8 }}>
        <div onClick={toggle}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto', cursor: esMovil ? 'pointer' : 'default', userSelect: 'none' }}>
          {esMovil && (
            <span aria-hidden style={{ display: 'inline-block', transition: 'transform .15s ease', transform: abierto ? 'rotate(90deg)' : 'none', color: 'var(--text-2)', fontSize: 13 }}>▶</span>
          )}
          <h3 style={{ margin: 0 }}>{titulo}</h3>
          {badge}
        </div>
        {derecha}
      </div>
      {(!esMovil || abierto) && children}
    </>
  );
}

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
  const [esMovil, setEsMovil] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [borrar, setBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const [anuncios, setAnuncios] = useState([]);
  const [nvAnuncio, setNvAnuncio] = useState({ titulo: '', enlace: '', ubicacion: 'banner', tienda_id: '' });
  const [nvArchivo, setNvArchivo] = useState(null);
  const [subiendoAnuncio, setSubiendoAnuncio] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const set = () => setEsMovil(mq.matches);
    set();
    mq.addEventListener?.('change', set);
    return () => mq.removeEventListener?.('change', set);
  }, []);

  async function recargarTodo() {
    setRecargando(true);
    try { await cargar(); } finally { setRecargando(false); }
  }

  async function cargarAnuncios() {
    try { const d = await api('/api/admin/anuncios'); setAnuncios(d.anuncios); }
    catch (e) { setError(e.message); }
  }

  async function crearAnuncio(e) {
    e.preventDefault();
    if (!nvArchivo) { setError('Elige una imagen para el anuncio.'); return; }
    setSubiendoAnuncio(true); setError('');
    try {
      const fd = new FormData();
      fd.append('imagen', nvArchivo);
      if (nvAnuncio.titulo) fd.append('titulo', nvAnuncio.titulo);
      if (nvAnuncio.enlace) fd.append('enlace', nvAnuncio.enlace);
      fd.append('ubicacion', nvAnuncio.ubicacion);
      if (nvAnuncio.tienda_id) fd.append('tienda_id', nvAnuncio.tienda_id);
      const res = await fetch(`${API_BASE}/api/admin/anuncios`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || 'No se pudo crear el anuncio');
      setNvAnuncio((p) => ({ titulo: '', enlace: '', ubicacion: p.ubicacion, tienda_id: '' }));
      setNvArchivo(null);
      await cargarAnuncios();
    } catch (e) { setError(e.message); }
    finally { setSubiendoAnuncio(false); }
  }

  async function toggleAnuncio(a) {
    try { await api(`/api/admin/anuncios/${a.id}`, { method: 'PATCH', body: { activo: Number(a.activo) === 1 ? 0 : 1 } }); await cargarAnuncios(); }
    catch (e) { setError(e.message); }
  }

  async function borrarAnuncio(id) {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try { await api(`/api/admin/anuncios/${id}`, { method: 'DELETE' }); await cargarAnuncios(); }
    catch (e) { setError(e.message); }
  }

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

  // Carga resiliente: si un endpoint secundario falla, los demás igual se
  // actualizan (no se cae toda la vista). Así aprobar/rechazar refresca
  // "Verificaciones" y "Tiendas" a la vez de forma confiable.
  async function cargar() {
    const [m, t, s, c, pl, v, el, an] = await Promise.allSettled([
      api('/api/admin/metricas'),
      api(`/api/admin/tiendas${filtro ? `?estado=${filtro}` : ''}`),
      api('/api/admin/suscripciones?estado=pendiente'),
      api('/api/config-pago', { auth: false }),
      api('/api/admin/planes'),
      api('/api/admin/verificaciones?estado=pendiente'),
      api('/api/admin/eliminaciones'),
      api('/api/admin/anuncios'),
    ]);
    if (m.status === 'fulfilled') setMetricas(m.value);
    if (t.status === 'fulfilled') setTiendas(t.value.tiendas);
    if (s.status === 'fulfilled') setPagos(s.value.pagos);
    if (c.status === 'fulfilled') setCfgPago((prev) => prev ?? c.value.pago);
    if (pl.status === 'fulfilled') setPlanes(pl.value.planes);
    if (v.status === 'fulfilled') setVerifs(v.value.verificaciones);
    if (el.status === 'fulfilled') setElims(el.value.eliminaciones);
    if (an.status === 'fulfilled') setAnuncios(an.value.anuncios);
    const fallo = [m, t, s, c, pl, v, el, an].find((r) => r.status === 'rejected');
    setError(fallo ? (fallo.reason?.message || 'No se pudieron cargar algunos datos.') : '');
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

  async function eliminarTienda() {
    if (!borrar) return;
    setBorrando(true);
    try {
      await api(`/api/admin/tiendas/${borrar.id}`, { method: 'DELETE' });
      setBorrar(null);
      await cargar();
    } catch (e) { setError(e.message); }
    finally { setBorrando(false); }
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

  const cards = metricas ? [
    ['Tiendas activas', metricas.tiendas.activas, 'var(--ok)'],
    ['Pendientes', metricas.tiendas.pendientes, 'var(--warn)'],
    ['Suspendidas', metricas.tiendas.suspendidas, 'var(--danger)'],
    ['Productos', metricas.productos, 'var(--text)'],
    ['Pedidos', metricas.pedidos.cantidad, 'var(--brand)'],
  ] : [];

  return (
    <>
      <div className="row" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Plataforma</h1>
        <button className="btn btn-soft btn-sm" onClick={recargarTodo} disabled={recargando}
          title="Recargar todos los datos del panel">
          <span aria-hidden style={{ display: 'inline-block', transition: 'transform .5s ease', transform: recargando ? 'rotate(360deg)' : 'none' }}>⟳</span>{' '}
          {recargando ? 'Recargando…' : 'Recargar'}
        </button>
      </div>
      <p className="muted tiny" style={{ marginTop: -4 }}>Aprueba, suspende y supervisa las tiendas.</p>

      {error && <div className="alert error" style={{ margin: '10px 0' }}>{error}</div>}

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

      <Colapsable esMovil={esMovil} titulo="Pagos de suscripción pendientes"
        badge={pagos.length > 0 ? <span className="badge badge-warn">{pagos.length}</span> : null}>
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
      </Colapsable>

      <Colapsable esMovil={esMovil} titulo="Verificaciones pendientes"
        badge={verifs.length > 0 ? <span className="badge badge-warn">{verifs.length}</span> : null}>
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
                    {v.tienda_slug
                      ? <a className="muted tiny" href={`/t/${v.tienda_slug}`} target="_blank" rel="noreferrer">/t/{v.tienda_slug} ↗</a>
                      : <span className="muted tiny">tienda #{v.tienda_id}</span>}
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
      </Colapsable>

      <Colapsable esMovil={esMovil} titulo="Solicitudes de eliminación"
        badge={elims.length > 0 ? <span className="badge badge-danger">{elims.length}</span> : null}>
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
      </Colapsable>

      <Colapsable esMovil={esMovil} titulo="Datos de cobro de la plataforma"
        derecha={okCfg ? <span className="muted" style={{ color: 'var(--ok)', fontSize: 13 }}>{okCfg}</span> : null}>
        <div className="card">
          <p className="muted tiny" style={{ marginTop: 0 }}>Estos datos ve el dueño para pagar su suscripción. Deja en blanco lo que no uses.</p>
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
      </Colapsable>

      <Colapsable esMovil={esMovil} titulo="Planes de membresía"
        derecha={okPlan ? <span className="muted" style={{ color: 'var(--ok)', fontSize: 13 }}>{okPlan}</span> : null}>
        <div className="card">
          <p className="muted tiny" style={{ marginTop: 0 }}>Edita nombre, precio y límites de cada plan. Deja vacío "Máx. productos" o "Máx. destacados" para <b>ilimitado</b>.</p>
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
      </Colapsable>

      <Colapsable esMovil={esMovil} titulo="Tiendas"
        derecha={
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {['', 'pendiente', 'activa', 'suspendida'].map((f) => (
              <button key={f || 'todas'} className={`chip ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
                {f === '' ? 'Todas' : f}
              </button>
            ))}
          </div>
        }>
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
                    )}{' '}
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontWeight: 600 }} onClick={() => setBorrar({ id: t.id, nombre: t.nombre })}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Colapsable>

      <Colapsable esMovil={esMovil} titulo="Publicidad (anuncios del home)"
        badge={anuncios.length > 0 ? <span className="badge badge-brand">{anuncios.length}</span> : null}>
        <div className="card" style={{ marginBottom: 14 }}>
          <p className="muted tiny" style={{ marginTop: 0 }}>
            Sube el anuncio. <b>Banner</b> = aparece en el modal de bienvenida (masonry). <b>Patrocinado</b> = tarjeta destacada arriba de las tiendas. Lo puedes activar u ocultar cuando quieras.
          </p>
          <form onSubmit={crearAnuncio}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div className="field"><label>Imagen del anuncio</label>
                <input className="input" type="file" accept="image/*" onChange={(e) => setNvArchivo(e.target.files?.[0] || null)} /></div>
              <div className="field"><label>Título (opcional)</label>
                <input className="input" value={nvAnuncio.titulo} placeholder="Ej: Ofertas de temporada"
                  onChange={(e) => setNvAnuncio({ ...nvAnuncio, titulo: e.target.value })} /></div>
              <div className="field"><label>Enlace (opcional)</label>
                <input className="input" value={nvAnuncio.enlace} placeholder="https://... o /t/mi-tienda"
                  onChange={(e) => setNvAnuncio({ ...nvAnuncio, enlace: e.target.value })} /></div>
              <div className="field"><label>Ubicación</label>
                <select className="input" value={nvAnuncio.ubicacion} onChange={(e) => setNvAnuncio({ ...nvAnuncio, ubicacion: e.target.value })}>
                  <option value="banner">Banner (modal de bienvenida)</option>
                  <option value="patrocinado">Patrocinado (arriba de las tiendas)</option>
                </select></div>
              <div className="field"><label>Tienda anunciante (opcional)</label>
                <select className="input" value={nvAnuncio.tienda_id} onChange={(e) => setNvAnuncio({ ...nvAnuncio, tienda_id: e.target.value })}>
                  <option value="">— Ninguna —</option>
                  {tiendas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select></div>
            </div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} disabled={subiendoAnuncio}>
              {subiendoAnuncio ? 'Subiendo…' : 'Agregar anuncio'}
            </button>
          </form>
        </div>

        <div className="card card-flush">
          <table className="table">
            <thead>
              <tr><th>Imagen</th><th>Título</th><th>Ubicación</th><th>Tienda</th><th>Enlace</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {anuncios.length === 0 && <tr><td colSpan={7} className="muted" style={{ padding: 22 }}>No hay anuncios todavía. Sube el primero arriba.</td></tr>}
              {anuncios.map((a) => (
                <tr key={a.id}>
                  <td><img src={a.imagen_url} alt="" style={{ width: 84, height: 48, objectFit: 'cover', borderRadius: 8, display: 'block' }} /></td>
                  <td>{a.titulo || <span className="muted">—</span>}</td>
                  <td><span className="badge">{a.ubicacion === 'patrocinado' ? 'Patrocinado' : 'Banner'}</span></td>
                  <td className="tiny">{a.tienda_nombre || '—'}</td>
                  <td className="tiny">{a.enlace ? <a href={a.enlace} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>ver</a> : '—'}</td>
                  <td>{Number(a.activo) === 1 ? <span className="badge badge-ok">Activo</span> : <span className="badge">Oculto</span>}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleAnuncio(a)}>{Number(a.activo) === 1 ? 'Ocultar' : 'Activar'}</button>{' '}
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => borrarAnuncio(a.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Colapsable>

      {borrar && (
        <div onClick={() => !borrando && setBorrar(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 460, width: '100%' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--danger)' }}>Eliminar tienda</h3>
            <p style={{ marginTop: 0 }}>
              Vas a eliminar <b>{borrar.nombre}</b> de forma <b>permanente</b>. Se borrarán todos sus
              productos, pedidos y fotos. Esta acción <b>no se puede deshacer</b>.
            </p>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setBorrar(null)} disabled={borrando}>Cancelar</button>
              <button className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff' }} onClick={eliminarTienda} disabled={borrando}>
                {borrando ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}

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
