'use client';
import SeguridadPanel from '@/components/panel/SeguridadPanel';

export default function SeguridadPage() {
  return (
    <div style={{ maxWidth: 780 }}>
      <h1 style={{ marginTop: 0 }}>Seguridad</h1>
      <p className="muted tiny" style={{ marginTop: 4 }}>Protege tu cuenta: dispositivos de confianza y sesiones activas.</p>
      <SeguridadPanel />
    </div>
  );
}
