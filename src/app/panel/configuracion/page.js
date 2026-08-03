'use client';
import { useEffect, useRef, useState } from 'react';
import { api, subirArchivo } from '@/lib/api';

// Métodos de pago que el comprador puede elegir en el checkout.
const METODOS_PAGO = [
  ['pago_movil', 'Pago móvil', 'Banco 0102 · 0412-1234567 · C.I. 12.345.678'],
  ['transferencia', 'Transferencia', 'Banco · Cuenta 0000-0000-00-0000000000 · C.I./RIF'],
  ['zelle', 'Zelle', 'correo@ejemplo.com (Nombre Apellido)'],
  ['usdt', 'USDT (Binance)', 'Usuario o correo de Binance'],
  ['efectivo', 'Efectivo', 'Pago en efectivo al recibir o retirar'],
];
const LABEL = Object.fromEntries(METODOS_PAGO.map(([k, l]) => [k, l]));
const PLACE = Object.fromEntries(METODOS_PAGO.map(([k, , p]) => [k, p]));

// Métodos de envío que la tienda puede ofrecer.
const METODOS_ENVIO_LIST = [
  ['delivery', 'Delivery (envío propio, con costo)'],
  ['origen', 'Entrega en origen (retiro en la tienda)'],
  ['mrw', 'MRW'],
  ['zoom', 'ZOOM'],
  ['acordado', 'Entrega acordada'],
];
const ENVIOS_VALIDOS = METODOS_ENVIO_LIST.map(([k]) => k);

// metodos_envio se guarda como CSV ("delivery,origen,..."). Devuelve un array de claves válidas.
function parseEnvios(raw) {
  const arr = Array.isArray(raw) ? raw : String(raw || '').split(',');
  return arr.map((s) => String(s).trim()).filter((k) => ENVIOS_VALIDOS.includes(k));
}

// datos_pago se guarda como JSON { metodos: [ { tipo, datos }, ... ] }.
// Se admiten formatos viejos (objeto por tipo o texto) por compatibilidad.
function parseMetodos(raw) {
  if (!raw) return [];
  let o;
  try { o = JSON.parse(raw); } catch { return []; }
  if (Array.isArray(o?.metodos)) return o.metodos.filter((m) => m && m.tipo);
  if (Array.isArray(o)) return o.filter((m) => m && m.tipo);
  if (o && typeof o === 'object') {
    return Object.entries(o)
      .filter(([k, v]) => LABEL[k] && v && String(v).trim())
      .map(([k, v]) => ({ tipo: k, datos: String(v) }));
  }
  return [];
}

export default function Configuracion() {
  const [t, setT] = useState(null);
  const [metodos, setMetodos] = useState([]);
  const [metodosEnvio, setMetodosEnvio] = useState([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const fileRef = useRef(null);

  // Modal de agregar/editar método de pago.
  const [modal, setModal] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [mTipo, setMTipo] = useState('pago_movil');
  const [mDatos, setMDatos] = useState('');
  const [guardandoM, setGuardandoM] = useState(false);

  useEffect(() => {
    api('/api/tienda')
      .then((d) => {
        setT(d.tienda);
        setMetodos(parseMetodos(d.tienda?.datos_pago));
        setMetodosEnvio(parseEnvios(d.tienda?.metodos_envio));
      })
      .catch((e) => setError(e.message));
  }, []);

  function set(k, v) { setT({ ...t, [k]: v }); }
  function toggleEnvio(k) {
    setMetodosEnvio((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  async function copiarLink() {
    const link = `${window.location.origin}/t/${t.slug}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function guardar(e) {
    e.preventDefault();
    setError(''); setOk(''); setGuardando(true);
    try {
      const d = await api('/api/tienda', {
        method: 'PUT',
        body: {
          nombre: t.nombre, descripcion: t.descripcion, whatsapp: t.whatsapp,
          direccion: t.direccion || '', costo_delivery: Number(t.costo_delivery || 0),
          metodos_envio: metodosEnvio, tasa_bs: Number(t.tasa_bs || 0),
        },
      });
      setT(d.tienda);
      setOk('Cambios guardados ✓');
    } catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }

  async function subirLogo(file) {
    if (!file) return;
    if (file.type !== 'image/png') { setError('El logo debe ser un archivo PNG.'); return; }
    setError(''); setOk(''); setSubiendo(true);
    try {
      const d = await subirArchivo('/api/tienda/logo', file, 'logo');
      setT(d.tienda);
      setOk('Logo actualizado ✓');
    } catch (e) { setError(e.message); }
    finally { setSubiendo(false); }
  }

  // Guarda la lista de métodos (solo el campo datos_pago).
  async function persistMetodos(lista) {
    const d = await api('/api/tienda', { method: 'PUT', body: { datos_pago: JSON.stringify({ metodos: lista }) } });
    setT(d.tienda);
    setMetodos(lista);
    setError(''); setOk('Métodos de pago actualizados ✓');
  }

  function abrirAgregar() { setEditIdx(null); setMTipo('pago_movil'); setMDatos(''); setModal(true); }
  function abrirEditar(idx) {
    const m = metodos[idx];
    setEditIdx(idx); setMTipo(m.tipo); setMDatos(m.datos || ''); setModal(true);
  }
  async function guardarModal() {
    if (!mDatos.trim()) return;
    const item = { tipo: mTipo, datos: mDatos.trim() };
    const lista = editIdx == null ? [...metodos, item] : metodos.map((m, i) => (i === editIdx ? item : m));
    setGuardandoM(true);
    try { await persistMetodos(lista); setModal(false); }
    catch (e) { setError(e.message); }
    finally { setGuardandoM(false); }
  }
  async function eliminarMetodo(idx) {
    if (!window.confirm('¿Eliminar este método de pago?')) return;
    const lista = metodos.filter((_, i) => i !== idx);
    try { await persistMetodos(lista); }
    catch (e) { setError(e.message); }
  }

  if (!t) return <p className="muted">Cargando…</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Configuración</h1>
      <p className="muted tiny" style={{ marginTop: -4 }}>Tu tienda pública: <b>/t/{t.slug}</b></p>

      {error && <div className="alert error" style={{ margin: '14px 0' }}>{error}</div>}
      {ok && <div className="alert ok-box" style={{ margin: '14px 0' }}>{ok}</div>}

      <div className="cfg-grid">
        {/* Columna principal */}
        <div className="cfg-main">
          <div className="card" style={{ marginTop: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>Compartir link de tu tienda</label>
            <p className="muted tiny" style={{ marginTop: 0, marginBottom: 10 }}>Comparte este enlace por WhatsApp y redes para que tus clientes te compren.</p>
            <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="input"
                readOnly
                onFocus={(e) => e.target.select()}
                value={typeof window !== 'undefined' ? `${window.location.origin}/t/${t.slug}` : `/t/${t.slug}`}
                style={{ flex: 1, minWidth: 220 }}
              />
              <button type="button" className="btn btn-primary btn-sm" onClick={copiarLink} style={{ whiteSpace: 'nowrap' }}>
                {copiado ? '¡Copiado! ✓' : 'Copiar link'}
              </button>
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="muted tiny" style={{ marginBottom: 8 }}>Código QR de tu tienda (imprímelo o compártelo):</div>
              <img alt="QR de la tienda" width={140} height={140}
                style={{ borderRadius: 10, border: '1px solid var(--border-soft)', background: '#fff', padding: 6 }}
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=6&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/t/${t.slug}` : `/t/${t.slug}`)}`} />
              <div>
                <a className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} target="_blank" rel="noreferrer"
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/t/${t.slug}` : `/t/${t.slug}`)}`}>
                  Descargar QR
                </a>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 10 }}>Logo de la tienda (PNG)</label>
            <div className="row">
              <div style={{
                width: 84, height: 84, borderRadius: 18, flexShrink: 0,
                background: t.logo_url ? `var(--surface-2) url(${t.logo_url}) center/contain no-repeat` : 'var(--surface-2)',
                border: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-3)', fontSize: 12,
              }}>
                {!t.logo_url && 'Sin logo'}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/png" hidden onChange={(e) => subirLogo(e.target.files[0])} />
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={subiendo}>
                  {subiendo ? 'Subiendo…' : (t.logo_url ? 'Cambiar logo' : 'Subir logo PNG')}
                </button>
                <p className="muted tiny" style={{ margin: '8px 0 0' }}>Formato PNG, se ajusta automáticamente. Ideal con fondo transparente.</p>
              </div>
            </div>
          </div>

          <form onSubmit={guardar} className="card" style={{ marginTop: 18 }}>
            <div className="field">
              <label>Nombre de la tienda</label>
              <input className="input" value={t.nombre || ''} onChange={(e) => set('nombre', e.target.value)} />
            </div>
            <div className="field">
              <label>Descripción</label>
              <textarea rows={2} value={t.descripcion || ''} onChange={(e) => set('descripcion', e.target.value)} />
            </div>
            <div className="field">
              <label>WhatsApp (con código de país)</label>
              <input className="input" value={t.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="584121234567" />
            </div>

            <hr className="divider" />
            <div className="field">
              <label>Dirección / ubicación de la tienda</label>
              <input className="input" value={t.direccion || ''} onChange={(e) => set('direccion', e.target.value)} placeholder="Calle, sector, punto de referencia…" />
              <p className="muted tiny" style={{ margin: '6px 0 0' }}>Se le muestra al comprador cuando elige “Entrega en origen” (retiro en tu tienda física).</p>
            </div>
            <div className="field">
              <label>Métodos de envío que ofreces</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {METODOS_ENVIO_LIST.map(([k, label]) => (
                  <label key={k} className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={metodosEnvio.includes(k)} onChange={() => toggleEnvio(k)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p className="muted tiny" style={{ margin: '6px 0 0' }}>El comprador solo verá los que actives.</p>
            </div>
            <div className="field">
              <label>Costo del delivery ($)</label>
              <input className="input" type="number" step="0.01" value={t.costo_delivery ?? ''} onChange={(e) => set('costo_delivery', e.target.value)} style={{ maxWidth: 200 }} />
              <p className="muted tiny" style={{ margin: '6px 0 0' }}>Solo aplica al método “Delivery”; se suma al total del pedido.</p>
            </div>
            <hr className="divider" />

            <div className="field">
              <label>Tasa del día (Bs por $1)</label>
              <input className="input" type="number" step="0.01" value={t.tasa_bs || ''} onChange={(e) => set('tasa_bs', e.target.value)} style={{ maxWidth: 200 }} />
            </div>
            <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
          </form>
        </div>

        {/* Columna lateral: métodos de pago */}
        <div className="cfg-side">
          <div className="card" style={{ marginTop: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block' }}>Métodos de pago</label>
            <p className="muted tiny" style={{ margin: '6px 0 12px' }}>El comprador verá el método que elija al pagar. Puedes agregar varios del mismo tipo.</p>
            <button type="button" className="btn btn-primary btn-sm btn-block" onClick={abrirAgregar}>+ Agregar método de pago</button>

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {metodos.length === 0 && <p className="muted tiny" style={{ margin: 0 }}>Aún no has agregado métodos de pago.</p>}
              {metodos.map((m, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 12px' }}>
                  <div className="row" style={{ alignItems: 'center', gap: 6 }}>
                    <span style={{ background: 'var(--brand-soft)', color: 'var(--brand)', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                      {LABEL[m.tipo] || m.tipo}
                    </span>
                    <div className="spacer" />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => abrirEditar(idx)} title="Editar">✎</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => eliminarMetodo(idx)} title="Eliminar">✕</button>
                  </div>
                  <div className="muted tiny" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{m.datos}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: elegir tipo y datos del método */}
      {modal && (
        <div
          onClick={() => setModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: '100%', maxWidth: 440 }}>
            <div className="row" style={{ alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editIdx == null ? 'Agregar método de pago' : 'Editar método de pago'}</h3>
              <div className="spacer" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label>Tipo de método</label>
              <select className="input" value={mTipo} onChange={(e) => setMTipo(e.target.value)}>
                {METODOS_PAGO.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Datos</label>
              <textarea rows={3} value={mDatos} onChange={(e) => setMDatos(e.target.value)} placeholder={PLACE[mTipo]} />
            </div>
            <div className="row" style={{ gap: 8, marginTop: 4 }}>
              <button type="button" className="btn btn-primary" disabled={!mDatos.trim() || guardandoM} onClick={guardarModal}>
                {guardandoM ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .cfg-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 22px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cfg-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
