import Navbar from '@/components/landing/Navbar';
import BotonVolver from '@/components/BotonVolver';
import TiendasClient from '@/components/landing/TiendasClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/emprende-back';

async function getInicial() {
  try {
    const res = await fetch(`${API}/api/tiendas?limit=12`, { cache: 'no-store' });
    const json = await res.json();
    return json?.data || { tiendas: [], total: 0 };
  } catch {
    return { tiendas: [], total: 0 };
  }
}

async function getRubros() {
  try {
    const res = await fetch(`${API}/api/rubros`, { cache: 'no-store' });
    const json = await res.json();
    return json?.data?.rubros || [];
  } catch {
    return [];
  }
}

export default async function Tiendas() {
  const [inicial, rubros] = await Promise.all([getInicial(), getRubros()]);

  return (
    <div className="lp">
      <Navbar />
      <section className="lp-section" style={{ paddingTop: 34 }}>
        <div className="container">
          <div className="tienda-head">
            <div className="tienda-head-back">
              <BotonVolver fallback="/" />
            </div>
            <div style={{ minWidth: 0 }}>
              <span className="eyebrow">Directorio</span>
              <h2 style={{ margin: '4px 0 0' }}>Todas las tiendas</h2>
              <p className="muted" style={{ margin: '6px 0 0' }}>Explora las tiendas de los emprendedores de Cumaná y entra a la que quieras.</p>
            </div>
          </div>
          <TiendasClient inicial={inicial} rubros={rubros} />
        </div>
      </section>
    </div>
  );
}
