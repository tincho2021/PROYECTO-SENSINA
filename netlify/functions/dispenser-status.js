/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: dispenser-status.js
 * 
 * Recibe y actualiza el estado operativo instantáneo de los surtidores de combustibles.
 */

const { getStore } = require("@netlify/blobs");

global.latestDispenserStatusData = global.latestDispenserStatusData || null;

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

  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "Método no permitido. Use POST." })
    };
  }

  // --- 1. AUTORIZACIÓN ---
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ ok: false, error: "Bearer token required in Authorization header." })
    };
  }

  const tokenRecibido = authHeader.split(' ')[1];
  const tokenEsperado = process.env.DEVICE_API_KEY || "cesti-demo-key-123";

  if (tokenRecibido !== tokenEsperado) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ ok: false, error: "Unauthorized. Invalid Device API Key." })
    };
  }

  // --- 2. VALIDACIÓN JSON ---
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Invalid JSON format." })
    };
  }

  if (!payload.dispensers || !Array.isArray(payload.dispensers)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Campos obligatorios faltantes (dispensers array es requerido)." })
    };
  }

  // Validar estado de surtidores permitidos
  const allowedStatuses = ['available', 'calling', 'authorized', 'dispensing', 'fueling', 'completed', 'offline', 'error', 'locked', 'maintenance'];
  
  for (const disp of payload.dispensers) {
    if (!disp.dispenser_id || !disp.status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: "Cada surtidor debe tener dispenser_id y status." })
      };
    }
    if (!allowedStatuses.includes(disp.status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: `Surtidor ${disp.dispenser_id} tiene un estado inválido: ${disp.status}` })
      };
    }
  }

  const received_at = new Date().toISOString();
  const dispenserStatusRecord = {
    device_id: payload.device_id || "CTRL-SURT-0001",
    site_id: payload.site_id || "rosario-01",
    timestamp: payload.timestamp || received_at,
    dispensers: payload.dispensers.map(d => ({
      dispenser_id: d.dispenser_id,
      hose_id: d.hose_id || d.nozzle || "M01",
      nozzle: Number(d.nozzle || d.hose_id || 1),
      product: d.product || "Combustible",
      product_id: d.product_id || "GO2",
      suction_tank_id: d.suction_tank_id || undefined,
      status: d.status || "available",
      last_transaction_id: d.last_transaction_id || null,
      last_sale_liters: Number(d.last_sale_liters || 0),
      last_sale_amount: Number(d.last_sale_amount || 0),
      driver: d.driver || undefined,
      vehicle: d.vehicle || undefined,
      plate: d.plate || undefined,
      odometer: d.odometer || undefined,
      authorization_method: d.authorization_method || "RFID"
    })),
    received_at,
    event_type: "dispenser_status"
  };

  console.log(`[C.E.S.T.I. SURTIDOR] Actualizado estado de surtidores para device: ${payload.device_id}`);

  // Guardar en RAM local
  global.latestDispenserStatusData = dispenserStatusRecord;

  // Guardar en KVDB.io
  try {
    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-dispenser-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dispenserStatusRecord)
    });
    console.log("[C.E.S.T.I. KVDB] Guardado exitoso de surtidores en KVDB.io");
  } catch (err) {
    console.warn("[C.E.S.T.I. KVDB WARN] Falló guardado de surtidores en KVDB.io:", err.message);
  }

  // Guardar en Blobs
  try {
    const store = getStore({ name: "cesti-telemetry" });
    await store.setJSON("latest-dispenser-status", dispenserStatusRecord);
  } catch (err) {
    console.warn("[C.E.S.T.I. BLOB WARN] Falló guardado final de surtidores:", err.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      message: "Dispenser status received successfully",
      data: dispenserStatusRecord
    })
  };
};
