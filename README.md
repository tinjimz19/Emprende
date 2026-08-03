# Emprende — Frontend (Next.js)

Interfaz de la plataforma: página de inicio, registro/login, panel del emprendedor y
catálogo público de cada tienda. Hecho con Next.js (App Router, JavaScript).

## Requisitos
- Node.js 18 o superior
- El backend PHP corriendo en XAMPP (ver `emprende-back`)

## Puesta en marcha

1. Instala dependencias:

   ```
   npm install
   ```

2. Revisa `.env.local` (apunta al backend):

   ```
   NEXT_PUBLIC_API_URL=http://localhost/emprende-back
   ```

3. Arranca el servidor de desarrollo:

   ```
   npm run dev
   ```

4. Abre <http://localhost:3000>.

   - Panel: entra con `dueno@demo.test` / `demo1234` (si corriste `seed.php`).
   - Catálogo de la tienda demo: <http://localhost:3000/t/la-tiendita>

## Estructura

```
src/
├── app/
│   ├── page.js                Página de inicio (landing)
│   ├── login/ · registro/     Autenticación
│   ├── panel/                 Panel del emprendedor (protegido)
│   │   ├── page.js            Resumen (ingresos, gastos, ganancia)
│   │   ├── productos/         Alta de productos + fotos
│   │   ├── pedidos/           Pedidos y cambio de estado
│   │   ├── contabilidad/      Ingresos y gastos del mes
│   │   └── configuracion/     Datos de la tienda, tasa Bs, WhatsApp
│   └── t/[slug]/              Catálogo público
│       ├── page.js            Grilla + carrito + checkout
│       └── [prodSlug]/        Detalle con variantes y botón WhatsApp
└── lib/
    ├── api.js                 Cliente HTTP + helpers de precio
    └── cart.js                Carrito (localStorage)
```

## Cómo funciona el flujo
- El cliente arma su **carrito** en el catálogo y genera un **pedido interno**.
- Cada producto tiene además un botón **"Consultar por WhatsApp"** que abre el chat
  con el emprendedor mencionando ese producto.
- Al confirmar el pedido se muestra un botón para **enviar el resumen por WhatsApp**.
- Los precios se ven en **$ y en Bs** según la tasa que el emprendedor configure.
