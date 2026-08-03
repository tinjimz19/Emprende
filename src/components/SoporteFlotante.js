'use client';

// Botón flotante de soporte: abre un chat de WhatsApp con el creador de la plataforma.
const SOPORTE_NUMERO = '584121890090';
const SOPORTE_TEXTO = 'Hola! Necesito soporte con la plataforma Emprende.';

export default function SoporteFlotante() {
  const href = `https://wa.me/${SOPORTE_NUMERO}?text=${encodeURIComponent(SOPORTE_TEXTO)}`;
  return (
    <a
      className="soporte-fab"
      href={href}
      target="_blank"
      rel="noreferrer"
      title="Soporte — contactar al creador de la plataforma"
      aria-label="Soporte por WhatsApp"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 00-8.46 15.06L2 22l5.05-1.32A9.9 9.9 0 1012.04 2zm0 1.8a8.1 8.1 0 016.9 12.36l-.2.32.78 2.84-2.92-.76-.31.18a8.06 8.06 0 01-4.25 1.21h-.01a8.1 8.1 0 01-6.86-12.4A8.09 8.09 0 0112.04 3.8zm-3.2 4.06c-.15 0-.4.06-.6.3-.21.24-.8.78-.8 1.9 0 1.12.82 2.2.93 2.35.11.15 1.6 2.55 3.96 3.47 1.96.77 2.36.62 2.79.58.42-.04 1.37-.56 1.56-1.1.19-.54.19-1 .13-1.1-.06-.1-.21-.16-.44-.28-.23-.12-1.37-.68-1.58-.76-.21-.08-.37-.12-.53.12-.15.23-.6.75-.73.9-.13.16-.27.18-.5.06-.23-.12-.98-.36-1.86-1.15-.69-.61-1.15-1.37-1.29-1.6-.13-.24-.01-.36.1-.48.11-.11.24-.28.36-.43.12-.15.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.28-.73-1.75-.19-.46-.39-.4-.53-.4z"/>
      </svg>
      <span className="soporte-fab-txt">Soporte</span>
      <style jsx>{`
        .soporte-fab {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 1000;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 999px;
          background: #25d366;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          box-shadow: 0 6px 18px rgba(37, 211, 102, .45);
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .soporte-fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(37, 211, 102, .55);
        }
        .soporte-fab:active { transform: translateY(0); }
        @media (max-width: 640px) {
          .soporte-fab { right: 14px; bottom: 14px; padding: 12px; }
          .soporte-fab-txt { display: none; }
        }
      `}</style>
    </a>
  );
}
