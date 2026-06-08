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

  // Lista de choferes y vehículos autorizados base (Sincronizado)
  const drivers = [
    { id: "DRV-001", name: "Juan Pérez", rfid_card: "RFID-9843-01", enabled_vehicles: ["VEH-001", "VEH-002"], daily_limit_liters: 200 },
    { id: "DRV-002", name: "Carlos Gómez", rfid_card: "RFID-1243-02", enabled_vehicles: ["VEH-002"], daily_limit_liters: 150 },
    { id: "DRV-003", name: "María Rodríguez", rfid_card: "RFID-4512-03", enabled_vehicles: ["VEH-003"], daily_limit_liters: 1000 },
    { id: "DRV-004", name: "Federico Villagra", rfid_card: "RFID-1100-04", enabled_vehicles: ["VEH-004", "VEH-005"], daily_limit_liters: 900 },
    { id: "DRV-005", name: "Leandro Mercado", rfid_card: "RFID-7711-05", enabled_vehicles: ["VEH-005"], daily_limit_liters: 500 },
    { id: "DRV-006", name: "Mariano Altuna", rfid_card: "RFID-5522-06", enabled_vehicles: ["VEH-006"], daily_limit_liters: 400 },
    { id: "DRV-008", name: "Christian Ledesma", rfid_card: "RFID-9944-08", enabled_vehicles: ["VEH-001", "VEH-008"], daily_limit_liters: 300 }
  ];

  const vehicles = [
    { id: "VEH-001", plate: "AB-123-CD", brand: "Toyota", model: "Hilux 4x4", tank_capacity_liters: 80 },
    { id: "VEH-002", plate: "AD-892-JJ", brand: "Ford", model: "Ranger Raptor", tank_capacity_liters: 80 },
    { id: "VEH-003", plate: "GEN-01-IND", brand: "Caterpillar", model: "CAT-3512", tank_capacity_liters: 2000 },
    { id: "VEH-004", plate: "AA-450-XX", brand: "Scania", model: "R450 Heavy", tank_capacity_liters: 450 },
    { id: "VEH-005", plate: "AA-510-ZZ", brand: "Mercedes-Benz", model: "Actros 2651", tank_capacity_liters: 500 },
    { id: "VEH-006", plate: "AE-320-MM", brand: "John Deere", model: "8345R", tank_capacity_liters: 600 },
    { id: "VEH-008", plate: "AG-912-BB", brand: "Chevrolet", model: "S10 CD", tank_capacity_liters: 76 }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      count_drivers: drivers.length,
      count_vehicles: vehicles.length,
      drivers: drivers,
      vehicles: vehicles
    })
  };
};
