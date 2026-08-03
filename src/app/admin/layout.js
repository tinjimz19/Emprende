'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [estado, setEstado] = useState('cargando');

  useEffect(() => {
    api('/api/auth/me')
      .then((data) => {
        if (data.usuario?.rol !== 'superadmin') { router.replace('/panel'); return; }
        setEstado('ok');
      })
      .catch(() => { router.replace('/login'); });
  }, [router]);

  async function salir() {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    setToken(null);
    router.replace('/login');
  }

  if (estado !== 'ok') return <div className="container muted" style={{ paddingTop: 80 }}>Cargando…</div>;

  return (
    <>
      <header className="topbar">
        <div className="container inner">
          <Link className="logo" href="/admin"><span className="dot" /> Emprende <span className="badge badge-brand" style={{ marginLeft: 4 }}>Admin</span></Link>
          <div className="row" style={{ gap: 10 }}>
            <ThemeToggle />
            <button className="btn btn-soft btn-sm" onClick={salir}>Salir</button>
          </div>
        </div>
      </header>
      <main className="container" style={{ padding: '28px 22px 60px' }}>{children}</main>
    </>
  );
}
