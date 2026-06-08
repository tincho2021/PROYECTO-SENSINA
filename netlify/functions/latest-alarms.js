/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: latest-alarms.js
 * 
 * Retorna las alarmas más recientes reportadas en el campo (últimas 50).
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

  let alarmsList = null;

  try {
    const store = getStore({ name: "cesti-telemetry" });
    alarmsList = await store.getJSON("latest-alarms");
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló Netlify Blobs en GET de alarmas:", error.message);
  }

  // Fallback a KVDB.io
  if (!Array.isArray(alarmsList)) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-alarms");
      if (kvRes.ok) {
        const storedAlarms = await kvRes.json();
        if (Array.isArray(storedAlarms)) {
          alarmsList = storedAlarms;
          console.log("[C.E.S.T.I. KVDB] Alarmas cargadas con éxito de KVDB.io");
        }
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de KVDB.io:", err.message);
    }
  }

  if (!Array.isArray(alarmsList)) {
    alarmsList = global.latestAlarmsData || [];
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      data: alarmsList
    })
  };
};
