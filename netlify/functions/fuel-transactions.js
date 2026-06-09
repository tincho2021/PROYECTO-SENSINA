/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: fuel-transactions.js
 * 
 * Recibe y registra despachos o cargas de combustible transmitidos por ESP32 / Controladores.
 * Mantiene un historial rodante de hasta 50 transacciones en Netlify Blobs o memoria global de sesión.
 */

const { getStore } = require("@netlify/blobs");

global.latestFuelTransactions = global.latestFuelTransactions || [];

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

  // Validaciones flexibles del protocolo C.E.S.T.I.
  if (!payload.dispenser_id || !payload.product_id || payload.liters === undefined) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Campos obligatorios faltantes (dispenser_id, product_id, liters)." })
    };
  }

  // Validar tipos básicos
  if (typeof payload.liters !== 'number') {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "liters debe ser numérico." }) };
  }

  // Construir registro enriquecido
  const received_at = new Date().toISOString();
  const transactionRecord = {
    transaction_id: payload.transaction_id || `TX-${Date.now()}`,
    device_id: payload.device_id || "CTRL-SURT-0001",
    site_id: payload.site_id || "rosario-01",
    timestamp_start: payload.timestamp_start || new Date(Date.now() - 3 * 60000).toISOString(),
    timestamp_end: payload.timestamp_end || received_at,
    dispenser_id: payload.dispenser_id,
    hose_id: payload.hose_id || payload.hose || "1",
    nozzle: Number(payload.nozzle || payload.hose || 1),
    product: payload.product || "Combustible",
    product_id: payload.product_id,
    liters: payload.liters,
    amount: payload.amount || (payload.liters * (payload.price_per_liter || 1200)),
    price_per_liter: payload.price_per_liter || 1200,
    driver_id: payload.driver_id || undefined,
    vehicle_id: payload.vehicle_id || undefined,
    vehicle_plate: payload.vehicle_plate || undefined,
    odometer: payload.odometer || undefined,
    authorization_method: payload.authorization_method || "RFID",
    status: payload.status || "completed",
    received_at,
    event_type: "fuel_transaction"
  };

  console.log(`[C.E.S.T.I. DESPACHO] Registrado despacho ${transactionRecord.transaction_id} | Litros: ${transactionRecord.liters} L`);

  // Guardar en el histórico rodante de los últimos 50 eventos
  let currentList = [];
  try {
    const store = getStore({ name: "cesti-telemetry" });
    const storedList = await store.getJSON("latest-fuel-transactions");
    if (Array.isArray(storedList)) {
      currentList = storedList;
    }
  } catch (error) {
    console.warn("[C.E.S.T.I. BLOB] Falló Blobs, usando fallbacks para despachos.");
  }

  if (currentList.length === 0) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-fuel-transactions");
      if (kvRes.ok) {
        const storedList = await kvRes.json();
        if (Array.isArray(storedList)) {
          currentList = storedList;
        }
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló carga de transacciones de KVDB:", err.message);
    }
  }

  if (currentList.length === 0) {
    currentList = global.latestFuelTransactions || [];
  }

  // --- Evitar duplicados de transacciones idénticas (caudalímetros, reintentos de red, etc.) ---
  let existingTx = null;
  const matchTxId = payload.transaction_id;
  if (matchTxId) {
    existingTx = currentList.find(tx => tx.transaction_id === matchTxId);
  }

  if (!existingTx) {
    const matchLiters = Number(payload.liters);
    existingTx = currentList.find(tx => {
      const isSameDispenser = tx.dispenser_id === payload.dispenser_id;
      const isSameProduct = tx.product_id === payload.product_id ||
                            (payload.product_id === 'GO3' && tx.product_id === 'GP') ||
                            (payload.product_id === 'GP' && tx.product_id === 'GO3');
      const isSameLiters = Math.abs(Number(tx.liters) - matchLiters) < 0.01;
      const isSamePlate = tx.vehicle_plate === payload.vehicle_plate ||
                          (!tx.vehicle_plate && !payload.vehicle_plate) ||
                          (tx.vehicle_plate === "SIN-PAT" && payload.vehicle_plate === "SIN-PAT") ||
                          (tx.vehicle_plate === "AB123CD" && payload.vehicle_plate === "AB123CD");

      if (isSameDispenser && isSameProduct && isSameLiters && isSamePlate) {
        // Ventana de 120 segundos
        const txTime = new Date(tx.received_at || tx.timestamp_end || Date.now()).getTime();
        const timeDiffSeconds = Math.abs(Date.now() - txTime) / 1000;
        return timeDiffSeconds < 120;
      }
      return false;
    });
  }

  if (existingTx) {
    console.log(`[C.E.S.T.I. DEDUPLICADOR SERVERLESS] Bloqueada transacción de despacho duplicada: ${existingTx.transaction_id}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message: "Fuel transaction already registered (duplicate entry avoided)",
        data: existingTx,
        duplicate: true
      })
    };
  }

  // Insertar al inicio, cap a 50
  currentList.unshift(transactionRecord);
  currentList = currentList.slice(0, 50);

  // Mantener actualizado el backup global en RAM
  global.latestFuelTransactions = currentList;

  // Guardar en KVDB.io
  try {
    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-fuel-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentList)
    });
    console.log("[C.E.S.T.I. KVDB] Despacho guardado con éxito en KVDB.io");
  } catch (err) {
    console.warn("[C.E.S.T.I. KVDB WARN] Falló guardado de transacción en KVDB.io:", err.message);
  }

  // Persistir en Blobs
  try {
    const store = getStore({ name: "cesti-telemetry" });
    await store.setJSON("latest-fuel-transactions", currentList);
  } catch (err) {
    console.warn("[C.E.S.T.I. BLOB WARN] Falló guardado final de despachos:", err.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      message: "Fuel transaction registered successfully",
      data: transactionRecord
    })
  };
};
