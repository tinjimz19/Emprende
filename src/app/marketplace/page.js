import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import MarketplaceClient from '@/components/landing/MarketplaceClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/emprende-back';

async function getInicial(cat) {
  try {
    const params = new URLSearchParams({ limit: '12' });
    if (cat) params.set('categoria', cat);
    const res = await fetch(`${API}/api/vitrina?${params}`, { cache: 'no-store' });
    const json = await res.json();
    return json?.data || { productos: [], categorias: [] };
  } catch {
    return { productos: [], categorias: [] };
  }
}

export default async function Marketplace({ searchParams }) {
  const sp = await searchParams;
  const cat = typeof sp?.categoria === 'string' ? sp.categoria : '';
  const inicial = await getInicial(cat);

  return (
    <div className="lp">
      <Navbar />
      <section className="lp-section" style={{ paddingTop: 30 }}>
        <div className="container">
          <nav className="mkt2-crumbs">
            <Link href="/">Home</Link><span>›</span>
            <Link href="/marketplace">Marketplace</Link><span>›</span>
            <span className="on">Todos los productos</span>
          </nav>
          <h1 className="mkt2-h1">Todos los productos</h1>
          <p className="muted mkt2-sub">Descubre miles de productos de tiendas locales de Cumaná. Calidad y servicio al mejor precio.</p>
          <MarketplaceClient inicial={inicial} categoriaInicial={cat} />
        </div>
      </section>
    </div>
  );
}
