/** Spinner circular animado (para esperas de red). */
export function Spinner({ size = 22, grosor = 2.5, className = '' }) {
  return (
    <span
      className={`spin ${className}`}
      style={{ width: size, height: size, borderWidth: grosor }}
      role="status"
      aria-label="Cargando"
    />
  );
}

/** Bloque centrado de carga: spinner + texto con puntos animados. */
export default function Cargando({ texto = 'Cargando', alto = 260 }) {
  return (
    <div className="cargando" style={{ minHeight: alto }}>
      <Spinner size={36} grosor={3} />
      <span className="cargando-txt">{texto}<span className="dots"><i>.</i><i>.</i><i>.</i></span></span>
    </div>
  );
}
