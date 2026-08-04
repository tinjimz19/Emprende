import './globals.css';
import PWA from '@/components/PWA';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Emprende — Tu tienda online',
  description: 'Plataforma para emprendedores de Cumaná: publica tu catálogo, vende y lleva tus cuentas.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Emprende' },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#FF453A',
};

// Evita el parpadeo de tema: aplica data-theme antes de pintar.
const initTheme = `(function(){try{var t=localStorage.getItem('emprende_theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
      </head>
      <body>{children}<PWA /></body>
    </html>
  );
}
