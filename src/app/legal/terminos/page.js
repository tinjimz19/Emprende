import Link from 'next/link';

export const metadata = {
  title: 'Términos y Condiciones — Emprende Cumaná',
  description: 'Términos y Condiciones de uso de la plataforma Emprende Cumaná.',
};

export default function TerminosPage() {
  return (
    <article className="card legal-doc" style={{ padding: 30 }}>
      <h1>Términos y Condiciones de Uso</h1>
      <p className="meta">Última actualización: agosto de 2026</p>

      <p className="intro">
        Bienvenido a <b>Emprende Cumaná</b> (en adelante, “Emprende”, “la plataforma” o “nosotros”).
        Estos Términos y Condiciones regulan el uso de nuestro sitio web y servicios. Al crear una
        cuenta, publicar una tienda, o comprar a través de la plataforma, aceptas estos términos en
        su totalidad. Si no estás de acuerdo, por favor no utilices la plataforma.
      </p>

      <h2>1. Qué es Emprende Cumaná</h2>
      <p>
        Emprende Cumaná es una plataforma que funciona como <b>vitrina digital</b> para conectar a
        emprendedores y tiendas de Cumaná (Venezuela) con compradores. Las tiendas publican su
        catálogo y los compradores lo exploran, arman un pedido y cierran la compra <b>directamente
        con cada tienda</b>, principalmente por WhatsApp.
      </p>

      <h2>2. Naturaleza del servicio (intermediario)</h2>
      <p>
        Emprende <b>no es parte de la relación de compraventa</b> entre la tienda y el comprador. No
        vendemos productos propios, no procesamos pagos, no gestionamos envíos ni retenemos dinero de
        las transacciones. Nuestro rol se limita a facilitar el contacto y la presentación de los
        productos. La compraventa, el pago, la entrega y cualquier reclamo se acuerdan y resuelven
        directamente entre la tienda y el comprador.
      </p>

      <h2>3. Cuentas de usuario</h2>
      <p>Existen dos tipos de cuenta:</p>
      <ul>
        <li><b>Cuenta de tienda (vendedor):</b> para emprendedores que publican y gestionan su catálogo.</li>
        <li><b>Cuenta de comprador (cliente):</b> para quienes desean comprar, guardar su historial y dejar reseñas.</li>
      </ul>
      <p>
        Debes proporcionar información veraz y mantenerla actualizada. Eres responsable de la
        confidencialidad de tu contraseña y de toda la actividad que ocurra en tu cuenta. Debes ser
        mayor de edad o contar con autorización de tu representante legal para usar la plataforma.
      </p>

      <h2>4. Responsabilidades de las tiendas</h2>
      <ul>
        <li>Publicar información veraz sobre sus productos: descripción, precio, existencias y fotos reales.</li>
        <li>Cumplir con los pedidos aceptados, los precios publicados y los tiempos y condiciones de entrega acordados.</li>
        <li>Ofrecer y despachar únicamente productos lícitos y de su legítima propiedad o representación.</li>
        <li>Atender y resolver los reclamos de sus compradores.</li>
        <li>Cumplir con las obligaciones legales, tributarias y sanitarias que apliquen a su actividad.</li>
      </ul>

      <h2>5. Responsabilidades del comprador</h2>
      <ul>
        <li>Revisar la información del producto y de la tienda antes de pagar.</li>
        <li>Confirmar con la tienda los detalles de pago, envío y entrega antes de concretar la compra.</li>
        <li>Proporcionar datos de contacto correctos para coordinar el pedido.</li>
      </ul>
      <p>
        Recomendamos verificar la reputación de la tienda y guardar la conversación de WhatsApp como
        respaldo de tu pedido.
      </p>

      <h2>6. Pagos y transacciones</h2>
      <p>
        Los pagos se realizan <b>directamente entre el comprador y la tienda</b> por los medios que la
        tienda indique (pago móvil, transferencia, divisas, USDT, efectivo al retirar, etc.). Emprende
        no interviene en el cobro ni garantiza los pagos. El comprobante de pago, cuando se solicita,
        sirve como respaldo de la operación entre las partes.
      </p>

      <h2>7. Envíos y entregas</h2>
      <p>
        Cada tienda define los métodos de entrega que ofrece (delivery, entrega en su tienda física,
        MRW, ZOOM, o entrega acordada) y sus costos. El delivery, cuando aplica, tiene un costo fijo
        establecido por la tienda. La responsabilidad sobre el envío, los tiempos y el estado del
        producto recae en la tienda y, cuando corresponda, en la empresa de encomiendas contratada.
      </p>

      <h2>8. Planes y membresías</h2>
      <p>
        Las tiendas pueden usar un plan gratuito o contratar planes pagos que amplían sus límites
        (más productos, fotos y destacados). La activación de los planes pagos puede realizarse de
        forma manual tras verificar el pago reportado. Los planes no tienen permanencia y pueden
        cancelarse en cualquier momento; al vencer un plan pago, la tienda regresa a los límites del
        plan gratuito sin que se eliminen sus productos. Los montos ya pagados por un período de
        servicio digital ya prestado no son reembolsables, salvo lo que exija la ley.
      </p>

      <h2>9. Contenido, reseñas y conducta</h2>
      <p>
        Eres responsable del contenido que publicas (nombres, descripciones, fotos, reseñas y
        comentarios). Las reseñas deben ser honestas y basadas en una experiencia real. Nos reservamos
        el derecho de moderar, ocultar o eliminar contenido que sea falso, ofensivo, engañoso, que
        infrinja derechos de terceros o que incumpla estos términos.
      </p>

      <h2>10. Productos y actividades prohibidas</h2>
      <p>Queda prohibido publicar, ofrecer o solicitar a través de la plataforma:</p>
      <ul>
        <li>Productos ilegales, robados, falsificados o que infrinjan derechos de terceros.</li>
        <li>Armas, sustancias controladas, medicamentos de venta restringida y similares.</li>
        <li>Contenido fraudulento, engañoso o que suplante la identidad de otra persona o marca.</li>
        <li>Cualquier uso que dañe, sobrecargue o vulnere la seguridad de la plataforma.</li>
      </ul>

      <h2>11. Propiedad intelectual</h2>
      <p>
        La marca “Emprende Cumaná”, el logo, el diseño y el software de la plataforma son de su
        titular. El contenido que cada tienda o usuario carga sigue siendo de su titular, quien nos
        otorga una licencia limitada para mostrarlo dentro de la plataforma con el fin de prestar el
        servicio.
      </p>

      <h2>12. Suspensión y cancelación de cuentas</h2>
      <p>
        Podemos suspender o cancelar cuentas que incumplan estos términos, que realicen actividades
        fraudulentas o que afecten a otros usuarios o a la plataforma. También puedes solicitar la
        eliminación de tu cuenta cuando lo desees.
      </p>

      <h2>13. Limitación de responsabilidad</h2>
      <p>
        Emprende se ofrece “tal cual”, como un servicio de vitrina e intermediación. No garantizamos la
        disponibilidad ininterrumpida del servicio ni la veracidad, calidad, legalidad o cumplimiento
        de las tiendas o compradores. <b>No somos responsables por las transacciones, pagos, entregas,
        daños o desacuerdos que ocurran entre tiendas y compradores.</b> Cada usuario asume los riesgos
        propios de operar con terceros.
      </p>

      <h2>14. Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos Términos y Condiciones cuando sea necesario. Publicaremos la versión
        vigente en esta página con su fecha de actualización. El uso continuado de la plataforma
        implica la aceptación de los cambios.
      </p>

      <h2>15. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Bolivariana de Venezuela. Cualquier
        controversia se procurará resolver de buena fe entre las partes.
      </p>

      <h2>16. Contacto</h2>
      <p>
        Para dudas sobre estos términos puedes escribirnos por WhatsApp al{' '}
        <a href="https://wa.me/584121890090" target="_blank" rel="noreferrer">+58 412-189-0090</a>.
      </p>

      <p style={{ marginTop: 26 }}>
        Consulta también nuestra <Link href="/legal/privacidad">Política de Privacidad</Link>.
      </p>
    </article>
  );
}
