'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function Recuperar() {
  const [tipo, setTipo] = useState('tienda');
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tipo');
    if (t === 'cliente' || t === 'tienda') setTipo(t);
  }, []);

  const loginHref = tipo === 'cliente' ? '/cliente/entrar' : '/login';

  async function enviar(e) {
    e.preventDefault();
    setError(''); setCargando(true);
    try {
      const path = tipo === 'cliente' ? '/api/cliente/recuperar' : '/api/auth/recuperar';
      await api(path, { method: 'POST', auth: false, body: { email } });
      setEnviado(true);
    } catch (err) { setError(err.message); }
    finally { setCargando(false); }
  }

  return (
    <main className="container narrow" style={{ paddingTop: 60, paddingBottom: 60 }}>
      <div className="card" style={{ maxWidth: 440, margin: '0 auto', padding: 28 }}>
        <Link className="logo" href="/"><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="logo-img" /> Emprende</Link>
        <h1 style={{ fontSize: 22, margin: '18px 0 4px' }}>Recuperar contraseña</h1>
        {enviado ? (
          <>
            <div className="alert ok-box" style={{ margin: '14px 0' }}>
              Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja (y la carpeta de spam).
            </div>
            <Link className="btn btn-ghost btn-block" href={loginHref}>Volver a iniciar sesión</Link>
          </>
        ) : (
          <>
            <p className="muted tiny" style={{ marginTop: -2 }}>Te enviaremos un enlace a tu correo para crear una nueva.</p>
            {error && <div className="alert error" style={{ margin: '14px 0' }}>{error}</div>}
            <form onSubmit={enviar} style={{ marginTop: 16 }}>
              <div className="field">
                <label>Correo de tu cuenta {tipo === 'cliente' ? 'de comprador' : 'de tienda'}</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <button className="btn btn-primary btn-block btn-lg" disabled={cargando}>{cargando ? 'Enviando…' : 'Enviar enlace'}</button>
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
