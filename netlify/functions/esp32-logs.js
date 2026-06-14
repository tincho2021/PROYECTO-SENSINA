/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: esp32-logs.js
 * 
 * Expone un GET para consultar el historial de JSONs crudos recibidos por el ESP32,
 * y un POST / DELETE para vaciar el historial.
 */

const { getStore } = require("@netlify/blobs");

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Content-Type": "application/json"
  };

  const method = event.httpMethod;

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // --- ESCRIBIR / VACIAR HISTORIAL ---
  if (method === 'DELETE' || method === 'POST') {
    // Si es POST, verificar si envió comando clear
    let shouldClear = method === 'DELETE';
    if (method === 'POST' && event.body) {
      try {
        const bodyObj = JSON.parse(event.body);
        if (bodyObj.action === 'clear') {
          shouldClear = true;
        }
      } catch (err) {}
    }

    if (shouldClear) {
      try {
        // Enviar un array vacío para resetear el historial en KVDB
        await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/esp32-raw-payloads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([])
        });

        // Borrar en Blobs
        try {
          const store = getStore({ name: "cesti-telemetry" });
          await store.setJSON("esp32-raw-payloads", []);
        } catch (e) {}

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ok: true, message: "Historial de payloads crudos ESP32 borrado correctamente." })
        };
      } catch (err) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ ok: false, error: err.message })
        };
      }
    }
  }

  // --- LEER HISTORIAL (GET) ---
  if (method === 'GET') {
    let logsList = null;

    try {
      const store = getStore({ name: "cesti-telemetry" });
      logsList = await store.getJSON("esp32-raw-payloads");
    } catch (error) {
      console.warn("[C.E.S.T.I. LOGS] Falló Netlify Blobs en GET de logs:", error.message);
    }

    // Fallback a KVDB.io
    if (!Array.isArray(logsList)) {
      try {
        const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/esp32-raw-payloads");
        if (kvRes.ok) {
          const stored = await kvRes.json();
          if (Array.isArray(stored)) {
            logsList = stored;
            console.log("[C.E.S.T.I. LOGS] Logs cargados con éxito de KVDB.io");
          }
        }
      } catch (err) {
        console.warn("[C.E.S.T.I. LOGS KVDB WARN] Falló lectura de logs en KVDB.io:", err.message);
      }
    }

    if (!Array.isArray(logsList)) {
      logsList = [];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        data: logsList
      })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ ok: false, error: "Método no permitido." })
  };
};
