'use client';
import { useEffect, useState } from 'react';
import { soportaPush, estaSuscrito, activarPush, desactivarPush } from '@/lib/push';

/**
 * Botón para activar/desactivar notificaciones push en este dispositivo.
 * `cliente`: true para compradores (token de cliente), false para dueños (token de panel).
 */
export default function BotonNotificaciones({ cliente = false }) {
  const [soporta, setSoporta] = useState(true);
  const [activo, setActivo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!soportaPush()) { setSoporta(false); return; }
    estaSuscrito().then(setActivo).catch(() => {});
  }, []);

  if (!soporta) return <p className="muted tiny" style={{ margin: 0 }}>Este navegador no soporta notificaciones push.</p>;

  async function toggle() {
    setCargando(true); setMsg('');
    try {
      if (activo) { await desactivarPush(cliente); setActivo(false); setMsg('Notificaciones desactivadas en este dispositivo.'); }
      else { await activarPush(cliente); setActivo(true); setMsg('¡Listo! Recibirás notificaciones en este dispositivo.'); }
    } catch (e) { setMsg(e.message); }
    finally { setCargando(false); }
  }

  return (
    <div>
      <button className={`btn ${activo ? 'btn-soft' : 'btn-primary'} btn-sm`} onClick={toggle} disabled={cargando} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        {cargando ? 'Un momento…' : (activo ? 'Notificaciones activadas' : 'Activar notificaciones')}
      </button>
      {msg && <p className="muted tiny" style={{ margin: '6px 0 0' }}>{msg}</p>}
    </div>
  );
}
