/**
 * C.E.S.T.I. TELEMETRIA
 * Service: fuelTransactionService.ts
 * 
 * Gestiona las consultas al endpoint de despacho más reciente (/api/latest-fuel-transactions)
 * utilizando rutas relativas para compatibilidad total con Netlify o Express local.
 */

import { FuelTransactionPayload, FuelTransactionResponse } from '../types';

/**
 * Consulta el endpoint serverless GET /api/latest-fuel-transactions
 * Retorna las transacciones/despachos de combustible, o un array vacío si no hay datos.
 */
export async function fetchLatestFuelTransactions(): Promise<FuelTransactionPayload[]> {
  // Obtener URL base personalizada de localStorage si existe
  let customBase = '';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cesti_custom_iot_server');
    if (saved && saved.trim() !== '') {
      customBase = saved.trim().replace(/\/+$/, '');
    }
  }

  const localUrl = customBase ? `${customBase}/api/latest-fuel-transactions` : '/api/latest-fuel-transactions';

  // 1. Intentar con el servidor local configurado (Express local, Netlify local o personalizado)
  try {
    const response = await fetch(localUrl);
    if (response.ok) {
      const result: any = await response.json();
      if (result && result.ok && result.data) {
        return Array.isArray(result.data) ? result.data : [result.data];
      }
    }
  } catch (error) {
    console.warn('[C.E.S.T.I. SERVICE] Error consultando URL:', localUrl, 'se procederá al fallback:', error);
  }

  // 2. Fallback al endpoint de producción real en Netlify si no se usó ya como base
  if (customBase !== 'https://velvety-vacherin-c43b91.netlify.app') {
    try {
      const response = await fetch('https://velvety-vacherin-c43b91.netlify.app/api/latest-fuel-transactions');
      if (response.ok) {
        const result: any = await response.json();
        if (result && result.ok && result.data) {
          return Array.isArray(result.data) ? result.data : [result.data];
        }
      }
    } catch (error) {
      console.error('[C.E.S.T.I. SERVICE] Error consultando fallback transacciones de producción Netlify:', error);
    }
  }

  return [];
}
