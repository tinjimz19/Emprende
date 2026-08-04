'use client';
// Estado global de TIENDAS SEGUIDAS por el comprador (requiere sesión de cliente).
import { api, getClienteToken } from '@/lib/api';

let ids = new Set();
let cargado = false;
let cargando = null;
const subs = new Set();

function notify() { subs.forEach((fn) => { try { fn(); } catch {} }); }

export function sigueTienda(id) { return ids.has(Number(id)); }
export function totalSeguidas() { return ids.size; }

export function suscribirSeguidas(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export async function cargarSeguidas(force = false) {
  if (typeof window === 'undefined') return;
  if (!getClienteToken()) { ids = new Set(); cargado = true; notify(); return; }
  if (cargado && !force) return;
  if (cargando) return cargando;
  cargando = api('/api/cliente/seguidas/ids', { cliente: true })
    .then((d) => { ids = new Set((d.ids || []).map(Number)); cargado = true; notify(); })
    .catch(() => {})
    .finally(() => { cargando = null; });
  return cargando;
}

// Alterna seguir/dejar de seguir de forma optimista; revierte si el servidor falla.
export async function alternarSeguir(id) {
  id = Number(id);
  const era = ids.has(id);
  if (era) ids.delete(id); else ids.add(id);
  notify();
  try {
    if (era) await api(`/api/cliente/seguir/${id}`, { method: 'DELETE', cliente: true });
    else await api(`/api/cliente/seguir/${id}`, { method: 'POST', cliente: true });
  } catch (e) {
    if (era) ids.add(id); else ids.delete(id);
    notify();
    throw e;
  }
}

export function limpiarSeguidas() { ids = new Set(); cargado = false; notify(); }
