import Navbar from '@/components/landing/Navbar';
import MarketplaceClient from '@/components/landing/MarketplaceClient';
import BotonVolver from '@/components/BotonVolver';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/emprende-back';

async function getInicial(cat) {
  try {
    const params = new URLSearchParams({ limit: '9' });
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
      <section className="lp-section" style={{ paddingTop: 34 }}>
        <div className="container">
          <div style={{ marginBottom: 16 }}><BotonVolver fallback="/" /></div>
          <div className="mkt-head">
            <div>
              <span className="eyebrow">Marketplace</span>
              <h2 style={{ margin: '4px 0 0' }}>Todos los productos</h2>
            </div>
            <p className="muted" style={{ margin: 0 }}>Explora el catálogo completo de las tiendas de Cumaná. Filtra por categoría o busca lo que necesitas.</p>
          </div>
          <MarketplaceClient inicial={inicial} categoriaInicial={cat} />
        </div>
      </section>
    </div>
  );
}
