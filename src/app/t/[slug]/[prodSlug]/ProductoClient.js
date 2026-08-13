'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, usd, precioBs, getToken, getClienteToken } from '@/lib/api';
import { addToCart, getCart } from '@/lib/cart';
import TiendaNav from '@/components/tienda/TiendaNav';
import BotonFavorito from '@/components/BotonFavorito';
import BotonUbicacion from '@/components/BotonUbicacion';
import Toast from '@/components/Toast';
import Cargando from '@/components/Spinner';
import EstadoVacio from '@/components/EstadoVacio';

function Stars({ valor = 0, size = 16 }) {
  const v = Math.max(0, Math.min(5, Number(valor) || 0));
  const pct = (v / 5) * 100;
  return (
    <span className="stars" style={{ fontSize: size, position: 'relative', display: 'inline-block' }} aria-label={`${v} de 5`}>
      <span style={{ color: 'var(--border)' }}>★★★★★</span>
      <span style={{ position: 'absolute', top: 0, left: 0, width: `${pct}%`, overflow: 'hidden', whiteSpace: 'nowrap', color: '#f5a623' }}>★★★★★</span>
    </span>
  );
}

function StarInput({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="stars stars-input" style={{ fontSize: 24 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= (hover || valor) ? 'on' : ''}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => onChange(i)}
          role="button" aria-label={`${i} estrellas`}>★</span>
      ))}
    </span>
  );
}

function fmtFecha(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProductoClient({ slug, prodSlug }) {
  const [prod, setProd] = useState(null);
  const [tienda, setTienda] = useState(null);
  const [tasa, setTasa] = useState(0);
  const [whatsapp, setWhatsapp] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [dueno, setDueno] = useState(null); // sesión de panel (dueño/admin) mirando la tienda
  const [error, setError] = useState('');
  const [imgActiva, setImgActiva] = useState(0);
  const [seleccion, setSeleccion] = useState({});
  const [agregado, setAgregado] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [relacionados, setRelacionados] = useState([]);
  const [rpag, setRpag] = useState(0);

  // Reseñas
  const [comentarios, setComentarios] = useState([]);
  const [resumen, setResumen] = useState({ promedio: 0, total: 0 });
  const [nuevo, setNuevo] = useState({ calificacion: 0, comentario: '' });
  const [esCliente, setEsCliente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errCom, setErrCom] = useState('');
  const [okCom, setOkCom] = useState(false);

  useEffect(() => {
    api(`/api/publico/${slug}/producto/${prodSlug}`, { auth: false })
      .then((d) => {
        setProd(d.producto); setTasa(d.tasa_bs); setWhatsapp(d.whatsapp); setTienda(d.tienda || { nombre: '', slug });
        if (d.producto?.resena) setResumen({ promedio: Number(d.producto.resena.promedio) || 0, total: Number(d.producto.resena.total) || 0 });
      })
      .catch((e) => setError(e.message));
  }, [slug, prodSlug]);

  useEffect(() => {
    const refresh = () => setCartCount(getCart(slug).reduce((s, i) => s + i.cantidad, 0));
    refresh();
    window.addEventListener('cart-changed', refresh);
    return () => window.removeEventListener('cart-changed', refresh);
  }, [slug]);

  // Si mira como dueño/admin (sesión de panel y NO de cliente), no compra: solo ve.
  useEffect(() => {
    if (typeof window === 'undefined' || getClienteToken() || !getToken()) return;
    api('/api/auth/me', { redirigir401: false }).then((d) => setDueno({ rol: d.usuario?.rol, tiendaSlug: d.tienda?.slug })).catch(() => {});
  }, []);

  // ¿Hay sesión de comprador? Solo esos pueden dejar reseña.
  useEffect(() => { setEsCliente(!!getClienteToken()); }, []);

  useEffect(() => {
    if (!prod?.id) return;
    api(`/api/publico/${slug}/comentarios?producto=${prod.id}`, { auth: false })
      .then((d) => { setComentarios(d.comentarios || []); if (d.resumen) setResumen({ promedio: Number(d.resumen.promedio) || 0, total: Number(d.resumen.total) || 0 }); })
      .catch(() => {});
  }, [prod?.id, slug]);

  // Productos relacionados: otros productos de la misma tienda.
  useEffect(() => {
    api(`/api/publico/${slug}/producto/${prodSlug}/relacionados`, { auth: false })
      .then((d) => { setRelacionados(d.productos || []); setRpag(0); })
      .catch(() => {});
  }, [slug, prodSlug]);

  // Lightbox: cerrar con Esc y navegar con flechas.
  useEffect(() => {
    if (!lightbox) return;
    const n = prod?.imagenes?.length || 0;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      else if (n > 1 && e.key === 'ArrowLeft') setImgActiva((i) => (i - 1 + n) % n);
      else if (n > 1 && e.key === 'ArrowRight') setImgActiva((i) => (i + 1) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, prod]);

  const atributos = useMemo(() => {
    if (!prod?.variantes?.length) return {};
    const map = {};
    prod.variantes.forEach((v) => (v.atributos || []).forEach((a) => {
      map[a.atributo] = map[a.atributo] || new Set();
      map[a.atributo].add(a.valor);
    }));
    const out = {};
    Object.keys(map).forEach((k) => (out[k] = [...map[k]]));
    return out;
  }, [prod]);

  const hexPorValor = useMemo(() => {
    const m = {};
    (prod?.variantes || []).forEach((v) => (v.atributos || []).forEach((a) => {
      if (a.color_hex) m[`${a.atributo}::${a.valor}`] = a.color_hex;
    }));
    return m;
  }, [prod]);

  const variante = useMemo(() => {
    if (!prod?.variantes?.length) return null;
    const claves = Object.keys(atributos);
    if (claves.some((k) => !seleccion[k])) return null;
    return prod.variantes.find((v) =>
      claves.every((k) => (v.atributos || []).some((a) => a.atributo === k && a.valor === seleccion[k]))
    ) || null;
  }, [prod, atributos, seleccion]);

  if (error) return (
    <main className="container" style={{ paddingTop: 40 }}>
      <EstadoVacio
        icono={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>}
        titulo="Producto no encontrado"
        texto={error}
        accion={<Link className="btn btn-primary btn-sm" href={`/t/${slug}`}>Volver a la tienda</Link>}
      />
    </main>
  );
  if (!prod) return <main className="container" style={{ paddingTop: 60 }}><Cargando texto="Cargando producto" /></main>;

  const tieneVar = Number(prod.tiene_variantes) > 0 && Object.keys(atributos).length > 0;
  const precio = tieneVar
    ? (variante && variante.precio != null ? Number(variante.precio) : Number(prod.precio))
    : Number(prod.precio_oferta ?? prod.precio);
  const enOferta = prod.precio_oferta != null && !tieneVar;
  const stock = tieneVar ? (variante ? Number(variante.stock) : null) : Number(prod.stock);
  const imgs = prod.imagenes || [];
  const imgPrincipal = (variante && variante.imagen_url) || imgs[imgActiva]?.url_full || null;
  const sinStock = stock !== null && stock <= 0;
  const modoDueno = !!dueno;                         // mira como tienda, no como comprador
  const esMiTienda = dueno && dueno.tiendaSlug === slug;

  function agregar() {
    if (tieneVar && !variante) return;
    if (sinStock) return;
    let nombre = prod.nombre;
    if (variante) nombre += ` (${Object.values(seleccion).join(' / ')})`;
    addToCart(slug, { producto_id: prod.id, variante_id: variante ? variante.id : null, nombre, precio, cantidad: 1 });
    setAgregado(true);
  }

  function waProducto() {
    if (!whatsapp) return null;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const msg = `Hola! Me interesa *${prod.nombre}* (${usd(precio)}). ${url}`;
    return `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
  }

  async function enviarComentario(e) {
    e.preventDefault();
    setErrCom(''); setOkCom(false);
    if (!nuevo.comentario.trim() || nuevo.calificacion < 1) {
      setErrCom('Elige una calificación y escribe tu comentario.');
      return;
    }
    setEnviando(true);
    try {
      const d = await api(`/api/publico/${slug}/comentarios`, {
        method: 'POST', cliente: true,
        body: { producto_id: prod.id, calificacion: nuevo.calificacion, comentario: nuevo.comentario },
      });
      setComentarios((c) => [d.comentario, ...c]);
      const total = resumen.total + 1;
      const promedio = ((resumen.promedio * resumen.total) + Number(nuevo.calificacion)) / total;
      setResumen({ total, promedio });
      setNuevo({ calificacion: 0, comentario: '' });
      setOkCom(true);
      setTimeout(() => setOkCom(false), 3000);
    } catch (e) { setErrCom(e.message); }
    finally { setEnviando(false); }
  }

  return (
    <>
      <TiendaNav slug={slug} tienda={tienda} crumb={prod.nombre} cartCount={cartCount} cartHref={`/t/${slug}?cart=1`} />
      <Toast visible={agregado} mensaje="Agregado al carrito" onHide={() => setAgregado(false)} />

      <main className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
        <div className="prod-detail">
          {/* Galería */}
          <div className="prod-media">
            <div className="prod-foto">
              {imgPrincipal
                ? <img src={imgPrincipal} alt={prod.nombre} onClick={() => imgs.length > 0 && setLightbox(true)} style={{ cursor: imgs.length > 0 ? 'zoom-in' : 'default' }} />
                : <div className="prod-foto-vacia">Sin imagen</div>}
              {enOferta && Number(prod.precio) > precio && <span className="prod-tag oferta">-{Math.round((1 - precio / Number(prod.precio)) * 100)}% OFERTA</span>}
              {sinStock && <span className="prod-tag agotado">Agotado</span>}
            </div>
            {imgs.length > 1 && (
              <div className="prod-thumbs">
                {imgs.map((im, i) => (
                  <button key={i} className={`prod-thumb ${i === imgActiva ? 'on' : ''}`} onClick={() => setImgActiva(i)}>
                    <img src={im.url_thumb} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="prod-info">
            <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
              <h1 style={{ margin: '0 0 2px' }}>{prod.nombre}</h1>
              <div className="spacer" />
              <BotonFavorito id={prod.id} size={24} />
            </div>

            <div className="prod-stats">
              {stock !== null && (
                <span className={`prod-stat ${sinStock ? 'agotado' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  {stock > 0 ? `${stock} disponibles` : (tieneVar && !variante ? 'Elige las opciones' : 'Agotado')}
                </span>
              )}
              {Number(prod.vistas) > 0 && (
                <span className="prod-stat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {prod.vistas} {Number(prod.vistas) === 1 ? 'vista' : 'vistas'}
                </span>
              )}
            </div>

            {resumen.total > 0 && (
              <a href="#resenas" className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 10, textDecoration: 'none' }}>
                <Stars valor={resumen.promedio} />
                <span className="muted tiny">{resumen.promedio.toFixed(1)} · {resumen.total} reseña{resumen.total !== 1 ? 's' : ''}</span>
              </a>
            )}

            <div className="row" style={{ gap: 12, alignItems: 'baseline' }}>
              <div className="price" style={{ fontSize: 38, lineHeight: 1.05 }}>{usd(precio)}</div>
              {enOferta && <div className="price-old" style={{ fontSize: 17 }}>{usd(prod.precio)}</div>}
            </div>
            {precioBs(precio, tasa) && <div className="price-bs" style={{ fontSize: 16, marginTop: 0 }}>{precioBs(precio, tasa)}</div>}

            {tieneVar && Object.entries(atributos).map(([attr, valores]) => (
              <div className="field" key={attr} style={{ marginTop: 16 }}>
                <label>{attr}</label>
                <div className="row" style={{ gap: 8 }}>
                  {valores.map((val) => {
                    const hex = hexPorValor[`${attr}::${val}`];
                    return (
                      <button key={val} className={`chip ${seleccion[attr] === val ? 'active' : ''}`}
                        onClick={() => setSeleccion({ ...seleccion, [attr]: val })}>
                        {hex && <span className="swatch" style={{ background: hex, marginRight: 6 }} />}
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {modoDueno ? (
              esMiTienda ? (
                <div className="row" style={{ marginTop: 6, gap: 10 }}>
                  <Link className="btn btn-primary btn-lg" href={`/panel/productos/${prod.id}`}>Editar producto</Link>
                  <Link className="btn btn-soft btn-lg" href="/panel/productos">Mis productos</Link>
                </div>
              ) : (
                <div className="warn-box" style={{ marginTop: 6 }}>
                  Estás navegando como <b>tienda</b>, no como comprador. Para comprar necesitas una{' '}
                  <a href="/cliente/registro" style={{ color: 'var(--warn)', fontWeight: 700, textDecoration: 'underline' }}>cuenta de cliente</a>.
                </div>
              )
            ) : (
              <>

                <div className="row prod-cta" style={{ marginTop: 18, gap: 10, flexWrap: 'nowrap' }}>
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={agregar} disabled={(tieneVar && !variante) || sinStock}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    {sinStock ? 'Agotado' : 'Agregar al carrito'}
                  </button>
                  {waProducto() && (
                    <a className="btn btn-wa btn-lg" style={{ flex: 1 }} href={waProducto()} target="_blank" rel="noreferrer">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.35c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14-.01-.31-.01-.48-.01-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.16 1.75 2.67 4.25 3.74.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>
                      <span className="wa-full">Consultar por WhatsApp</span>
                      <span className="wa-corta">WhatsApp</span>
                    </a>
                  )}
                  <BotonUbicacion direccion={tienda?.direccion} ubicacion={tienda?.ubicacion_maps} className="btn btn-soft btn-lg" nombre="" />
                </div>
              </>
            )}

            {prod.descripcion && <p style={{ lineHeight: 1.6, marginTop: 12, fontSize: 14.5, color: 'var(--text-2)' }}>{prod.descripcion}</p>}





          </div>
        </div>

        {lightbox && imgs.length > 0 && (
          <div className="lb-ov" onClick={() => setLightbox(false)}>
            <button className="lb-x" onClick={() => setLightbox(false)} aria-label="Cerrar">✕</button>
            {imgs.length > 1 && (
              <button className="lb-nav lb-prev" aria-label="Anterior"
                onClick={(e) => { e.stopPropagation(); setImgActiva((i) => (i - 1 + imgs.length) % imgs.length); }}>‹</button>
            )}
            <img className="lb-img" src={imgs[imgActiva]?.url_full} alt={prod.nombre} onClick={(e) => e.stopPropagation()} />
            {imgs.length > 1 && (
              <button className="lb-nav lb-next" aria-label="Siguiente"
                onClick={(e) => { e.stopPropagation(); setImgActiva((i) => (i + 1) % imgs.length); }}>›</button>
            )}
            {imgs.length > 1 && <div className="lb-count">{imgActiva + 1} / {imgs.length}</div>}
          </div>
        )}

        <div className="prod-bottom">
          {/* Productos relacionados (izquierda) */}
          <section className="relacionados">
            <div className="row" style={{ alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Productos relacionados</h2>
              <div className="spacer" />
              {relacionados.length > 3 && (
                <div className="rel-nav">
                  <button type="button" onClick={() => setRpag((p) => Math.max(0, p - 1))} disabled={rpag === 0} aria-label="Anteriores">‹</button>
                  <button type="button" onClick={() => setRpag((p) => ((p + 1) * 3 < relacionados.length ? p + 1 : p))} disabled={(rpag + 1) * 3 >= relacionados.length} aria-label="Siguientes">›</button>
                </div>
              )}
            </div>
            {relacionados.length === 0 ? (
              <p className="muted">No hay otros productos por ahora.</p>
            ) : (
              <div className="rel-grid">
                {relacionados.slice(rpag * 3, rpag * 3 + 3).map((p) => {
                  const conVar = Number(p.tiene_variantes) > 0;
                  const rp = (!conVar && p.precio_oferta != null) ? p.precio_oferta : (conVar && p.precio_desde != null ? p.precio_desde : p.precio);
                  return (
                    <Link className="rel-card" key={p.id} href={`/t/${p.tienda_slug || slug}/${p.slug}`}>
                      <span className="rel-thumb" style={{ backgroundImage: p.imagen ? `url(${p.imagen})` : 'none' }} />
                      <div className="rel-body">
                        <p className="rel-name">{p.nombre}</p>
                        <span className="rel-price">{usd(rp)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Reseñas (derecha) */}
          <section id="resenas" className="resenas">
          <div className="row" style={{ alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>Reseñas</h2>
            {resumen.total > 0 && (
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <Stars valor={resumen.promedio} />
                <span className="muted tiny">{resumen.promedio.toFixed(1)} de 5 · {resumen.total}</span>
              </div>
            )}
          </div>

          {esCliente ? (
            <form className="card resena-form" onSubmit={enviarComentario}>
              <h3 style={{ marginTop: 0 }}>Deja tu opinión</h3>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Tu calificación</label>
                <StarInput valor={nuevo.calificacion} onChange={(v) => setNuevo({ ...nuevo, calificacion: v })} />
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label>Tu comentario</label>
                <textarea rows={3} value={nuevo.comentario} maxLength={1000} onChange={(e) => setNuevo({ ...nuevo, comentario: e.target.value })} />
              </div>
              {errCom && <div className="error" style={{ marginBottom: 10 }}>{errCom}</div>}
              {okCom && <div className="ok-box" style={{ marginBottom: 10 }}>¡Gracias por tu opinión!</div>}
              <button className="btn btn-primary" disabled={enviando}>{enviando ? 'Enviando…' : 'Publicar reseña'}</button>
            </form>
          ) : (
            <div className="card" style={{ textAlign: 'center' }}>
              <p className="muted" style={{ margin: '4px 0 12px' }}>Para dejar una reseña, inicia sesión o crea tu cuenta de comprador.</p>
              <div className="row" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Link className="btn btn-primary btn-sm" href="/cliente/entrar">Iniciar sesión</Link>
                <Link className="btn btn-ghost btn-sm" href="/cliente/registro">Crear cuenta</Link>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            {comentarios.length === 0 && <p className="muted">Aún no hay reseñas. ¡Sé el primero en opinar!</p>}
            {comentarios.map((c, i) => (
              <div className="resena-card" key={i}>
                <div className="row" style={{ alignItems: 'center', gap: 10 }}>
                  <div className="resena-avatar">{(c.nombre || '?').trim().charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.nombre}</div>
                    <Stars valor={Number(c.calificacion)} size={13} />
                  </div>
                  <div className="spacer" />
                  <span className="muted tiny">{fmtFecha(c.created_at)}</span>
                </div>
                {c.comentario && <p style={{ margin: '10px 0 0', lineHeight: 1.55, color: 'var(--text-2)' }}>{c.comentario}</p>}
              </div>
            ))}
          </div>
        </section>
        </div>
      </main>
    </>
  );
}
