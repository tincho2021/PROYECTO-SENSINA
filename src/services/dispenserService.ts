/**
 * C.E.S.T.I. TELEMETRIA
 * Service: dispenserService.ts
 * 
 * Gestiona las consultas al endpoint de estado de surtidores (/api/latest-dispenser-status)
 * utilizando rutas relativas para compatibilidad total con Netlify o Express local.
 */

import { DispenserStatusPayload, DispenserStatusResponse } from '../types';

/**
 * Consulta el endpoint serverless GET /api/latest-dispenser-status
 * Retorna el último estado de surtidores, o null si falla o no hay datos.
 */
export async function fetchLatestDispenserStatus(): Promise<DispenserStatusPayload | null> {
  // Obtener URL base personalizada de localStorage si existe
  let customBase = '';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cesti_custom_iot_server');
    if (saved && saved.trim() !== '') {
      customBase = saved.trim().replace(/\/+$/, '');
    }
  }

  const localUrl = customBase ? `${customBase}/api/latest-dispenser-status` : '/api/latest-dispenser-status';

  // 1. Intentar con el servidor local configurado (Express local, Netlify local o personalizado)
  try {
    const response = await fetch(localUrl);
    if (response.ok) {
      const result: DispenserStatusResponse = await response.json();
      if (result && result.ok && result.data) {
        return result.data;
      }
    }
  } catch (error) {
    console.warn('[C.E.S.T.I. SERVICE] Error consultando URL:', localUrl, 'se procederá al fallback:', error);
  }

  // 2. Fallback al endpoint de producción real en Netlify si no se usó ya como base
  if (customBase !== 'https://velvety-vacherin-c43b91.netlify.app') {
    try {
      const response = await fetch('https://velvety-vacherin-c43b91.netlify.app/api/latest-dispenser-status');
      if (response.ok) {
        const result: DispenserStatusResponse = await response.json();
        if (result && result.ok && result.data) {
          return result.data;
        }
      }
    } catch (error) {
      console.error('[C.E.S.T.I. SERVICE] Error consultando fallback surtidores de producción Netlify:', error);
    }
  }

  return null;
}
