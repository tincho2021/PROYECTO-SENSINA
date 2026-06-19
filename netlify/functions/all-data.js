/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: all-data.js
 * 
 * Compila y retorna el estado completo de la base de datos para la aplicación React,
 * leyendo de Netlify Blobs o de KVDB.io. Esto es equivalente a la ruta /api/all-data del servidor Express.
 */

const { getStore } = require("@netlify/blobs");

// Mock Data de fábrica en caso de que no existan registros persistidos en la base
const mockSites = [
  { id: 'rosario-01', name: 'Estación Rosario Norte', location: 'Ruta 9, Km 280, Rosario', status: 'active', manager: 'M. Rodríguez' }
];

const mockProducts = [
  { id: 'GO2', name: 'Gasoil Grado 2 (Ultra Diesel)', type: 'gasoil', referenceDensity: 840, color: 'emerald', hexColor: '#10b981', pricePerLiter: 1210.40, minStock: 8000, maxStock: 40000, unit: 'L', active: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'GP', name: 'Gasoil Grado 3 (Infinia Diesel)', type: 'premium', referenceDensity: 835, color: 'teal', hexColor: '#0d9488', pricePerLiter: 1450.20, minStock: 6000, maxStock: 30000, unit: 'L', active: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'NS', name: 'Nafta Súper', type: 'nafta', referenceDensity: 735, color: 'blue', hexColor: '#3b82f6', pricePerLiter: 1280.90, minStock: 5000, maxStock: 25000, unit: 'L', active: true, createdAt: '2025-01-01T00:00:00Z' }
];

const mockDrivers = [
  { id: 'DRV-001', name: 'Juan Carlos Gómez', nfcUid: 'A1B2C3D4', active: true, company: 'Logística Flecha', maxLitersPerDay: 400 },
  { id: 'DRV-002', name: 'Martín Rodríguez', nfcUid: 'E5F61234', active: true, company: 'Propia', maxLitersPerDay: 1000 },
  { id: 'DRV-003', name: 'Pedro Acevedo', nfcUid: '87654321', active: true, company: 'Silos Del Sur', maxLitersPerDay: 500 }
];

const mockVehicles = [
  { id: 'VEH-001', plate: 'AA777BB', model: 'Scania R450', active: true, company: 'Logística Flecha', allowedProducts: ['GO2', 'GP'], currentOdometer: 142300 },
  { id: 'VEH-002', plate: 'AF123JK', model: 'Toyota Hilux', active: true, company: 'Propia', allowedProducts: ['GP', 'NS'], currentOdometer: 45600 },
  { id: 'VEH-003', plate: 'ODG998', model: 'Mercedes Benz Axor', active: true, company: 'Silos Del Sur', allowedProducts: ['GO2'], currentOdometer: 298100 }
];

const mockDevices = [
  { id: 'DEV-001', name: 'Concentrador Principal', macAddress: 'AA:BB:CC:DD:EE:FF', hardwareVersion: 'v3.2', firmwareVersion: 'v1.4.2', lastSeen: new Date().toISOString(), status: 'online', type: 'esp32' }
];

const mockUsers = [
  { id: 'usr-admin', username: 'admin', email: 'admin@cesti.com', role: 'admin', active: true, name: 'Administrador CESTI' }
];

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

  const bucket = "7b3mwrCjYKfthbbugjqh4k";

  // Inicializar respuesta base limpia
  let buildDb = {
    sites: [...mockSites],
    products: [],
    tanks: [],
    dispensers: [],
    drivers: [...mockDrivers],
    vehicles: [...mockVehicles],
    transactions: [],
    deliveries: [],
    reconciliations: [],
    alerts: [],
    devices: [...mockDevices],
    users: [...mockUsers],
    auditLogs: [],
    esp32RawLogs: []
  };

  // Helper de timeout para consultas a KVDB
  const fetchWithTimeout = async (url, options = {}, timeout = 2500) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  let store;
  try {
    store = getStore({ name: "cesti-telemetry" });
  } catch (err) {
    console.warn("[C.E.S.T.I.] No se pudo inicializar Netlify Blobs:", err.message);
  }

  // 1. Obtener Tanques
  let tanks = null;
  if (store) {
    try {
      tanks = await store.getJSON("registered-tanks");
    } catch (e) {}
  }
  if (!tanks) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/registered-tanks`);
      if (res.ok) tanks = await res.json();
    } catch (e) {}
  }
  // Mapeamos a la estructura que espera el cliente React si es que existen tanques
  if (Array.isArray(tanks)) {
    buildDb.tanks = tanks.map(t => {
      // Garantizar compatibilidad de estructura
      const incomingId = t.tank_id || t.id;
      let targetId = incomingId;
      if (incomingId === 'tank_01' || incomingId === 'tank_1') targetId = 'TQ-02';
      else if (incomingId === 'tank_02' || incomingId === 'tank_2') targetId = 'TQ-01';
      else if (incomingId === 'tank_03' || incomingId === 'tank_3') targetId = 'TQ-03';

      let pId = t.product_id || t.productId;
      if (pId === 'GO3' || pId === 'premium') pId = 'GP';
      else if (pId === 'nafta') pId = 'NS';
      else if (pId === 'gasoil') pId = 'GO2';

      return {
        id: targetId,
        siteId: t.site_id || t.siteId || "rosario-01",
        productId: pId || "GO2",
        name: t.tank_name || t.name || `Cisterna Sonda ${incomingId}`,
        capacityLiters: t.capacity_liters || t.capacityLiters || 20000,
        heightMm: t.height_mm || t.heightMm || 2000,
        currentHeightMm: t.height_mm ?? t.currentHeightMm ?? 0,
        currentVolumeLiters: t.volume_liters ?? t.currentVolumeLiters ?? 0,
        temperatureC: t.temperature_c ?? t.temperatureC ?? 15,
        waterMm: t.water_mm ?? t.waterMm ?? 0,
        batteryV: t.battery_v ?? t.batteryV ?? 3.6,
        batteryPercent: t.battery_percent ?? t.batteryPercent ?? 100,
        signalRssi: t.signal_rssi ?? t.signalRssi ?? -60,
        sensorStatus: t.sensor_status || t.sensorStatus || "normal",
        sensorType: "magnetostrictive",
        lastUpdated: t.received_at || t.lastUpdated || new Date().toISOString()
      };
    });
  }

  // 2. Obtener Productos
  let products = null;
  if (store) {
    try {
      products = await store.getJSON("registered-products");
    } catch (e) {}
  }
  if (!products) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/registered-products`);
      if (res.ok) products = await res.json();
    } catch (e) {}
  }
  buildDb.products = Array.isArray(products) ? products : [...mockProducts];

  // 3. Obtener Surtidores
  let dispenserData = null;
  if (store) {
    try {
      dispenserData = await store.getJSON("latest-dispenser-status");
    } catch (e) {}
  }
  if (!dispenserData) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/latest-dispenser-status`);
      if (res.ok) dispenserData = await res.json();
    } catch (e) {}
  }
  if (dispenserData && Array.isArray(dispenserData.dispensers)) {
    buildDb.dispensers = dispenserData.dispensers.map(updatedDisp => ({
      id: updatedDisp.dispenser_id || updatedDisp.id,
      siteId: dispenserData.site_id || "rosario-01",
      name: `Surtidor ${(updatedDisp.dispenser_id || '').replace(/[_-]/g, ' ')}`,
      hose: updatedDisp.nozzle || updatedDisp.hose || 1,
      productId: updatedDisp.product_id || updatedDisp.productId || "GO2",
      suctionTankId: updatedDisp.suction_tank_id || updatedDisp.suctionTankId,
      status: updatedDisp.status === 'fueling' ? 'dispensing' : (updatedDisp.status || "available"),
      lastSaleLiters: Number(updatedDisp.last_sale_liters || updatedDisp.lastSaleLiters || 0),
      lastSaleAmount: Number(updatedDisp.last_sale_amount || updatedDisp.lastSaleAmount || 0),
      activeDriver: updatedDisp.driver || updatedDisp.activeDriver,
      activeVehicle: updatedDisp.vehicle || updatedDisp.activeVehicle,
      activePlate: updatedDisp.plate || updatedDisp.activePlate,
      odometerReading: updatedDisp.odometer || updatedDisp.odometerReading,
      authorizationMethod: updatedDisp.authorization_method || updatedDisp.authorizationMethod || "RFID",
      lastUpdated: dispenserData.received_at || updatedDisp.lastUpdated || new Date().toISOString()
    }));
  }

  // 4. Obtener Transacciones de Combustible
  let txs = null;
  if (store) {
    try {
      txs = await store.getJSON("latest-fuel-transactions");
    } catch (e) {}
  }
  if (!txs) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/latest-fuel-transactions`);
      if (res.ok) txs = await res.json();
    } catch (e) {}
  }
  if (Array.isArray(txs)) {
    buildDb.transactions = txs.map(tx => ({
      id: tx.transaction_id || tx.id,
      siteId: tx.site_id || tx.siteId || "rosario-01",
      dispenserId: tx.dispenser_id || tx.dispenserId,
      hose: tx.nozzle || tx.hose || 1,
      productId: tx.product_id || tx.productId || "GO2",
      liters: Number(tx.liters || 0),
      amount: Number(tx.amount || 0),
      pricePerLiter: Number(tx.price_per_liter || tx.pricePerLiter || 1200),
      driverId: tx.driver_id || tx.driverId,
      vehicleId: tx.vehicle_id || tx.vehicleId,
      vehiclePlate: tx.vehicle_plate || tx.vehiclePlate || tx.plate,
      odometer: tx.odometer,
      timestampStart: tx.timestamp_start || tx.timestampStart,
      timestampEnd: tx.timestamp_end || tx.timestampEnd,
      authorizationMethod: tx.authorization_method || tx.authorizationMethod || "RFID",
      status: tx.status || "completed",
      createdAt: tx.received_at || tx.createdAt || new Date().toISOString()
    }));
  }

  // 5. Obtener Alarmas / Alertas
  let alarms = null;
  if (store) {
    try {
      alarms = await store.getJSON("latest-alarms");
    } catch (e) {}
  }
  if (!alarms) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/latest-alarms`);
      if (res.ok) alarms = await res.json();
    } catch (e) {}
  }
  if (Array.isArray(alarms)) {
    buildDb.alerts = alarms.map(alm => ({
      id: alm.alarm_id || alm.id,
      level: alm.severity === 'critical' ? 'critical' : alm.severity === 'warning' ? 'warning' : 'info',
      timestamp: alm.timestamp,
      source: `${(alm.source_type || '').toUpperCase()} - ${alm.source_id}`,
      description: `[IoT ${(alm.alarm_type || '').toUpperCase()}] ${alm.message}`,
      status: alm.status === 'active' ? 'new' : alm.status === 'resolved' ? 'resolved' : 'acknowledged',
      recommendation: 'Inspección de seguridad física. Medir de forma manual para contrastar diferencias.'
    }));
  }

  // 6. Obtener Descargas / Entregas
  let deliveries = null;
  if (store) {
    try {
      deliveries = await store.getJSON("latest-deliveries");
    } catch (e) {}
  }
  if (!deliveries) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/latest-deliveries`);
      if (res.ok) deliveries = await res.json();
    } catch (e) {}
  }
  if (Array.isArray(deliveries)) {
    buildDb.deliveries = deliveries;
  }

  // 7. Obtener Payloads crudos ESP32
  let rawLogs = null;
  if (store) {
    try {
      rawLogs = await store.getJSON("esp32-raw-payloads");
    } catch (e) {}
  }
  if (!rawLogs) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/esp32-raw-payloads`);
      if (res.ok) rawLogs = await res.json();
    } catch (e) {}
  }
  if (Array.isArray(rawLogs)) {
    buildDb.esp32RawLogs = rawLogs;
  }

  // 8. Obtener Choferes Registrados desde la Nube (KVDB / Blobs)
  let cloudDrivers = null;
  if (store) {
    try {
      cloudDrivers = await store.getJSON("registered-drivers");
    } catch (e) {}
  }
  if (!cloudDrivers) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/registered-drivers`);
      if (res.ok) cloudDrivers = await res.json();
    } catch (e) {}
  }
  if (Array.isArray(cloudDrivers) && cloudDrivers.length > 0) {
    buildDb.drivers = cloudDrivers;
  }

  // 9. Obtener Vehículos Registrados desde la Nube (KVDB / Blobs)
  let cloudVehicles = null;
  if (store) {
    try {
      cloudVehicles = await store.getJSON("registered-vehicles");
    } catch (e) {}
  }
  if (!cloudVehicles) {
    try {
      const res = await fetchWithTimeout(`https://kvdb.io/${bucket}/registered-vehicles`);
      if (res.ok) cloudVehicles = await res.json();
    } catch (e) {}
  }
  if (Array.isArray(cloudVehicles) && cloudVehicles.length > 0) {
    buildDb.vehicles = cloudVehicles;
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(buildDb)
  };
};
