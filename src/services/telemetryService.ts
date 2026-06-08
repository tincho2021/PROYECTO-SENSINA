/**
 * C.E.S.T.I. TELEMETRIA
 * Service: telemetryService.ts
 * 
 * Gestiona las consultas al endpoint de telemetría más reciente (/api/latest-telemetry)
 * utilizando rutas relativas para compatibilidad total con Netlify o Express local.
 */

import { TelemetryPayload, TelemetryResponse } from '../types';

/**
 * Consulta el endpoint serverless GET /api/latest-telemetry
 * Retorna el último registro recibido desde el ESP32, o null si falla o no hay datos.
 */
export async function fetchLatestTelemetry(): Promise<TelemetryPayload | null> {
  // Obtener URL base personalizada de localStorage si existe
  let customBase = '';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cesti_custom_iot_server');
    if (saved && saved.trim() !== '') {
      customBase = saved.trim().replace(/\/+$/, '');
    }
  }

  const localUrl = customBase ? `${customBase}/api/latest-telemetry` : '/api/latest-telemetry';

  // 1. Intentar con el servidor local configurado (Express local, Netlify local o personalizado)
  try {
    const response = await fetch(localUrl);
    if (response.ok) {
      const result: TelemetryResponse = await response.json();
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
      const response = await fetch('https://velvety-vacherin-c43b91.netlify.app/api/latest-telemetry');
      if (response.ok) {
        const result: TelemetryResponse = await response.json();
        if (result && result.ok && result.data) {
          return result.data;
        }
      }
    } catch (error) {
      console.error('[C.E.S.T.I. SERVICE] Error consultando fallback de producción Netlify:', error);
    }
  }

  return null;
}
