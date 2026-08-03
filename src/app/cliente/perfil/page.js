'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getClienteToken, setClienteToken, usd } from '@/lib/api';

const BADGE = { pagado: 'badge-ok', entregado: 'badge-ok', cancelado: 'badge-danger', confirmado: 'badge-brand', pendiente: 'badge-warn' };

function fmt(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return String(s).slice(0, 10);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Perfil() {
  const router = useRouter();
  const [cuenta, setCuenta] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [estado, setEstado] = useState('cargando');

  useEffect(() => {
    if (!getClienteToken()) { router.replace('/cliente/entrar'); return; }
    Promise.all([api('/api/cliente/me', { cliente: true }), api('/api/cliente/pedidos', { cliente: true })])
      .then(([m, p]) => { setCuenta(m.cuenta); setPedidos(p.pedidos); setEstado('ok'); })
      .catch(() => { setClienteToken(null); router.replace('/cliente/entrar'); });
  }, [router]);

  async function salir() {
    try { await api('/api/cliente/logout', { method: 'POST', cliente: true }); } catch {}
    setClienteToken(null);
    router.replace('/');
  }

  if (estado !== 'ok') return <p className="muted">Cargando…</p>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="row" style={{ alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Hola, {cuenta.nombre}</h1>
          <p className="muted tiny" style={{ margin: '4px 0 0' }}>{cuenta.email}{cuenta.telefono ? ` · ${cuenta.telefono}` : ''}</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-soft btn-sm" onClick={salir}>Cerrar sesión</button>
      </div>

      <h3 style={{ margin: '28px 0 12px' }}>Mis pedidos</h3>
      {pedidos.length === 0 ? (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Aún no has hecho pedidos. Explora las tiendas y tus compras aparecerán aquí.</p></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Código</th><th>Tienda</th><th>Fecha</th><th>Ítems</th><th style={{ textAlign: 'right' }}>Total</th><th>Estado</th></tr></thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.codigo}</td>
                  <td><Link href={`/t/${p.tienda_slug}`} style={{ color: 'var(--brand)' }}>{p.tienda_nombre}</Link></td>
                  <td className="tiny">{fmt(p.created_at)}</td>
                  <td>{p.num_items}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{usd(p.total)}</td>
                  <td><span className={`badge ${BADGE[p.estado] || ''}`}>{p.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
