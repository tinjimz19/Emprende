// Comprime/redimensiona una imagen en el navegador ANTES de subirla, para no
// enviar (ni guardar) archivos pesados. Reduce el lado mayor a `maxLado` y la
// re-codifica (WebP por defecto). Ante cualquier fallo o formato no soportado,
// devuelve el archivo original sin romper la subida.
export async function comprimirImagen(file, opciones = {}) {
  const { maxLado = 1600, calidad = 0.82, tipo = 'image/webp', alfa = true } = opciones;
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file; // no re-codificar
  if (typeof document === 'undefined') return file;

  try {
    const img = await cargarImagen(file);
    const w = img.width, h = img.height;
    if (!w || !h) return file;
    const escala = Math.min(1, maxLado / Math.max(w, h));
    const nw = Math.max(1, Math.round(w * escala));
    const nh = Math.max(1, Math.round(h * escala));

    const canvas = document.createElement('canvas');
    canvas.width = nw; canvas.height = nh;
    const ctx = canvas.getContext('2d');
    if (!alfa) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, nw, nh); }
    ctx.drawImage(img, 0, 0, nw, nh);
    if (img.close) img.close();

    let tOut = tipo;
    let blob = await aBlob(canvas, tOut, calidad);
    if (!blob && tipo === 'image/webp') {
      if (alfa) return file;            // sin soporte WebP y necesita transparencia: original
      tOut = 'image/jpeg';
      blob = await aBlob(canvas, tOut, calidad);
    }
    if (!blob) return file;
    if (blob.size >= file.size && escala === 1) return file; // no ahorró: deja el original

    const ext = tOut === 'image/webp' ? 'webp' : (tOut === 'image/png' ? 'png' : 'jpg');
    const base = (file.name || 'imagen').replace(/\.[^.]+$/, '') || 'imagen';
    return new File([blob], `${base}.${ext}`, { type: tOut });
  } catch {
    return file;
  }
}

function aBlob(canvas, tipo, calidad) {
  return new Promise((res) => {
    try { canvas.toBlob((b) => res(b), tipo, calidad); } catch { res(null); }
  });
}

async function cargarImagen(file) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(file); } catch { /* fallback */ }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
