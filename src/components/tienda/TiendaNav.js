'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getClienteToken, getToken } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import Verificado from '@/components/Verificado';

function Icon({ d, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
const ICO = {
  user: ['M20 21v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1', 'M12 11a4 4 0 100-8 4 4 0 000 8'],
  cart: ['M6 6h15l-1.5 9h-12z', 'M6 6L5 3H2', 'M9 20a1 1 0 100-2 1 1 0 000 2', 'M17 20a1 1 0 100-2 1 1 0 000 2'],
  panel: ['M3 3h7v8H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 15h7v6H3z'],
};

/**
 * Barra superior unificada de la tienda pública.
 * Migas: Emprende (inicio) › Tienda › [Producto].
 * Sesiones independientes: cliente (comprador) vs panel (dueño/superadmin).
 *  - Cliente  → chip con su nombre + carrito.
 *  - Panel    → botón "Mi panel" (sin carrito: el carrito es para compradores).
 *  - Invitado → "Ingresar" + carrito.
 */
export default function TiendaNav({ slug, tienda, crumb, cartCount = 0, onCart, cartHref }) {
  const [cuenta, setCuenta] = useState(null);
  const [panel, setPanel] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (getClienteToken()) {
      api('/api/cliente/me', { cliente: true })
        .then((d) => setCuenta(d.cuenta))
        .catch(() => { if (getToken()) setPanel(true); });
    } else if (getToken()) {
      setPanel(true);
    }
  }, []);

  const esComprador = !panel || cuenta; // dueño sin sesión de cliente => no es comprador

  const botonCarrito = cartHref
    ? <Link className="btn btn-primary btn-sm tn-cart" href={cartHref}><Icon d={ICO.cart} /><span className="tn-cart-txt">Carrito</span>{cartCount > 0 ? <span className="tn-cart-n">{cartCount}</span> : null}</Link>
    : <button className="btn btn-primary btn-sm tn-cart" onClick={onCart}><Icon d={ICO.cart} /><span className="tn-cart-txt">Carrito</span>{cartCount > 0 ? <span className="tn-cart-n">{cartCount}</span> : null}</button>;

  return (
    <header className="topbar">
      <div className="container inner">
        <nav className="tn-crumbs">
          <Link href="/" className="tn-home" title="Ir al inicio de Emprende"><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="tn-logo-img" /> Emprende</Link>
          <span className="tn-sep">›</span>
          <Link href={`/t/${slug}`} className="tn-brand" title={tienda?.nombre || 'Tienda'}>
            {tienda?.logo_url && <img src={tienda.logo_url} alt="" />}
            <span className="tn-name">{tienda?.nombre || 'Tienda'}</span>{tienda?.verificada && <Verificado size={15} />}
          </Link>
          {crumb && <><span className="tn-sep">›</span><span className="tn-crumb">{crumb}</span></>}
        </nav>

        <div className="row" style={{ gap: 8, flex: 'none', alignItems: 'center' }}>
          {cuenta && (
            <Link href="/cliente/perfil" className="tn-cuenta" title="Mi cuenta">
              <Icon d={ICO.user} /><span className="tn-cuenta-txt">{cuenta.nombre?.split(' ')[0] || 'Mi cuenta'}</span>
            </Link>
          )}
          {!cuenta && !panel && (
            <Link href="/cliente/entrar" className="tn-cuenta" title="Ingresar">
              <Icon d={ICO.user} /><span className="tn-cuenta-txt">Ingresar</span>
            </Link>
          )}

          <ThemeToggle />

          {esComprador
            ? botonCarrito
            : (
              <Link className="btn btn-primary btn-sm tn-cart" href="/panel" title="Ir a mi panel">
                <Icon d={ICO.panel} /><span className="tn-cart-txt">Mi panel</span>
              </Link>
            )}
        </div>
      </div>
    </header>
  );
}
