/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: fleet.js
 * 
 * Expone un GET para descargar la lista de choferes y vehículos autorizados (patente, rfidCard).
 * Esto permite al ESP32 cachear la flota y validar transacciones de forma offline/local.
 */

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  const { getStore } = require("@netlify/blobs");

  // Fallbacks
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

  const bucket = "7b3mwrCjYKfthbbugjqh4k";

  // 1. Fetch raw lists
  let driversList = null;
  let vehiclesList = null;
  let store = null;

  try {
    store = getStore({ name: "cesti-telemetry" });
  } catch (e) {}

  // Drivers
  if (store) {
    try {
      driversList = await store.getJSON("registered-drivers");
    } catch (e) {}
  }
  if (!driversList) {
    try {
      const res = await fetch(`https://kvdb.io/${bucket}/registered-drivers`);
      if (res.ok) {
        driversList = await res.json();
      }
    } catch (e) {}
  }
  if (!Array.isArray(driversList) || driversList.length === 0) {
    driversList = [...mockDrivers];
  }

  // Vehicles
  if (store) {
    try {
      vehiclesList = await store.getJSON("registered-vehicles");
    } catch (e) {}
  }
  if (!vehiclesList) {
    try {
      const res = await fetch(`https://kvdb.io/${bucket}/registered-vehicles`);
      if (res.ok) {
        vehiclesList = await res.json();
      }
    } catch (e) {}
  }
  if (!Array.isArray(vehiclesList) || vehiclesList.length === 0) {
    vehiclesList = [...mockVehicles];
  }

  // 2. Clean and format active entities for ESP32 JSON optimization
  const activeDrivers = driversList
    .filter(d => d.active)
    .map(d => ({
      id: d.id,
      name: d.name,
      rfid_card: d.rfidCard,
      document: d.document || "",
      dni: d.document || "",
      enabled_vehicles: d.enabledVehicles || [],
      daily_limit_liters: Number(d.dailyLimitLiters || 200)
    }));

  const activeVehicles = vehiclesList
    .filter(v => v.active)
    .map(v => ({
      id: v.id,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      tank_capacity_liters: Number(v.tankCapacityLiters || 80)
    }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      count_drivers: activeDrivers.length,
      count_vehicles: activeVehicles.length,
      drivers: activeDrivers,
      vehicles: activeVehicles
    })
  };
};
