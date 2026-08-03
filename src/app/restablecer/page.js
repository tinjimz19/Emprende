'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Restablecer() {
  const router = useRouter();
  const [tipo, setTipo] = useState('tienda');
  const [token, setToken] = useState('');
  const [clave, setClave] = useState('');
  const [clave2, setClave2] = useState('');
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get('tipo');
    if (t === 'cliente' || t === 'tienda') setTipo(t);
    setToken(q.get('token') || '');
  }, []);

  const loginHref = tipo === 'cliente' ? '/cliente/entrar' : '/login';

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (clave.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (clave !== clave2) { setError('Las contraseñas no coinciden.'); return; }
    setCargando(true);
    try {
      const path = tipo === 'cliente' ? '/api/cliente/recuperar/confirmar' : '/api/auth/recuperar/confirmar';
      await api(path, { method: 'POST', auth: false, body: { token, clave } });
      setListo(true);
      setTimeout(() => router.push(loginHref), 2500);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }

  return (
    <main className="container narrow" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <div className="card" style={{ maxWidth: 440, margin: '0 auto', padding: 28 }}>
        <Link className="logo" href="/"><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="logo-img" /> Emprende</Link>
        <h1 style={{ fontSize: 22, margin: '18px 0 4px' }}>Nueva contraseña</h1>
        {listo ? (
          <div className="alert ok-box" style={{ margin: '14px 0' }}>¡Listo! Tu contraseña fue actualizada. Te llevamos a iniciar sesión…</div>
        ) : !token ? (
          <div className="alert error" style={{ margin: '14px 0' }}>Enlace inválido. Solicita uno nuevo desde “Recuperar contraseña”.</div>
        ) : (
          <>
            <p className="muted tiny" style={{ marginTop: -2 }}>Escribe tu nueva contraseña.</p>
            {error && <div className="alert error" style={{ margin: '14px 0' }}>{error}</div>}
            <form onSubmit={enviar} style={{ marginTop: 16 }}>
              <div className="field">
                <label>Nueva contraseña</label>
                <input className="input" type="password" value={clave} onChange={(e) => setClave(e.target.value)} required minLength={6} autoFocus />
              </div>
              <div className="field">
                <label>Repite la contraseña</label>
                <input className="input" type="password" value={clave2} onChange={(e) => setClave2(e.target.value)} required minLength={6} />
              </div>
              <button className="btn btn-primary btn-block btn-lg" disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar contraseña'}</button>
            </form>
            <p className="muted tiny" style={{ textAlign: 'center', marginTop: 14 }}>
              <Link href={loginHref} style={{ color: 'var(--brand)', fontWeight: 600 }}>Volver a iniciar sesión</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
