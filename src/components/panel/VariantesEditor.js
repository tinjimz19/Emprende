'use client';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';

const HEX_DEFECTO = '#dc2626';
const comboKey = (arr) => arr.join(' / ');

// Producto cartesiano de arreglos de valores.
function cartesiano(listas) {
  if (!listas.length || listas.some((l) => l.length === 0)) return [];
  return listas.reduce((acc, lista) => acc.flatMap((c) => lista.map((v) => [...c, v])), [[]]);
}

// Reconstruye atributos + filas desde las variantes que vienen del backend.
function desdeBackend(variantes) {
  const orden = [];
  const valoresPorAttr = {}; // nombre -> Map(valor -> hex)
  variantes.forEach((v) => (v.atributos || []).forEach((a) => {
    if (!valoresPorAttr[a.atributo]) { valoresPorAttr[a.atributo] = new Map(); orden.push(a.atributo); }
    if (!valoresPorAttr[a.atributo].has(a.valor)) valoresPorAttr[a.atributo].set(a.valor, a.color_hex || null);
  }));
  const atributos = orden.map((nombre) => {
    const entradas = [...valoresPorAttr[nombre].entries()];
    const esColor = nombre.toLowerCase() === 'color' || entradas.some(([, hex]) => !!hex);
    return {
      nombre,
      esColor,
      valores: entradas.map(([valor, hex]) => ({ valor, hex: hex || (esColor ? HEX_DEFECTO : null) })),
    };
  });
  const filas = variantes.map((v) => {
    const combo = orden.map((nombre) => (v.atributos || []).find((a) => a.atributo === nombre)?.valor || '');
    return {
      combo,
      sku: v.sku || '',
      precio: v.precio == null ? '' : String(v.precio),
      stock: v.stock ?? 0,
      imagen_id: v.imagen_id ? Number(v.imagen_id) : null,
    };
  });
  return { atributos, filas };
}

export default function VariantesEditor({ productoId, variantesIniciales, imagenes = [], onChange, onError }) {
  const inicial = useMemo(() => desdeBackend(variantesIniciales || []), [variantesIniciales]);
  const [activo, setActivo] = useState((variantesIniciales || []).length > 0);
  const [atributos, setAtributos] = useState(inicial.atributos);
  const [filas, setFilas] = useState(inicial.filas);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState('');
  const [nuevoAttr, setNuevoAttr] = useState('');
  const [nuevoValor, setNuevoValor] = useState({}); // idxAttr -> texto

  // Regenera la matriz preservando lo ya editado (por combinación).
  function regenerar(attrs) {
    const listas = attrs.map((a) => a.valores.map((v) => v.valor).filter(Boolean));
    const combos = cartesiano(listas);
    setFilas((prev) => {
      const previas = new Map(prev.map((f) => [comboKey(f.combo), f]));
      return combos.map((combo) => previas.get(comboKey(combo)) || { combo, sku: '', precio: '', stock: 0, imagen_id: null });
    });
  }

  function actualizarAttrs(nuevos) { setAtributos(nuevos); regenerar(nuevos); }

  function activar() {
    setActivo(true);
    if (atributos.length === 0) {
      const base = [
        { nombre: 'Talla', esColor: false, valores: [] },
        { nombre: 'Color', esColor: true, valores: [] },
      ];
      setAtributos(base);
    }
  }

  function agregarAtributo() {
    const nombre = nuevoAttr.trim();
    if (!nombre) return;
    if (atributos.some((a) => a.nombre.toLowerCase() === nombre.toLowerCase())) { onError?.('Ese atributo ya existe'); return; }
    actualizarAttrs([...atributos, { nombre, esColor: nombre.toLowerCase() === 'color', valores: [] }]);
    setNuevoAttr('');
  }

  function quitarAtributo(idx) {
    actualizarAttrs(atributos.filter((_, i) => i !== idx));
  }

  function toggleColor(idx) {
    const nuevos = atributos.map((a, i) => i === idx
      ? { ...a, esColor: !a.esColor, valores: a.valores.map((v) => ({ ...v, hex: !a.esColor ? (v.hex || HEX_DEFECTO) : null })) }
      : a);
    setAtributos(nuevos);
  }

  function agregarValor(idx) {
    const texto = (nuevoValor[idx] || '').trim();
    if (!texto) return;
    if (atributos[idx].valores.some((v) => v.valor.toLowerCase() === texto.toLowerCase())) return;
    const nuevos = atributos.map((a, i) => i === idx
      ? { ...a, valores: [...a.valores, { valor: texto, hex: a.esColor ? HEX_DEFECTO : null }] }
      : a);
    actualizarAttrs(nuevos);
    setNuevoValor((n) => ({ ...n, [idx]: '' }));
  }

  function quitarValor(idx, vIdx) {
    const nuevos = atributos.map((a, i) => i === idx
      ? { ...a, valores: a.valores.filter((_, j) => j !== vIdx) }
      : a);
    actualizarAttrs(nuevos);
  }

  function cambiarHex(idx, vIdx, hex) {
    setAtributos((prev) => prev.map((a, i) => i === idx
      ? { ...a, valores: a.valores.map((v, j) => j === vIdx ? { ...v, hex } : v) }
      : a));
  }

  function editarFila(fIdx, campo, valor) {
    setFilas((prev) => prev.map((f, i) => i === fIdx ? { ...f, [campo]: valor } : f));
  }

  function hexDe(nombreAttr, valor) {
    const a = atributos.find((x) => x.nombre === nombreAttr);
    return a?.valores.find((v) => v.valor === valor)?.hex || null;
  }

  async function guardar() {
    setGuardando(true); setOk(''); onError?.('');
    try {
      const payloadAttrs = atributos
        .filter((a) => a.nombre.trim() && a.valores.length)
        .map((a) => ({
          nombre: a.nombre.trim(),
          valores: a.valores.map((v) => a.esColor ? { valor: v.valor, hex: v.hex } : v.valor),
        }));
      const payloadVars = filas.map((f) => ({
        sku: f.sku || '',
        precio: f.precio === '' ? '' : Number(f.precio),
        stock: Number(f.stock || 0),
        imagen_id: f.imagen_id || null,
        combo: f.combo,
      }));
      const r = await api(`/api/productos/${productoId}/variantes`, {
        method: 'POST',
        body: { atributos: payloadAttrs, variantes: payloadVars },
      });
      onChange?.(r.variantes || []);
      setOk('Variantes guardadas ✓');
      setTimeout(() => setOk(''), 2500);
    } catch (e) { onError?.(e.message); }
    finally { setGuardando(false); }
  }

  async function desactivar() {
    if (!confirm('¿Quitar todas las variantes de este producto?')) return;
    setGuardando(true); onError?.('');
    try {
      const r = await api(`/api/productos/${productoId}/variantes`, {
        method: 'POST', body: { atributos: [], variantes: [] },
      });
      onChange?.(r.variantes || []);
      setActivo(false); setAtributos([]); setFilas([]);
    } catch (e) { onError?.(e.message); }
    finally { setGuardando(false); }
  }

  if (!activo) {
    return (
      <div>
        <p className="muted" style={{ marginTop: 0 }}>
          Este producto se vende como una sola opción, con el stock de arriba. Actívalo si tiene tallas, colores u otras opciones.
        </p>
        <button type="button" className="btn btn-soft" onClick={activar}>Activar variantes</button>
      </div>
    );
  }

  return (
    <div>
      {/* Atributos y sus valores */}
      {atributos.map((a, idx) => (
        <div key={idx} className="attr-bloque">
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            <strong>{a.nombre}</strong>
            <label className="row tiny muted" style={{ gap: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={a.esColor} onChange={() => toggleColor(idx)} /> es color
            </label>
            <div className="spacer" />
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => quitarAtributo(idx)}>Quitar</button>
          </div>

          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {a.valores.map((v, vIdx) => (
              <span key={vIdx} className="valor-chip">
                {a.esColor && (
                  <input type="color" value={v.hex || HEX_DEFECTO} onChange={(e) => cambiarHex(idx, vIdx, e.target.value)}
                    className="valor-color" title="Color" />
                )}
                {v.valor}
                <button type="button" onClick={() => quitarValor(idx, vIdx)} aria-label="quitar">✕</button>
              </span>
            ))}
            <input
              className="input input-inline"
              placeholder={a.esColor ? 'Rojo, Azul…' : 'S, M, L…'}
              value={nuevoValor[idx] || ''}
              onChange={(e) => setNuevoValor((n) => ({ ...n, [idx]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarValor(idx); } }}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => agregarValor(idx)}>+ Valor</button>
          </div>
        </div>
      ))}

      <div className="row" style={{ gap: 8, marginTop: 6 }}>
        <input className="input input-inline" placeholder="Nuevo atributo (Material…)" value={nuevoAttr}
          onChange={(e) => setNuevoAttr(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarAtributo(); } }} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={agregarAtributo}>+ Atributo</button>
      </div>

      {/* Matriz */}
      {filas.length > 0 ? (
        <div className="card" style={{ marginTop: 16, padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Variante</th>
                <th style={{ width: 120 }}>Precio ($)</th>
                <th style={{ width: 90 }}>Stock</th>
                <th style={{ width: 140 }}>SKU</th>
                <th style={{ width: 150 }}>Imagen</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, fIdx) => (
                <tr key={comboKey(f.combo)}>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                      {f.combo.map((val, i) => {
                        const hex = hexDe(atributos[i]?.nombre, val);
                        return (
                          <span key={i} className="combo-tag">
                            {hex && <span className="swatch" style={{ background: hex }} />}
                            {val}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <input className="input input-sm" type="number" step="0.01" min="0" placeholder="base"
                      value={f.precio} onChange={(e) => editarFila(fIdx, 'precio', e.target.value)} />
                  </td>
                  <td>
                    <input className="input input-sm" type="number" min="0"
                      value={f.stock} onChange={(e) => editarFila(fIdx, 'stock', e.target.value)} />
                  </td>
                  <td>
                    <input className="input input-sm" placeholder="opcional"
                      value={f.sku} onChange={(e) => editarFila(fIdx, 'sku', e.target.value)} />
                  </td>
                  <td>
                    {imagenes.length === 0 ? (
                      <span className="muted tiny">Sube fotos en la <b>Galería</b> ↑ para poder asignarlas</span>
                    ) : (
                      <div className="row" style={{ gap: 6, alignItems: 'center' }}>
                        <span className="var-thumb">
                          {(() => {
                            const im = imagenes.find((x) => Number(x.id) === Number(f.imagen_id));
                            return im ? <img src={im.url_thumb || im.url_card} alt="" /> : null;
                          })()}
                        </span>
                        <select className="input input-sm" value={f.imagen_id || ''}
                          onChange={(e) => editarFila(fIdx, 'imagen_id', e.target.value === '' ? null : Number(e.target.value))}>
                          <option value="">— Ninguna —</option>
                          {imagenes.map((im, i) => (
                            <option key={im.id} value={im.id}>Foto {i + 1}{i === 0 ? ' (portada)' : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted tiny" style={{ marginTop: 14 }}>Agrega valores a los atributos para generar las combinaciones.</p>
      )}

      <p className="muted tiny" style={{ marginTop: 10 }}>Precio vacío = usa el precio base del producto. El stock se descuenta por variante al confirmar pedidos.</p>
      <p className="muted tiny" style={{ marginTop: 4 }}>Foto por variante: sube todas las fotos en la <b>Galería</b> (arriba) y luego, en la columna <b>Imagen</b>, elige cuál le corresponde a cada combinación. En la tienda, al elegir esa opción se mostrará su foto.</p>

      <div className="row" style={{ marginTop: 14, gap: 10, alignItems: 'center' }}>
        <button type="button" className="btn btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar variantes'}</button>
        <button type="button" className="btn btn-soft" onClick={desactivar} disabled={guardando}>Quitar variantes</button>
        {ok && <span className="muted" style={{ color: 'var(--ok, var(--brand))', fontSize: 13 }}>{ok}</span>}
      </div>
    </div>
  );
}
