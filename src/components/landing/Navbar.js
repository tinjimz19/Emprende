'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getToken, getClienteToken } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

const LINKS = [
  ['#productos', 'Explorar'],
  ['#vender', 'Vender'],
  ['#planes', 'Planes'],
];

export default function Navbar() {
  const [abierto, setAbierto] = useState(false);
  const [sesion, setSesion] = useState(null); // 'panel' | 'cliente' | null

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (getToken()) setSesion('panel');
    else if (getClienteToken()) setSesion('cliente');
  }, []);

  function AuthBtns({ block }) {
    const b = block ? ' btn-block' : '';
    if (sesion === 'panel') return <Link className={`btn btn-primary btn-sm${b}`} href="/panel" onClick={() => setAbierto(false)}>Mi panel</Link>;
    if (sesion === 'cliente') return <Link className={`btn btn-primary btn-sm${b}`} href="/cliente/perfil" onClick={() => setAbierto(false)}>Mi cuenta</Link>;
    return (
      <>
        <Link className={`btn btn-ghost btn-sm${b}`} href="/cliente/entrar" onClick={() => setAbierto(false)}>Entrar</Link>
        <Link className={`btn btn-primary btn-sm${b}`} href="/cliente/registro" onClick={() => setAbierto(false)}>Crear cuenta</Link>
      </>
    );
  }

  return (
    <nav className="lp-nav">
      <div className="container inner">
        <Link className="logo" href="/"><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="logo-img" /> Emprende</Link>

        <div className="links">
          {LINKS.map(([h, l]) => <a key={h} href={h}>{l}</a>)}
        </div>

        <div className="spacer" />

        <div className="nav-actions">
          <ThemeToggle />
          <AuthBtns />
        </div>

        <button className="theme-toggle lp-burger" aria-label="Menú" onClick={() => setAbierto(!abierto)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {abierto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {abierto && (
        <div className="container" style={{ paddingBottom: 16 }}>
          <div className="card" style={{ padding: 12 }}>
            {LINKS.map(([h, l]) => (
              <a key={h} href={h} className="lp-mobile-link" onClick={() => setAbierto(false)}>{l}</a>
            ))}
            <div className="lp-mobile-actions">
              <AuthBtns block />
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span className="muted tiny">Tema claro / oscuro</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
