/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: latest-telemetry.js
 * 
 * Expone un GET para consultar el último estado de telemetría medido.
 */

const { getStore } = require("@netlify/blobs");

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

  let latestData = null;
  let registeredTanks = null;

  try {
    const store = getStore({ name: "cesti-telemetry" });
    latestData = await store.getJSON("latest-telemetry");
    registeredTanks = await store.getJSON("registered-tanks");
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló Netlify Blobs en GET:", error.message);
  }

  // Fallback a KVDB.io (Persistencia serverless universal de respaldo)
  if (!latestData) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-telemetry");
      if (kvRes.ok) {
        latestData = await kvRes.json();
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de KVDB.io:", err.message);
    }
  }

  if (!registeredTanks) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-tanks");
      if (kvRes.ok) {
        registeredTanks = await kvRes.json();
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de registered-tanks de KVDB.io:", err.message);
    }
  }

  if (!latestData) {
    latestData = global.latestTelemetryData || null;
  }

  if (!registeredTanks && latestData) {
    registeredTanks = [latestData];
  }

  // Cargar productos registrados dinámicos
  let registeredProducts = null;
  try {
    const store = getStore({ name: "cesti-telemetry" });
    registeredProducts = await store.getJSON("registered-products");
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló Netlify Blobs en GET para productos:", error.message);
  }

  if (!registeredProducts) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-products");
      if (kvRes.ok) {
        registeredProducts = await kvRes.json();
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de registered-products de KVDB.io:", err.message);
    }
  }

  if (!registeredProducts) {
    // Definir productos por defecto de la plataforma
    registeredProducts = [
      {
        id: 'GO2',
        name: 'Gasoil Grado 2 (Ultra Diesel)',
        type: 'gasoil',
        referenceDensity: 840,
        color: 'emerald',
        hexColor: '#10b981',
        pricePerLiter: 1210.40,
        minStock: 8000,
        maxStock: 40000,
        unit: 'L',
        active: true,
        createdAt: '2025-01-01T00:00:00Z'
      },
      {
        id: 'GP',
        name: 'Gasoil Grado 3 (Infinia Diesel)',
        type: 'premium',
        referenceDensity: 835,
        color: 'teal',
        hexColor: '#0d9488',
        pricePerLiter: 1450.20,
        minStock: 6000,
        maxStock: 30000,
        unit: 'L',
        active: true,
        createdAt: '2025-01-01T00:00:00Z'
      },
      {
        id: 'NS',
        name: 'Nafta Súper',
        type: 'nafta',
        referenceDensity: 735,
        color: 'blue',
        hexColor: '#3b82f6',
        pricePerLiter: 1280.90,
        minStock: 5000,
        maxStock: 25000,
        unit: 'L',
        active: true,
        createdAt: '2025-01-01T00:00:00Z'
      }
    ];
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      data: latestData,
      tanks: registeredTanks || [],
      products: registeredProducts || [],
      message: latestData ? undefined : "No telemetry received yet"
    })
  };
};
