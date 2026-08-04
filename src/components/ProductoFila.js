'use client';
import Link from 'next/link';
import { usd, precioBs } from '@/lib/api';
import BotonFavorito from '@/components/BotonFavorito';

/**
 * Tarjeta compacta de producto en formato lista: foto a la izquierda (a todo
 * el alto y pegada al borde) e info a la derecha. Toda la tarjeta es clickable
 * (enlace que cubre la tarjeta); el corazón queda por encima para poder tocarlo.
 * Usada en el panel del cliente (favoritos / novedades).
 */
export default function ProductoFila({ p }) {
  const enOferta = p.precio_oferta != null;
  const precio = enOferta ? p.precio_oferta : p.precio;
  const bs = precioBs(precio, p.tasa_bs);
  const prodHref = `/t/${p.tienda_slug}/${p.slug}`;
  return (
    <div className="card prod-fila">
      <Link href={prodHref} className="pf-cover" aria-label={p.nombre} />
      <span className="pf-thumb" style={{ backgroundImage: p.imagen ? `url(${p.imagen})` : 'none' }} />
      <div className="pf-body">
        <span className="pf-name">{p.nombre}</span>
        <span className="pf-tienda muted tiny">{p.tienda_nombre}</span>
        <div className="pf-precios">
          <span className="price">{usd(precio)}</span>
          {enOferta && <span className="price-old">{usd(p.precio)}</span>}
          {bs && <span className="pf-bs">{bs}</span>}
        </div>
      </div>
      <div className="pf-fav"><BotonFavorito id={p.id} size={18} /></div>
    </div>
  );
}
