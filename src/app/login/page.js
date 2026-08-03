'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: form, auth: false });
      setToken(data.token);
      router.push(data.usuario?.rol === 'superadmin' ? '/admin' : '/panel');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="container narrow" style={{ paddingTop: 40, paddingBottom: 50 }}>
      <div className="row">
        <Link className="logo" href="/"><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="logo-img" /> Emprende</Link>
        <div className="spacer" />
        <ThemeToggle />
      </div>

      <div className="card" style={{ marginTop: 34, padding: 28 }}>
        <h1 style={{ marginTop: 0, fontSize: 24 }}>Entrar</h1>
        <p className="muted tiny" style={{ marginTop: -4 }}>Accede al panel de tu tienda.</p>
        {error && <div className="alert error" style={{ margin: '14px 0' }}>{error}</div>}
        <form onSubmit={enviar} style={{ marginTop: 18 }}>
          <div className="field">
            <label>Correo</label>
            <input className="input" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required autoFocus />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary btn-block btn-lg" disabled={cargando}>
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
      <p className="muted tiny" style={{ textAlign: 'center', marginTop: 18 }}>
        <Link href="/recuperar?tipo=tienda" style={{ color: 'var(--brand)', fontWeight: 600 }}>¿Olvidaste tu contraseña?</Link>
      </p>
      <p className="muted" style={{ textAlign: 'center', marginTop: 18 }}>
        ¿No tienes tienda? <Link href="/registro" style={{ color: 'var(--brand)', fontWeight: 600 }}>Créala aquí</Link>
      </p>
      <p className="muted tiny" style={{ textAlign: 'center', marginTop: 6 }}>
        ¿Solo quieres comprar? <Link href="/cliente/entrar" style={{ color: 'var(--brand)', fontWeight: 600 }}>Entra como cliente</Link>
      </p>
    </main>
  );
}
