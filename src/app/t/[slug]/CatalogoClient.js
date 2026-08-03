'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, usd, precioBs, getClienteToken, getToken } from '@/lib/api';
import { getCart, addToCart, cartTotal } from '@/lib/cart';
import TiendaNav from '@/components/tienda/TiendaNav';
import Carrito from '@/components/tienda/CarritoDrawer';
import BotonVolver from '@/components/BotonVolver';
import { Stars, StarInput } from '@/components/Estrellas';

export default function CatalogoClient({ slug }) {
  const [tienda, setTienda] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [colores, setColores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [tasa, setTasa] = useState(0);
  const [cat, setCat] = useState('');
  const [color, setColor] = useState('');
  const [q, setQ] = useState('');
  const [ocultarAgotados, setOcultarAgotados] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [cuenta, setCuenta] = useState(null);
  const [dueno, setDueno] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [resenaTienda, setResenaTienda] = useState({ resumen: { promedio: 0, total: 0 }, lista: [] });
  const [nuevaR, setNuevaR] = useState({ calificacion: 0, comentario: '' });
  const [enviandoR, setEnviandoR] = useState(false);
  const [msgR, setMsgR] = useState('');

  useEffect(() => {
    api(`/api/publico/${slug}`, { auth: false })
      .then((d) => { setTienda(d.tienda); setCategorias(d.categorias || []); setColores(d.colores || []); setTasa(d.tienda.tasa_bs); })
      .catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (cat) params.set('categoria', cat);
    if (color) params.set('color', color);
    if (q) params.set('q', q);
    api(`/api/publico/${slug}/productos?${params}`, { auth: false })
      .then((d) => { setProductos(d.productos); setTasa(d.tasa_bs); })
      .catch((e) => setError(e.message));
  }, [slug, cat, color, q]);

  useEffect(() => {
    const refresh = () => setCart(getCart(slug));
    refresh();
    window.addEventListener('cart-changed', refresh);
    return () => window.removeEventListener('cart-changed', refresh);
  }, [slug]);

  // Abre el carrito si se llega con ?cart=1 (ej. desde el detalle del producto).
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('cart') === '1') {
      setAbierto(true);
    }
  }, []);

  // Cuenta del comprador (si tiene sesión iniciada).
  useEffect(() => {
    if (typeof window === 'undefined' || !getClienteToken()) return;
    api('/api/cliente/me', { cliente: true }).then((d) => setCuenta(d.cuenta)).catch(() => {});
  }, []);

  function cargarResenasTienda() {
    api(`/api/publico/${slug}/resenas`, { auth: false })
      .then((d) => setResenaTienda({ resumen: d.resumen || { promedio: 0, total: 0 }, lista: d.resenas || [] }))
      .catch(() => {});
  }
  useEffect(() => { cargarResenasTienda(); }, [slug]);

  async function enviarResenaTienda(e) {
    e.preventDefault();
    setMsgR('');
    if (nuevaR.calificacion < 1) { setMsgR('Elige una calificación.'); return; }
    setEnviandoR(true);
    try {
      await api(`/api/publico/${slug}/resenas`, { method: 'POST', cliente: true, body: { calificacion: nuevaR.calificacion, comentario: nuevaR.comentario } });
      setNuevaR({ calificacion: 0, comentario: '' });
      cargarResenasTienda();
      setMsgR('ok');
    } catch (err) { setMsgR(err.message); }
    finally { setEnviandoR(false); }
  }

  // Si mira como dueño/admin (sesión de panel y NO de cliente), no compra: solo ve.
  useEffect(() => {
    if (typeof window === 'undefined' || getClienteToken() || !getToken()) return;
    api('/api/auth/me').then((d) => setDueno({ rol: d.usuario?.rol, tiendaSlug: d.tienda?.slug })).catch(() => {});
  }, []);

  const modoDueno = !!dueno;

  const total = useMemo(() => cartTotal(cart), [cart]);
  const cantidad = cart.reduce((s, i) => s + i.cantidad, 0);

  function estaAgotado(p) {
    return Number(p.tiene_variantes) ? Number(p.stock_variantes) <= 0 : Number(p.stock) <= 0;
  }

  function agregar(p) {
    if (Number(p.tiene_variantes)) { window.location.href = `/t/${slug}/${p.slug}`; return; }
    if (estaAgotado(p)) return;
    addToCart(slug, { producto_id: p.id, variante_id: null, nombre: p.nombre, precio: Number(p.precio_oferta ?? p.precio), cantidad: 1 });
    setAbierto(true);
  }

  const visibles = ocultarAgotados ? productos.filter((p) => !estaAgotado(p)) : productos;

  if (error) return <main className="container" style={{ paddingTop: 60 }}><div className="alert error">{error}</div></main>;
  if (!tienda) return <main className="container" style={{ paddingTop: 60 }}><p className="muted">Cargando…</p></main>;

  return (
    <>
      <TiendaNav slug={slug} tienda={tienda} cartCount={cantidad} onCart={() => setAbierto(true)} />

      <main className="container" style={{ paddingTop: 26, paddingBottom: 70 }}>
        <div style={{ marginBottom: 14 }}><BotonVolver fallback="/marketplace" /></div>
        <div className="tienda-hero">
          {tienda.logo_url && (
            <img src={tienda.logo_url} alt="" style={{ width: 52, height: 52, borderRadius: 13, objectFit: 'contain', background: 'var(--surface-2)' }} />
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0 }}>{tienda.nombre}</h1>
            {resenaTienda.resumen.total > 0 && (
              <div className="row" style={{ gap: 8, alignItems: 'center', margin: '4px 0 0' }}>
                <Stars valor={resenaTienda.resumen.promedio} size={15} />
                <span className="muted tiny">{Number(resenaTienda.resumen.promedio).toFixed(1)} · {resenaTienda.resumen.total} calificación{resenaTienda.resumen.total !== 1 ? 'es' : ''}</span>
              </div>
            )}
            {tienda.descripcion && <p className="muted" style={{ margin: '2px 0 0' }}>{tienda.descripcion}</p>}
          </div>
        </div>

        <div className="mkt-layout">
          <aside className="mkt-side">
            <input className="input" placeholder="Buscar productos…" value={q} onChange={(e) => setQ(e.target.value)} />
            <label className="row muted tiny" style={{ gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={ocultarAgotados} onChange={(e) => setOcultarAgotados(e.target.checked)} />
              Ocultar agotados
            </label>

            {categorias.length > 0 && (
              <div>
                <div className="mkt-side-title">Categorías</div>
                <div className="mkt-cats">
                  <button className={`mkt-cat ${cat === '' ? 'active' : ''}`} onClick={() => setCat('')}>Todo</button>
                  {categorias.map((c) => (
                    <button key={c.id} className={`mkt-cat ${cat === c.slug ? 'active' : ''}`} onClick={() => setCat(c.slug)}>{c.nombre}</button>
                  ))}
                </div>
              </div>
            )}

            {colores.length > 0 && (
              <div>
                <div className="mkt-side-title">Color</div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button className={`chip ${color === '' ? 'active' : ''}`} onClick={() => setColor('')}>Todos</button>
                  {colores.map((c) => (
                    <button key={c.valor} className={`chip ${color === c.valor ? 'active' : ''}`} onClick={() => setColor(color === c.valor ? '' : c.valor)}>
                      <span className="swatch" style={{ background: c.color_hex, marginRight: 6 }} />
                      {c.valor}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="mkt-main">
            <div className="grid grid-cards">
          {visibles.length === 0 && <p className="muted">No hay productos que mostrar.</p>}
          {visibles.map((p) => {
            const conVariantes = Number(p.tiene_variantes) > 0;
            const agotado = estaAgotado(p);
            const enOferta = !conVariantes && p.precio_oferta != null;
            const precio = enOferta ? p.precio_oferta : (conVariantes && p.precio_desde != null ? p.precio_desde : p.precio);
            return (
              <div className="card prod-card" key={p.id}>
                <Link href={`/t/${slug}/${p.slug}`}>
                  <span className="thumb" style={{ backgroundImage: p.imagen ? `url(${p.imagen})` : 'none', opacity: agotado ? 0.55 : 1 }}>
                    {Number(p.destacado) === 1 && !agotado && <span className="badge badge-brand" style={{ position: 'absolute', top: 10, left: 10 }}>Destacado</span>}
                    {agotado && (
                      <span className="badge" style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.72)', color: '#fff' }}>Agotado</span>
                    )}
                    {enOferta && !agotado && Number(p.precio) > Number(p.precio_oferta) && (
                      <span className="oferta-badge">-{Math.round((1 - p.precio_oferta / p.precio) * 100)}%</span>
                    )}
                  </span>
                </Link>
                <div className="body">
                  <Link href={`/t/${slug}/${p.slug}`}><p className="name">{p.nombre}</p></Link>
                  <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                    {conVariantes && p.precio_desde != null && <span className="muted tiny">desde</span>}
                    <span className="price">{usd(precio)}</span>
                    {enOferta && <span className="price-old">{usd(p.precio)}</span>}
                  </div>
                  {precioBs(precio, tasa) && <div className="price-bs">{precioBs(precio, tasa)}</div>}
                  {p.colores?.length > 0 && (
                    <div className="row" style={{ gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                      {p.colores.slice(0, 6).map((c, i) => (
                        <span key={i} className="swatch" style={{ background: c.color_hex, width: 15, height: 15 }} title={c.valor} />
                      ))}
                      {p.colores.length > 6 && <span className="tiny muted">+{p.colores.length - 6}</span>}
                    </div>
                  )}
                  {modoDueno ? (
                    <Link className="btn btn-soft btn-sm btn-block" style={{ marginTop: 10 }} href={`/t/${slug}/${p.slug}`}>Ver</Link>
                  ) : (
                    <button className="btn btn-primary btn-sm btn-block" style={{ marginTop: 10 }} onClick={() => agregar(p)}
                      disabled={agotado && !conVariantes}>
                      {agotado && !conVariantes ? 'Agotado' : (conVariantes ? 'Ver opciones' : 'Agregar')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </div>

        <section className="resenas" style={{ marginTop: 10 }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Calificación de la tienda</h2>
            {resenaTienda.resumen.total > 0 && (
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <Stars valor={resenaTienda.resumen.promedio} />
                <span className="muted tiny">{Number(resenaTienda.resumen.promedio).toFixed(1)} de 5 · {resenaTienda.resumen.total}</span>
              </div>
            )}
          </div>

          {!modoDueno && (cuenta ? (
            <form className="card" style={{ marginTop: 12 }} onSubmit={enviarResenaTienda}>
              <h3 style={{ marginTop: 0 }}>¿Cómo fue tu experiencia con esta tienda?</h3>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Tu calificación</label>
                <StarInput valor={nuevaR.calificacion} onChange={(v) => setNuevaR({ ...nuevaR, calificacion: v })} />
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label>Comentario (opcional)</label>
                <textarea rows={3} value={nuevaR.comentario} maxLength={1000} onChange={(e) => setNuevaR({ ...nuevaR, comentario: e.target.value })} />
              </div>
              {msgR && msgR !== 'ok' && <div className="error" style={{ marginBottom: 10 }}>{msgR}</div>}
              {msgR === 'ok' && <div className="ok-box" style={{ marginBottom: 10 }}>¡Gracias por calificar la tienda!</div>}
              <button className="btn btn-primary" disabled={enviandoR}>{enviandoR ? 'Enviando…' : 'Publicar calificación'}</button>
            </form>
          ) : (
            <div className="card" style={{ marginTop: 12, textAlign: 'center' }}>
              <p className="muted" style={{ margin: '4px 0 12px' }}>Para calificar la tienda, inicia sesión con tu cuenta de comprador.</p>
              <div className="row" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn btn-primary btn-sm" href="/cliente/entrar">Iniciar sesión</Link>
                <Link className="btn btn-ghost btn-sm" href="/cliente/registro">Crear cuenta</Link>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            {resenaTienda.lista.length === 0 && <p className="muted">Esta tienda aún no tiene calificaciones.</p>}
            {resenaTienda.lista.map((c, i) => (
              <div className="card" key={i} style={{ marginBottom: 10 }}>
                <div className="row" style={{ alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand)', display: 'grid', placeItems: 'center', fontWeight: 700, flex: 'none' }}>{(c.nombre || '?').trim().charAt(0).toUpperCase()}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</div>
                    <Stars valor={Number(c.calificacion)} size={13} />
                  </div>
                </div>
                {c.comentario && <p style={{ margin: '10px 0 0', lineHeight: 1.55, color: 'var(--text-2)' }}>{c.comentario}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>

      {abierto && (
        <Carrito slug={slug} tienda={tienda} cart={cart} total={total} tasa={tasa} cuenta={cuenta} onClose={() => setAbierto(false)} />
      )}
    </>
  );
}
