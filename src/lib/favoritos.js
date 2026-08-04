'use client';
// Estado global de FAVORITOS del comprador (requiere sesión de cliente).
// Cachea el conjunto de ids de productos favoritos y notifica a los suscriptores
// para que los corazones se mantengan sincronizados en toda la app.
import { api, getClienteToken } from '@/lib/api';

let ids = new Set();
let cargado = false;
let cargando = null;
const subs = new Set();

function notify() { subs.forEach((fn) => { try { fn(); } catch {} }); }

export function estaEnFavoritos(id) { return ids.has(Number(id)); }
export function totalFavoritos() { return ids.size; }

export function suscribirFavoritos(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

// Carga (una vez) los ids favoritos del comprador. Sin sesión, deja el set vacío.
export async function cargarFavoritos(force = false) {
  if (typeof window === 'undefined') return;
  if (!getClienteToken()) { ids = new Set(); cargado = true; notify(); return; }
  if (cargado && !force) return;
  if (cargando) return cargando;
  cargando = api('/api/cliente/favoritos/ids', { cliente: true })
    .then((d) => { ids = new Set((d.ids || []).map(Number)); cargado = true; notify(); })
    .catch(() => {})
    .finally(() => { cargando = null; });
  return cargando;
}

// Alterna un favorito de forma optimista; revierte si el servidor falla.
export async function alternarFavorito(id) {
  id = Number(id);
  const era = ids.has(id);
  if (era) ids.delete(id); else ids.add(id);
  notify();
  try {
    if (era) await api(`/api/cliente/favoritos/${id}`, { method: 'DELETE', cliente: true });
    else await api(`/api/cliente/favoritos/${id}`, { method: 'POST', cliente: true });
  } catch (e) {
    if (era) ids.add(id); else ids.delete(id);
    notify();
    throw e;
  }
}

// Limpia el estado (p. ej. al cerrar sesión de comprador).
export function limpiarFavoritos() { ids = new Set(); cargado = false; notify(); }
