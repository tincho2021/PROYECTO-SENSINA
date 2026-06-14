/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: latest-deliveries.js
 * 
 * Retorna las descargas de combustible más recientes (historial de las últimas 50).
 */

const { getStore } = require("@netlify/blobs");

// Fallback en memoria si falla blobs y kvdb
global.latestDeliveriesData = global.latestDeliveriesData || [];

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  const method = event.httpMethod;

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "Método no permitido. Use GET." })
    };
  }

  let deliveriesList = null;

  try {
    const store = getStore({ name: "cesti-telemetry" });
    deliveriesList = await store.getJSON("latest-deliveries");
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló Netlify Blobs en GET de descargas:", error.message);
  }

  // Fallback a KVDB.io (Persistencia alternativa)
  if (!Array.isArray(deliveriesList)) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-deliveries");
      if (kvRes.ok) {
        const stored = await kvRes.json();
        if (Array.isArray(stored)) {
          deliveriesList = stored;
          console.log("[C.E.S.T.I. KVDB] Descargas cargadas con éxito de KVDB.io");
        }
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de descargas en KVDB.io:", err.message);
    }
  }

  if (!Array.isArray(deliveriesList)) {
    deliveriesList = global.latestDeliveriesData || [];
  }

  // Si aún está vacío, retornamos los datos iniciales semilla de mocks para que la UI no se vea vacía en el primer arranque
  if (deliveriesList.length === 0) {
    deliveriesList = [
      {
        id: 'DL-001',
        timestamp: '2026-06-01T15:30:00Z',
        supplier: 'YPF Distribución Directa',
        invoiceNumber: '0001-00049281',
        productId: 'GO2',
        tankId: 'TQ-01',
        litersDeclared: 15000,
        litersMeasuredBefore: 12000,
        litersMeasuredAfter: 26900,
        differenceLiters: -100,
        temperatureC: 20.2,
        density: 841.5,
        operator: 'Carlos Gómez',
        notes: 'Descarga de gasoil grado 2 inicializada.'
      },
      {
        id: 'DL-002',
        timestamp: '2026-05-28T10:15:00Z',
        supplier: 'Shell Mayorista S.A.',
        invoiceNumber: '0003-00021394',
        productId: 'GP',
        tankId: 'TQ-02',
        litersDeclared: 8000,
        litersMeasuredBefore: 4500,
        litersMeasuredAfter: 12450,
        differenceLiters: -50,
        temperatureC: 18.5,
        density: 834.0,
        operator: 'Carlos Gómez',
        notes: 'Pintores y precintos conformes.'
      }
    ];
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      data: deliveriesList
    })
  };
};
