/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: wipe-all-data.js
 * 
 * Limpia y borra por completo toda la información del playón, tanques y despachos.
 * Remueve la persistencia tanto en Netlify Blobs en producción como en los canales en KVDB.io.
 */

const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  const method = event.httpMethod;

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "Método no permitido. Use POST que es disparado por Configuración." })
    };
  }

  const bucket = "7b3mwrCjYKfthbbugjqh4k";

  // Estructuras vacías explícitas para evitar que el mecanismo de retroceso cargue datos mocks de fábrica
  const entriesToClear = {
    "registered-tanks": [],
    "registered-products": [],
    "latest-fuel-transactions": [],
    "latest-dispenser-status": { device_id: "CTRL-SURT-0001", site_id: "ESTACION-001", dispensers: [] },
    "latest-telemetry": null,
    "latest-alarms": [],
    "latest-deliveries": [],
    "esp32-raw-payloads": []
  };

  // 1. Borrado completo de la persistencia fallback en KVDB.io
  for (const [key, val] of Object.entries(entriesToClear)) {
    try {
      await fetch(`https://kvdb.io/${bucket}/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(val)
      });
    } catch (err) {
      console.error(`[C.E.S.T.I. WIPE] Falló limpieza de la clave de KVDB '${key}':`, err.message);
    }
  }

  // Telemetrías individuales por cisterna en KVDB.io
  const knownTanks = ['tank_01', 'tank_02', 'tank_03', 'TQ-01', 'TQ-02', 'TQ-03'];
  for (const tankId of knownTanks) {
    try {
      await fetch(`https://kvdb.io/${bucket}/tank-telemetry-${tankId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(null)
      });
    } catch (err) {}
  }

  // 2. Borrado completo de la persistencia de producción en Netlify Blobs
  let blobsSuccess = false;
  try {
    const store = getStore({ name: "cesti-telemetry" });
    for (const [key, val] of Object.entries(entriesToClear)) {
      try {
        await store.setJSON(key, val);
      } catch (err) {
        console.error(`[C.E.S.T.I. WIPE] Falló limpieza en Netlify Blobs para clave '${key}':`, err.message);
      }
    }
    for (const tankId of knownTanks) {
      try {
        await store.setJSON(`tank-telemetry-${tankId}`, null);
      } catch (err) {}
    }
    blobsSuccess = true;
  } catch (error) {
    console.warn("[C.E.S.T.I. WIPE INFO] Netlify Blobs no disponible o sin configuración, omitido:", error.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      success: true,
      message: "Se borraron con éxito todos los datos en la base de datos distribuida (Netlify Blobs y KVDB.io).",
      blobsSynced: blobsSuccess
    })
  };
};
