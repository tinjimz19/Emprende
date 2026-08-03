import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import HeroSlider from '@/components/landing/HeroSlider';
import TopProducts from '@/components/landing/TopProducts';
import TiendaCard from '@/components/landing/TiendaCard';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/emprende-back';

async function getVitrina() {
  try {
    const res = await fetch(`${API}/api/vitrina?limit=12`, { cache: 'no-store' });
    const json = await res.json();
    return json?.data || { productos: [], categorias: [] };
  } catch {
    return { productos: [], categorias: [] };
  }
}

async function getTiendas() {
  try {
    const res = await fetch(`${API}/api/tiendas?limit=4`, { cache: 'no-store' });
    const json = await res.json();
    return json?.data?.tiendas || [];
  } catch {
    return [];
  }
}

async function getPlanes() {
  try {
    const res = await fetch(`${API}/api/planes`, { cache: 'no-store' });
    const json = await res.json();
    return json?.data?.planes || [];
  } catch {
    return [];
  }
}

const VALORES = [
  ['M12 2v20M2 12h20', 'Precios en $ y Bs', 'Cambia tu tasa una sola vez y todos tus precios se actualizan al instante. Sin tocar producto por producto.'],
  ['M21 11.5a8.4 8.4 0 01-9 8.4L3 21l1.1-8A8.4 8.4 0 1121 11.5z', 'Cierre por WhatsApp', 'Cada producto y cada pedido lleva directo al chat con tu cliente. Vende como ya vendes, pero ordenado.'],
  ['M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7', 'Variantes y stock', 'Tallas, colores y existencias por combinación, con su propio SKU y precio. Sin líos de inventario.'],
  ['M4 4h16v16H4zM8 9h8M8 13h8M8 17h5', 'Cuentas claras', 'Registra ventas y gastos y mira tu ganancia del mes de un vistazo. Adiós al cuaderno.'],
];

// Respaldo si el API de planes no responde.
const PLANES_FALLBACK = [
  {
    nombre: 'Emprende', precio: '0', periodo: '/mes', destacado: false,
    resumen: 'Para empezar hoy mismo.',
    features: ['Catálogo público', 'Hasta 20 productos', 'Cierre por WhatsApp', 'Precios en $ y Bs'],
    cta: 'Empezar gratis',
  },
  {
    nombre: 'Negocio', precio: '5', periodo: '/mes', destacado: true,
    resumen: 'Para vender en serio.',
    features: ['Productos ilimitados', 'Variantes y galería', 'Pedidos y clientes', 'Contabilidad del mes', 'Soporte prioritario'],
    cta: 'Elegir Negocio',
  },
  {
    nombre: 'Pro', precio: '12', periodo: '/mes', destacado: false,
    resumen: 'Para crecer y destacar.',
    features: ['Todo lo de Negocio', 'Dominio propio', 'Múltiples empleados', 'Reportes avanzados', 'Prioridad en la vitrina'],
    cta: 'Elegir Pro',
  },
];

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// Convierte un plan del API en el formato de la tarjeta del home.
function planParaHome(p, i, total) {
  const precioNum = Number(p.precio_mensual) || 0;
  const precio = precioNum % 1 === 0 ? String(precioNum) : precioNum.toFixed(2);
  return {
    nombre: p.nombre,
    precio,
    periodo: '/mes',
    destacado: total >= 3 ? i === 1 : precioNum > 0,
    resumen: precioNum === 0 ? 'Para empezar hoy mismo.' : 'Para crecer tu negocio.',
    features: [
      p.max_productos == null ? 'Productos ilimitados' : `Hasta ${p.max_productos} productos`,
      `Hasta ${p.max_fotos} fotos por producto`,
      p.max_destacados == null ? 'Destacados ilimitados' : `${p.max_destacados} productos destacados`,
      'Cierre por WhatsApp',
      'Precios en $ y Bs',
    ],
    cta: precioNum === 0 ? 'Empezar gratis' : `Elegir ${p.nombre}`,
  };
}

export default async function Home() {
  const [vitrina, tiendas, planesRaw] = await Promise.all([getVitrina(), getTiendas(), getPlanes()]);
  const planes = planesRaw.length ? planesRaw.map((p, i) => planParaHome(p, i, planesRaw.length)) : PLANES_FALLBACK;

  return (
    <div className="lp">
      <Navbar />
      <HeroSlider />

      {/* Tiendas destacadas */}
      {tiendas.length > 0 && (
        <section className="lp-section" id="tiendas">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Tiendas</span>
              <h2>Tiendas destacadas</h2>
              <p>Conoce a los emprendedores de Cumaná y entra a la tienda que quieras.</p>
            </div>
            <div className="grid grid-cards">
              {tiendas.map((t) => <TiendaCard key={t.slug} t={t} />)}
            </div>
            <div className="row" style={{ justifyContent: 'center', marginTop: 28 }}>
              <Link className="btn btn-primary btn-lg" href="/tiendas">Ver todas las tiendas</Link>
            </div>
          </div>
        </section>
      )}

      {/* Vitrina de productos + filtros */}
      <section className="lp-section alt">
        <div className="container">
          <TopProducts inicial={vitrina} />
        </div>
      </section>

      {/* Vender en Emprende (para vendedores) */}
      <section className="lp-section alt" id="vender">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">¿Tienes un negocio?</span>
            <h2>Véndelo en Emprende</h2>
            <p>Publica tu catálogo, recibe pedidos y lleva tus cuentas. Una plataforma pensada para el emprendedor venezolano, no para una startup de Silicon Valley.</p>
          </div>
          <div className="grid grid-cards">
            {VALORES.map(([d, t, desc]) => (
              <div className="value-card" key={t}>
                <div className="value-ic">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                </div>
                <h3 style={{ margin: '0 0 6px' }}>{t}</h3>
                <p className="muted tiny" style={{ margin: 0, lineHeight: 1.55 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'center', gap: 12, marginTop: 30, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary btn-lg" href="/registro">Crear mi tienda</Link>
            <Link className="btn btn-ghost btn-lg" href="/login">Ya tengo tienda, entrar</Link>
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="lp-section" id="planes">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Membresías</span>
            <h2>Un plan para cada etapa</h2>
            <p>Empieza gratis y crece cuando tu negocio lo pida. Sin permanencia, cancela cuando quieras.</p>
          </div>
          <div className="plans">
            {planes.map((p) => (
              <div className={`plan ${p.destacado ? 'featured' : ''}`} key={p.nombre}>
                {p.destacado && <span className="tag">Más popular</span>}
                <div className="pname">{p.nombre}</div>
                <div className="muted tiny">{p.resumen}</div>
                <div className="price-big">${p.precio}<small>{p.periodo}</small></div>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}><Check /> {f}</li>
                  ))}
                </ul>
                <Link className={`btn ${p.destacado ? 'btn-primary' : 'btn-ghost'} btn-block cta`} href="/registro">{p.cta}</Link>
              </div>
            ))}
          </div>
          <p className="muted tiny" style={{ textAlign: 'center', marginTop: 22 }}>
            Los precios se activan por pago móvil, transferencia o USDT. Al inicio la activación es manual.
          </p>
        </div>
      </section>

      {/* CTA final (comprar o vender) */}
      <section className="lp-section alt">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)' }}>Compra o vende en Emprende</h2>
          <p className="muted" style={{ fontSize: 18, maxWidth: 560, margin: '10px auto 26px' }}>
            Crea tu cuenta gratis para comprar a las tiendas de Cumaná, o monta la tuya y empieza a vender hoy.
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary btn-lg" href="/cliente/registro">Crear cuenta para comprar</Link>
            <Link className="btn btn-ghost btn-lg" href="/registro">Crear mi tienda</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="container">
          <div className="cols">
            <div>
              <div className="logo" style={{ marginBottom: 12 }}><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="logo-img" /> Emprende</div>
              <p className="muted tiny" style={{ maxWidth: 280 }}>
                La plataforma para que los emprendedores de Cumaná publiquen, vendan y lleven sus cuentas.
              </p>
            </div>
            <div>
              <h4>Comprar</h4>
              <a href="#productos">Explorar productos</a>
              <Link href="/cliente/registro">Crear cuenta</Link>
              <Link href="/cliente/entrar">Entrar</Link>
              <Link href="/t/la-tiendita">Tienda demo</Link>
            </div>
            <div>
              <h4>Vender</h4>
              <Link href="/registro">Crear tienda</Link>
              <Link href="/login">Entrar</Link>
              <a href="#planes">Planes</a>
            </div>
            <div>
              <h4>Legal</h4>
              <Link href="/legal/terminos">Términos</Link>
              <Link href="/legal/privacidad">Privacidad</Link>
              <a href="https://wa.me/584121890090" target="_blank" rel="noreferrer">Contacto</a>
            </div>
          </div>
          <div className="bottom">
            <span>© {new Date().getFullYear()} Emprende · Cumaná, Venezuela</span>
            <span>Hecho con ❤ para emprendedores</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
