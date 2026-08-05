'use client';
import { useEffect, useState } from 'react';
import { api, API_BASE, getToken } from '@/lib/api';
import Verificado from '@/components/Verificado';

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconReloj = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);

export default function Verificacion() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [doc, setDoc] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [cedula, setCedula] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    try { setData(await api('/api/verificacion')); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { cargar(); }, []);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!doc || !selfie) { setError('Sube la foto de tu cédula y una selfie.'); return; }
    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('numero_cedula', cedula);
      fd.append('documento', doc);
      fd.append('selfie', selfie);
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/verificacion`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json().catch(() => ({ ok: false, error: 'Error de red' }));
      if (!res.ok || json.ok === false) throw new Error(json.error || 'No se pudo enviar');
      setDoc(null); setSelfie(null); setCedula('');
      await cargar();
    } catch (e) { setError(e.message); }
    finally { setEnviando(false); }
  }

  if (!data) return <p className="muted">{error ? <span className="error">{error}</span> : 'Cargando…'}</p>;
  const estado = data.estado;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Verificación de tu tienda</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        Verificamos tu identidad para dar confianza a los compradores. Una vez verificada, tu tienda podrá
        publicar sus productos y mostrará la insignia de verificado junto a su nombre.
      </p>

      {estado === 'verificada' && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--brand)' }}>
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <Verificado size={28} />
            <div>
              <h3 style={{ margin: 0 }}>Tienda verificada</h3>
              <p className="muted tiny" style={{ margin: '2px 0 0' }}>
                Ya puedes publicar tus productos.{data.verificada_at ? ` Verificada el ${String(data.verificada_at).slice(0, 10)}.` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {estado === 'pendiente' && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--warn)' }}><IconReloj /></span>
            <div>
              <h3 style={{ margin: 0 }}>En revisión</h3>
              <p className="muted" style={{ margin: '2px 0 0' }}>
                Recibimos tus documentos. El equipo los revisará pronto y te avisaremos por notificación.
                Mientras tanto, puedes seguir preparando tus productos.
              </p>
            </div>
          </div>
        </div>
      )}

      {(estado === 'sin_verificar' || estado === 'rechazada') && (
        <>
          {estado === 'rechazada' && data.motivo && (
            <div className="alert error" style={{ marginTop: 16 }}>
              Tu verificación anterior fue rechazada. Motivo: {data.motivo}. Vuelve a enviar tus documentos corregidos.
            </div>
          )}
          <form className="card" style={{ marginTop: 16 }} onSubmit={enviar}>
            <div className="field">
              <label>Número de cédula (opcional)</label>
              <input className="input" value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="V-12.345.678" />
            </div>
            <div className="field">
              <label>Foto de tu cédula</label>
              <input type="file" accept="image/*" onChange={(e) => setDoc(e.target.files[0] || null)} />
              <p className="muted tiny" style={{ margin: '6px 0 0' }}>Foto clara del frente de tu cédula de identidad.</p>
            </div>
            <div className="field">
              <label>Selfie con tu cédula</label>
              <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files[0] || null)} />
              <p className="muted tiny" style={{ margin: '6px 0 0' }}>Una selfie sosteniendo tu cédula junto a tu rostro.</p>
            </div>
            {error && <div className="error" style={{ marginBottom: 10 }}>{error}</div>}
            <button className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar para verificación'}</button>
            <p className="muted tiny" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, margin: '12px 0 0' }}>
              <IconLock />
              Tus documentos se guardan de forma privada y solo los revisa el equipo de Emprende para confirmar tu
              identidad. No se muestran en tu tienda ni a los compradores.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
