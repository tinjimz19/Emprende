'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setToken } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import SoporteFlotante from '@/components/SoporteFlotante';

const NAV = [
  ['/panel', 'Resumen', 'M3 12l9-9 9 9M5 10v10h14V10'],
  ['/panel/productos', 'Productos', 'M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7'],
  ['/panel/pedidos', 'Pedidos', 'M6 2l1.5 3h9L18 2M3 6h18l-1.5 14h-15L3 6z'],
  ['/panel/top-clientes', 'Top Clientes', 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M13 7a4 4 0 11-8 0 4 4 0 018 0zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'],
  ['/panel/cupones', 'Cupones', 'M20 12a2 2 0 012-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v3a2 2 0 010 4v3a2 2 0 002 2h16a2 2 0 002-2v-3a2 2 0 01-2-2zM13 5v2M13 11v2M13 17v2'],
  ['/panel/tarjetas', 'Tarjetas', 'M4 12v8h16v-8M16 6l-4-4-4 4M12 2v14'],
  ['/panel/reportes', 'Reportes', 'M3 21h18M7 21V11M12 21V4M17 21v-7'],
  ['/panel/contabilidad', 'Contabilidad', 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h5'],
  ['/panel/plan', 'Plan', 'M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z'],
  ['/panel/verificacion', 'Verificación', 'M12 3l7 3v5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-3z M9 12l2 2 4-4'],
  ['/panel/configuracion', 'Configuración', 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2 1-2 4-2-1M5 12L3 13l2 4 2-1'],
  ['/panel/seguridad', 'Seguridad', 'M12 2l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V5l8-3z'],
];

function Icon({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function fmt(fecha) {
  if (!fecha) return '';
  const iso = String(fecha).replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d)) return String(fecha).slice(0, 16);
  return d.toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function PanelLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sesion, setSesion] = useState(null);
  const [estado, setEstado] = useState('cargando');
  const [notis, setNotis] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [menu, setMenu] = useState(false);
  const [anim, setAnim] = useState(false);
  useEffect(() => { setAnim(true); }, []);

  useEffect(() => {
    api('/api/auth/me')
      .then((data) => {
        if (data.usuario?.rol === 'superadmin') { router.replace('/admin'); return; }
        setSesion(data); setEstado('ok');
      })
      .catch(() => { setEstado('no'); router.replace('/login'); });
  }, [router]);

  async function cargarNotis() {
    try {
      const d = await api('/api/notificaciones');
      setNotis(d.notificaciones || []);
      setNoLeidas(d.no_leidas || 0);
    } catch {}
  }
  useEffect(() => { if (estado === 'ok') cargarNotis(); }, [estado]);

  async function abrirNotis() {
    const abrir = !abierto;
    setAbierto(abrir);
    if (abrir && noLeidas > 0) {
      setNoLeidas(0);
      try { await api('/api/notificaciones/leer', { method: 'POST' }); } catch {}
    }
  }

  function irA(n) {
    setAbierto(false);
    if (n.url) router.push(n.url);
  }

  async function salir() {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    setToken(null);
    router.replace('/login');
  }

  if (estado !== 'ok') {
    return <div className="container muted" style={{ paddingTop: 80 }}>Cargando…</div>;
  }

  return (
    <div className="panel">
      <div className="panel-mobilebar">
        <button className="panel-burger" onClick={() => setMenu(true)} aria-label="Abrir menú">
          <Icon d="M3 6h18M3 12h18M3 18h18" />
        </button>
        <div className="logo" style={{ fontSize: 17 }}><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="logo-img" /> Emprende</div>
        <div className="spacer" />
        <button className="noti-btn" onClick={abrirNotis} title="Notificaciones" aria-label="Notificaciones">
          <Icon d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
          {noLeidas > 0 && <span className="noti-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>}
        </button>
      </div>
      {menu && <div className="panel-menu-overlay" onClick={() => setMenu(false)} />}
      <aside className={`sidebar ${menu ? 'open' : ''} ${anim ? 'anim' : ''}`}>
        <div className="row" style={{ padding: '6px 12px 14px', alignItems: 'center' }}>
          <div className="logo" style={{ fontSize: 19 }}><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="logo-img" /> Emprende</div>
          <div className="spacer" />
          <button className="noti-btn" onClick={abrirNotis} title="Notificaciones" aria-label="Notificaciones">
            <Icon d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
            {noLeidas > 0 && <span className="noti-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>}
          </button>
        </div>

        {NAV.map(([href, label, d]) => (
          <Link key={href} href={href} className={`nav-link ${pathname === href ? 'active' : ''}`} onClick={() => setMenu(false)}>
            <Icon d={d} /> {label}
          </Link>
        ))}
        <div className="spacer" style={{ minHeight: 12 }} />
        <a className="nav-link" href={`/t/${sesion?.tienda?.slug}`} target="_blank" rel="noreferrer" onClick={() => setMenu(false)}>
          <Icon d="M10 14L21 3M21 3h-6M21 3v6M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" /> Ver mi tienda
        </a>
        <div className="row" style={{ padding: '8px 12px', gap: 8 }}>
          <ThemeToggle />
          <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={salir}>Salir</button>
        </div>
      </aside>

      {abierto && (
        <>
          <div className="noti-overlay" onClick={() => setAbierto(false)} />
          <div className="noti-panel">
            <div className="row" style={{ padding: '4px 8px 10px', alignItems: 'center' }}>
              <strong style={{ fontSize: 14 }}>Notificaciones</strong>
              <div className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={() => setAbierto(false)}>✕</button>
            </div>
            {notis.length === 0 && <p className="muted tiny" style={{ padding: '4px 12px 12px' }}>No tienes notificaciones.</p>}
            {notis.map((n) => (
              <div key={n.id} className={`noti-item ${Number(n.leida) ? '' : 'no-leida'}`} onClick={() => irA(n)} style={{ cursor: n.url ? 'pointer' : 'default' }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.titulo}</div>
                {n.mensaje && <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{n.mensaje}</div>}
                <div className="muted tiny" style={{ marginTop: 3 }}>{fmt(n.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <main className="content">{children}</main>
      <SoporteFlotante />
    </div>
  );
}
