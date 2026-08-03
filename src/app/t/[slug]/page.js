import CatalogoClient from './CatalogoClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/emprende-back';

// Meta tags para el preview al compartir el link (WhatsApp, redes).
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`${API}/api/publico/${params.slug}`, { cache: 'no-store' });
    const json = await res.json();
    const t = json?.data?.tienda;
    if (!t) return { title: 'Tienda — Emprende' };
    const titulo = t.nombre;
    const desc = t.descripcion || `Mira el catálogo de ${t.nombre} y haz tu pedido.`;
    return {
      title: `${titulo} — Emprende`,
      description: desc,
      openGraph: {
        title: titulo,
        description: desc,
        type: 'website',
        images: t.logo_url ? [{ url: t.logo_url }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: titulo,
        description: desc,
        images: t.logo_url ? [t.logo_url] : undefined,
      },
    };
  } catch {
    return { title: 'Tienda — Emprende' };
  }
}

export default function Page({ params }) {
  return <CatalogoClient slug={params.slug} />;
}
