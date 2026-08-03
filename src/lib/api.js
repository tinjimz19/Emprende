// Cliente HTTP hacia el backend PHP.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/emprende-back';

// Métodos de envío que puede ofrecer una tienda (clave -> etiqueta).
export const METODOS_ENVIO = {
  delivery: 'Delivery',
  origen: 'Entrega en origen',
  mrw: 'MRW',
  zoom: 'ZOOM',
  acordado: 'Entrega acordada',
};

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('emprende_token');
}

export function setToken(t) {
  if (typeof window === 'undefined') return;
  if (t) localStorage.setItem('emprende_token', t);
  else localStorage.removeItem('emprende_token');
}

// Token de CUENTA DE CLIENTE (comprador), separado del token del panel.
export function getClienteToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('emprende_cliente_token');
}
export function setClienteToken(t) {
  if (typeof window === 'undefined') return;
  if (t) localStorage.setItem('emprende_cliente_token', t);
  else localStorage.removeItem('emprende_cliente_token');
}

export async function api(path, { method = 'GET', body, auth = true, isForm = false, cliente = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  // cliente:true usa el token del comprador; si no, el del panel (cuando auth).
  const token = cliente ? getClienteToken() : (auth ? getToken() : null);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = { ok: false, error: `Error ${res.status}` };
  }
  if (!res.ok || json.ok === false) {
    const err = new Error(json.error || `Error ${res.status}`);
    err.detalles = json.detalles;
    err.status = res.status;
    throw err;
  }
  return json.data;
}

// Sube un archivo (multipart/form-data) a un endpoint del backend.
// Devuelve el `data` de la respuesta o lanza Error con el mensaje del servidor.
export async function subirArchivo(path, file, field = 'imagen') {
  const fd = new FormData();
  fd.append(field, file);
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = { ok: false, error: `Error ${res.status}` };
  }
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `Error ${res.status}`);
  }
  return json.data;
}

// Envía un formulario multipart (campos + archivo opcional). Devuelve `data` o lanza.
export async function enviarFormulario(path, campos = {}, archivo = null, campoArchivo = 'archivo', method = 'POST') {
  const fd = new FormData();
  Object.entries(campos).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
  if (archivo) fd.append(campoArchivo, archivo);
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = { ok: false, error: `Error ${res.status}` };
  }
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || `Error ${res.status}`);
  }
  return json.data;
}

// Formatea un precio USD con su equivalente en Bs.
export function precioBs(usd, tasa) {
  const bs = Number(usd) * Number(tasa || 0);
  return bs > 0 ? `Bs ${bs.toLocaleString('es-VE', { maximumFractionDigits: 2 })}` : null;
}

export function usd(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
