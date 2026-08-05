'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, usd, enviarFormulario } from '@/lib/api';

const CSV_HEADERS = 'nombre,precio,precio_oferta,descripcion,categoria,stock,estado,imagen_url';
const CSV_EJEMPLO = [
  'Camisa manga larga,18.50,14.90,Camisa de algodón para caballero,Ropa,25,borrador,https://ejemplo.com/camisa.jpg',
  'Gorra clásica,7.00,,Gorra ajustable unisex,Accesorios,40,borrador,',
];

const BADGE = {
  ok: { bg: '#e7f6ec', color: '#1a7f43', txt: 'Listo' },
  duplicado: { bg: '#fff4e0', color: '#a86400', txt: 'Duplicado' },
  error: { bg: '#fdecec', color: '#c0392b', txt: 'Error' },
  limite: { bg: '#f0edff', color: '#5b4bd6', txt: 'Límite' },
};

const POR_PAGINA = 10;

// Filtros de estado (el primero es el activo por defecto).
const FILTROS = [
  { key: 'activo', label: 'Activos' },
  { key: 'borrador', label: 'Borrador' },
  { key: 'inactivo', label: 'Inactivos' },
  { key: 'todos', label: 'Todos' },
];

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  // Filtro / búsqueda / paginación
  const [filtro, setFiltro] = useState('activo');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [umbral, setUmbral] = useState(0);

  // Importación por CSV
  const [modal, setModal] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);   // { resumen, filas }
  const [resultado, setResultado] = useState(null); // { creados, resumen }
  const [procesando, setProcesando] = useState(false);
  const [errImp, setErrImp] = useState('');

  async function cargar() {
    setCargando(true);
    try {
      const p = await api('/api/productos');
      setProductos(p.productos);
      setUmbral(p.umbral_stock || 0);
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);

  // Al cambiar filtro o búsqueda, vuelve a la primera página.
  useEffect(() => { setPagina(1); }, [filtro, busqueda]);

  async function eliminar(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar este producto? Se borran también sus imágenes y variantes.')) return;
    try { await api(`/api/productos/${id}`, { method: 'DELETE' }); await cargar(); }
    catch (e) { setError(e.message); }
  }

  // Conteos por estado.
  const conteo = useMemo(() => {
    const c = { activo: 0, borrador: 0, inactivo: 0, todos: productos.length };
    for (const p of productos) { if (c[p.estado] !== undefined) c[p.estado]++; }
    return c;
  }, [productos]);

  // Lista filtrada por estado + búsqueda por nombre.
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos
      .filter((p) => filtro === 'todos' || p.estado === filtro)
      .filter((p) => q === '' || String(p.nombre || '').toLowerCase().includes(q));
  }, [productos, filtro, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  function abrirImportar() {
    setModal(true);
    setArchivo(null);
    setPreview(null);
    setResultado(null);
    setErrImp('');
  }

  function descargarPlantilla() {
    const contenido = '﻿' + CSV_HEADERS + '\n' + CSV_EJEMPLO.join('\n') + '\n';
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-productos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function elegirArchivo(e) {
    setArchivo(e.target.files?.[0] || null);
    setPreview(null);
    setResultado(null);
    setErrImp('');
  }

  async function previsualizar() {
    if (!archivo) { setErrImp('Selecciona un archivo CSV.'); return; }
    setErrImp('');
    setProcesando(true);
    try {
      const d = await enviarFormulario('/api/productos/importar', { confirmar: '0' }, archivo, 'archivo');
      setPreview(d);
    } catch (e) { setErrImp(e.message); }
    finally { setProcesando(false); }
  }

  async function confirmar() {
    if (!archivo) return;
    setErrImp('');
    setProcesando(true);
    try {
      const d = await enviarFormulario('/api/productos/importar', { confirmar: '1' }, archivo, 'archivo');
      setResultado(d);
      await cargar();
    } catch (e) { setErrImp(e.message); }
    finally { setProcesando(false); }
  }

  const r = preview?.resumen;

  return (
    <>
      <div className="row">
        <h1 style={{ margin: 0 }}>Productos</h1>
        <div className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={abrirImportar}>Importar CSV</button>{' '}
        <Link className="btn btn-primary btn-sm" href="/panel/productos/nuevo">+ Nuevo producto</Link>
      </div>
      {error && <div className="error" style={{ marginTop: 14 }}>{error}</div>}

      {/* Filtros por estado + búsqueda */}
      <div className="prod-toolbar">
        <div className="prod-chips">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`chip ${filtro === f.key ? 'chip-on' : ''} chip-${f.key}`}
              onClick={() => setFiltro(f.key)}
            >
              {f.label} <span className="chip-n">{conteo[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="prod-search">
          <input
            className="input"
            type="search"
            placeholder="Buscar por nombre…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <div className="card prod-tabla-desktop" style={{ marginTop: 14, padding: 0 }}>
        <table className="table">
          <thead>
            <tr><th></th><th>Producto</th><th>Precio</th><th>Stock</th><th>Vistas</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={7} className="muted" style={{ padding: 24 }}>Cargando…</td></tr>
            )}
            {!cargando && productos.length === 0 && (
              <tr><td colSpan={7} className="muted" style={{ padding: 24 }}>
                Aún no tienes productos. <Link href="/panel/productos/nuevo" style={{ color: 'var(--brand)' }}>Crea el primero</Link>.
              </td></tr>
            )}
            {!cargando && productos.length > 0 && visibles.length === 0 && (
              <tr><td colSpan={7} className="muted" style={{ padding: 24 }}>
                No hay productos que coincidan con este filtro o búsqueda.
              </td></tr>
            )}
            {visibles.map((p) => {
              const efectivo = Number(p.tiene_variantes) ? Number(p.stock_variantes || 0) : Number(p.stock || 0);
              const bajo = umbral > 0 && efectivo <= umbral;
              return (
              <tr key={p.id} className="row-link" onClick={() => { location.href = `/panel/productos/${p.id}`; }}>
                <td style={{ width: 56 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: p.imagen ? `var(--surface-2) url(${p.imagen}) center/cover` : 'var(--surface-2)' }} />
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {p.categoria_nombre || 'Sin categoría'}
                    {Number(p.num_variantes) > 0 ? ` · ${p.num_variantes} variantes` : ''}
                    {Number(p.num_imagenes) > 0 ? ` · ${p.num_imagenes} fotos` : ''}
                  </div>
                </td>
                <td className="price">{usd(p.precio)}</td>
                <td>
                  {Number(p.tiene_variantes) ? Number(p.stock_variantes || 0) : (Number(p.stock) > 0 ? p.stock : (Number(p.stock) === 0 ? 0 : ''))}
                  {bajo && <span className="badge badge-warn" style={{ marginLeft: 6 }}>Stock bajo</span>}
                </td>
                <td className="muted">{Number(p.vistas) || 0}</td>
                <td><span className={`badge estado-${p.estado}`}>{p.estado}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Link className="btn btn-ghost btn-sm" href={`/panel/productos/${p.id}`} onClick={(e) => e.stopPropagation()}>Editar</Link>{' '}
                  <button className="btn btn-ghost btn-sm" onClick={(e) => eliminar(e, p.id)} style={{ color: 'var(--danger)' }}>Eliminar</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="prod-movil">
        {cargando && <div className="muted" style={{ padding: 14 }}>Cargando…</div>}
        {!cargando && productos.length === 0 && (
          <div className="muted" style={{ padding: 14 }}>Aún no tienes productos. <Link href="/panel/productos/nuevo" style={{ color: 'var(--brand)' }}>Crea el primero</Link>.</div>
        )}
        {!cargando && productos.length > 0 && visibles.length === 0 && (
          <div className="muted" style={{ padding: 14 }}>No hay productos que coincidan.</div>
        )}
        {visibles.map((p) => {
          const conVar = Number(p.tiene_variantes);
          const efectivo = conVar ? Number(p.stock_variantes || 0) : Number(p.stock || 0);
          const bajo = umbral > 0 && efectivo <= umbral;
          return (
            <div className="pm-card" key={p.id}>
              <div className="pm-main" onClick={() => { location.href = `/panel/productos/${p.id}`; }}>
                <span className="pm-thumb" style={{ backgroundImage: p.imagen ? `url(${p.imagen})` : 'none' }} />
                <div className="pm-body">
                  <div className="pm-name">{p.nombre}</div>
                  <div className="pm-meta">
                    {p.categoria_nombre || 'Sin categoría'}
                    {conVar ? ` · ${p.num_variantes} var.` : ''}
                    {Number(p.num_imagenes) > 0 ? ` · ${p.num_imagenes} fotos` : ''}
                  </div>
                  <div className="pm-row2">
                    <span className="price">{usd(p.precio)}</span>
                    <span className={`badge estado-${p.estado}`}>{p.estado}</span>
                    {!conVar && <span className="muted tiny">Stock {efectivo}</span>}
                    {bajo && <span className="badge badge-warn">Stock bajo</span>}
                    <span className="muted tiny">{Number(p.vistas) || 0} vistas</span>
                  </div>
                </div>
              </div>
              <button className="pm-del" onClick={(e) => eliminar(e, p.id)} aria-label="Eliminar producto">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      {filtrados.length > POR_PAGINA && (
        <div className="prod-pag">
          <span className="muted" style={{ fontSize: 13 }}>
            {(paginaSegura - 1) * POR_PAGINA + 1}–{Math.min(paginaSegura * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </span>
          <div className="spacer" />
          <button className="btn btn-ghost btn-sm" onClick={() => setPagina((n) => Math.max(1, n - 1))} disabled={paginaSegura <= 1}>← Anterior</button>
          <span className="muted" style={{ fontSize: 13, padding: '0 6px' }}>Página {paginaSegura} de {totalPaginas}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setPagina((n) => Math.min(totalPaginas, n + 1))} disabled={paginaSegura >= totalPaginas}>Siguiente →</button>
        </div>
      )}

      {modal && (
        <div
          onClick={() => !procesando && setModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="row" style={{ alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 19 }}>Importar productos por CSV</h2>
              <div className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)} disabled={procesando}>✕</button>
            </div>

            {/* Paso final: reporte de importación */}
            {resultado ? (
              <div style={{ marginTop: 16 }}>
                <div className="ok-box" style={{ padding: 16, borderRadius: 12, background: '#e7f6ec', color: '#1a7f43', fontWeight: 600 }}>
                  ✓ Se importaron {resultado.creados} producto{resultado.creados === 1 ? '' : 's'} correctamente.
                </div>
                {resultado.resumen && (resultado.resumen.duplicados > 0 || resultado.resumen.errores > 0 || resultado.resumen.limite > 0) && (
                  <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                    Se omitieron: {resultado.resumen.duplicados} duplicado(s), {resultado.resumen.errores} con error, {resultado.resumen.limite} por límite de plan.
                  </p>
                )}
                <div className="row" style={{ marginTop: 18 }}>
                  <div className="spacer" />
                  <button className="btn btn-primary" onClick={() => setModal(false)}>Cerrar</button>
                </div>
              </div>
            ) : (
              <>
                <p className="muted" style={{ fontSize: 13.5, marginTop: 10, lineHeight: 1.6 }}>
                  Sube un archivo <b>.csv</b> con tus productos. Descarga la plantilla para ver el formato exacto.
                  Los productos se crean como <b>borrador</b> (no destacados) y se omiten los que ya existan con el mismo nombre.
                </p>

                <div className="row" style={{ gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={descargarPlantilla} type="button">↓ Descargar plantilla CSV</button>
                </div>

                <div className="field" style={{ marginTop: 14 }}>
                  <label>Archivo CSV</label>
                  <input type="file" accept=".csv,text/csv" onChange={elegirArchivo} className="input" />
                </div>

                {errImp && <div className="error" style={{ marginTop: 12 }}>{errImp}</div>}

                {/* Paso 2: vista previa */}
                {preview && r && (
                  <div style={{ marginTop: 16 }}>
                    <div className="row" style={{ gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                      <span className="badge" style={{ background: '#e7f6ec', color: '#1a7f43' }}>{r.ok} listos</span>
                      {r.duplicados > 0 && <span className="badge" style={{ background: '#fff4e0', color: '#a86400' }}>{r.duplicados} duplicados</span>}
                      {r.errores > 0 && <span className="badge" style={{ background: '#fdecec', color: '#c0392b' }}>{r.errores} con error</span>}
                      {r.limite > 0 && <span className="badge" style={{ background: '#f0edff', color: '#5b4bd6' }}>{r.limite} por límite</span>}
                    </div>

                    <div className="card" style={{ marginTop: 12, padding: 0, maxHeight: 260, overflow: 'auto' }}>
                      <table className="table" style={{ fontSize: 13 }}>
                        <thead>
                          <tr><th style={{ width: 42 }}>#</th><th>Producto</th><th>Estado</th></tr>
                        </thead>
                        <tbody>
                          {preview.filas.map((f, i) => {
                            const b = BADGE[f.estado] || BADGE.error;
                            return (
                              <tr key={i}>
                                <td className="muted">{f.fila}</td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{f.nombre || <span className="muted">(sin nombre)</span>}</div>
                                  {f.mensaje && <div className="muted" style={{ fontSize: 12 }}>{f.mensaje}</div>}
                                </td>
                                <td><span className="badge" style={{ background: b.bg, color: b.color }}>{b.txt}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="row" style={{ marginTop: 18, gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setModal(false)} disabled={procesando}>Cancelar</button>
                  <div className="spacer" />
                  {!preview ? (
                    <button className="btn btn-primary" onClick={previsualizar} disabled={procesando || !archivo}>
                      {procesando ? 'Analizando…' : 'Previsualizar'}
                    </button>
                  ) : (
                    <>
                      <button className="btn btn-ghost" onClick={previsualizar} disabled={procesando}>Volver a analizar</button>
                      <button className="btn btn-primary" onClick={confirmar} disabled={procesando || r.ok === 0}>
                        {procesando ? 'Importando…' : `Confirmar importación (${r.ok})`}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .prod-toolbar {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 18px;
          flex-wrap: wrap;
        }
        .prod-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .prod-search { margin-left: auto; min-width: 220px; flex: 1; max-width: 320px; }
        .prod-search .input { width: 100%; }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 13px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-2);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background .12s, border-color .12s, color .12s;
        }
        .chip:hover { border-color: var(--brand); color: var(--text); }
        .chip-n {
          font-size: 12px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 999px;
          background: var(--surface-2);
          color: var(--text-2);
        }
        .chip-on { background: var(--brand); border-color: var(--brand); color: #fff; }
        .chip-on .chip-n { background: rgba(255,255,255,.25); color: #fff; }
        .prod-pag {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .prod-search { margin-left: 0; max-width: none; }
        }
      `}</style>
    </>
  );
}
