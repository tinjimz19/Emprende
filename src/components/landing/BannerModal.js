'use client';
import { useEffect, useState } from 'react';

/**
 * Modal de bienvenida con los banners publicitarios en masonry.
 * Se muestra una vez por sesión al entrar al home.
 */
export default function BannerModal({ banners }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!banners || banners.length === 0) return;
    let visto = false;
    try { visto = !!sessionStorage.getItem('emprende_ads_seen'); } catch {}
    if (!visto) setAbierto(true);
  }, [banners]);

  function cerrar() {
    setAbierto(false);
    try { sessionStorage.setItem('emprende_ads_seen', '1'); } catch {}
  }

  if (!abierto) return null;

  return (
    <div className="admodal-ov" onClick={cerrar} role="dialog" aria-modal="true">
      <div className="admodal" onClick={(e) => e.stopPropagation()}>
        <button className="admodal-x" onClick={cerrar} aria-label="Cerrar">✕</button>
        <div className="admodal-head">
          <span className="eyebrow">Novedades</span>
          <h3>Ofertas y anuncios de hoy</h3>
        </div>
        <div className="ad-masonry">
          {banners.map((b) => {
            const contenido = (
              <>
                <img src={b.imagen_url} alt={b.titulo || 'Anuncio'} />
                {b.titulo && <span className="ad-mcap">{b.titulo}</span>}
              </>
            );
            return b.enlace ? (
              <a key={b.id} className="ad-mitem" href={b.enlace} target="_blank" rel="noreferrer">{contenido}</a>
            ) : (
              <div key={b.id} className="ad-mitem">{contenido}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
