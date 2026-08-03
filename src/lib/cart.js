// Carrito simple guardado en localStorage, por tienda (slug).
function key(slug) {
  return `emprende_cart_${slug}`;
}

export function getCart(slug) {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key(slug)) || '[]');
  } catch {
    return [];
  }
}

export function saveCart(slug, items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key(slug), JSON.stringify(items));
  window.dispatchEvent(new Event('cart-changed'));
}

export function addToCart(slug, item) {
  const items = getCart(slug);
  const idx = items.findIndex(
    (i) => i.producto_id === item.producto_id && i.variante_id === item.variante_id
  );
  if (idx >= 0) {
    items[idx].cantidad += item.cantidad;
  } else {
    items.push(item);
  }
  saveCart(slug, items);
}

export function updateQty(slug, index, cantidad) {
  const items = getCart(slug);
  if (items[index]) {
    items[index].cantidad = Math.max(1, cantidad);
    saveCart(slug, items);
  }
}

export function removeItem(slug, index) {
  const items = getCart(slug);
  items.splice(index, 1);
  saveCart(slug, items);
}

export function clearCart(slug) {
  saveCart(slug, []);
}

export function cartTotal(items) {
  return items.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0);
}
