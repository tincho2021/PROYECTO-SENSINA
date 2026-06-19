/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: add-vehicle.js
 * 
 * Registra un vehículo de flota nuevo persistiendo directamente en la base de datos de la nube (KVDB.io)
 * y en Netlify Blobs.
 */

const { getStore } = require("@netlify/blobs");

// Fallback mock vehicles if cloud is empty
const mockVehicles = [
  { id: 'VEH-001', plate: 'AB-123-CD', brand: 'Toyota', model: 'Hilux 4x4', type: 'Pick-up', costCenter: 'Mantenimiento Técnico', tankCapacityLiters: 80, expectedKmL: 10.5, lastOdometer: 145230, active: true, createdAt: '2025-01-15T11:00:00Z' },
  { id: 'VEH-002', plate: 'AD-892-JJ', brand: 'Ford', model: 'Ranger Raptor', type: 'Pick-up', costCenter: 'Supervisión de Base', tankCapacityLiters: 80, expectedKmL: 8.4, lastOdometer: 120540, active: true, createdAt: '2025-01-15T11:15:00Z' },
  { id: 'VEH-003', plate: 'GEN-01-IND', brand: 'Caterpillar', model: 'CAT-3512', type: 'Generador', costCenter: 'Generación Industrial', tankCapacityLiters: 2000, expectedKmL: 0.1, lastOdometer: 8520, active: true, createdAt: '2025-02-18T12:00:00Z' },
  { id: 'VEH-004', plate: 'AA-450-XX', brand: 'Scania', model: 'R450 Heavy', type: 'Camión Cisterna', costCenter: 'Logística Rosario', tankCapacityLiters: 450, expectedKmL: 3.2, lastOdometer: 345670, active: true, createdAt: '2025-01-12T10:00:00Z' },
  { id: 'VEH-005', plate: 'AA-510-ZZ', brand: 'Mercedes-Benz', model: 'Actros 2651', type: 'Camión Sider', costCenter: 'Logística Rosario', tankCapacityLiters: 500, expectedKmL: 3.5, lastOdometer: 198530, active: true, createdAt: '2025-01-12T10:30:00Z' },
  { id: 'VEH-006', plate: 'AE-320-MM', brand: 'John Deere', model: '8345R', type: 'Tractor Agrícola', costCenter: 'Siembra Campo 1', tankCapacityLiters: 600, expectedKmL: 1.5, lastOdometer: 3410, active: true, createdAt: '2025-02-01T09:10:00Z' },
  { id: 'VEH-007', plate: 'AF-710-DD', brand: 'Iveco', model: 'Stralis 600', type: 'Camión Tolva', costCenter: 'Cosecha Campo 2', tankCapacityLiters: 400, expectedKmL: 3.0, lastOdometer: 54120, active: false, createdAt: '2025-02-01T09:40:00Z' },
  { id: 'VEH-008', plate: 'AG-912-BB', brand: 'Chevrolet', model: 'S10 CD', type: 'Pick-up', costCenter: 'Distribución Norte', tankCapacityLiters: 76, expectedKmL: 11.2, lastOdometer: 24150, active: true, createdAt: '2025-03-05T10:00:00Z' }
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
    const { plate, brand, model, type, costCenter, tankCapacityLiters, expectedKmL, lastOdometer } = body;

    if (!plate || !brand) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'La patente y la marca son obligatorias' })
      };
    }

    // 1. Fetch current vehicles list from Blobs or KVDB
    let vehicles = null;
    let store = null;
    try {
      store = getStore({ name: "cesti-telemetry" });
      vehicles = await store.getJSON("registered-vehicles");
    } catch (e) {}

    if (!vehicles) {
      try {
        const res = await fetch(`https://kvdb.io/${bucket}/registered-vehicles`);
        if (res.ok) {
          vehicles = await res.json();
        }
      } catch (e) {}
    }

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      vehicles = [...mockVehicles];
    }

    // 2. Create and append the new vehicle
    const newVeh = {
      id: `VEH-${Date.now()}`,
      plate: plate.toUpperCase(),
      brand,
      model: model || 'S/M',
      type: type || 'Pick-up',
      costCenter: costCenter || 'General',
      tankCapacityLiters: Number(tankCapacityLiters || 80),
      expectedKmL: Number(expectedKmL || 10),
      lastOdometer: Number(lastOdometer || 0),
      active: true,
      createdAt: new Date().toISOString()
    };

    vehicles.push(newVeh);

    // 3. Persist back to KVDB
    try {
      await fetch(`https://kvdb.io/${bucket}/registered-vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicles)
      });
    } catch (e) {
      console.error("KVDB write error:", e);
    }

    // 4. Persist to Netlify Blobs if configured
    if (store) {
      try {
        await store.setJSON("registered-vehicles", vehicles);
      } catch (e) {
        console.error("Blobs write error:", e);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, vehicle: newVeh })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to add vehicle: ' + err.message })
    };
  }
};
