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
    site_name: payload.site_name || "Sede " + (payload.site_id || "ESTACION-GENERIC"),
    site_location: payload.site_location || "Ubicación Sincronizada",
    tank_id: payload.tank_id,
    tank_name: payload.tank_name || `Cisterna Sonda ${payload.tank_id}`,
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
    product_id: payload.product_id || "GO2",
    product_name: payload.product_name,
    product_type: payload.product_type,
    product_price: payload.product_price,
    product_density: payload.product_density,
    product_color: payload.product_color,
    received_at,
    source_ip: clientIp,
    event_type: "tank_telemetry"
  };

  console.log(`[C.E.S.T.I.] Telemetría exitosa de tanque: ${telemetryRecord.tank_id} | Vol: ${telemetryRecord.volume_liters} L`);

  // Guardar en memoria de sesión local (Hot starts de Lambda)
  global.latestTelemetryData = telemetryRecord;
  global.latestTanksMap = global.latestTanksMap || {};
  global.latestTanksMap[telemetryRecord.tank_id] = telemetryRecord;

  // Productos base por defecto
  const defaultProducts = [
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

  // --- PERSISTENCIA EN KVDB.IO ---
  try {
    // 1. Persistencia de Tanques en KVDB
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

    await fetch(`https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/tank-telemetry-${telemetryRecord.tank_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telemetryRecord)
    });

    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telemetryRecord)
    });

    // 2. Persistencia y Auto-Registro de Producto en KVDB
    let kvProducts = [];
    try {
      const getKvProds = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-products");
      if (getKvProds.ok) {
        kvProducts = await getKvProds.json();
      }
    } catch (e) {}

    if (!Array.isArray(kvProducts) || kvProducts.length === 0) {
      kvProducts = [...defaultProducts];
    }

    const resProdId = telemetryRecord.product_id;
    let kvProdIdx = kvProducts.findIndex(p => p.id === resProdId);
    if (kvProdIdx > -1) {
      if (payload.product_name) kvProducts[kvProdIdx].name = payload.product_name;
      if (payload.product_type) kvProducts[kvProdIdx].type = payload.product_type;
      if (payload.product_price) kvProducts[kvProdIdx].pricePerLiter = Number(payload.product_price);
      if (payload.product_density) kvProducts[kvProdIdx].referenceDensity = Number(payload.product_density);
      if (payload.product_color) kvProducts[kvProdIdx].hexColor = payload.product_color;
    } else {
      kvProducts.push({
        id: resProdId,
        name: payload.product_name || `${resProdId} Combustible`,
        type: payload.product_type || 'gasoil',
        referenceDensity: Number(payload.product_density || 840),
        color: 'teal',
        hexColor: payload.product_color || '#0ea5e9',
        pricePerLiter: Number(payload.product_price || 1200),
        minStock: 2000,
        maxStock: 40000,
        unit: 'L',
        active: true,
        createdAt: new Date().toISOString()
      });
    }

    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kvProducts)
    });

    console.log("[C.E.S.T.I. KVDB] Guardado exitoso de tanques y productos en KVDB.io");
  } catch (err) {
    console.warn("[C.E.S.T.I. KVDB WARN] Falló guardado en KVDB.io:", err.message);
  }

  // --- PERSISTENCIA EN NETLIFY BLOBS ---
  try {
    const store = getStore({ name: "cesti-telemetry" });
    
    // 1. Guardar Tanques en Blobs
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
    await store.setJSON(`tank-telemetry-${telemetryRecord.tank_id}`, telemetryRecord);
    await store.setJSON("latest-telemetry", telemetryRecord);

    // 2. Guardar Productos en Blobs
    let blobProducts = [];
    try {
      blobProducts = await store.getJSON("registered-products") || [];
    } catch (e) {
      blobProducts = [];
    }

    if (!Array.isArray(blobProducts) || blobProducts.length === 0) {
      blobProducts = [...defaultProducts];
    }

    const bProdId = telemetryRecord.product_id;
    let bProdIdx = blobProducts.findIndex(p => p.id === bProdId);
    if (bProdIdx > -1) {
      if (payload.product_name) blobProducts[bProdIdx].name = payload.product_name;
      if (payload.product_type) blobProducts[bProdIdx].type = payload.product_type;
      if (payload.product_price) blobProducts[bProdIdx].pricePerLiter = Number(payload.product_price);
      if (payload.product_density) blobProducts[bProdIdx].referenceDensity = Number(payload.product_density);
      if (payload.product_color) blobProducts[bProdIdx].hexColor = payload.product_color;
    } else {
      blobProducts.push({
        id: bProdId,
        name: payload.product_name || `${bProdId} Combustible`,
        type: payload.product_type || 'gasoil',
        referenceDensity: Number(payload.product_density || 840),
        color: 'teal',
        hexColor: payload.product_color || '#0ea5e9',
        pricePerLiter: Number(payload.product_price || 1200),
        minStock: 2000,
        maxStock: 40000,
        unit: 'L',
        active: true,
        createdAt: new Date().toISOString()
      });
    }

    await store.setJSON("registered-products", blobProducts);

    console.log("[C.E.S.T.I. BLOB] Guardado exitoso de tanques y productos en Netlify Blobs.");
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
