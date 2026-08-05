'use client';
import { createPortal } from 'react-dom';

/**
 * Diálogo de confirmación (modal). Reemplaza al confirm() del navegador.
 * Portal a document.body para que se centre siempre y no lo recorte ningún contenedor.
 */
export default function ConfirmDialog({
  abierto,
  titulo = 'Confirmar',
  mensaje,
  textoConfirmar = 'Eliminar',
  textoCancelar = 'Cancelar',
  cargando = false,
  onConfirmar,
  onCancelar,
}) {
  if (!abierto || typeof document === 'undefined') return null;
  return createPortal(
    <div className="confirm-overlay" onClick={() => !cargando && onCancelar && onCancelar()}>
      <div className="confirm-card card" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="confirm-ic">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></svg>
        </div>
        <h3 style={{ margin: '0 0 6px' }}>{titulo}</h3>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{mensaje}</p>
        <div className="confirm-actions">
          <button className="btn btn-soft" onClick={onCancelar} disabled={cargando}>{textoCancelar}</button>
          <button
            className="btn"
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }}
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Eliminando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
