'use client';
import { useEffect, useState } from 'react';
import { getToken, getClienteToken } from '@/lib/api';

/**
 * Muestra distintos botones según la sesión:
 *  - invitado (sin sesión): botones de registro/entrar.
 *  - tienda (sesión de panel): botones para el dueño.
 *  - cliente (sesión de comprador): botones para el comprador.
 * Recibe cada juego de botones como prop (JSX). Por defecto renderiza "invitado"
 * (que es lo que se ve en el SSR) y se ajusta al montar en el navegador.
 */
export default function AuthCTA({ invitado = null, tienda = null, cliente = null }) {
  const [sesion, setSesion] = useState('invitado');
  useEffect(() => {
    if (getToken()) setSesion('panel');
    else if (getClienteToken()) setSesion('cliente');
    else setSesion('invitado');
  }, []);
  if (sesion === 'panel') return tienda ?? invitado;
  if (sesion === 'cliente') return cliente ?? invitado;
  return invitado;
}
