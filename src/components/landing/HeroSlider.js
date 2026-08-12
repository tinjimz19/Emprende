'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getToken, getClienteToken } from '@/lib/api';

const SLIDES = [
  {
    img: '/hero/hero-1.png',
    eyebrow: 'Mercado de Cumaná 🇻🇪',
    titulo: <>Compra a los <span className="grad">emprendedores de tu ciudad.</span></>,
    texto: 'Explora productos de muchas tiendas locales y cierra por WhatsApp. Precios en dólares con su equivalente en bolívares, siempre al día.',
    cta1: ['Explorar productos', '/marketplace'],
    cta2: ['Crear mi cuenta', '/cliente/registro'],
  },
  {
    img: '/hero/hero-2.png',
    eyebrow: '¿Tienes un negocio?',
    titulo: <>Vende online, <span className="grad">sin complicarte.</span></>,
    texto: 'Publica tu catálogo, recibe pedidos y lleva tus cuentas. Monta tu tienda en minutos, sin código ni tarjetas.',
    cta1: ['Crear mi tienda', '/registro'],
    cta2: ['Ver los planes', '#planes'],
  },
  {
    img: '/hero/hero-3.png',
    eyebrow: 'Comprar y vender, fácil',
    titulo: <>Variantes, stock y <span className="grad">cierre por WhatsApp.</span></>,
    texto: 'Tallas, colores y existencias por combinación. Cada producto lleva directo al chat entre el cliente y la tienda.',
    cta1: ['Explorar', '/marketplace'],
    cta2: ['Empezar a vender', '/registro'],
  },
];

const AUTH_ROUTES = ['/cliente/registro', '/cliente/entrar', '/registro', '/login'];

// Si el usuario ya inició sesión, cambia los CTA de registro/entrar por destinos útiles.
function ctaResuelto([label, href], sesion) {
  if (AUTH_ROUTES.includes(href)) {
    if (sesion === 'panel') return ['Ir a mi panel', '/panel'];
    if (sesion === 'cliente') return ['Mi cuenta', '/cliente/perfil'];
  }
  return [label, href];
}

export default function HeroSlider() {
  const [i, setI] = useState(0);
  const timer = useRef(null);
  const n = SLIDES.length;
  const [sesion, setSesion] = useState('invitado');
  useEffect(() => {
    if (getToken()) setSesion('panel');
    else if (getClienteToken()) setSesion('cliente');
    else setSesion('invitado');
  }, []);

  useEffect(() => {
    timer.current = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(timer.current);
  }, [n]);

  function manual(idx) {
    clearInterval(timer.current);
    setI(((idx % n) + n) % n);
    timer.current = setInterval(() => setI((p) => (p + 1) % n), 6000);
  }

  return (
    <section className="lp-hero">
      <div className="hero-bg">
        {SLIDES.map((s, idx) => (
          <div key={idx} className={`hero-bg-img ${idx === i ? 'on' : ''}`} style={{ backgroundImage: `url(${s.img})` }} />
        ))}
        <div className="hero-scrim" />
      </div>

      <div className="container inner">
        <div className="slider">
          <button className="slider-arrow prev" aria-label="Anterior" onClick={() => manual(i - 1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button className="slider-arrow next" aria-label="Siguiente" onClick={() => manual(i + 1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>

          <div className="slides">
            {SLIDES.map((s, idx) => (
              <div key={idx} className={`slide ${idx === i ? 'active' : ''}`} aria-hidden={idx !== i}>
                <span className="eyebrow">{s.eyebrow}</span>
                <h1 style={{ marginTop: 14 }}>{s.titulo}</h1>
                <p>{s.texto}</p>
                <div className="row slide-cta" style={{ marginTop: 28 }}>
                  {(() => {
                    const c1 = ctaResuelto(s.cta1, sesion);
                    const c2 = ctaResuelto(s.cta2, sesion);
                    return (
                      <>
                        <Link className="btn btn-primary btn-lg" href={c1[1]}>{c1[0]}</Link>
                        <Link className="btn btn-ghost btn-lg" href={c2[1]}>{c2[0]}</Link>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          <div className="slider-dots">
            {SLIDES.map((_, idx) => (
              <button key={idx} className={idx === i ? 'on' : ''} aria-label={`Ir al slide ${idx + 1}`} onClick={() => manual(idx)} />
            ))}
          </div>
        </div>

        <div className="hero-stats">
          <div className="s"><div className="n">$ → Bs</div><div className="l">Precios claros y al día</div></div>
          <div className="s"><div className="n">WhatsApp</div><div className="l">Compra y vende directo</div></div>
          <div className="s"><div className="n">Local</div><div className="l">Emprendedores de Cumaná</div></div>
        </div>
      </div>
    </section>
  );
}
