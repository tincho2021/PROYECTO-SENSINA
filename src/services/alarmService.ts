/**
 * C.E.S.T.I. TELEMETRIA
 * Service: alarmService.ts
 * 
 * Gestiona las consultas al endpoint de alarmas técnicas (/api/latest-alarms)
 * utilizando rutas relativas para compatibilidad con Netlify o Express local.
 */

import { AlarmPayload, AlarmResponse } from '../types';

/**
 * Consulta el endpoint serverless GET /api/latest-alarms
 * Retorna la lista de alarmas activas/recientes, o un array vacío si no hay datos.
 */
export async function fetchLatestAlarms(): Promise<AlarmPayload[]> {
  // Obtener URL base personalizada de localStorage si existe
  let customBase = '';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cesti_custom_iot_server');
    if (saved && saved.trim() !== '') {
      customBase = saved.trim().replace(/\/+$/, '');
    }
  }

  const localUrl = customBase ? `${customBase}/api/latest-alarms` : '/api/latest-alarms';

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
      const response = await fetch('https://velvety-vacherin-c43b91.netlify.app/api/latest-alarms');
      if (response.ok) {
        const result: any = await response.json();
        if (result && result.ok && result.data) {
          return Array.isArray(result.data) ? result.data : [result.data];
        }
      }
    } catch (error) {
      console.error('[C.E.S.T.I. SERVICE] Error consultando fallback alarmas de producción Netlify:', error);
    }
  }

  return [];
}
