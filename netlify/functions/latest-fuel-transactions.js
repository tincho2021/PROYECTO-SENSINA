/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: latest-fuel-transactions.js
 * 
 * Retorna las transacciones más recientes reportadas al sistema (últimas 50).
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

  let transactionsList = null;

  try {
    const store = getStore({ name: "cesti-telemetry" });
    transactionsList = await store.getJSON("latest-fuel-transactions");
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló Netlify Blobs en GET de transacciones, usando memoria:", error.message);
  }

  // Fallback a KVDB.io
  if (!Array.isArray(transactionsList)) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-fuel-transactions");
      if (kvRes.ok) {
        const storedList = await kvRes.json();
        if (Array.isArray(storedList)) {
          transactionsList = storedList;
          console.log("[C.E.S.T.I. KVDB] Transacciones cargadas con éxito de KVDB.io");
        }
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de KVDB.io:", err.message);
    }
  }

  if (!Array.isArray(transactionsList)) {
    transactionsList = global.latestFuelTransactions || [];
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      data: transactionsList
    })
  };
};
