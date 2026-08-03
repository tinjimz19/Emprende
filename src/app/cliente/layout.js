'use client';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function ClienteLayout({ children }) {
  return (
    <>
      <header className="topbar">
        <div className="container inner">
          <Link href="/" className="tn-home" title="Inicio de Emprende"><img src="/hero/emprende-logo.png" alt="Emprende Cumaná" className="tn-logo-img" /> Emprende</Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="container" style={{ paddingTop: 40, paddingBottom: 70 }}>{children}</main>
    </>
  );
}
