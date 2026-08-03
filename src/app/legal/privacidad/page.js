import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad — Emprende Cumaná',
  description: 'Cómo Emprende Cumaná recopila, usa y protege tus datos personales.',
};

export default function PrivacidadPage() {
  return (
    <article className="card legal-doc" style={{ padding: 30 }}>
      <h1>Política de Privacidad</h1>
      <p className="meta">Última actualización: agosto de 2026</p>

      <p className="intro">
        En <b>Emprende Cumaná</b> respetamos tu privacidad. Esta política explica qué datos personales
        recopilamos, para qué los usamos y qué derechos tienes sobre ellos. Al usar la plataforma
        aceptas las prácticas aquí descritas.
      </p>

      <h2>1. Datos que recopilamos</h2>
      <p>Recopilamos únicamente los datos necesarios para prestar el servicio:</p>
      <ul>
        <li><b>De tiendas:</b> nombre de la tienda, nombre del responsable, correo, WhatsApp, dirección, logo, catálogo, tasa de cambio y datos de sus pedidos.</li>
        <li><b>De compradores:</b> nombre, correo, teléfono/WhatsApp y el historial de pedidos realizados.</li>
        <li><b>De cada pedido:</b> productos, cantidades, método de envío, y el comprobante de pago si decides adjuntarlo.</li>
        <li><b>Datos técnicos básicos:</b> información necesaria para mantener tu sesión iniciada y el funcionamiento del sitio.</li>
      </ul>

      <h2>2. Cómo usamos tus datos</h2>
      <ul>
        <li>Crear y administrar tu cuenta de tienda o de comprador.</li>
        <li>Mostrar los catálogos y permitir que se generen y gestionen los pedidos.</li>
        <li>Facilitar el contacto entre comprador y tienda para cerrar la compra (por ejemplo, por WhatsApp).</li>
        <li>Enviarte notificaciones relacionadas con tu actividad (pedidos, estado de tu tienda o plan).</li>
        <li>Mejorar y mantener seguro el servicio.</li>
      </ul>

      <h2>3. Comunicación por WhatsApp</h2>
      <p>
        Emprende facilita el contacto directo por WhatsApp entre compradores y tiendas. Al iniciar esa
        conversación, tu número queda visible para la otra parte, que es con quien concretas la
        operación. Esas conversaciones ocurren en WhatsApp y se rigen por las políticas de dicha
        aplicación.
      </p>

      <h2>4. Con quién compartimos tus datos</h2>
      <p>
        <b>No vendemos ni alquilamos tus datos personales.</b> Los datos de un pedido se comparten con
        la tienda correspondiente para que pueda atenderlo (y viceversa, los datos de la tienda con el
        comprador). Solo podríamos divulgar información si la ley lo exige o para proteger los derechos
        y la seguridad de los usuarios y de la plataforma.
      </p>

      <h2>5. Cookies y almacenamiento local</h2>
      <p>
        Usamos almacenamiento en tu navegador para mantener tu sesión iniciada y recordar preferencias
        básicas (como el tema claro/oscuro). No usamos estos datos para publicidad de terceros.
      </p>

      <h2>6. Seguridad</h2>
      <p>
        Aplicamos medidas razonables para proteger tu información, incluido el resguardo cifrado de las
        contraseñas. Ningún sistema es 100% infalible, por lo que también te recomendamos usar una
        contraseña fuerte y no compartirla.
      </p>

      <h2>7. Conservación de datos</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa y durante el tiempo necesario para cumplir
        con las finalidades descritas o con obligaciones legales. Puedes solicitar la eliminación de tu
        cuenta y sus datos cuando lo desees.
      </p>

      <h2>8. Tus derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li><b>Acceder</b> a los datos que tenemos sobre ti.</li>
        <li><b>Rectificar</b> datos inexactos o desactualizados (puedes hacerlo desde tu perfil o configuración).</li>
        <li><b>Eliminar</b> tu cuenta y solicitar el borrado de tus datos.</li>
      </ul>
      <p>Para ejercer estos derechos, contáctanos por los medios indicados abajo.</p>

      <h2>9. Menores de edad</h2>
      <p>
        La plataforma está dirigida a personas mayores de edad. Si eres menor, debes contar con la
        autorización y supervisión de tu representante legal.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en esta página
        con su fecha de actualización.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Si tienes preguntas sobre el tratamiento de tus datos, escríbenos por WhatsApp al{' '}
        <a href="https://wa.me/584121890090" target="_blank" rel="noreferrer">+58 412-189-0090</a>.
      </p>

      <p style={{ marginTop: 26 }}>
        Consulta también nuestros <Link href="/legal/terminos">Términos y Condiciones</Link>.
      </p>
    </article>
  );
}
