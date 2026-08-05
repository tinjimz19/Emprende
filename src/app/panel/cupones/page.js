'use client';
import { useEffect, useState } from 'react';
import { api, usd } from '@/lib/api';

const VACIO = { codigo: '', tipo: 'porcentaje', valor: '', minimo_compra: '', usos_maximos: '', vence: '', activo: 1 };

function fmtFecha(f) {
  if (!f) return '—';
  const s = String(f).slice(0, 10).split('-'); // YYYY-MM-DD
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : String(f);
}

export default function Cupones() {
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errModal, setErrModal] = useState('');

  async function cargar() {
    setCargando(true);
    try { setCupones((await api('/api/cupones')).cupones || []); }
    catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);

  function abrirNuevo() {
    setEditId(null);
    setForm(VACIO);
    setErrModal('');
    setModal(true);
  }

  function abrirEditar(c) {
    setEditId(c.id);
    setForm({
      codigo: c.codigo || '',
      tipo: c.tipo || 'porcentaje',
      valor: String(c.valor ?? ''),
      minimo_compra: Number(c.minimo_compra) > 0 ? String(c.minimo_compra) : '',
      usos_maximos: c.usos_maximos == null ? '' : String(c.usos_maximos),
      vence: c.vence ? String(c.vence).slice(0, 10) : '',
      activo: Number(c.activo) ? 1 : 0,
    });
    setErrModal('');
    setModal(true);
  }

  async function guardar() {
    setErrModal('');
    setGuardando(true);
    try {
      const body = {
        codigo: form.codigo.trim().toUpperCase(),
        tipo: form.tipo,
        valor: Number(form.valor),
        minimo_compra: form.minimo_compra === '' ? 0 : Number(form.minimo_compra),
        usos_maximos: form.usos_maximos === '' ? null : Number(form.usos_maximos),
        vence: form.vence || null,
        activo: form.activo ? 1 : 0,
      };
      if (editId) await api(`/api/cupones/${editId}`, { method: 'PATCH', body });
      else await api('/api/cupones', { method: 'POST', body });
      setModal(false);
      await cargar();
    } catch (e) { setErrModal(e.message); }
    finally { setGuardando(false); }
  }

  async function toggle(c) {
    try {
      await api(`/api/cupones/${c.id}`, {
        method: 'PATCH',
        body: {
          codigo: c.codigo, tipo: c.tipo, valor: Number(c.valor),
          minimo_compra: Number(c.minimo_compra), usos_maximos: c.usos_maximos == null ? null : Number(c.usos_maximos),
          vence: c.vence ? String(c.vence).slice(0, 10) : null, activo: Number(c.activo) ? 0 : 1,
        },
      });
      await cargar();
    } catch (e) { setError(e.message); }
  }

  async function eliminar(c) {
    if (!confirm(`¿Eliminar el cupón ${c.codigo}?`)) return;
    try { await api(`/api/cupones/${c.id}`, { method: 'DELETE' }); await cargar(); }
    catch (e) { setError(e.message); }
  }

  function descTxt(c) {
    return c.tipo === 'porcentaje' ? `${Number(c.valor)}%` : usd(c.valor);
  }

  return (
    <>
      <div className="row">
        <h1 style={{ margin: 0 }}>Cupones</h1>
        <div className="spacer" />
        <button className="btn btn-primary btn-sm" onClick={abrirNuevo}>+ Nuevo cupón</button>
      </div>
      <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>
        Crea códigos de descuento para tus promociones. El comprador los escribe en el carrito y el descuento se aplica al total.
      </p>
      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      <div className="card prod-tabla-desktop" style={{ marginTop: 14, padding: 0 }}>
        <table className="table">
          <thead>
            <tr><th>Código</th><th>Descuento</th><th>Mínimo</th><th>Usos</th><th>Vence</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={7} className="muted" style={{ padding: 24 }}>Cargando…</td></tr>}
            {!cargando && cupones.length === 0 && (
              <tr><td colSpan={7} className="muted" style={{ padding: 24 }}>
                Aún no tienes cupones. <button className="btn btn-ghost btn-sm" onClick={abrirNuevo}>Crea el primero</button>
              </td></tr>
            )}
            {cupones.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700, letterSpacing: '.02em' }}>{c.codigo}</td>
                <td className="price">{descTxt(c)}</td>
                <td>{Number(c.minimo_compra) > 0 ? usd(c.minimo_compra) : '—'}</td>
                <td>{c.usos}/{c.usos_maximos == null ? '∞' : c.usos_maximos}</td>
                <td>{fmtFecha(c.vence)}</td>
                <td>
                  <span className="badge" style={Number(c.activo)
                    ? { background: '#e7f6ec', color: '#1a7f43' }
                    : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                    {Number(c.activo) ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(c)}>Editar</button>{' '}
                  <button className="btn btn-ghost btn-sm" onClick={() => toggle(c)}>{Number(c.activo) ? 'Desactivar' : 'Activar'}</button>{' '}
                  <button className="btn btn-ghost btn-sm" onClick={() => eliminar(c)} style={{ color: 'var(--danger)' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prod-movil">
        {cargando && <div className="card"><p className="muted" style={{ margin: 0 }}>Cargando…</p></div>}
        {!cargando && cupones.length === 0 && (
          <div className="card"><p className="muted" style={{ margin: 0 }}>
            Aún no tienes cupones. <button className="btn btn-ghost btn-sm" onClick={abrirNuevo}>Crea el primero</button>
          </p></div>
        )}
        {cupones.map((c) => (
          <div className="pm-card" key={c.id}>
            <div className="pm-body">
              <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                <span className="pm-name" style={{ letterSpacing: '.02em' }}>{c.codigo}</span>
                <span className="badge" style={Number(c.activo)
                  ? { background: '#e7f6ec', color: '#1a7f43' }
                  : { background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                  {Number(c.activo) ? 'Activo' : 'Inactivo'}
                </span>
                <div className="spacer" />
                <span className="price">{descTxt(c)}</span>
              </div>
              <span className="pm-meta">
                {Number(c.minimo_compra) > 0 ? `Mín. ${usd(c.minimo_compra)} · ` : ''}
                Usos {c.usos}/{c.usos_maximos == null ? '∞' : c.usos_maximos}
                {c.vence ? ` · Vence ${fmtFecha(c.vence)}` : ''}
              </span>
              <div className="pm-acciones">
                <button className="btn btn-ghost btn-sm" onClick={() => abrirEditar(c)}>Editar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => toggle(c)}>{Number(c.activo) ? 'Desactivar' : 'Activar'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => eliminar(c)} style={{ color: 'var(--danger)' }}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div
          onClick={() => !guardando && setModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="row" style={{ alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{editId ? 'Editar cupón' : 'Nuevo cupón'}</h3>
              <div className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)} disabled={guardando}>✕</button>
            </div>

            {errModal && <div className="error" style={{ marginTop: 12 }}>{errModal}</div>}

            <div className="field" style={{ marginTop: 12 }}>
              <label>Código</label>
              <input className="input" value={form.codigo} placeholder="Ej. VERANO10"
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} style={{ letterSpacing: '.03em', fontWeight: 600 }} />
              <p className="muted tiny" style={{ margin: '6px 0 0' }}>3 a 40 caracteres: letras, números o guiones.</p>
            </div>

            <div className="row" style={{ gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Tipo</label>
                <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="monto">Monto fijo ($)</option>
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>{form.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto ($)'}</label>
                <input className="input" type="number" min="0" step={form.tipo === 'porcentaje' ? '1' : '0.01'} max={form.tipo === 'porcentaje' ? '100' : undefined}
                  value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder={form.tipo === 'porcentaje' ? '10' : '5.00'} />
              </div>
            </div>

            <div className="row" style={{ gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Mínimo de compra ($)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.minimo_compra}
                  onChange={(e) => setForm({ ...form, minimo_compra: e.target.value })} placeholder="0 = sin mínimo" />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Límite de usos</label>
                <input className="input" type="number" min="1" step="1" value={form.usos_maximos}
                  onChange={(e) => setForm({ ...form, usos_maximos: e.target.value })} placeholder="Vacío = ilimitado" />
              </div>
            </div>

            <div className="field">
              <label>Vence el (opcional)</label>
              <input className="input" type="date" value={form.vence} onChange={(e) => setForm({ ...form, vence: e.target.value })} />
            </div>

            <label className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer', margin: '4px 0 8px' }}>
              <input type="checkbox" checked={!!form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked ? 1 : 0 })} />
              <span>Cupón activo</span>
            </label>

            <div className="row" style={{ gap: 8, marginTop: 6 }}>
              <button className="btn btn-primary" disabled={guardando || !form.codigo.trim() || !form.valor} onClick={guardar}>
                {guardando ? 'Guardando…' : (editId ? 'Guardar cambios' : 'Crear cupón')}
              </button>
              <button className="btn btn-ghost" onClick={() => setModal(false)} disabled={guardando}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
