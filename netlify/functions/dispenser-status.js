/**
 * C.E.S.T.I. TELEMETRIA
 * Netlify Function: dispenser-status.js
 * 
 * Recibe y actualiza el estado operativo instantáneo de los surtidores de combustibles.
 */

const { getStore } = require("@netlify/blobs");

global.latestDispenserStatusData = global.latestDispenserStatusData || null;

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

  // --- 1. AUTORIZACIÓN ---
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ ok: false, error: "Bearer token required in Authorization header." })
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
      body: JSON.stringify({ ok: false, error: "Invalid JSON format." })
    };
  }

  if (!payload.dispensers || !Array.isArray(payload.dispensers)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Campos obligatorios faltantes (dispensers array es requerido)." })
    };
  }

  // Validar estado de surtidores permitidos
  const allowedStatuses = ['available', 'calling', 'authorized', 'dispensing', 'fueling', 'completed', 'offline', 'error', 'locked', 'maintenance'];
  
  for (const disp of payload.dispensers) {
    if (!disp.dispenser_id || !disp.status) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: "Cada surtidor debe tener dispenser_id y status." })
      };
    }
    if (!allowedStatuses.includes(disp.status)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ ok: false, error: `Surtidor ${disp.dispenser_id} tiene un estado inválido: ${disp.status}` })
      };
    }
  }

  const received_at = new Date().toISOString();
  const dispenserStatusRecord = {
    device_id: payload.device_id || "CTRL-SURT-0001",
    site_id: payload.site_id || "rosario-01",
    timestamp: payload.timestamp || received_at,
    dispensers: payload.dispensers.map(d => {
      let resolvedProdId = d.product_id || 'GO2';
      if (resolvedProdId === 'GO3' || resolvedProdId === 'premium') {
        resolvedProdId = 'GP';
      } else if (resolvedProdId === 'nafta') {
        resolvedProdId = 'NS';
      } else if (resolvedProdId === 'gasoil') {
        resolvedProdId = 'GO2';
      }
      if (!d.product_id || d.product_id === 'GO2') {
        if (d.suction_tank_id === 'tank_01' || (d.product && d.product.toLowerCase().includes('premium'))) {
          resolvedProdId = 'GP';
        } else if (d.suction_tank_id === 'tank_03' || (d.product && d.product.toLowerCase().includes('super'))) {
          resolvedProdId = 'NS';
        }
      }
      return {
        dispenser_id: d.dispenser_id,
        hose_id: d.hose_id || d.nozzle || "M01",
        nozzle: Number(d.nozzle || d.hose_id || 1),
        product: d.product || (resolvedProdId === 'GP' ? 'Gasoil Grado 3' : resolvedProdId === 'NS' ? 'Nafta Súper' : 'Gasoil Grado 2'),
        product_id: resolvedProdId,
        suction_tank_id: d.suction_tank_id || undefined,
        status: d.status || "available",
        last_transaction_id: d.last_transaction_id || null,
        last_sale_liters: Number(d.last_sale_liters || d.lastSaleLiters || 0),
        last_sale_amount: Number(d.last_sale_amount || d.lastSaleAmount || 0),
        driver: d.driver || undefined,
        vehicle: d.vehicle || undefined,
        plate: d.plate || undefined,
        odometer: d.odometer || undefined,
        authorization_method: d.authorization_method || "RFID"
      };
    }),
    received_at,
    event_type: "dispenser_status"
  };

  console.log(`[C.E.S.T.I. SURTIDOR] Actualizado estado de surtidores para device: ${payload.device_id}`);

  // Auto-generate fuel transaction records from completed dispenser statuses
  const activeCompletedSales = dispenserStatusRecord.dispensers.filter(d => Number(d.last_sale_liters) > 0);
  
  if (activeCompletedSales.length > 0) {
    let transactionsList = [];
    let transactionsUpdated = false;

    // Load current transactions list
    try {
      const store = getStore({ name: "cesti-telemetry" });
      const storedList = await store.getJSON("latest-fuel-transactions");
      if (Array.isArray(storedList)) {
        transactionsList = storedList;
      }
    } catch (error) {
      console.warn("[C.E.S.T.I. BLOB] Failed loading transactions in dispenser flow.");
    }

    if (transactionsList.length === 0) {
      try {
        const kvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-fuel-transactions");
        if (kvRes.ok) {
          const storedList = await kvRes.json();
          if (Array.isArray(storedList)) {
            transactionsList = storedList;
          }
        }
      } catch (err) {
        console.warn("[C.E.S.T.I.] Failed loading transactions from KVDB in dispenser flow.");
      }
    }

    if (transactionsList.length === 0) {
      transactionsList = global.latestFuelTransactions || [];
    }

    // Process completed sales
    activeCompletedSales.forEach(d => {
      const txId = d.last_transaction_id || `TX-AUTO-${d.dispenser_id}-${Math.round(d.last_sale_liters * 100)}-${new Date(received_at).toISOString().split('T')[0]}`;
      
      const hasTx = transactionsList.some(tx => tx.transaction_id === txId);
      const hasDupe = transactionsList.some(tx => 
        tx.dispenser_id === d.dispenser_id && 
        Number(tx.liters) === Number(d.last_sale_liters) && 
        Math.abs(new Date(tx.timestamp_end || tx.received_at || received_at).getTime() - new Date(received_at).getTime()) < 120000
      );

      if (!hasTx && !hasDupe) {
        const lookupDriver = (driverVal) => {
          if (!driverVal) return { id: undefined, name: undefined };
          const val = String(driverVal).trim().toLowerCase();
          const driversDb = [
            { id: 'DRV-001', name: 'Martin Rodriguez' },
            { id: 'DRV-002', name: 'Federico Villagra' },
            { id: 'DRV-003', name: 'María Rodríguez' },
            { id: 'DRV-004', name: 'Juan Carlos Ortiz' },
            { id: 'DRV-005', name: 'Esteban Benítez' },
            { id: 'DRV-006', name: 'Patricia Gómez' },
            { id: 'DRV-007', name: 'Carlos Peralta' }
          ];
          const found = driversDb.find(drv => 
            drv.id.toLowerCase() === val || 
            drv.name.toLowerCase() === val ||
            drv.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === val.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          );
          if (found) return { id: found.id, name: found.name };
          return { id: "DRV-AUTO", name: driverVal };
        };

        const lookupVehicle = (vehicleVal) => {
          if (!vehicleVal) return { id: undefined, plate: undefined };
          const val = String(vehicleVal).trim().toLowerCase();
          const vehiclesDb = [
            { id: 'VEH-001', plate: 'AA-510-ZZ', model: 'Hilux', brand: 'Toyota' },
            { id: 'VEH-002', plate: 'AF-112-OP', model: 'Ranger', brand: 'Ford' },
            { id: 'VEH-003', plate: 'AA-450-XX', model: 'R450 Heavy', brand: 'Scania' },
            { id: 'VEH-004', plate: 'AE-321-LL', model: 'Constellation', brand: 'Volkswagen' },
            { id: 'VEH-005', plate: 'AG-987-YY', model: 'Daily', brand: 'Iveco' },
            { id: 'VEH-006', plate: 'AD-456-WW', model: 'F-100', brand: 'Ford' },
            { id: 'VEH-007', plate: 'AB-123-CD', model: 'Sprinter', brand: 'Mercedes-Benz' }
          ];
          const found = vehiclesDb.find(v => 
            v.id.toLowerCase() === val || 
            v.plate.toLowerCase().replace(/[^a-z0-9]/g, '') === val.replace(/[^a-z0-9]/g, '')
          );
          if (found) return { id: found.id, plate: found.plate };
          return { id: "VEH-AUTO", plate: vehicleVal };
        };

        const resolvedDrv = lookupDriver(d.driver);
        const resolvedVeh = lookupVehicle(d.vehicle || d.plate);

        const autoTx = {
          transaction_id: txId,
          device_id: dispenserStatusRecord.device_id,
          site_id: dispenserStatusRecord.site_id,
          timestamp_start: new Date(new Date(received_at).getTime() - 3 * 60000).toISOString(),
          timestamp_end: received_at,
          dispenser_id: d.dispenser_id,
          hose_id: d.hose_id,
          nozzle: d.nozzle,
          product: d.product,
          product_id: d.product_id,
          liters: d.last_sale_liters,
          amount: d.last_sale_amount || (d.last_sale_liters * 1200),
          price_per_liter: d.last_sale_amount ? Number((d.last_sale_amount / d.last_sale_liters).toFixed(2)) : 1200,
          driver_id: resolvedDrv.id,
          driver_name: resolvedDrv.name || d.driver || "C.E.S.T.I. Chofer",
          vehicle_id: resolvedVeh.id,
          vehicle_plate: resolvedVeh.plate || d.plate || "SIN-PAT",
          odometer: d.odometer || 0,
          authorization_method: d.authorization_method || "RFID",
          status: "completed",
          received_at,
          event_type: "fuel_transaction"
        };
        transactionsList.unshift(autoTx);
        transactionsUpdated = true;
      }
    });

    if (transactionsUpdated) {
      transactionsList = transactionsList.slice(0, 50);
      global.latestFuelTransactions = transactionsList;

      // Persist transactions to KVDB.io
      try {
        await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-fuel-transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transactionsList)
        });
        console.log("[C.E.S.T.I. KVDB] Auto-generated transactions from dispenser status saved to KVDB.io");
      } catch (err) {
        console.warn("[C.E.S.T.I. KVDB] Failed saving auto-generated transactions:", err.message);
      }

      // Persist transactions to Blobs
      try {
        const store = getStore({ name: "cesti-telemetry" });
        await store.setJSON("latest-fuel-transactions", transactionsList);
        console.log("[C.E.S.T.I. BLOBS] Auto-generated transactions from dispenser status saved to Blobs");
      } catch (err) {
        console.warn("[C.E.S.T.I. BLOBS] Failed saving auto-generated transactions:", err.message);
      }
    }
  }

  // Guardar en RAM local
  global.latestDispenserStatusData = dispenserStatusRecord;

  // Guardar en KVDB.io
  try {
    await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-dispenser-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dispenserStatusRecord)
    });
    console.log("[C.E.S.T.I. KVDB] Guardado exitoso de surtidores en KVDB.io");
  } catch (err) {
    console.warn("[C.E.S.T.I. KVDB WARN] Falló guardado de surtidores en KVDB.io:", err.message);
  }

  // Guardar en Blobs
  try {
    const store = getStore({ name: "cesti-telemetry" });
    await store.setJSON("latest-dispenser-status", dispenserStatusRecord);
  } catch (err) {
    console.warn("[C.E.S.T.I. BLOB WARN] Falló guardado final de surtidores:", err.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      message: "Dispenser status received successfully",
      data: dispenserStatusRecord
    })
  };
};
