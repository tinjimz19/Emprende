'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, usd } from '@/lib/api';

export default function Resumen() {
  const [resumen, setResumen] = useState(null);
  const [tienda, setTienda] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/api/contabilidad/resumen'), api('/api/tienda')])
      .then(([r, t]) => { setResumen(r); setTienda(t.tienda); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!resumen) return <p className="muted">Cargando…</p>;

  const tarjetas = [
    ['Ingresos del mes', usd(resumen.ingresos), 'var(--ok)'],
    ['Gastos del mes', usd(resumen.gastos), 'var(--danger)'],
    ['Ganancia', usd(resumen.ganancia), 'var(--text)'],
    ['Ventas', `${resumen.ventas.cantidad}`, 'var(--brand)'],
  ];

  return (
    <>
      {tienda && tienda.estado === 'pendiente' && (
        <div className="alert" style={{ background: 'var(--warn-soft)', color: 'var(--warn)', marginBottom: 18 }}>
          Tu tienda está <b>pendiente de aprobación</b>. Puedes cargar tus productos mientras tanto; tu catálogo público se activará cuando el equipo la apruebe.
        </div>
      )}
      <div className="row">
        <div>
          <h1 style={{ margin: 0 }}>{tienda?.nombre || 'Tu tienda'}</h1>
          <p className="muted tiny" style={{ margin: '4px 0 0' }}>Resumen del mes en curso</p>
        </div>
        <div className="spacer" />
        {tienda && Number(tienda.tasa_bs) === 0 && (
          <Link className="badge badge-warn" href="/panel/configuracion" style={{ padding: '8px 14px' }}>⚠ Configura tu tasa Bs</Link>
        )}
      </div>

      <div className="grid grid-stats" style={{ marginTop: 22 }}>
        {tarjetas.map(([t, n, c]) => (
          <div className="card stat" key={t}>
            <div className="label">{t}</div>
            <div className="n" style={{ color: c }}>{n}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Primeros pasos</h3>
        <ol className="muted" style={{ lineHeight: 2, margin: 0, paddingLeft: 20 }}>
          <li>Configura tu <Link href="/panel/configuracion" style={{ color: 'var(--brand)', fontWeight: 600 }}>tasa del día, logo y WhatsApp</Link>.</li>
          <li>Carga tus <Link href="/panel/productos" style={{ color: 'var(--brand)', fontWeight: 600 }}>productos</Link> con fotos y variantes.</li>
          <li>Comparte el link de tu tienda pública con tus clientes por WhatsApp.</li>
        </ol>
      </div>
    </>
  );
}
