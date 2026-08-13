/**
 * Estado visual para "no encontrado", vacío o error.
 * `accion` es un nodo (botón/Link) opcional que provee el que lo usa.
 */
export default function EstadoVacio({ icono, titulo, texto, accion }) {
  return (
    <div className="estado-vacio">
      {icono && <div className="ev-ic">{icono}</div>}
      {titulo && <h3>{titulo}</h3>}
      {texto && <p className="muted" style={{ margin: '0 auto', maxWidth: 340 }}>{texto}</p>}
      {accion && <div className="ev-accion">{accion}</div>}
    </div>
  );
}
