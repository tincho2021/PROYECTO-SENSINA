/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: alarms.js
 * 
 * Recibe, procesa y almacena alarmas de fugas o eventos del sistema.
 * Preserva un listado rodante de las últimas 50 alarmas reportadas.
 */

const { getStore } = require("@netlify/blobs");

global.latestAlarmsData = global.latestAlarmsData || [];

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

  // --- 1. AUTORIZACIÓN (Permisiva) ---
  let tokenRecibido = "";
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      tokenRecibido = authHeader.split(' ')[1];
    } else {
      tokenRecibido = authHeader.trim();
    }
  } else if (event.queryStringParameters && (event.queryStringParameters.token || event.queryStringParameters.apiKey || event.queryStringParameters.key)) {
    tokenRecibido = event.queryStringParameters.token || event.queryStringParameters.apiKey || event.queryStringParameters.key;
  } else {
    try {
      if (event.body) {
        const parsedBody = JSON.parse(event.body);
        tokenRecibido = parsedBody.token || parsedBody.apiKey || parsedBody.api_key;
      }
    } catch (e) {}
  }

  if (!tokenRecibido) {
    tokenRecibido = "cesti-demo-key-123";
  }

  const tokenEsperado = process.env.DEVICE_API_KEY || "cesti-demo-key-123";

  if (tokenRecibido !== tokenEsperado && tokenRecibido !== "cesti-demo-key-123") {
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
      body: JSON.stringify({ ok: false, error: "Invalid JSON." })
    };
  }

  // Validaciones del protocolo C.E.S.T.I. de alarmas
  const requiredFields = [
    'device_id', 'site_id', 'timestamp', 'alarm_id', 'alarm_type',
    'severity', 'source_type', 'source_id', 'message', 'value', 'unit', 'status'
  ];

  const missing = requiredFields.filter(f => !(f in payload));
  if (missing.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: `Campos faltantes: ${missing.join(', ')}` })
    };
  }

  const allowedAlarms = [
    'liquid_leak', 'gas_leak', 'low_stock', 'critical_low_stock', 'high_level',
    'water_detected', 'battery_low', 'sensor_error', 'communication_lost',
    'dispenser_error', 'unauthorized_fueling', 'inventory_difference',
    'power_failure', 'tamper', 'generic'
  ];
  if (!allowedAlarms.includes(payload.alarm_type)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "alarm_type inválido." }) };
  }

  const allowedSeverities = ['info', 'warning', 'critical'];
  if (!allowedSeverities.includes(payload.severity)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Severity inválido." }) };
  }

  const allowedSources = ['tank_sensor', 'leak_sensor', 'gas_sensor', 'dispenser', 'gateway', 'battery', 'system', 'manual'];
  if (!allowedSources.includes(payload.source_type)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "source_type inválido." }) };
  }

  const allowedStatuses = ['active', 'acknowledged', 'resolved'];
  if (!allowedStatuses.includes(payload.status)) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: "Status inválido." }) };
  }

  const received_at = new Date().toISOString();
  const alarmRecord = {
    ...payload,
    received_at,
    event_type: "alarm"
  };

  console.log(`[C.E.S.T.I. ALARMA] Recibida alarma ${alarmRecord.alarm_id} (${alarmRecord.alarm_type}) - Severidad: ${alarmRecord.severity}`);

  // Historial rodante de los últimos 50 alarmas activas / eventos
  let currentAlarms = [];
  try {
    const store = getStore({ name: "cesti-telemetry" });
    const storedAlarms = await store.getJSON("latest-alarms");
    if (Array.isArray(storedAlarms)) {
      currentAlarms = storedAlarms;
    }
  } catch (error) {
    console.warn("[C.E.S.T.I. BLOB] Falló Blobs, usando fallbacks para alarmas.");
  }

  if (currentAlarms.length === 0) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-alarms");
      if (kvRes.ok) {
        const storedAlarms = await kvRes.json();
        if (Array.isArray(storedAlarms)) {
          currentAlarms = storedAlarms;
        }
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló carga de alarmas de KVDB:", err.message);
    }
  }

  if (currentAlarms.length === 0) {
    currentAlarms = global.latestAlarmsData || [];
  }

  currentAlarms.unshift(alarmRecord);
  currentAlarms = currentAlarms.slice(0, 50);

  global.latestAlarmsData = currentAlarms;

  // Guardar en KVDB.io
  try {
    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-alarms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentAlarms)
    });
    console.log("[C.E.S.T.I. KVDB] Alarma guardada con éxito en KVDB.io");
  } catch (err) {
    console.warn("[C.E.S.T.I. KVDB WARN] Falló guardado de alarmas en KVDB.io:", err.message);
  }

  try {
    const store = getStore({ name: "cesti-telemetry" });
    await store.setJSON("latest-alarms", currentAlarms);
  } catch (err) {
    console.warn("[C.E.S.T.I. BLOB WARN] Falló guardado final de alarmas:", err.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      message: "Alarm received successfully",
      data: alarmRecord
    })
  };
};
