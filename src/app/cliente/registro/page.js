'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setClienteToken } from '@/lib/api';
import MedidorClave from '@/components/cliente/MedidorClave';

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', clave: '' });
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function registrar(e) {
    e.preventDefault();
    setError('');
    if (!acepta) { setError('Debes aceptar los Términos y Condiciones y la Política de Privacidad.'); return; }
    if (form.clave.length < 6) { setError('La clave debe tener al menos 6 caracteres.'); return; }
    setCargando(true);
    try {
      const d = await api('/api/cliente/registro', { method: 'POST', body: form, auth: false });
      setClienteToken(d.token);
      router.push('/cliente/perfil');
    } catch (e) { setError(e.message); setCargando(false); }
  }

  return (
    <div className="card" style={{ maxWidth: 460, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Crear cuenta</h1>
      <p className="muted tiny" style={{ marginTop: -6 }}>Una sola cuenta para comprar en cualquier tienda Emprende y guardar tus pedidos.</p>
      {error && <div className="error" style={{ margin: '12px 0' }}>{error}</div>}
      <form onSubmit={registrar}>
        <div className="field"><label>Nombre</label>
          <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required autoFocus /></div>
        <div className="field"><label>Correo</label>
          <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></div>
        <div className="field"><label>Teléfono / WhatsApp</label>
          <input className="input" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="584121234567" /></div>
        <div className="field" style={{ marginBottom: 8 }}><label>Clave</label>
          <input className="input" type="password" value={form.clave} onChange={(e) => set('clave', e.target.value)} required />
          <MedidorClave clave={form.clave} />
        </div>
        <label className="row" style={{ gap: 8, alignItems: 'flex-start', margin: '4px 0 4px', cursor: 'pointer' }}>
          <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} required style={{ marginTop: 3 }} />
          <span className="muted tiny">
            He leído y acepto los{' '}
            <Link href="/legal/terminos" target="_blank" style={{ color: 'var(--brand)', fontWeight: 600 }}>Términos y Condiciones</Link>{' '}
            y la{' '}
            <Link href="/legal/privacidad" target="_blank" style={{ color: 'var(--brand)', fontWeight: 600 }}>Política de Privacidad</Link>.
          </span>
        </label>
        <button className="btn btn-primary btn-block" disabled={cargando || !acepta} style={{ marginTop: 8 }}>{cargando ? 'Creando…' : 'Crear cuenta'}</button>
      </form>
      <p className="muted tiny" style={{ marginTop: 16, textAlign: 'center' }}>
        ¿Ya tienes cuenta? <Link href="/cliente/entrar" style={{ color: 'var(--brand)', fontWeight: 600 }}>Ingresa</Link>
      </p>
      <p className="muted tiny" style={{ marginTop: 6, textAlign: 'center' }}>
        ¿Quieres vender? <Link href="/registro" style={{ color: 'var(--brand)', fontWeight: 600 }}>Crea tu tienda</Link>
      </p>
    </div>
  );
}
