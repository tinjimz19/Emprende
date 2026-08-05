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
        recopilamos, para qué los usamos, con quién los compartimos y qué derechos tienes sobre ellos.
        Al usar la plataforma aceptas las prácticas aquí descritas.
      </p>

      <h2>1. Datos que recopilamos</h2>
      <p>Recopilamos únicamente los datos necesarios para prestar el servicio:</p>
      <ul>
        <li><b>De tiendas:</b> nombre de la tienda, nombre del responsable, correo, WhatsApp, dirección, ubicación en el mapa (coordenadas), logo, catálogo, tasa de cambio y datos de sus pedidos.</li>
        <li><b>De verificación de identidad de la tienda:</b> foto de la cédula de identidad del responsable y una selfie, además del número de cédula si decides indicarlo (ver sección 2).</li>
        <li><b>De compradores:</b> nombre, correo, teléfono/WhatsApp y el historial de pedidos realizados.</li>
        <li><b>De cada pedido:</b> productos, cantidades, método de envío y el comprobante de pago si decides adjuntarlo.</li>
        <li><b>Ubicación del comprador:</b> solo si lo autorizas en tu navegador, la ubicación aproximada de tu dispositivo para mostrarte tiendas cercanas (ver sección 4).</li>
        <li><b>Notificaciones push:</b> si las activas, los datos técnicos de suscripción de tu navegador para poder enviártelas.</li>
        <li><b>Datos técnicos básicos:</b> la información necesaria para mantener tu sesión iniciada y el funcionamiento del sitio.</li>
      </ul>

      <h2>2. Verificación de identidad de las tiendas</h2>
      <p>
        Para poder publicar sus productos, una tienda debe verificar la identidad de su responsable
        enviando una <b>foto de su cédula de identidad</b> y una <b>selfie</b>. Usamos estos documentos
        únicamente para confirmar la identidad de quien está detrás de la tienda, prevenir fraudes y dar
        confianza a los compradores.
      </p>
      <p>Sobre estos documentos:</p>
      <ul>
        <li><b>No se publican.</b> No se muestran en la tienda, ni a los compradores, ni a otras tiendas.</li>
        <li>Se almacenan en un <b>espacio privado y de acceso restringido</b>, separado de los archivos públicos del sitio.</li>
        <li>Solo el <b>equipo de verificación</b> de Emprende accede a ellos, y exclusivamente para revisarlos y aprobar o rechazar la solicitud.</li>
        <li>Al enviarlos, <b>consientes</b> su tratamiento para esta finalidad. Puedes solicitar su eliminación cerrando tu cuenta, salvo que debamos conservarlos por un tiempo razonable para acreditar la verificación o cumplir obligaciones legales.</li>
      </ul>

      <h2>3. Dirección de la tienda y mapas</h2>
      <p>
        Cada tienda puede cargar su <b>dirección</b> y, de forma opcional, un enlace de Google Maps o sus
        coordenadas. Esta dirección y su ubicación en el mapa <b>se muestran públicamente</b> en la página
        de la tienda y en las fichas de sus productos, para que los compradores puedan ubicarla. La tienda
        decide qué dirección publicar y es responsable de esa decisión.
      </p>
      <p>
        Para ubicar la tienda en el mapa, su dirección puede enviarse al servicio de geocodificación de
        <b> OpenStreetMap (Nominatim)</b>, que devuelve las coordenadas; guardamos esas coordenadas. Los
        mapas se muestran mediante <b>Google Maps</b> y/o <b>OpenStreetMap</b>; al cargar un mapa, tu
        navegador se comunica con esos proveedores, que pueden recopilar datos conforme a sus propias
        políticas de privacidad.
      </p>

      <h2>4. Ubicación del comprador (“Tiendas cerca”)</h2>
      <p>
        La función “Tiendas cerca” puede usar la ubicación de tu dispositivo para mostrarte qué tiendas
        están más próximas a ti. Esto solo ocurre <b>si lo autorizas</b> en la ventana de permiso de tu
        navegador. El cálculo de distancias se realiza <b>en tu navegador</b>; <b>no almacenamos tu
        ubicación</b> en nuestros servidores. Puedes negar el permiso o revocarlo en cualquier momento
        desde la configuración de tu navegador; en ese caso solo verás las tiendas sin el orden por
        cercanía.
      </p>

      <h2>5. Notificaciones push</h2>
      <p>
        Si activas las notificaciones, guardamos los datos técnicos de la suscripción de tu navegador
        (un identificador y las claves necesarias para el envío) con el único fin de enviarte avisos
        relevantes (por ejemplo, un pedido nuevo, el cambio de estado de un pedido o el resultado de tu
        verificación). Puedes desactivarlas cuando quieras desde tu navegador o dispositivo.
      </p>

      <h2>6. Cómo usamos tus datos</h2>
      <ul>
        <li>Crear y administrar tu cuenta de tienda o de comprador.</li>
        <li>Verificar la identidad de las tiendas antes de permitirles publicar.</li>
        <li>Mostrar los catálogos, la ubicación de las tiendas y permitir que se generen y gestionen los pedidos.</li>
        <li>Facilitar el contacto entre comprador y tienda para cerrar la compra (por ejemplo, por WhatsApp).</li>
        <li>Enviarte avisos por correo y/o notificaciones push relacionados con tu actividad (pedidos, estado de tu tienda, plan o verificación).</li>
        <li>Mostrarte tiendas cercanas cuando usas esa función.</li>
        <li>Mejorar y mantener seguro el servicio.</li>
      </ul>

      <h2>7. Comunicación por WhatsApp</h2>
      <p>
        Emprende facilita el contacto directo por WhatsApp entre compradores y tiendas. Al iniciar esa
        conversación, tu número queda visible para la otra parte, que es con quien concretas la
        operación. Esas conversaciones ocurren en WhatsApp y se rigen por las políticas de dicha
        aplicación.
      </p>

      <h2>8. Con quién compartimos tus datos</h2>
      <p>
        <b>No vendemos ni alquilamos tus datos personales.</b> Los datos de un pedido se comparten con la
        tienda correspondiente para que pueda atenderlo (y los datos de la tienda con el comprador). Los
        <b> documentos de verificación (cédula y selfie) no se comparten</b> con tiendas ni compradores;
        solo los revisa nuestro equipo.
      </p>
      <p>
        Para operar, nos apoyamos en proveedores que tratan ciertos datos estrictamente para prestar su
        función: un <b>servicio de correo electrónico</b> (para enviarte avisos), <b>servicios de mapas y
        geocodificación</b> (Google Maps y OpenStreetMap/Nominatim) y un <b>servicio de envío de
        notificaciones push</b>. Solo podríamos divulgar información adicional si la ley lo exige o para
        proteger los derechos y la seguridad de los usuarios y de la plataforma.
      </p>

      <h2>9. Cookies y almacenamiento local</h2>
      <p>
        Usamos almacenamiento en tu navegador para mantener tu sesión iniciada y recordar preferencias
        básicas (como el tema claro/oscuro). No usamos estos datos para publicidad de terceros.
      </p>

      <h2>10. Seguridad</h2>
      <p>
        Aplicamos medidas razonables para proteger tu información: las contraseñas se guardan cifradas y
        los documentos de verificación se almacenan en un espacio privado, fuera del acceso público del
        sitio y solo disponible para el equipo autorizado. Ningún sistema es 100% infalible, por lo que
        también te recomendamos usar una contraseña fuerte y no compartirla.
      </p>

      <h2>11. Conservación de datos</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa y durante el tiempo necesario para cumplir
        con las finalidades descritas o con obligaciones legales. Los documentos de verificación se
        conservan mientras se mantenga el estado de verificación de la tienda o según lo exija la ley.
        Puedes solicitar la eliminación de tu cuenta y de tus datos cuando lo desees.
      </p>

      <h2>12. Tus derechos</h2>
      <p>Tienes derecho a:</p>
      <ul>
        <li><b>Acceder</b> a los datos que tenemos sobre ti.</li>
        <li><b>Rectificar</b> datos inexactos o desactualizados (puedes hacerlo desde tu perfil o configuración).</li>
        <li><b>Eliminar</b> tu cuenta y solicitar el borrado de tus datos, incluidos los documentos de verificación.</li>
        <li><b>Retirar tu consentimiento</b> para la ubicación y las notificaciones push en cualquier momento, desde tu navegador o dispositivo.</li>
      </ul>
      <p>Para ejercer estos derechos, contáctanos por los medios indicados abajo.</p>

      <h2>13. Menores de edad</h2>
      <p>
        La plataforma está dirigida a personas mayores de edad. Si eres menor, debes contar con la
        autorización y supervisión de tu representante legal.
      </p>

      <h2>14. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en esta página
        con su fecha de actualización.
      </p>

      <h2>15. Contacto</h2>
      <p>
        Si tienes preguntas sobre el tratamiento de tus datos o deseas ejercer tus derechos, escríbenos
        por WhatsApp al{' '}
        <a href="https://wa.me/584121890090" target="_blank" rel="noreferrer">+58 412-189-0090</a>.
      </p>

      <p style={{ marginTop: 26 }}>
        Consulta también nuestros <Link href="/legal/terminos">Términos y Condiciones</Link>.
      </p>
    </article>
  );
}
