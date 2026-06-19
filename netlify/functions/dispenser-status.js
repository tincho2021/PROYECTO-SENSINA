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

  let previousDispData = global.latestDispenserStatusData;
  if (!previousDispData) {
    try {
      const pRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/latest-dispenser-status");
      if (pRes.ok) {
        previousDispData = await pRes.json();
      }
    } catch (e) {
      console.warn("[C.E.S.T.I.] Failed to fetch previous dispenser status in Netlify function:", e.message);
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
      } else if (resolvedProdId === 'nafta' || resolvedProdId === 'NF' || resolvedProdId === 'NS') {
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

      const nozzleNum = Number(d.nozzle || d.hose_id || 1);
      const prevDisp = previousDispData && Array.isArray(previousDispData.dispensers)
        ? previousDispData.dispensers.find(p => p.dispenser_id === d.dispenser_id && (p.nozzle === nozzleNum || p.hose_id === d.hose_id))
        : null;

      const isCurrentlyDispensing = d.status === 'dispensing' || d.status === 'fueling';
      
      // Manage driver fallback to avoid loosing card credentials on completion
      let rawDriver = d.driver;
      if (d.driver === "Sin asignar") {
        if (isCurrentlyDispensing || Number(d.last_sale_liters || 0) > 0) {
          rawDriver = prevDisp ? prevDisp.driver : d.driver;
        }
      }

      let rawVehicle = d.vehicle;
      if (d.vehicle === "Sin asignar" && (isCurrentlyDispensing || Number(d.last_sale_liters || 0) > 0)) {
        rawVehicle = prevDisp ? prevDisp.vehicle : d.vehicle;
      }

      let rawPlate = d.plate;
      if ((d.plate === "SIN-PAT" || d.plate === "Sin asignar") && (isCurrentlyDispensing || Number(d.last_sale_liters || 0) > 0)) {
        rawPlate = prevDisp ? prevDisp.plate : d.plate;
      }

      return {
        dispenser_id: d.dispenser_id,
        hose_id: d.hose_id || d.nozzle || "M01",
        nozzle: nozzleNum,
        product: d.product || (resolvedProdId === 'GP' ? 'Gasoil Grado 3' : resolvedProdId === 'NS' ? 'Nafta Súper' : 'Gasoil Grado 2'),
        product_id: resolvedProdId,
        suction_tank_id: d.suction_tank_id || undefined,
        status: d.status || "available",
        last_transaction_id: d.last_transaction_id || null,
        last_sale_liters: Number(d.last_sale_liters || d.lastSaleLiters || 0),
        last_sale_amount: Number(d.last_sale_amount || d.lastSaleAmount || 0),
        driver: rawDriver || undefined,
        vehicle: rawVehicle || undefined,
        plate: rawPlate || undefined,
        odometer: d.odometer || (prevDisp ? prevDisp.odometer : undefined),
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

    // Load dynamic drivers and vehicles from KVDB in the background before processing
    let dynamicDrivers = [];
    let dynamicVehicles = [];
    try {
      const drvRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-drivers");
      if (drvRes.ok) {
        const drvData = await drvRes.json();
        if (Array.isArray(drvData)) dynamicDrivers = drvData;
      }
    } catch (e) {
      console.warn("[C.E.S.T.I.] Failed to load dynamic drivers in Netlify function:", e);
    }

    try {
      const vehRes = await fetch("https://kvdb.io/7b3mwrCjYKfthbbugjqh4k/registered-vehicles");
      if (vehRes.ok) {
        const vehData = await vehRes.json();
        if (Array.isArray(vehData)) dynamicVehicles = vehData;
      }
    } catch (e) {
      console.warn("[C.E.S.T.I.] Failed to load dynamic vehicles in Netlify function:", e);
    }

    // Process completed sales
    activeCompletedSales.forEach(d => {
      const txId = d.last_transaction_id || `TX-AUTO-${d.dispenser_id}-${Math.round(d.last_sale_liters * 100)}-${new Date(received_at).toISOString().split('T')[0]}`;
      
      const hasTx = transactionsList.some(tx => tx.transaction_id === txId || tx.id === txId);
      const hasDupe = transactionsList.some(tx => {
        const txDispId = tx.dispenserId || tx.dispenser_id;
        const txLiters = tx.liters;
        const txTimeStr = tx.timestampEnd || tx.timestampStart || tx.createdAt || tx.timestamp_end || tx.received_at || received_at;
        const txTime = new Date(txTimeStr).getTime();
        
        return txDispId === d.dispenser_id && 
               Math.abs(Number(txLiters) - Number(d.last_sale_liters)) < 0.04 && 
               Math.abs(txTime - new Date(received_at).getTime()) < 120000;
      });

      if (!hasTx && !hasDupe) {
        const lookupDriver = (driverVal) => {
          if (!driverVal) return { id: undefined, name: undefined };
          let rawVal = String(driverVal).trim();
          let val = rawVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          // Ignore standard empty / empty-equivalent names
          if (!val || val === "sin asignar" || val === "sin_asignar" || val === "desconocido" || val === "unknown" || val === "sin asociar" || val === "sin_asociar") {
            return { id: "DRV-AUTO", name: "Sin asignar" };
          }
          
          let driversDb = [
            { id: 'DRV-001', name: 'Juan Pérez', rfid_card: 'RFID-9843-01' },
            { id: 'DRV-002', name: 'Carlos Gómez', rfid_card: 'RFID-1243-02' },
            { id: 'DRV-003', name: 'María Rodríguez', rfid_card: 'RFID-4512-03' },
            { id: 'DRV-004', name: 'Federico Villagra', rfid_card: 'RFID-1100-04' },
            { id: 'DRV-005', name: 'Leandro Mercado', rfid_card: 'RFID-7711-05' },
            { id: 'DRV-006', name: 'Mariano Altuna', rfid_card: 'RFID-5522-06' },
            { id: 'DRV-007', name: 'Guillermo Ortelli', rfid_card: 'RFID-8833-07' },
            { id: 'DRV-008', name: 'Christian Ledesma', rfid_card: 'RFID-9944-08' }
          ];

          // Prepend dynamic drivers fetched from KVDB
          if (Array.isArray(dynamicDrivers) && dynamicDrivers.length > 0) {
            const dynamicIds = new Set(dynamicDrivers.map(drv => drv.id));
            driversDb = [
              ...dynamicDrivers.map(drv => ({
                id: drv.id,
                name: drv.name,
                rfid_card: drv.rfidCard || drv.rfid_card || "",
                document: drv.document || ""
              })),
              ...driversDb.filter(drv => !dynamicIds.has(drv.id))
            ];
          }

          // 1. First attempt: exact match of ID, Name, Card, Document (case-insensitive and normalized)
          const exactMatch = driversDb.find(drv => {
            const dId = drv.id.toLowerCase();
            const dName = drv.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const dRfid = drv.rfid_card ? drv.rfid_card.toLowerCase().replace(/[^a-z0-9]/g, '') : "";
            const dDoc = drv.document ? String(drv.document).toLowerCase().replace(/[^a-z0-9]/g, '') : "";
            const cleanVal = val.replace(/[^a-z0-9]/g, '');

            return dId === val || 
                   dName === val || 
                   (dRfid && dRfid === cleanVal) || 
                   (dDoc && dDoc === cleanVal) ||
                   (drv.rfid_card && drv.rfid_card.toLowerCase() === val) ||
                   (drv.document && String(drv.document).toLowerCase() === val);
          });
          if (exactMatch) return { id: exactMatch.id, name: exactMatch.name };

          // 2. Second attempt: partial fuzzy match on components of the full name
          const partialNameMatch = driversDb.find(drv => {
            const dName = drv.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return dName.includes(val) || val.includes(dName);
          });
          if (partialNameMatch) return { id: partialNameMatch.id, name: partialNameMatch.name };

          // 3. Static helper rules (guarded to avoid false positives)
          if (val.includes("villagra") || val.includes("federico")) {
            const found = driversDb.find(drv => drv.id === 'DRV-004');
            if (found) return { id: found.id, name: found.name };
          }
          if (val.includes("perez") || (val.includes("juan") && !val.includes("gomez"))) {
            const found = driversDb.find(drv => drv.id === 'DRV-001');
            if (found) return { id: found.id, name: found.name };
          }
          if (val.includes("gomez") || val.includes("carlos")) {
            const found = driversDb.find(drv => drv.id === 'DRV-002');
            if (found) return { id: found.id, name: found.name };
          }
          if (val.includes("rodriguez") || val.includes("maria")) {
            if (!val.includes("martin") && !val.includes("melgarejo")) {
              const found = driversDb.find(drv => drv.id === 'DRV-003');
              if (found) return { id: found.id, name: found.name };
            }
          }
          if (val.includes("mercado") || val.includes("leandro")) {
            const found = driversDb.find(drv => drv.id === 'DRV-005');
            if (found) return { id: found.id, name: found.name };
          }
          if (val.includes("altuna") || val.includes("mariano")) {
            const found = driversDb.find(drv => drv.id === 'DRV-006');
            if (found) return { id: found.id, name: found.name };
          }
          if (val.includes("ortelli") || val.includes("guillermo")) {
            const found = driversDb.find(drv => drv.id === 'DRV-007');
            if (found) return { id: found.id, name: found.name };
          }
          if (val.includes("ledesma") || val.includes("christian")) {
            const found = driversDb.find(drv => drv.id === 'DRV-008');
            if (found) return { id: found.id, name: found.name };
          }

          // 4. Ultimate dynamic check of all properties containing of each other
          const anyMatch = driversDb.find(drv => {
            const mName = drv.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const mId = drv.id.toLowerCase();
            return mId === val || mName === val || mName.includes(val) || val.includes(mName);
          });
          if (anyMatch) return { id: anyMatch.id, name: anyMatch.name };

          return { id: "DRV-AUTO", name: driverVal };
        };

        const lookupVehicle = (vehicleVal) => {
          if (!vehicleVal) return { id: undefined, plate: undefined };
          let rawVal = String(vehicleVal).trim();
          let val = rawVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          // Ignore standard empty / empty-equivalent plate values
          if (!val || val === "sin-pat" || val === "sin patente" || val === "sin_patente" || val === "unknown" || val === "sin patente o asociar") {
            return { id: "VEH-AUTO", plate: "SIN-PAT" };
          }

          // Normalize commonly misspelled terms
          val = val.replace('mercedez', 'mercedes').replace('mercede', 'mercedes');

          let vehiclesDb = [
            { id: 'VEH-001', plate: 'AB-123-CD', brand: 'Toyota', model: 'Hilux 4x4' },
            { id: 'VEH-002', plate: 'AD-892-JJ', brand: 'Ford', model: 'Ranger Raptor' },
            { id: 'VEH-003', plate: 'GEN-01-IND', brand: 'Caterpillar', model: 'CAT-3512' },
            { id: 'VEH-004', plate: 'AA-450-XX', brand: 'Scania', model: 'R450 Heavy' },
            { id: 'VEH-005', plate: 'AA-510-ZZ', brand: 'Mercedes-Benz', model: 'Actros 2651' },
            { id: 'VEH-006', plate: 'AE-320-MM', brand: 'John Deere', model: '8345R' },
            { id: 'VEH-007', plate: 'AF-710-DD', brand: 'Iveco', model: 'Stralis 600' },
            { id: 'VEH-008', plate: 'AG-912-BB', brand: 'Chevrolet', model: 'S10 CD' }
          ];

          // Prepend dynamic vehicles from KVDB
          if (Array.isArray(dynamicVehicles) && dynamicVehicles.length > 0) {
            const dynamicIds = new Set(dynamicVehicles.map(veh => veh.id));
            vehiclesDb = [
              ...dynamicVehicles,
              ...vehiclesDb.filter(veh => !dynamicIds.has(veh.id))
            ];
          }

          // 1. Try to extract a plate pattern using regex (e.g. AA 123 CD, AA-123-CD, AAA 123, AAA-123)
          const plateRegex = /[a-z]{2,3}[-\s]?\d{3}[-\s]?[a-z]{0,3}/i;
          const plateMatchResult = rawVal.match(plateRegex);
          if (plateMatchResult) {
            const extractedPlate = plateMatchResult[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
            const exactPlateMatch = vehiclesDb.find(v => v.plate.toUpperCase().replace(/[^A-Z0-9]/g, '') === extractedPlate);
            if (exactPlateMatch) {
              return { id: exactPlateMatch.id, plate: exactPlateMatch.plate };
            }
          }

          // 2. Direct mapping bypass for known vehicle models/brands or plates
          if (val.includes("mercedes") || val.includes("actros") || val.includes("510") || val.includes("zz") || val.includes("aa-510-zz") || val.includes("aa510zz")) {
            const found = vehiclesDb.find(v => v.id === 'VEH-005');
            if (found) return { id: found.id, plate: found.plate };
          }
          if (val.includes("scania") || val.includes("r450") || val.includes("450") || val.includes("xx") || val.includes("aa-440-xx") || val.includes("aa-450-xx") || val.includes("aa450xx")) {
            const found = vehiclesDb.find(v => v.id === 'VEH-004');
            if (found) return { id: found.id, plate: found.plate };
          }
          if (val.includes("toyota") || val.includes("hilux") || val.includes("123") || val.includes("cd") || val.includes("ab-123-cd") || val.includes("ab123cd")) {
            const found = vehiclesDb.find(v => v.id === 'VEH-001');
            if (found) return { id: found.id, plate: found.plate };
          }
          if (val.includes("ford") || val.includes("ranger") || val.includes("raptor") || val.includes("892") || val.includes("jj") || val.includes("ad-892-jj") || val.includes("ad892jj")) {
            const found = vehiclesDb.find(v => v.id === 'VEH-002');
            if (found) return { id: found.id, plate: found.plate };
          }
          if (val.includes("caterpillar") || val.includes("cat") || val.includes("3512") || val.includes("gen-01-ind")) {
            const found = vehiclesDb.find(v => v.id === 'VEH-003');
            if (found) return { id: found.id, plate: found.plate };
          }
          if (val.includes("deere") || val.includes("john") || val.includes("8345") || val.includes("ae-320-mm") || val.includes("ae320mm")) {
            const found = vehiclesDb.find(v => v.id === 'VEH-006');
            if (found) return { id: found.id, plate: found.plate };
          }
          if (val.includes("iveco") || val.includes("stralis") || val.includes("710") || val.includes("dd") || val.includes("af-710-dd") || val.includes("af710dd")) {
            const found = vehiclesDb.find(v => v.id === 'VEH-007');
            if (found) return { id: found.id, plate: found.plate };
          }
          if (val.includes("chevrolet") || val.includes("s10") || val.includes("912") || val.includes("bb") || val.includes("ag-912-bb") || val.includes("ag912bb")) {
            const found = vehiclesDb.find(v => v.id === 'VEH-008');
            if (found) return { id: found.id, plate: found.plate };
          }

          // 3. Match by ID or exact Plate
          const foundVeh = vehiclesDb.find(v => {
            const vId = v.id.toLowerCase();
            const vPlateNoDashes = v.plate.toLowerCase().replace(/[^a-z0-9]/g, '');
            const vBrandModel = (v.brand + " " + v.model).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cleanVal = val.replace(/[^a-z0-9]/g, '');
            return vId === val || vPlateNoDashes === cleanVal || vBrandModel === val;
          });
          if (foundVeh) return { id: foundVeh.id, plate: foundVeh.plate };

          // 4. Fuzzy match brand or model contains
          const fuzzyVeh = vehiclesDb.find(v => {
            const vBrandModel = (v.brand + " " + v.model).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return vBrandModel.includes(val) || val.includes(vBrandModel);
          });
          if (fuzzyVeh) return { id: fuzzyVeh.id, plate: fuzzyVeh.plate };

          return { id: "VEH-AUTO", plate: vehicleVal };
        };

        const prevDisp = previousDispData && Array.isArray(previousDispData.dispensers)
          ? previousDispData.dispensers.find(p => p.dispenser_id === d.dispenser_id && p.nozzle === d.nozzle)
          : null;

        const dDriver = (d.driver && d.driver !== "Sin asignar") ? d.driver : (prevDisp ? prevDisp.driver : d.driver) || "";
        const dVehicle = (d.vehicle && d.vehicle !== "Sin asignar") ? d.vehicle : (prevDisp ? prevDisp.vehicle : d.vehicle) || "";
        const dPlate = (d.plate && d.plate !== "SIN-PAT" && d.plate !== "Sin asignar") ? d.plate : (prevDisp ? prevDisp.plate : d.plate) || "";
        const dOdometer = d.odometer || (prevDisp ? prevDisp.odometer : 0) || 0;

        const resolvedDrv = lookupDriver(dDriver);
        const resolvedVeh = lookupVehicle(dPlate || dVehicle);

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
          driver_name: resolvedDrv.name || dDriver || "C.E.S.T.I. Chofer",
          vehicle_id: resolvedVeh.id,
          vehicle_plate: resolvedVeh.plate || dPlate || "SIN-PAT",
          odometer: dOdometer,
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
