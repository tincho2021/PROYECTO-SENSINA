/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: add-driver.js
 * 
 * Registra un chofer nuevo persistiendo directamente en la base de datos de la nube (KVDB.io)
 * y en Netlify Blobs.
 */

const { getStore } = require("@netlify/blobs");

// Fallback mock drivers if cloud is empty
const mockDrivers = [
  { id: 'DRV-001', name: 'Juan Pérez', document: '28.345.981', rfidCard: 'RFID-9843-01', enabledVehicles: ['VEH-001', 'VEH-002'], dailyLimitLiters: 200, monthlyLimitLiters: 3000, active: true, costCenter: 'Logística Oeste', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'DRV-002', name: 'Carlos Gómez', document: '31.254.912', rfidCard: 'RFID-1243-02', enabledVehicles: ['VEH-002'], dailyLimitLiters: 150, monthlyLimitLiters: 2000, active: true, costCenter: 'Mantenimiento Técnico', createdAt: '2025-01-15T10:15:00Z' },
  { id: 'DRV-003', name: 'María Rodríguez', document: '25.983.473', rfidCard: 'RFID-4512-03', enabledVehicles: ['VEH-003'], dailyLimitLiters: 1000, monthlyLimitLiters: 15000, active: true, costCenter: 'Generación Industrial', createdAt: '2025-02-18T11:00:00Z' },
  { id: 'DRV-004', name: 'Federico Villagra', document: '27.411.092', rfidCard: 'RFID-1100-04', enabledVehicles: ['VEH-004', 'VEH-005'], dailyLimitLiters: 900, monthlyLimitLiters: 18000, active: true, costCenter: 'Logística Rosario', createdAt: '2025-01-12T09:00:00Z' },
  { id: 'DRV-005', name: 'Leandro Mercado', document: '33.821.492', rfidCard: 'RFID-7711-05', enabledVehicles: ['VEH-005'], dailyLimitLiters: 500, monthlyLimitLiters: 10000, active: true, costCenter: 'Logística Rosario', createdAt: '2025-01-12T09:30:00Z' },
  { id: 'DRV-006', name: 'Mariano Altuna', document: '29.384.102', rfidCard: 'RFID-5522-06', enabledVehicles: ['VEH-006'], dailyLimitLiters: 400, monthlyLimitLiters: 8000, active: true, costCenter: 'Transporte Agro', createdAt: '2025-02-01T08:00:00Z' },
  { id: 'DRV-007', name: 'Guillermo Ortelli', document: '24.129.584', rfidCard: 'RFID-8833-07', enabledVehicles: ['VEH-007'], dailyLimitLiters: 600, monthlyLimitLiters: 12000, active: false, costCenter: 'Transporte Agro', createdAt: '2025-02-01T08:30:00Z' },
  { id: 'DRV-008', name: 'Christian Ledesma', document: '26.849.201', rfidCard: 'RFID-9944-08', enabledVehicles: ['VEH-001', 'VEH-008'], dailyLimitLiters: 300, monthlyLimitLiters: 5000, active: true, costCenter: 'Distribución Norte', createdAt: '2025-03-05T09:15:00Z' }
];

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "Método no permitido. Use POST." })
    };
  }

  const bucket = "7b3mwrCjYKfthbbugjqh4k";

  try {
    const body = JSON.parse(event.body || "{}");
    const { name, document, rfidCard, dailyLimitLiters, monthlyLimitLiters, costCenter } = body;

    if (!name || !rfidCard) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nombre y Tarjeta RFID son obligatorios' })
      };
    }

    // 1. Fetch current drivers list from Blobs or KVDB
    let drivers = null;
    let store = null;
    try {
      store = getStore({ name: "cesti-telemetry" });
      drivers = await store.getJSON("registered-drivers");
    } catch (e) {}

    if (!drivers) {
      try {
        const res = await fetch(`https://kvdb.io/${bucket}/registered-drivers`);
        if (res.ok) {
          drivers = await res.json();
        }
      } catch (e) {}
    }

    if (!Array.isArray(drivers) || drivers.length === 0) {
      drivers = [...mockDrivers];
    }

    // 2. Create and append the new driver
    const newDrv = {
      id: `DRV-${Date.now()}`,
      name,
      document: document || '',
      rfidCard,
      dailyLimitLiters: Number(dailyLimitLiters || 200),
      monthlyLimitLiters: Number(monthlyLimitLiters || 3000),
      active: true,
      costCenter: costCenter || 'General',
      createdAt: new Date().toISOString()
    };

    drivers.push(newDrv);

    // 3. Persist back to KVDB
    try {
      await fetch(`https://kvdb.io/${bucket}/registered-drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(drivers)
      });
    } catch (e) {
      console.error("KVDB write error:", e);
    }

    // 4. Persist to Netlify Blobs if configured
    if (store) {
      try {
        await store.setJSON("registered-drivers", drivers);
      } catch (e) {
        console.error("Blobs write error:", e);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, driver: newDrv })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to add driver: ' + err.message })
    };
  }
};
