'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function fmt(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0, 16);
  return d.toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SeguridadPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);

  async function cargar() {
    try { setData(await api('/api/auth/seguridad')); } catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); }, []);

  async function confiar(e) {
    e.preventDefault(); setError(''); setOk(''); setBusy(true);
    try {
      await api('/api/auth/confiar', { method: 'POST', body: { password: pw } });
      setPw(''); setPwOpen(false); setOk('Este dispositivo quedó como permanente ✓');
      await cargar();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function desconfiar() {
    setError(''); setOk(''); setBusy(true);
    try { await api('/api/auth/desconfiar', { method: 'POST' }); setOk('Se quitó el permanente de este dispositivo.'); await cargar(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function cerrar(id) {
    setError(''); setBusy(true);
    try { await api(`/api/auth/sesiones/${id}`, { method: 'DELETE' }); await cargar(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function cerrarOtras() {
    setError(''); setOk(''); setBusy(true);
    try { await api('/api/auth/sesiones/cerrar-otras', { method: 'POST' }); setOk('Se cerraron las demás sesiones.'); await cargar(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (!data) {
    return <div className="card" style={{ marginTop: 18 }}><p className="muted" style={{ margin: 0 }}>{error ? <span className="error">{error}</span> : 'Cargando…'}</p></div>;
  }

  const permanente = !!data.este_dispositivo?.es_confiable;
  const sesiones = data.sesiones || [];

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <h3 style={{ marginTop: 0 }}>Seguridad y dispositivos</h3>
      <p className="muted tiny" style={{ marginTop: -4 }}>
        Cuando inicias sesión desde un dispositivo nuevo, te enviamos un código por correo. Marca como permanentes solo los dispositivos de tu confianza para no pedir el código en ellos.
      </p>
      {error && <div className="error" style={{ margin: '12px 0' }}>{error}</div>}
      {ok && <div className="ok-box" style={{ margin: '12px 0' }}>{ok}</div>}

      <div className="row" style={{ alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <div>
          <b>Este dispositivo</b>{' '}
          {permanente
            ? <span className="badge badge-ok">Permanente</span>
            : <span className="badge">Pide código al iniciar sesión</span>}
        </div>
        <div className="spacer" />
        {permanente
          ? <button className="btn btn-ghost btn-sm" onClick={desconfiar} disabled={busy} style={{ color: 'var(--danger)' }}>Quitar permanente</button>
          : <button className="btn btn-primary btn-sm" onClick={() => setPwOpen((v) => !v)} disabled={busy}>Marcar como permanente</button>}
      </div>

      {pwOpen && !permanente && (
        <form onSubmit={confiar} className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input className="input" type="password" placeholder="Confirma tu contraseña" value={pw} onChange={(e) => setPw(e.target.value)} required style={{ maxWidth: 260 }} />
          <button className="btn btn-primary btn-sm" disabled={busy || !pw}>{busy ? 'Guardando…' : 'Confirmar'}</button>
        </form>
      )}

      <div className="row" style={{ alignItems: 'baseline', marginTop: 22 }}>
        <h4 style={{ margin: 0 }}>Sesiones activas</h4>
        <div className="spacer" />
        {sesiones.length > 1 && <button className="btn btn-ghost btn-sm" onClick={cerrarOtras} disabled={busy} style={{ color: 'var(--danger)' }}>Cerrar las demás</button>}
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sesiones.map((s) => (
          <div key={s.id} className="row" style={{ alignItems: 'center', gap: 10, border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {s.nombre || 'Dispositivo'}
                {Number(s.actual) ? <span className="badge badge-brand" style={{ marginLeft: 8 }}>Este dispositivo</span> : null}
                {Number(s.es_confiable) ? <span className="badge badge-ok" style={{ marginLeft: 6 }}>Permanente</span> : null}
              </div>
              <div className="muted tiny">{s.ip || 'IP desconocida'} · {fmt(s.ultima_actividad || s.created_at)}</div>
            </div>
            <div className="spacer" />
            {!Number(s.actual) && <button className="btn btn-ghost btn-sm" onClick={() => cerrar(s.id)} disabled={busy} style={{ color: 'var(--danger)' }}>Cerrar</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
