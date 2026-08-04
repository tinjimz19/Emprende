'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, usd, precioBs, getToken, getClienteToken } from '@/lib/api';
import { addToCart, getCart } from '@/lib/cart';
import TiendaNav from '@/components/tienda/TiendaNav';
import BotonFavorito from '@/components/BotonFavorito';

function Stars({ valor = 0, size = 16 }) {
  const llenas = Math.round(valor);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= llenas ? 'on' : ''}>★</span>
      ))}
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
    api('/api/auth/me').then((d) => setDueno({ rol: d.usuario?.rol, tiendaSlug: d.tienda?.slug })).catch(() => {});
  }, []);

  // ¿Hay sesión de comprador? Solo esos pueden dejar reseña.
  useEffect(() => { setEsCliente(!!getClienteToken()); }, []);

  useEffect(() => {
    if (!prod?.id) return;
    api(`/api/publico/${slug}/comentarios?producto=${prod.id}`, { auth: false })
      .then((d) => { setComentarios(d.comentarios || []); if (d.resumen) setResumen({ promedio: Number(d.resumen.promedio) || 0, total: Number(d.resumen.total) || 0 }); })
      .catch(() => {});
  }, [prod?.id, slug]);

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

  if (error) return <main className="container" style={{ paddingTop: 60 }}><div className="alert error">{error}</div></main>;
  if (!prod) return <main className="container" style={{ paddingTop: 60 }}><p className="muted">Cargando…</p></main>;

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
    setTimeout(() => setAgregado(false), 2500);
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

      <main className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
        <div className="prod-detail">
          {/* Galería */}
          <div className="prod-media">
            <div className="prod-foto">
              {imgPrincipal
                ? <img src={imgPrincipal} alt={prod.nombre} />
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
              <h1 style={{ margin: '0 0 8px' }}>{prod.nombre}</h1>
              <div className="spacer" />
              <BotonFavorito id={prod.id} size={24} />
            </div>

            {resumen.total > 0 && (
              <a href="#resenas" className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 12, textDecoration: 'none' }}>
                <Stars valor={resumen.promedio} />
                <span className="muted tiny">{resumen.promedio.toFixed(1)} · {resumen.total} reseña{resumen.total !== 1 ? 's' : ''}</span>
              </a>
            )}

            <div className="row" style={{ gap: 12, alignItems: 'baseline' }}>
              <div className="price" style={{ fontSize: 32 }}>{usd(precio)}</div>
              {enOferta && <div className="price-old" style={{ fontSize: 17 }}>{usd(prod.precio)}</div>}
            </div>
            {precioBs(precio, tasa) && <div className="price-bs" style={{ fontSize: 16, marginTop: 2 }}>{precioBs(precio, tasa)}</div>}

            {prod.descripcion && <p style={{ lineHeight: 1.65, marginTop: 18, color: 'var(--text-2)' }}>{prod.descripcion}</p>}

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

            {stock !== null && (
              <p className="muted tiny" style={{ marginTop: 16 }}>
                {stock > 0 ? `${stock} disponibles` : (tieneVar && !variante ? 'Elige las opciones' : 'Agotado')}
              </p>
            )}

            {modoDueno ? (
              esMiTienda ? (
                <div className="row" style={{ marginTop: 18, gap: 10 }}>
                  <Link className="btn btn-primary btn-lg" href={`/panel/productos/${prod.id}`}>Editar producto</Link>
                  <Link className="btn btn-soft btn-lg" href="/panel/productos">Mis productos</Link>
                </div>
              ) : (
                <div className="warn-box" style={{ marginTop: 18 }}>
                  Estás navegando como <b>tienda</b>, no como comprador. Para comprar necesitas una{' '}
                  <a href="/cliente/registro" style={{ color: 'var(--warn)', fontWeight: 700, textDecoration: 'underline' }}>cuenta de cliente</a>.
                </div>
              )
            ) : (
              <>
                {agregado && <div className="ok-box" style={{ marginTop: 12 }}>Agregado al carrito ✓</div>}
                <div className="row" style={{ marginTop: 18, gap: 10 }}>
                  <button className="btn btn-primary btn-lg" onClick={agregar} disabled={(tieneVar && !variante) || sinStock}>
                    {sinStock ? 'Agotado' : 'Agregar al carrito'}
                  </button>
                  {waProducto() && (
                    <a className="btn btn-wa btn-lg" href={waProducto()} target="_blank" rel="noreferrer">
                      <span className="wa-full">Consultar por WhatsApp</span>
                      <span className="wa-corta">WhatsApp</span>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reseñas */}
        <section id="resenas" className="resenas">
          <div className="row" style={{ alignItems: 'baseline', gap: 12 }}>
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

          <div style={{ marginTop: 18 }}>
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
      </main>
    </>
  );
}
