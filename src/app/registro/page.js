'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ tienda_nombre: '', nombre: '', email: '', password: '', whatsapp: '' });
  const [rubros, setRubros] = useState([]);
  const [rubroIds, setRubroIds] = useState([]);
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api('/api/rubros', { auth: false }).then((d) => setRubros(d.rubros || [])).catch(() => {});
  }, []);

  function set(k, v) { setForm({ ...form, [k]: v }); }
  function toggleRubro(id) {
    setRubroIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!acepta) { setError('Debes aceptar los Términos y Condiciones y la Política de Privacidad.'); return; }
    setCargando(true);
    try {
      const data = await api('/api/auth/registro', { method: 'POST', body: { ...form, rubro_ids: rubroIds }, auth: false });
      setToken(data.token);
      router.push('/panel');
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
        <h1 style={{ marginTop: 0, fontSize: 24 }}>Crear mi tienda</h1>
        <p className="muted tiny" style={{ marginTop: -4 }}>Listo en un minuto. Sin tarjetas ni complicaciones.</p>
        {error && <div className="alert error" style={{ margin: '14px 0' }}>{error}</div>}
        <form onSubmit={enviar} style={{ marginTop: 18 }}>
          <div className="field">
            <label>Nombre de la tienda</label>
            <input className="input" value={form.tienda_nombre} onChange={(e) => set('tienda_nombre', e.target.value)} required autoFocus />
          </div>
          {rubros.length > 0 && (
            <div className="field">
              <label>Rubros de tu tienda</label>
              <p className="muted tiny" style={{ margin: '-2px 0 8px' }}>Elige uno o varios. Ayudan a que te encuentren en el directorio de tiendas.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {rubros.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    className={`chip ${rubroIds.includes(r.id) ? 'active' : ''}`}
                    onClick={() => toggleRubro(r.id)}
                  >
                    {r.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="field">
            <label>Tu nombre</label>
            <input className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
          </div>
          <div className="field">
            <label>WhatsApp (con código de país)</label>
            <input className="input" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="584121234567" />
          </div>
          <div className="field">
            <label>Correo</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} />
          </div>
          <label className="row" style={{ gap: 8, alignItems: 'flex-start', margin: '4px 0 16px', cursor: 'pointer' }}>
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} required style={{ marginTop: 3 }} />
            <span className="muted tiny">
              He leído y acepto los{' '}
              <Link href="/legal/terminos" target="_blank" style={{ color: 'var(--brand)', fontWeight: 600 }}>Términos y Condiciones</Link>{' '}
              y la{' '}
              <Link href="/legal/privacidad" target="_blank" style={{ color: 'var(--brand)', fontWeight: 600 }}>Política de Privacidad</Link>.
            </span>
          </label>
          <button className="btn btn-primary btn-block btn-lg" disabled={cargando || !acepta}>
            {cargando ? 'Creando…' : 'Crear tienda'}
          </button>
        </form>
      </div>
      <p className="muted" style={{ textAlign: 'center', marginTop: 18 }}>
        ¿Ya tienes cuenta? <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Entra aquí</Link>
      </p>
      <p className="muted tiny" style={{ textAlign: 'center', marginTop: 6 }}>
        ¿Solo quieres comprar? <Link href="/cliente/registro" style={{ color: 'var(--brand)', fontWeight: 600 }}>Crea tu cuenta de cliente</Link>
      </p>
    </main>
  );
}
