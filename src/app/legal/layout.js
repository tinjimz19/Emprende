import Link from 'next/link';

export const metadata = {
  title: 'Legal — Emprende Cumaná',
  description: 'Términos y Condiciones y Política de Privacidad de Emprende Cumaná.',
};

export default function LegalLayout({ children }) {
  return (
    <div className="lp">
      <header style={{ borderBottom: '1px solid var(--border-soft)' }}>
        <div className="container row" style={{ padding: '16px 0', alignItems: 'center' }}>
          <Link className="logo" href="/"><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="logo-img" /> Emprende</Link>
          <div className="spacer" />
          <nav className="row" style={{ gap: 18 }}>
            <Link href="/legal/terminos" className="muted">Términos</Link>
            <Link href="/legal/privacidad" className="muted">Privacidad</Link>
          </nav>
        </div>
      </header>

      <main className="container narrow" style={{ paddingTop: 30, paddingBottom: 60 }}>
        <style>{`
          .legal-doc{line-height:1.72}
          .legal-doc h1{font-size:28px;margin:0 0 4px}
          .legal-doc .meta{color:var(--text-3);font-size:13px;margin:0 0 22px}
          .legal-doc h2{font-size:19px;margin:30px 0 8px;padding-top:6px}
          .legal-doc h3{font-size:16px;margin:18px 0 4px}
          .legal-doc p{margin:8px 0}
          .legal-doc ul{margin:8px 0;padding-left:22px}
          .legal-doc li{margin:5px 0}
          .legal-doc a{color:var(--brand);font-weight:600}
          .legal-doc .intro{color:var(--text-2)}
        `}</style>
        {children}
      </main>

      <footer className="lp-footer">
        <div className="container">
          <div className="bottom">
            <span>© {new Date().getFullYear()} Emprende Cumaná · Cumaná, Venezuela</span>
            <Link href="/">Volver al inicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
