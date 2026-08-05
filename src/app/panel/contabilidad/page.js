'use client';
import { useEffect, useState } from 'react';
import { api, usd } from '@/lib/api';

export default function Contabilidad() {
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [resumen, setResumen] = useState(null);
  const [movs, setMovs] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ tipo: 'gasto', categoria: '', descripcion: '', monto: '', fecha: '' });

  async function cargar() {
    try {
      const [r, m] = await Promise.all([
        api(`/api/contabilidad/resumen?mes=${mes}`),
        api(`/api/contabilidad/movimientos?mes=${mes}`),
      ]);
      setResumen(r);
      setMovs(m.movimientos);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); }, [mes]);

  async function agregar(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/contabilidad/movimientos', { method: 'POST', body: { ...form, monto: Number(form.monto || 0) } });
      setForm({ tipo: 'gasto', categoria: '', descripcion: '', monto: '', fecha: '' });
      await cargar();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <div className="row">
        <h1 style={{ margin: 0 }}>Contabilidad</h1>
        <div className="spacer" />
        <input className="input" type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ width: 170 }} />
      </div>
      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      {resumen && (
        <div className="grid grid-stats" style={{ marginTop: 18 }}>
          <div className="card stat"><div className="muted" style={{ fontSize: 13 }}>Ingresos</div><div className="n" style={{ color: 'var(--ok)' }}>{usd(resumen.ingresos)}</div></div>
          <div className="card stat"><div className="muted" style={{ fontSize: 13 }}>Gastos</div><div className="n" style={{ color: 'var(--danger)' }}>{usd(resumen.gastos)}</div></div>
          <div className="card stat"><div className="muted" style={{ fontSize: 13 }}>Ganancia</div><div className="n">{usd(resumen.ganancia)}</div></div>
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Registrar movimiento</h3>
        <form onSubmit={agregar}>
          <div className="row form-inline" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: '0 0 130px', marginBottom: 0 }}>
              <label>Tipo</label>
              <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>
            <div className="field" style={{ flex: '1 1 140px', marginBottom: 0 }}>
              <label>Categoría</label>
              <input className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="compra_inventario" />
            </div>
            <div className="field" style={{ flex: '2 1 200px', marginBottom: 0 }}>
              <label>Descripción</label>
              <input className="input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="field" style={{ flex: '0 0 110px', marginBottom: 0 }}>
              <label>Monto ($)</label>
              <input className="input" type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required />
            </div>
            <button className="btn btn-primary">Agregar</button>
          </div>
        </form>
      </div>

      <div className="card prod-tabla-desktop" style={{ marginTop: 18, padding: 0 }}>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th style={{ textAlign: 'right' }}>Monto</th></tr></thead>
          <tbody>
            {movs.length === 0 && <tr><td colSpan={5} className="muted" style={{ padding: 24 }}>Sin movimientos este mes.</td></tr>}
            {movs.map((m) => (
              <tr key={m.id}>
                <td>{m.fecha}</td>
                <td><span className={`badge ${m.tipo === 'ingreso' ? 'badge-ok' : 'badge-danger'}`}>{m.tipo}</span></td>
                <td>{m.categoria || '—'}</td>
                <td>{m.descripcion || '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{usd(m.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prod-movil">
        {movs.length === 0 && <div className="card"><p className="muted" style={{ margin: 0 }}>Sin movimientos este mes.</p></div>}
        {movs.map((m) => (
          <div className="pm-card" key={m.id}>
            <div className="pm-body">
              <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                <span className={`badge ${m.tipo === 'ingreso' ? 'badge-ok' : 'badge-danger'}`}>{m.tipo}</span>
                <span className="pm-name" style={{ fontWeight: 600 }}>{m.categoria || '—'}</span>
                <div className="spacer" />
                <span className="price" style={{ whiteSpace: 'nowrap', color: m.tipo === 'ingreso' ? 'var(--ok)' : 'var(--danger)' }}>{usd(m.monto)}</span>
              </div>
              <span className="pm-meta">{m.fecha}{m.descripcion ? ` · ${m.descripcion}` : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
