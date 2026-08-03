import ProductoClient from './ProductoClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/emprende-back';

function usd(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Meta tags para el preview al compartir el producto (imagen + título + precio).
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${API}/api/publico/${params.slug}/producto/${params.prodSlug}`, { cache: 'no-store' });
    const json = await res.json();
    const d = json?.data;
    const p = d?.producto;
    if (!p) return { title: 'Producto — Emprende' };

    const precio = p.precio_oferta != null ? p.precio_oferta : p.precio;
    const bs = Number(d.tasa_bs) > 0 ? ` · Bs ${(Number(precio) * Number(d.tasa_bs)).toLocaleString('es-VE', { maximumFractionDigits: 2 })}` : '';
    const desc = `${usd(precio)}${bs}${p.descripcion ? ' — ' + p.descripcion : ''}`;
    const img = p.imagenes?.[0]?.url_full;

    return {
      title: `${p.nombre} — ${usd(precio)}`,
      description: desc,
      openGraph: {
        title: p.nombre,
        description: desc,
        type: 'website',
        images: img ? [{ url: img }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: p.nombre,
        description: desc,
        images: img ? [img] : undefined,
      },
    };
  } catch {
    return { title: 'Producto — Emprende' };
  }
}

export default function Page({ params }) {
  return <ProductoClient slug={params.slug} prodSlug={params.prodSlug} />;
}
