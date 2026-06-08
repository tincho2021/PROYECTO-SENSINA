/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: telemetry.js
 * 
 * Recibe e interpreta la telemetría enviada por el ESP32 para tanques por HTTP POST.
 * Graba los datos en Netlify Blobs (persistencia serverless) o memoria temporal.
 */

const { getStore } = require("@netlify/blobs");

// Persistencia en memoria temporal como respaldo local/desarrollo
global.latestTelemetryData = global.latestTelemetryData || null;

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  const method = event.httpMethod;
  const clientIp = event.headers["client-ip"] || event.headers["x-nf-client-connection-ip"] || "0.0.0.0";
  console.log(`[C.E.S.T.I. TELEMETRÍA] IP Origen: ${clientIp} - Método: ${method}`);

  // CORS Preflight
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

  // --- 1. VALIDACIÓN TOKEN ---
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ ok: false, error: "Access Denied. Bearer token required in Authorization header." })
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
      body: JSON.stringify({ ok: false, error: "Invalid JSON format in request body." })
    };
  }

  // Validar campos obligatorios
  const camposRequeridos = [
    'tank_id',
    'height_mm',
    'volume_liters',
    'temperature_c',
    'water_mm',
    'battery_v',
    'battery_percent',
    'signal_rssi',
    'sensor_status'
  ];

  const faltantes = camposRequeridos.filter(c => !(c in payload));
  if (faltantes.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: `Campos obligatorios faltantes: ${faltantes.join(', ')}` })
    };
  }

  // Validar tipos
  if (typeof payload.tank_id !== 'string') {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "tank_id debe ser un string" }) };
  }
  if (typeof payload.height_mm !== 'number' || typeof payload.volume_liters !== 'number' || 
      typeof payload.temperature_c !== 'number' || typeof payload.water_mm !== 'number' || 
      typeof payload.battery_v !== 'number' || typeof payload.battery_percent !== 'number' || 
      typeof payload.signal_rssi !== 'number') {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Los parámetros métricos deben ser numéricos." }) };
  }
  if (typeof payload.sensor_status !== 'string') {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "sensor_status debe ser un string" }) };
  }

  const estadosPermitidos = ['normal', 'low_stock', 'critical_low', 'high_level', 'error', 'offline'];
  if (!estadosPermitidos.includes(payload.sensor_status)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: `sensor_status inválido. Valores permitidos: ${estadosPermitidos.join(', ')}` })
    };
  }

  // Construir objeto enriquecido
  const received_at = new Date().toISOString();
  const telemetryRecord = {
    device_id: payload.device_id || "SENSINA-GENERIC-01",
    site_id: payload.site_id || "ESTACION-GENERIC",
    tank_id: payload.tank_id,
    timestamp: payload.timestamp || received_at,
    height_mm: payload.height_mm,
    volume_liters: payload.volume_liters,
    capacity_liters: payload.capacity_liters || 20000,
    temperature_c: payload.temperature_c,
    water_mm: payload.water_mm,
    battery_v: payload.battery_v,
    battery_percent: payload.battery_percent,
    signal_rssi: payload.signal_rssi,
    sensor_status: payload.sensor_status,
    received_at,
    source_ip: clientIp,
    event_type: "tank_telemetry"
  };

  console.log(`[C.E.S.T.I.] Telemetría exitosa de tanque: ${telemetryRecord.tank_id} | Vol: ${telemetryRecord.volume_liters} L`);

  // Guardar en memoria de sesión local (Hot starts de Lambda)
  global.latestTelemetryData = telemetryRecord;

  // Guardar en KVDB.io como persistencia universal de respaldo externa (¡Resuelve stateless de Lambdas!)
  try {
    // Primero, obtener los tanques registrados acumulados
    let fallbackTanks = [];
    try {
      const kvGet = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-tanks");
      if (kvGet.ok) {
        fallbackTanks = await kvGet.json();
      }
    } catch (e) {}

    const fIdx = fallbackTanks.findIndex(t => t.tank_id === telemetryRecord.tank_id);
    if (fIdx > -1) {
      fallbackTanks[fIdx] = telemetryRecord;
    } else {
      fallbackTanks.push(telemetryRecord);
    }

    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-tanks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fallbackTanks)
    });

    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telemetryRecord)
    });
    console.log("[C.E.S.T.I. KVDB] Guardado exitoso de múltiples tanques en KVDB.io");
  } catch (err) {
    console.warn("[C.E.S.T.I. KVDB WARN] Falló guardado en KVDB.io:", err.message);
  }

  // Persistencia mediante Netlify Blobs si está configurado en producción
  try {
    const store = getStore({ name: "cesti-telemetry" });
    let blobTanks = [];
    try {
      blobTanks = await store.getJSON("registered-tanks") || [];
    } catch (e) {
      blobTanks = [];
    }

    const bIdx = blobTanks.findIndex(t => t.tank_id === telemetryRecord.tank_id);
    if (bIdx > -1) {
      blobTanks[bIdx] = telemetryRecord;
    } else {
      blobTanks.push(telemetryRecord);
    }

    await store.setJSON("registered-tanks", blobTanks);
    await store.setJSON("latest-telemetry", telemetryRecord);
    console.log("[C.E.S.T.I. BLOB] Guardado existoso de múltiples tanques en Netlify Blobs.");
  } catch (error) {
    console.warn("[C.E.S.T.I. BLOB WARN] Falló acceso a Netlify Blobs (común en local sin CLI):", error.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      message: "Telemetry received successfully",
      data: telemetryRecord
    })
  };
};
