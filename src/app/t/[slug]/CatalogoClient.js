'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, usd, precioBs, getClienteToken, getToken } from '@/lib/api';
import { getCart, addToCart, cartTotal } from '@/lib/cart';
import TiendaNav from '@/components/tienda/TiendaNav';
import Carrito from '@/components/tienda/CarritoDrawer';
import BotonVolver from '@/components/BotonVolver';
import Cargando from '@/components/Spinner';
import EstadoVacio from '@/components/EstadoVacio';
import { Stars, StarInput } from '@/components/Estrellas';
import BotonFavorito from '@/components/BotonFavorito';
import BotonSeguir from '@/components/BotonSeguir';
import Verificado from '@/components/Verificado';
import BotonUbicacion from '@/components/BotonUbicacion';

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
  const [filtros, setFiltros] = useState(false);
  const [orden, setOrden] = useState('recomendados');
  const [precioMax, setPrecioMax] = useState(null);
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
    api('/api/auth/me', { redirigir401: false }).then((d) => setDueno({ rol: d.usuario?.rol, tiendaSlug: d.tienda?.slug })).catch(() => {});
  }, []);

  const modoDueno = !!dueno;
  const total = useMemo(() => cartTotal(cart), [cart]);
  const cantidad = cart.reduce((s, i) => s + i.cantidad, 0);

  function estaAgotado(p) {
    return Number(p.tiene_variantes) ? Number(p.stock_variantes) <= 0 : Number(p.stock) <= 0;
  }
  const precioDe = (p) => Number(p.precio_oferta ?? (Number(p.tiene_variantes) && p.precio_desde != null ? p.precio_desde : p.precio)) || 0;

  const maxPrecio = useMemo(
    () => Math.max(1, Math.ceil(productos.reduce((mx, p) => Math.max(mx, precioDe(p)), 0))),
    [productos]
  );
  useEffect(() => { setPrecioMax(maxPrecio); }, [maxPrecio]);

  function agregar(p) {
    if (Number(p.tiene_variantes)) { window.location.href = `/t/${slug}/${p.slug}`; return; }
    if (estaAgotado(p)) return;
    addToCart(slug, { producto_id: p.id, variante_id: null, nombre: p.nombre, precio: Number(p.precio_oferta ?? p.precio), cantidad: 1 });
    setAbierto(true);
  }

  const tope = precioMax == null ? maxPrecio : precioMax;
  const visibles = useMemo(() => {
    let arr = ocultarAgotados ? productos.filter((p) => !estaAgotado(p)) : productos.slice();
    arr = arr.filter((p) => precioDe(p) <= tope);
    if (orden === 'precio_asc') arr.sort((a, b) => precioDe(a) - precioDe(b));
    else if (orden === 'precio_desc') arr.sort((a, b) => precioDe(b) - precioDe(a));
    else if (orden === 'nuevos') arr.sort((a, b) => Number(b.id) - Number(a.id));
    else arr.sort((a, b) => Number(b.destacado) - Number(a.destacado));
    return arr;
  }, [productos, ocultarAgotados, tope, orden]);

  if (error) return (
    <main className="container" style={{ paddingTop: 40 }}>
      <EstadoVacio
        icono={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></svg>}
        titulo="Tienda no encontrada"
        texto={error}
        accion={<Link className="btn btn-primary btn-sm" href="/tiendas">Volver a tiendas</Link>}
      />
    </main>
  );
  if (!tienda) return <main className="container" style={{ paddingTop: 60 }}><Cargando texto="Cargando tienda" /></main>;

  return (
    <>
      <TiendaNav slug={slug} tienda={tienda} cartCount={cantidad} onCart={() => setAbierto(true)} />

      <main className="container" style={{ paddingTop: 22, paddingBottom: 70 }}>
        <div style={{ marginBottom: 14 }}><BotonVolver fallback="/marketplace" /></div>

        <div className="tienda-layout">
          <aside className="tienda-side">
            {/* Perfil de la tienda */}
            <div className="card tienda-perfil-card">
              {tienda.logo_url
                ? <img src={tienda.logo_url} alt={tienda.nombre} className="tp-logo" />
                : <div className="tp-logo tp-logo-vacio">{(tienda.nombre || '?').trim().charAt(0).toUpperCase()}</div>}
              <div className="tp-nombre">{tienda.nombre}{tienda.verificada && <Verificado size={18} />}</div>
              {tienda.descripcion && <div className="tp-sub">{tienda.descripcion}</div>}
              {resenaTienda.resumen.total > 0 && (
                <div className="row" style={{ gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
                  <Stars valor={resenaTienda.resumen.promedio} size={14} />
                  <span className="muted tiny">{Number(resenaTienda.resumen.promedio).toFixed(1)} · {resenaTienda.resumen.total}</span>
                </div>
              )}
              <div className="tp-acciones">
                {dueno?.tiendaSlug !== slug && <BotonSeguir id={tienda.id} mostrarAviso={false} />}
                {tienda.whatsapp && dueno?.tiendaSlug !== slug && (
                  <a
                    className="btn btn-wa btn-sm btn-block"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    target="_blank"
                    rel="noreferrer"
                    href={`https://wa.me/${tienda.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola *${tienda.nombre}*! Vi tu tienda en Emprende Cumaná y quiero hacerte una consulta.`)}`}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.35c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.48-.01-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.25 3.74.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>
                    Hablar con tienda
                  </a>
                )}
                <BotonUbicacion direccion={tienda.direccion} ubicacion={tienda.ubicacion_maps} className="btn btn-soft btn-sm btn-block" nombre="Ubicación" />
              </div>
            </div>

            {/* Filtros */}
            <button type="button" className="filtros-toggle btn btn-soft btn-sm" onClick={() => setFiltros((v) => !v)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              {filtros ? 'Ocultar filtros' : 'Filtros y categorías'}
            </button>
            <div className={`card tienda-filtros-card ${filtros ? 'abierto' : ''}`}>
              <div className="input-busca">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                <input className="input" placeholder="Buscar productos…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
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
            </div>
          </aside>

          <div className="tienda-main">
            {/* Barra: filtro por precio + ordenar */}
            <div className="card tienda-toolbar">
              <div className="tt-precio">
                <span className="muted tiny" style={{ whiteSpace: 'nowrap' }}>Filtrar por precio:</span>
                <input type="range" min={0} max={maxPrecio} value={tope} onChange={(e) => setPrecioMax(Number(e.target.value))} />
                <span className="tiny" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{usd(tope)}</span>
              </div>
              <div className="tt-orden">
                <span className="muted tiny" style={{ whiteSpace: 'nowrap' }}>Ordenar por:</span>
                <select className="input" value={orden} onChange={(e) => setOrden(e.target.value)}>
                  <option value="recomendados">Recomendados</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                  <option value="nuevos">Más recientes</option>
                </select>
              </div>
            </div>

            <div className="tienda-grid">
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
                        <BotonFavorito id={p.id} flotante />
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

            <section className="resenas">
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
          </div>
        </div>
      </main>

      {abierto && (
        <Carrito slug={slug} tienda={tienda} cart={cart} total={total} tasa={tasa} cuenta={cuenta} onClose={() => setAbierto(false)} />
      )}
    </>
  );
}
