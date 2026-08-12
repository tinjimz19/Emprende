import Link from 'next/link';
import { Stars } from '@/components/Estrellas';
import Verificado from '@/components/Verificado';

/**
 * Tarjeta de tienda para el directorio (home destacadas + página /tiendas).
 * Estilo centrado: avatar circular, nombre + verificado y conteo de productos.
 */
export default function TiendaCard({ t }) {
  const inicial = (t.nombre || '?').trim().charAt(0).toUpperCase();
  const n = Number(t.productos) || 0;
  return (
    <Link className="card tienda-card" href={`/t/${t.slug}`}>
      <span className="tc-logo" style={t.logo_url ? { backgroundImage: `url(${t.logo_url})` } : undefined}>
        {!t.logo_url && inicial}
      </span>
      <div className="tc-name">{t.nombre}{Number(t.verificada) ? <Verificado size={15} /> : null}</div>
      <div className="muted tiny">{n} producto{n !== 1 ? 's' : ''}</div>
      {Number(t.resenas_n) > 0 && (
        <div className="row" style={{ gap: 5, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          <Stars valor={t.calificacion} size={13} />
          <span className="muted tiny">{Number(t.calificacion).toFixed(1)}</span>
        </div>
      )}
    </Link>
  );
}
