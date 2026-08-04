'use client';
// Suscripción a notificaciones push (Web Push) para compradores y dueños.
import { API_BASE, getToken, getClienteToken } from '@/lib/api';

export function soportaPush() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

function b64ToUint8(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function post(path, body, cliente) {
  const token = cliente ? getClienteToken() : getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  let json; try { json = await res.json(); } catch { json = { ok: false }; }
  if (!res.ok || json.ok === false) throw new Error(json.error || 'Error');
  return json.data;
}

export async function estaSuscrito() {
  if (!soportaPush()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch { return false; }
}

export async function activarPush(cliente = false) {
  if (!soportaPush()) throw new Error('Tu navegador no soporta notificaciones.');
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('Permiso de notificaciones denegado.');
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const res = await fetch(`${API_BASE}/api/push/clave-publica`);
  const j = await res.json();
  const clave = j && j.data && j.data.clave;
  if (!clave) throw new Error('No hay clave de notificaciones configurada en el servidor.');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(clave) });
  }
  await post('/api/push/suscribir', { subscription: sub.toJSON() }, cliente);
  return true;
}

export async function desactivarPush(cliente = false) {
  if (!soportaPush()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    try { await post('/api/push/desuscribir', { endpoint: sub.endpoint }, cliente); } catch {}
    try { await sub.unsubscribe(); } catch {}
  }
}
