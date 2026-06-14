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

  // --- PERSISTENCIA RAW PAYLOAD LOG EN KVDB Y BLOBS ---
  try {
    let rawLogs = [];
    try {
      const resRaw = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/esp32-raw-payloads");
      if (resRaw.ok) {
        rawLogs = await resRaw.json();
      }
    } catch (e) {}
    if (!Array.isArray(rawLogs)) rawLogs = [];

    rawLogs.unshift({
      timestamp: received_at,
      ip: clientIp,
      payload: payload
    });

    rawLogs = rawLogs.slice(0, 50);

    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/esp32-raw-payloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rawLogs)
    });

    try {
      const storeObj = getStore({ name: "cesti-telemetry" });
      await storeObj.setJSON("esp32-raw-payloads", rawLogs);
    } catch (err) {}
    console.log(`[C.E.S.T.I. LOGS] Payload grabado con éxito en el historial (Total logs: ${rawLogs.length})`);
  } catch (err) {
    console.warn("[C.E.S.T.I.] Falló registro en historial de raw payload:", err.message);
  }

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

    const aliases = {
      'tank_01': 'TQ-02', 'tank_1': 'TQ-02', 'TQ-02': 'tank_01',
      'tank_02': 'TQ-01', 'tank_2': 'TQ-01', 'TQ-01': 'tank_02',
      'tank_03': 'TQ-03', 'tank_3': 'TQ-03', 'TQ-03': 'tank_03'
    };
    const targetAlias = aliases[telemetryRecord.tank_id];

    const fIdx = fallbackTanks.findIndex(t => {
      const tid = t.tank_id || t.id;
      return tid === telemetryRecord.tank_id || (targetAlias && tid === targetAlias);
    });

    let prevVolume = 0;
    if (fIdx > -1) {
      const prevTank = fallbackTanks[fIdx];
      prevVolume = Number(prevTank.volume_liters ?? prevTank.currentVolumeLiters ?? 0);
    }

    if (fIdx > -1) {
      const originalId = fallbackTanks[fIdx].tank_id || fallbackTanks[fIdx].id || telemetryRecord.tank_id;
      fallbackTanks[fIdx] = { 
        ...fallbackTanks[fIdx], 
        ...telemetryRecord, 
        tank_id: originalId 
      };
    } else {
      fallbackTanks.push(telemetryRecord);
    }

    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-tanks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fallbackTanks)
    });

    const diff = Number(telemetryRecord.volume_liters) - prevVolume;
    if (prevVolume > 0 && diff >= 250) {
      console.log(`[C.E.S.T.I. NETLIFY AUTO-DELIVERY] ¡Incremento de nivel detectado en el tanque ${telemetryRecord.tank_id}!: +${diff.toFixed(1)} L`);
      
      // Let's load existing deliveries to avoid duplicates and append new one
      let deliveries = [];
      try {
        const dGet = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-deliveries");
        if (dGet.ok) {
          deliveries = await dGet.json();
        }
      } catch (e) {}

      if (!Array.isArray(deliveries)) {
        deliveries = [];
      }

      // Check duplicate within last 10 minutes
      const tenMinutes = 10 * 60 * 1000;
      const isDuplicate = deliveries.some(d => 
        d.tankId === telemetryRecord.tank_id &&
        d.id.startsWith('DL-AUTO-') &&
        Math.abs(d.litersDeclared - diff) < 150 &&
        (Date.now() - new Date(d.timestamp).getTime()) < tenMinutes
      );

      if (!isDuplicate) {
        const newDelivery = {
          id: `DL-AUTO-${Date.now()}`,
          timestamp: new Date().toISOString(),
          supplier: 'Detección Automática IoT',
          invoiceNumber: `AUTO-${Math.floor(100000 + Math.random() * 900000)}`,
          productId: telemetryRecord.product_id || 'GO2',
          tankId: telemetryRecord.tank_id,
          litersDeclared: Number(diff.toFixed(1)),
          litersMeasuredBefore: Number(prevVolume.toFixed(1)),
          litersMeasuredAfter: Number(telemetryRecord.volume_liters.toFixed(1)),
          differenceLiters: 0,
          temperatureC: Number(telemetryRecord.temperature_c || 20),
          density: Number(telemetryRecord.product_density || 840),
          operator: 'Sonda de Telemedición SENSINA',
          notes: `Detección automática: Incremento repentino de +${diff.toFixed(1)} L registrado por la sonda IoT de nivel.`
        };

        deliveries.unshift(newDelivery);
        deliveries = deliveries.slice(0, 50);

        // Guardar descargas en KVDB.io y Netlify Blobs
        try {
          await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-deliveries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(deliveries)
          });
          const store = getStore({ name: "cesti-telemetry" });
          await store.setJSON("latest-deliveries", deliveries);
        } catch (e) {
          console.warn("[C.E.S.T.I.] Falló persistencia de descarga automática:", e.message);
        }

        // Crear una alarma automatica
        let alarms = [];
        try {
          const aGet = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-alarms");
          if (aGet.ok) {
            alarms = await aGet.json();
          }
        } catch (e) {}

        if (!Array.isArray(alarms)) {
          alarms = [];
        }

        const newAlarm = {
          device_id: telemetryRecord.device_id || "SENSINA-GENERIC-01",
          site_id: telemetryRecord.site_id || "ESTACION-GENERIC",
          timestamp: new Date().toISOString(),
          alarm_id: `ALT-AUTO-DL-${Date.now()}`,
          alarm_type: 'generic',
          severity: 'info',
          source_type: 'tank_sensor',
          source_id: telemetryRecord.tank_id,
          message: `Descarga de combustible detectada de forma automática en ${telemetryRecord.tank_name || telemetryRecord.tank_id}: +${diff.toFixed(1)} Litros.`,
          value: Number(diff.toFixed(1)),
          unit: 'L',
          status: 'active'
        };

        alarms.unshift(newAlarm);
        alarms = alarms.slice(0, 50);

        try {
          await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-alarms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(alarms)
          });
          const store = getStore({ name: "cesti-telemetry" });
          await store.setJSON("latest-alarms", alarms);
        } catch (e) {
          console.warn("[C.E.S.T.I.] Falló persistencia de alerta automática:", e.message);
        }
      } else {
        console.log(`[C.E.S.T.I. NETLIFY AUTO-DELIVERY] Omitiendo descarga duplicada detectada recientemente para ${telemetryRecord.tank_id}`);
      }
    }

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

    const aliases = {
      'tank_01': 'TQ-02', 'tank_1': 'TQ-02', 'TQ-02': 'tank_01',
      'tank_02': 'TQ-01', 'tank_2': 'TQ-01', 'TQ-01': 'tank_02',
      'tank_03': 'TQ-03', 'tank_3': 'TQ-03', 'TQ-03': 'tank_03'
    };
    const targetAlias = aliases[telemetryRecord.tank_id];

    const bIdx = blobTanks.findIndex(t => {
      const tid = t.tank_id || t.id;
      return tid === telemetryRecord.tank_id || (targetAlias && tid === targetAlias);
    });

    if (bIdx > -1) {
      const originalId = blobTanks[bIdx].tank_id || blobTanks[bIdx].id || telemetryRecord.tank_id;
      blobTanks[bIdx] = { 
        ...blobTanks[bIdx], 
        ...telemetryRecord, 
        tank_id: originalId 
      };
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
