/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: latest-dispenser-status.js
 * 
 * Expone un GET para consultar el último estado instantáneo de los surtidores.
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

  let dispenserStatus = null;

  try {
    const store = getStore({ name: "cesti-telemetry" });
    dispenserStatus = await store.getJSON("latest-dispenser-status");
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló Netlify Blobs en GET de surtidores, usando memoria:", error.message);
  }

  // Fallback a KVDB.io
  if (!dispenserStatus) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-dispenser-status");
      if (kvRes.ok) {
        dispenserStatus = await kvRes.json();
        console.log("[C.E.S.T.I. KVDB] Surtidores cargados con éxito de KVDB.io");
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de KVDB.io:", err.message);
    }
  }

  if (!dispenserStatus) {
    dispenserStatus = global.latestDispenserStatusData || null;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      data: dispenserStatus
    })
  };
};
