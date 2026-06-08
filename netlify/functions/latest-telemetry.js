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

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      data: latestData,
      tanks: registeredTanks || [],
      message: latestData ? undefined : "No telemetry received yet"
    })
  };
};
