import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Emprende — Tu tienda online',
  description: 'Plataforma para emprendedores de Cumaná: publica tu catálogo, vende y lleva tus cuentas.',
  icons: { icon: '/hero/emprende-logo.png' },
};

// Evita el parpadeo de tema: aplica data-theme antes de pintar.
const initTheme = `(function(){try{var t=localStorage.getItem('emprende_theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
