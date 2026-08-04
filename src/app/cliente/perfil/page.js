'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getClienteToken, setClienteToken, usd } from '@/lib/api';
import BotonNotificaciones from '@/components/BotonNotificaciones';
import ProductoFila from '@/components/ProductoFila';
import TiendaCard from '@/components/landing/TiendaCard';
import { cargarFavoritos, limpiarFavoritos } from '@/lib/favoritos';
import { cargarSeguidas, limpiarSeguidas } from '@/lib/seguir';

const BADGE = { pagado: 'badge-ok', entregado: 'badge-ok', cancelado: 'badge-danger', confirmado: 'badge-brand', pendiente: 'badge-warn' };
const POR_PAGINA = 10;

function fmt(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Pager({ pagina, setPagina, total }) {
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (total <= POR_PAGINA) return null;
  const inicio = (pagina - 1) * POR_PAGINA;
  return (
    <div className="row" style={{ marginTop: 12, gap: 4, alignItems: 'center' }}>
      <span className="muted tiny">{inicio + 1}–{Math.min(inicio + POR_PAGINA, total)} de {total}</span>
      <div className="spacer" />
      <button className="btn btn-ghost btn-sm" onClick={() => setPagina((n) => Math.max(1, n - 1))} disabled={pagina <= 1}>← Anterior</button>
      <span className="muted tiny" style={{ padding: '0 6px' }}>{pagina} de {totalPaginas}</span>
      <button className="btn btn-ghost btn-sm" onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))} disabled={pagina >= totalPaginas}>Siguiente →</button>
    </div>
  );
}

export default function Perfil() {
  const router = useRouter();
  const [cuenta, setCuenta] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [seguidas, setSeguidas] = useState([]);
  const [novedades, setNovedades] = useState([]);
  const [estado, setEstado] = useState('cargando');
  const [pagFav, setPagFav] = useState(1);
  const [pagNov, setPagNov] = useState(1);

  useEffect(() => {
    if (!getClienteToken()) { router.replace('/cliente/entrar'); return; }
    Promise.all([api('/api/cliente/me', { cliente: true }), api('/api/cliente/pedidos', { cliente: true })])
      .then(([m, p]) => { setCuenta(m.cuenta); setPedidos(p.pedidos); setEstado('ok'); })
      .catch(() => { setClienteToken(null); router.replace('/cliente/entrar'); });
  }, [router]);

  // Favoritos, tiendas seguidas y novedades (no bloquean la carga del perfil).
  useEffect(() => {
    if (estado !== 'ok') return;
    cargarFavoritos();
    cargarSeguidas();
    api('/api/cliente/favoritos', { cliente: true }).then((d) => setFavoritos(d.favoritos || [])).catch(() => {});
    api('/api/cliente/tiendas', { cliente: true }).then((d) => setSeguidas(d.tiendas || [])).catch(() => {});
    api('/api/cliente/novedades', { cliente: true }).then((d) => setNovedades(d.novedades || [])).catch(() => {});
  }, [estado]);

  async function salir() {
    try { await api('/api/cliente/logout', { method: 'POST', cliente: true }); } catch {}
    setClienteToken(null);
    limpiarFavoritos();
    limpiarSeguidas();
    router.replace('/');
  }

  if (estado !== 'ok') return <p className="muted">Cargando…</p>;

  const favPaginas = Math.max(1, Math.ceil(favoritos.length / POR_PAGINA));
  const favPag = Math.min(pagFav, favPaginas);
  const favVisibles = favoritos.slice((favPag - 1) * POR_PAGINA, (favPag - 1) * POR_PAGINA + POR_PAGINA);

  const novPaginas = Math.max(1, Math.ceil(novedades.length / POR_PAGINA));
  const novPag = Math.min(pagNov, novPaginas);
  const novVisibles = novedades.slice((novPag - 1) * POR_PAGINA, (novPag - 1) * POR_PAGINA + POR_PAGINA);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="row" style={{ alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Hola, {cuenta.nombre}</h1>
          <p className="muted tiny" style={{ margin: '4px 0 0' }}>{cuenta.email}{cuenta.telefono ? ` · ${cuenta.telefono}` : ''}</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-soft btn-sm" onClick={salir}>Cerrar sesión</button>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Notificaciones</div>
            <p className="muted tiny" style={{ margin: '2px 0 0' }}>Te avisamos en este dispositivo cuando cambie el estado de tu pedido o una tienda que sigues publique algo nuevo.</p>
          </div>
          <div className="spacer" />
          <BotonNotificaciones cliente={true} />
        </div>
      </div>

      <h3 style={{ margin: '28px 0 12px' }}>Mis pedidos</h3>
      {pedidos.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Aún no has hecho pedidos. Explora las tiendas y tus compras aparecerán aquí.</p></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Código</th><th>Tienda</th><th>Fecha</th><th>Ítems</th><th style={{ textAlign: 'right' }}>Total</th><th>Estado</th></tr></thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.codigo}</td>
                  <td><Link href={`/t/${p.tienda_slug}`} style={{ color: 'var(--brand)' }}>{p.tienda_nombre}</Link></td>
                  <td className="tiny">{fmt(p.created_at)}</td>
                  <td>{p.num_items}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{usd(p.total)}</td>
                  <td><span className={`badge ${BADGE[p.estado] || ''}`}>{p.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ margin: '32px 0 12px' }}>Mis favoritos</h3>
      {favoritos.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Aún no tienes favoritos. Toca el corazón en cualquier producto para guardarlo aquí.</p></div>
      ) : (
        <>
          <div className="grid-filas">
            {favVisibles.map((p) => <ProductoFila key={p.id} p={p} />)}
          </div>
          <Pager pagina={favPag} setPagina={setPagFav} total={favoritos.length} />
        </>
      )}

      <h3 style={{ margin: '32px 0 12px' }}>Tiendas que sigo</h3>
      {seguidas.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>No sigues ninguna tienda todavía. Sigue tus tiendas favoritas para enterarte de sus productos nuevos.</p></div>
      ) : (
        <div className="grid grid-cards">
          {seguidas.map((t) => <TiendaCard key={t.id} t={t} />)}
        </div>
      )}

      {novedades.length > 0 && (
        <>
          <h3 style={{ margin: '32px 0 4px' }}>Novedades de tiendas que sigues</h3>
          <p className="muted tiny" style={{ margin: '0 0 12px' }}>Productos publicados recientemente por las tiendas que sigues.</p>
          <div className="grid-filas">
            {novVisibles.map((p) => <ProductoFila key={p.id} p={p} />)}
          </div>
          <Pager pagina={novPag} setPagina={setPagNov} total={novedades.length} />
        </>
      )}
    </div>
  );
}
