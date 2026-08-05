import Link from 'next/link';
import { usd, precioBs } from '@/lib/api';
import BotonFavorito from '@/components/BotonFavorito';
import Verificado from '@/components/Verificado';

/**
 * Tarjeta de producto para la vitrina global (home + marketplace).
 * La foto y el nombre enlazan al detalle del producto; el nombre de la
 * tienda enlaza a la tienda. (No es un solo <a> para permitir enlaces anidados.)
 */
export default function ProductoCard({ p }) {
  const enOferta = p.precio_oferta != null;
  const precio = enOferta ? p.precio_oferta : p.precio;
  const prodHref = `/t/${p.tienda_slug}/${p.slug}`;
  return (
    <div className="card prod-card">
      <Link href={prodHref}>
        <span className="thumb" style={{ backgroundImage: p.imagen ? `url(${p.imagen})` : 'none' }}>
          {Number(p.destacado) === 1 && <span className="badge badge-brand" style={{ position: 'absolute', top: 10, left: 10 }}>Top</span>}
          <BotonFavorito id={p.id} flotante />
        </span>
      </Link>
      <div className="body">
        <Link href={prodHref}><p className="name">{p.nombre}</p></Link>
        <Link className="muted tiny prod-tienda" href={`/t/${p.tienda_slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{p.tienda_nombre}{Number(p.tienda_verificada) ? <Verificado size={13} /> : null}</Link>
        <div className="row" style={{ gap: 8, alignItems: 'baseline', marginTop: 2 }}>
          <span className="price">{usd(precio)}</span>
          {enOferta && <span className="price-old">{usd(p.precio)}</span>}
        </div>
        {precioBs(precio, p.tasa_bs) && <div className="price-bs">{precioBs(precio, p.tasa_bs)}</div>}
      </div>
    </div>
  );
}
