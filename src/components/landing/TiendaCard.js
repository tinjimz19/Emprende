import Link from 'next/link';

/**
 * Tarjeta de tienda para el directorio (home destacadas + página /tiendas).
 * Enlaza al catálogo de la tienda.
 */
export default function TiendaCard({ t }) {
  const inicial = (t.nombre || '?').trim().charAt(0).toUpperCase();
  const n = Number(t.productos) || 0;
  return (
    <Link className="card tienda-card" href={`/t/${t.slug}`}>
      <div className="tc-head">
        <span className="tc-logo" style={t.logo_url ? { backgroundImage: `url(${t.logo_url})` } : undefined}>
          {!t.logo_url && inicial}
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="tc-name">{t.nombre}</div>
          <div className="muted tiny">{n} producto{n !== 1 ? 's' : ''}</div>
        </div>
      </div>
      {t.descripcion && <p className="muted tiny tc-desc">{t.descripcion}</p>}
    </Link>
  );
}
