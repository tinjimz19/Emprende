'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setClienteToken } from '@/lib/api';

export default function Entrar() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', clave: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError(''); setCargando(true);
    try {
      const d = await api('/api/cliente/login', { method: 'POST', body: form, auth: false });
      setClienteToken(d.token);
      router.push('/cliente/perfil');
    } catch (e) { setError(e.message); setCargando(false); }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Ingresar</h1>
      <p className="muted tiny" style={{ marginTop: -6 }}>Entra a tu cuenta para ver tu historial de pedidos.</p>
      {error && <div className="error" style={{ margin: '12px 0' }}>{error}</div>}
      <form onSubmit={entrar}>
        <div className="field"><label>Correo</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoFocus /></div>
        <div className="field"><label>Clave</label>
          <input className="input" type="password" value={form.clave} onChange={(e) => setForm({ ...form, clave: e.target.value })} required /></div>
        <button className="btn btn-primary btn-block" disabled={cargando}>{cargando ? 'Entrando…' : 'Ingresar'}</button>
      </form>
      <p className="muted tiny" style={{ marginTop: 16, textAlign: 'center' }}>
        ¿No tienes cuenta? <Link href="/cliente/registro" style={{ color: 'var(--brand)', fontWeight: 600 }}>Regístrate</Link>
      </p>
      <p className="muted tiny" style={{ marginTop: 6, textAlign: 'center' }}>
        ¿Quieres vender? <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Entra como vendedor</Link>
      </p>
    </div>
  );
}
