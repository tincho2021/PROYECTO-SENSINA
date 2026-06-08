/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: latest-telemetry.js
 * 
 * Expone un GET para consultar el último estado de telemetría medido.
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

  let latestData = null;
  let registeredTanks = null;

  try {
    const store = getStore({ name: "cesti-telemetry" });
    latestData = await store.getJSON("latest-telemetry");
    registeredTanks = await store.getJSON("registered-tanks");
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló Netlify Blobs en GET:", error.message);
  }

  // Fallback a KVDB.io (Persistencia serverless universal de respaldo)
  if (!latestData) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-telemetry");
      if (kvRes.ok) {
        latestData = await kvRes.json();
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de KVDB.io:", err.message);
    }
  }

  if (!registeredTanks) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-tanks");
      if (kvRes.ok) {
        registeredTanks = await kvRes.json();
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de registered-tanks de KVDB.io:", err.message);
    }
  }

  if (!latestData) {
    latestData = global.latestTelemetryData || null;
  }

  if (!registeredTanks) {
    if (global.latestTanksMap && Object.keys(global.latestTanksMap).length > 0) {
      registeredTanks = Object.values(global.latestTanksMap);
    } else if (latestData) {
      registeredTanks = [latestData];
    } else {
      const nowStr = new Date().toISOString();
      registeredTanks = [
        {
          tank_id: 'tank_02',
          site_id: 'ESTACION-001',
          product_id: 'GO2',
          tank_name: 'Cisterna Diesel Comun',
          capacity_liters: 20000,
          volume_liters: 12160,
          height_mm: 1520,
          temperature_c: 15.8,
          water_mm: 4,
          battery_v: 3.62,
          battery_percent: 100,
          signal_rssi: -65,
          sensor_status: 'normal',
          received_at: nowStr
        },
        {
          tank_id: 'tank_01',
          site_id: 'ESTACION-001',
          product_id: 'GP',
          tank_name: 'Cisterna Gasoil Premium',
          capacity_liters: 30000,
          volume_liters: 21500,
          height_mm: 2150,
          temperature_c: 16.4,
          water_mm: 0,
          battery_v: 3.62,
          battery_percent: 100,
          signal_rssi: -60,
          sensor_status: 'normal',
          received_at: nowStr
        },
        {
          tank_id: 'tank_03',
          site_id: 'ESTACION-001',
          product_id: 'NS',
          tank_name: 'Cisterna Nafta Super',
          capacity_liters: 15000,
          volume_liters: 7050,
          height_mm: 940,
          temperature_c: 17.2,
          water_mm: 0,
          battery_v: 3.62,
          battery_percent: 100,
          signal_rssi: -62,
          sensor_status: 'normal',
          received_at: nowStr
        }
      ];
    }
  } else {
    // Merge latest global.latestTanksMap items if they exist to keep them up to date across cold restarts
    if (global.latestTanksMap) {
      const aliases = {
        'tank_01': 'TQ-02', 'tank_1': 'TQ-02', 'TQ-02': 'tank_01',
        'tank_02': 'TQ-01', 'tank_2': 'TQ-01', 'TQ-01': 'tank_02',
        'tank_03': 'TQ-03', 'tank_3': 'TQ-03', 'TQ-03': 'tank_03'
      };
      Object.entries(global.latestTanksMap).forEach(([tId, record]) => {
        const targetAlias = aliases[tId];
        const idx = registeredTanks.findIndex(t => {
          const tid = t.tank_id || t.id;
          return tid === tId || (targetAlias && tid === targetAlias);
        });
        if (idx > -1) {
          registeredTanks[idx] = { ...registeredTanks[idx], ...record };
        } else {
          registeredTanks.push(record);
        }
      });
    }
  }

  // --- SEGURIDAD MULTI-CISTERNA SÍNCRONA (ANTI RACE CONDITION) ---
  // Para evitar sobreescrituras por condiciones de carrera entre llamadas POST concurrentes
  // del microcontrolador o simulador, leemos las telemetrías individuales de cada cisterna en paralelo.
  const knownTankIds = ['tank_01', 'tank_02', 'tank_03', 'TQ-01', 'TQ-02', 'TQ-03'];
  const upToDateTanks = {};

  // 1) Cargar del mapa local en memoria si existe
  if (global.latestTanksMap) {
    Object.entries(global.latestTanksMap).forEach(([tId, r]) => {
      upToDateTanks[tId] = r;
    });
  }

  // 2) Cargar de Netlify Blobs individuales en paralelo
  try {
    const store = getStore({ name: "cesti-telemetry" });
    const blobPromises = knownTankIds.map(async (tId) => {
      try {
        const individual = await store.getJSON(`tank-telemetry-${tId}`);
        if (individual && individual.received_at) {
          if (!upToDateTanks[tId] || new Date(individual.received_at) > new Date(upToDateTanks[tId].received_at)) {
            upToDateTanks[tId] = individual;
          }
        }
      } catch (err) {}
    });
    await Promise.all(blobPromises);
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló consulta a Blobs para telemetrías individuales:", error.message);
  }

  // 3) Cargar de KVDB individual en paralelo
  try {
    const kvPromises = knownTankIds.map(async (tId) => {
      try {
        const kvRes = await fetch(`https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/tank-telemetry-${tId}`);
        if (kvRes.ok) {
          const individual = await kvRes.json();
          if (individual && individual.received_at) {
            if (!upToDateTanks[tId] || new Date(individual.received_at) > new Date(upToDateTanks[tId].received_at)) {
              upToDateTanks[tId] = individual;
            }
          }
        }
      } catch (err) {}
    });
    await Promise.all(kvPromises);
  } catch (err) {
    console.warn("[C.E.S.T.I.] Falló consulta a KVDB para telemetrías individuales:", err.message);
  }

  // 4) Fusionar de forma destructiva sobre registeredTanks usando la telemetría individual más fresca, considerando alias
  if (registeredTanks && Array.isArray(registeredTanks)) {
    const aliases = {
      'tank_01': 'TQ-02', 'tank_1': 'TQ-02', 'TQ-02': 'tank_01',
      'tank_02': 'TQ-01', 'tank_2': 'TQ-01', 'TQ-01': 'tank_02',
      'tank_03': 'TQ-03', 'tank_3': 'TQ-03', 'TQ-03': 'tank_03'
    };

    registeredTanks = registeredTanks.map(t => {
      const primaryKey = t.tank_id || t.id;
      const secondaryKey = aliases[primaryKey];

      let match = upToDateTanks[primaryKey];
      if (secondaryKey && upToDateTanks[secondaryKey]) {
        if (!match || (upToDateTanks[secondaryKey].received_at && new Date(upToDateTanks[secondaryKey].received_at) > new Date(match.received_at))) {
          match = upToDateTanks[secondaryKey];
        }
      }
      return match ? { ...t, ...match, tank_id: primaryKey } : t;
    });
    
    // Si hay algún tanque en upToDateTanks que no esté en registeredTanks, lo agregamos
    Object.entries(upToDateTanks).forEach(([tId, record]) => {
      const targetAlias = aliases[tId];
      const exists = registeredTanks.some(t => {
        const tid = t.tank_id || t.id;
        return tid === tId || (targetAlias && tid === targetAlias);
      });
      if (!exists) {
        registeredTanks.push(record);
      }
    });
  }

  // Cargar productos registrados dinámicos
  let registeredProducts = null;
  try {
    const store = getStore({ name: "cesti-telemetry" });
    registeredProducts = await store.getJSON("registered-products");
  } catch (error) {
    console.warn("[C.E.S.T.I.] Falló Netlify Blobs en GET para productos:", error.message);
  }

  if (!registeredProducts) {
    try {
      const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-products");
      if (kvRes.ok) {
        registeredProducts = await kvRes.json();
      }
    } catch (err) {
      console.warn("[C.E.S.T.I. KVDB WARN] Falló lectura de registered-products de KVDB.io:", err.message);
    }
  }

  if (!registeredProducts) {
    // Definir productos por defecto de la plataforma
    registeredProducts = [
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
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      data: latestData,
      tanks: registeredTanks || [],
      products: registeredProducts || [],
      message: latestData ? undefined : "No telemetry received yet"
    })
  };
};
