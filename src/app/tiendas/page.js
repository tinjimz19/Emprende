import Navbar from '@/components/landing/Navbar';
import TiendasClient from '@/components/landing/TiendasClient';
import BotonTiendasCerca from '@/components/BotonTiendasCerca';

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
          <div className="mkt2-crumbs">
            <a href="/">Inicio</a>
            <span>›</span>
            <span className="on">Tiendas</span>
          </div>
          <div className="dir-head">
            <div style={{ minWidth: 0 }}>
              <span className="eyebrow">Directorio</span>
              <h1 className="mkt2-h1">Todas las tiendas</h1>
              <p className="mkt2-sub" style={{ marginBottom: 0 }}>Explora las tiendas de los emprendedores de Cumaná y entra a la que quieras.</p>
            </div>
            <BotonTiendasCerca className="btn btn-soft btn-sm" />
          </div>
          <TiendasClient inicial={inicial} rubros={rubros} />
        </div>
      </section>
    </div>
  );
}
