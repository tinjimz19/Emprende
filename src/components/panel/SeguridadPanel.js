'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function fmt(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0, 16);
  return d.toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Ícono genérico (admite múltiples subtrazos en el mismo path).
const I = ({ d, size = 16, w = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d={d} /></svg>
);
const P = {
  escudo: 'M12 2l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V5l8-3z',
  check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',
  alerta: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  monitor: 'M2 3h20v14H2zM8 21h8M12 17v4',
  candado: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  correo: 'M4 4h16v16H4zM22 6l-10 7L2 6',
};

function Alerta({ tipo, children }) {
  const ok = tipo === 'ok';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9, margin: '12px 0',
      padding: '10px 13px', borderRadius: 11, fontSize: 13.5, fontWeight: 500,
      color: ok ? 'var(--ok)' : 'var(--danger)',
      background: ok ? 'var(--ok-soft, rgba(26,127,67,.12))' : 'var(--danger-soft, rgba(220,38,38,.12))',
      border: `1px solid ${ok ? 'var(--ok, #1a7f43)' : 'var(--danger, #dc2626)'}`,
    }}>
      <I d={ok ? P.check : P.alerta} size={18} />
      <span>{children}</span>
    </div>
  );
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
      setPw(''); setPwOpen(false); setOk('Este dispositivo quedó marcado como permanente.');
      await cargar();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function desconfiar() {
    setError(''); setOk(''); setBusy(true);
    try { await api('/api/auth/desconfiar', { method: 'POST' }); setOk('Se quitó el permanente de este dispositivo.'); await cargar(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function cerrar(id) {
    setError(''); setOk(''); setBusy(true);
    try { await api(`/api/auth/sesiones/${id}`, { method: 'DELETE' }); setOk('Sesión cerrada.'); await cargar(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function cerrarOtras() {
    setError(''); setOk(''); setBusy(true);
    try { await api('/api/auth/sesiones/cerrar-otras', { method: 'POST' }); setOk('Se cerraron las demás sesiones.'); await cargar(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (!data) {
    return (
      <div className="card" style={{ marginTop: 18 }}>
        {error ? <Alerta tipo="err">{error}</Alerta> : <p className="muted" style={{ margin: 0 }}>Cargando…</p>}
      </div>
    );
  }

  const permanente = !!data.este_dispositivo?.es_confiable;
  const sesiones = data.sesiones || [];

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--brand)' }}><I d={P.escudo} size={18} /></span>
        Seguridad y dispositivos
      </h3>
      <p className="muted tiny" style={{ marginTop: -2, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span style={{ color: 'var(--text-3)', marginTop: 1 }}><I d={P.correo} size={14} /></span>
        Al iniciar sesión desde un dispositivo nuevo te enviamos un código por correo. Marca como permanentes solo los dispositivos de tu confianza para no pedir el código en ellos.
      </p>

      {error && <Alerta tipo="err">{error}</Alerta>}
      {ok && <Alerta tipo="ok">{ok}</Alerta>}

      <div className="row" style={{ alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-2)' }}><I d={P.monitor} size={18} /></span>
          <b>Este dispositivo</b>
          {permanente
            ? <span className="badge badge-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I d={P.candado} size={12} /> Permanente</span>
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
        {permanente && sesiones.length > 1 && <button className="btn btn-ghost btn-sm" onClick={cerrarOtras} disabled={busy} style={{ color: 'var(--danger)' }}>Cerrar las demás</button>}
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sesiones.map((s) => (
          <div key={s.id} className="row" style={{ alignItems: 'center', gap: 10, border: '1px solid var(--border-soft)', borderRadius: 12, padding: '10px 12px' }}>
            <span style={{ color: 'var(--text-3)' }}><I d={P.monitor} size={18} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {s.nombre || 'Dispositivo'}
                {Number(s.actual) ? <span className="badge badge-brand">Este dispositivo</span> : null}
                {Number(s.es_confiable) ? <span className="badge badge-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><I d={P.candado} size={11} /> Permanente</span> : null}
              </div>
              <div className="muted tiny">{s.ip || 'IP desconocida'} · {fmt(s.ultima_actividad || s.created_at)}</div>
            </div>
            <div className="spacer" />
            {!Number(s.actual) && (
              (Number(s.es_confiable) && !permanente)
                ? <span className="muted tiny" title="Solo un dispositivo permanente puede cerrarla" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}><I d={P.candado} size={13} /> Protegida</span>
                : <button className="btn btn-ghost btn-sm" onClick={() => cerrar(s.id)} disabled={busy} style={{ color: 'var(--danger)' }}>Cerrar</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
