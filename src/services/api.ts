/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Site,
  Product,
  Tank,
  Dispenser,
  FuelTransaction,
  Driver,
  Vehicle,
  Delivery,
  InventoryReconciliation,
  Alert,
  DeviceRegistry,
  AuditLog,
  User
} from '../types';

import {
  mockSites,
  mockProducts,
  mockTanks,
  mockDispensers,
  mockDrivers,
  mockVehicles,
  mockTransactions,
  mockDeliveries,
  mockReconciliations,
  mockAlerts,
  mockDevices,
  mockUsers,
  mockAuditLogs
} from '../data/mockData';

// Local pure client-side fallback state
let clientDb = {
  sites: [...mockSites],
  products: [...mockProducts],
  tanks: [] as Tank[],
  dispensers: [] as Dispenser[],
  drivers: [...mockDrivers],
  vehicles: [...mockVehicles],
  transactions: [] as FuelTransaction[],
  deliveries: [] as Delivery[],
  reconciliations: [] as InventoryReconciliation[],
  alerts: [] as Alert[],
  devices: [...mockDevices],
  users: [...mockUsers],
  auditLogs: [] as AuditLog[]
};

// Check if we are running in browser context
const isServerAvailable = true;

/**
 * Fetch all available state from full-stack backend, with local client fallback
 */
export async function fetchAllData() {
  try {
    const res = await fetch('/api/all-data');
    if (!res.ok) throw new Error('Failed to fetch from live backend server');
    const data = await res.json();
    
    // Merge latest-fuel-transactions to make sure live dispatches are kept
    try {
      const txRes = await fetch('/api/latest-fuel-transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData && txData.ok && Array.isArray(txData.data)) {
          const freshTx = txData.data.map((newTx: any) => ({
            id: newTx.transaction_id,
            siteId: newTx.site_id || "rosario-01",
            dispenserId: newTx.dispenser_id,
            hose: newTx.nozzle || 1,
            productId: newTx.product_id,
            liters: Number(newTx.liters),
            amount: Number(newTx.amount),
            pricePerLiter: Number(newTx.price_per_liter || 1200),
            driverId: newTx.driver_id,
            vehicleId: newTx.vehicle_id,
            vehiclePlate: newTx.vehicle_plate,
            odometer: newTx.odometer,
            timestampStart: newTx.timestamp_start,
            timestampEnd: newTx.timestamp_end,
            authorizationMethod: newTx.authorization_method || "RFID",
            status: newTx.status || "completed",
            createdAt: newTx.received_at || new Date().toISOString(),
            isLiveIot: true
          }));
          
          const mergedTx = [...freshTx];
          (data.transactions || []).forEach((tx: any) => {
            if (!mergedTx.some((mTx: any) => mTx.id === tx.id)) {
              mergedTx.push(tx);
            }
          });
          data.transactions = mergedTx;
        }
      }
    } catch (e) {
      console.warn("Failed to merge latest fuel transactions during fetchAllData", e);
    }

    // Merge latest-deliveries to make sure live automatic/manual deliveries are kept
    try {
      const delRes = await fetch('/api/latest-deliveries');
      if (delRes.ok) {
        const delData = await delRes.json();
        if (delData && delData.ok && Array.isArray(delData.data)) {
          const mergedDel = [...delData.data];
          (data.deliveries || []).forEach((dl: any) => {
            if (!mergedDel.some((mDel: any) => mDel.id === dl.id)) {
              mergedDel.push(dl);
            }
          });
          data.deliveries = mergedDel;
        }
      }
    } catch (e) {
      console.warn("Failed to merge latest deliveries during fetchAllData", e);
    }

    clientDb = data;
    return clientDb;
  } catch (error) {
    console.warn('[SENSINA API] Backend server offline or starting up, using local state.', error);
    
    // In Netlify or offline, retrieve latest transactions, tank statuses, and dispenser statuses
    try {
      const txRes = await fetch('https://velvety-vacherin-c43b91.netlify.app/api/latest-fuel-transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData && txData.ok && Array.isArray(txData.data)) {
          const freshTx = txData.data.map((newTx: any) => ({
            id: newTx.transaction_id,
            siteId: newTx.site_id || "rosario-01",
            dispenserId: newTx.dispenser_id,
            hose: newTx.nozzle || 1,
            productId: newTx.product_id,
            liters: Number(newTx.liters),
            amount: Number(newTx.amount),
            pricePerLiter: Number(newTx.price_per_liter || 1200),
            driverId: newTx.driver_id,
            vehicleId: newTx.vehicle_id,
            vehiclePlate: newTx.vehicle_plate,
            odometer: newTx.odometer,
            timestampStart: newTx.timestamp_start,
            timestampEnd: newTx.timestamp_end,
            authorizationMethod: newTx.authorization_method || "RFID",
            status: newTx.status || "completed",
            createdAt: newTx.received_at || new Date().toISOString(),
            isLiveIot: true
          }));
          clientDb.transactions = freshTx;
        }
      }
    } catch (e) {
      console.warn("Failed fallback fetch of latest fuel transactions", e);
    }

    // Fallback deliveries fetch to populate deliveries instantly
    try {
      const delRes = await fetch('https://velvety-vacherin-c43b91.netlify.app/api/latest-deliveries');
      if (delRes.ok) {
        const delData = await delRes.json();
        if (delData && delData.ok && Array.isArray(delData.data)) {
          clientDb.deliveries = delData.data;
        }
      }
    } catch (e) {
      console.warn("Failed fallback fetch of latest deliveries", e);
    }

    // Fallback telemetry fetch to populate tanks instantly
    try {
      const telRes = await fetch('https://velvety-vacherin-c43b91.netlify.app/api/latest-telemetry');
      if (telRes.ok) {
        const telData = await telRes.json();
        if (telData && telData.ok) {
          const telemetries = telData.tanks && Array.isArray(telData.tanks)
            ? telData.tanks
            : telData.data
              ? [telData.data]
              : [];
          
          clientDb.tanks = [];
          telemetries.forEach((tel: any) => {
            if (tel && tel.tank_id) {
              const aliases: Record<string, string> = {
                'tank_01': 'TQ-02', 'tank_1': 'TQ-02', 'TQ-02': 'tank_01',
                'tank_02': 'TQ-01', 'tank_2': 'TQ-01', 'TQ-01': 'tank_02',
                'tank_03': 'TQ-03', 'tank_3': 'TQ-03', 'TQ-03': 'tank_03'
              };
              const mappedAlias = aliases[tel.tank_id];
              const tankIndex = clientDb.tanks.findIndex((t: any) => t.id === tel.tank_id || (mappedAlias && t.id === mappedAlias));

              let pId = tel.product_id;
              if (!pId || pId === "GO2") {
                if (tel.tank_id === 'tank_01' || tel.tank_name?.toLowerCase().includes('premium') || tel.product_name?.toLowerCase().includes('premium') || tel.product_name?.toLowerCase().includes('grado 3')) {
                  pId = "GP";
                } else if (tel.tank_id === 'tank_03' || tel.tank_name?.toLowerCase().includes('super') || tel.product_name?.toLowerCase().includes('super')) {
                  pId = "NS";
                } else {
                  pId = "GO2";
                }
              } else if (pId === "GO3" || pId === "premium") {
                pId = "GP";
              } else if (pId === "nafta") {
                pId = "NS";
              } else if (pId === "gasoil") {
                pId = "GO2";
              }

              const targetId = tankIndex > -1 ? clientDb.tanks[tankIndex].id : tel.tank_id;
              const tankObj = {
                id: targetId,
                siteId: tel.site_id || "rosario-01",
                productId: pId,
                name: tel.tank_name || `Cisterna Sonda ${tel.tank_id}`,
                capacityLiters: tel.capacity_liters || 20000,
                heightMm: tel.height_mm ? Math.max(tel.height_mm, 2000) : 2000,
                currentHeightMm: tel.height_mm,
                currentVolumeLiters: tel.volume_liters,
                temperatureC: tel.temperature_c ?? 15,
                waterMm: tel.water_mm ?? 0,
                batteryV: tel.battery_v ?? 3.6,
                batteryPercent: tel.battery_percent ?? 100,
                signalRssi: tel.signal_rssi ?? -60,
                sensorStatus: tel.sensor_status || "normal",
                sensorType: "magnetostrictive" as "hydrostatic" | "magnetostrictive" | "ultrasonic" | "manual",
                lastUpdated: tel.received_at || new Date().toISOString(),
                createdAt: tel.received_at || new Date().toISOString()
              };

              if (tankIndex > -1) {
                clientDb.tanks[tankIndex] = { ...clientDb.tanks[tankIndex], ...tankObj };
              } else {
                clientDb.tanks.push(tankObj);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn("Failed fallback fetch of latest telemetry inside fetchAllData", e);
    }

    // Fallback dispenser fetch to populate dispensers instantly
    try {
      const dispRes = await fetch('https://velvety-vacherin-c43b91.netlify.app/api/latest-dispenser-status');
      if (dispRes.ok) {
        const dispData = await dispRes.json();
        if (dispData && dispData.ok && dispData.data) {
          const dispPayload = dispData.data;
          if (Array.isArray(dispPayload.dispensers)) {
            clientDb.dispensers = [];
            dispPayload.dispensers.forEach((updatedDisp: any) => {
              const dispObj = {
                id: updatedDisp.dispenser_id,
                siteId: dispPayload.site_id || "rosario-01",
                name: `Surtidor ${updatedDisp.dispenser_id.replace(/[_-]/g, ' ')}`,
                hose: updatedDisp.nozzle || 1,
                productId: updatedDisp.product_id || "GO2",
                suctionTankId: updatedDisp.suction_tank_id || undefined,
                status: updatedDisp.status === 'fueling' ? 'dispensing' : (updatedDisp.status || "available"),
                lastSaleLiters: updatedDisp.last_sale_liters || 0,
                lastSaleAmount: updatedDisp.last_sale_amount || 0,
                activeDriver: updatedDisp.driver || undefined,
                activeVehicle: updatedDisp.vehicle || undefined,
                activePlate: updatedDisp.plate || undefined,
                odometerReading: updatedDisp.odometer || undefined,
                authorizationMethod: updatedDisp.authorization_method || "RFID",
                lastUpdated: dispPayload.received_at || new Date().toISOString(),
                createdAt: dispPayload.received_at || new Date().toISOString()
              };
              clientDb.dispensers.push(dispObj);
            });
          }
        }
      }
    } catch (e) {
      console.warn("Failed fallback fetch of latest dispenser status inside fetchAllData", e);
    }
    
    return clientDb;
  }
}

/**
 * Manual intake/delivery registration (increasing tank stocks)
 */
export async function registerDelivery(deliveryData: {
  supplier: string;
  invoiceNumber: string;
  productId: string;
  tankId: string;
  litersDeclared: number;
  operator: string;
  notes: string;
  density: number;
  temperature: number;
}) {
  try {
    const res = await fetch('/api/add-delivery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryData)
    });
    if (!res.ok) throw new Error('Error registering load on backend');
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[SENSINA API] Post failed, performing client-side simulation.', err);
    
    // Simulate locally
    const tank = clientDb.tanks.find(t => t.id === deliveryData.tankId);
    if (tank) {
      const added = Number(deliveryData.litersDeclared);
      const beforeLit = tank.currentVolumeLiters;
      tank.currentVolumeLiters = Math.min(tank.capacityLiters, tank.currentVolumeLiters + added);
      tank.currentHeightMm = Math.round((tank.currentVolumeLiters / tank.capacityLiters) * tank.heightMm);
      tank.lastUpdated = new Date().toISOString();

      const newDel: Delivery = {
        id: `DL-LOCAL-${Date.now()}`,
        timestamp: new Date().toISOString(),
        supplier: deliveryData.supplier,
        invoiceNumber: deliveryData.invoiceNumber,
        productId: deliveryData.productId,
        tankId: deliveryData.tankId,
        litersDeclared: added,
        litersMeasuredBefore: beforeLit,
        litersMeasuredAfter: tank.currentVolumeLiters,
        differenceLiters: tank.currentVolumeLiters - (beforeLit + added),
        temperatureC: Number(deliveryData.temperature),
        density: Number(deliveryData.density),
        operator: deliveryData.operator,
        notes: deliveryData.notes
      };

      clientDb.deliveries.unshift(newDel);

      clientDb.auditLogs.unshift({
        id: `AUD-LOCAL-${Date.now()}`,
        userId: 'client-user',
        username: 'admin',
        action: 'Descarga Realizada (Offline)',
        details: `Cargados ${added} L de combustible en ${tank.name}.`,
        timestamp: new Date().toISOString()
      });
    }
    return { success: true, message: 'Registrado localmente (Offline fallback)' };
  }
}

/**
 * Register a new vehicle to fleet
 */
export async function registerVehicle(vehicleData: any) {
  try {
    const res = await fetch('/api/add-vehicle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData)
    });
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch (err) {
    const newVeh: Vehicle = {
      id: `VEH-LOCAL-${Date.now()}`,
      plate: vehicleData.plate,
      brand: vehicleData.brand,
      model: vehicleData.model,
      type: vehicleData.type || 'Pick-up',
      costCenter: vehicleData.costCenter || 'Mantenimiento',
      tankCapacityLiters: Number(vehicleData.tankCapacityLiters || 80),
      expectedKmL: Number(vehicleData.expectedKmL || 10),
      lastOdometer: Number(vehicleData.lastOdometer || 0),
      active: true,
      createdAt: new Date().toISOString()
    };
    clientDb.vehicles.push(newVeh);
    return { success: true, vehicle: newVeh };
  }
}

/**
 * Register a new driver to fleet
 */
export async function registerDriver(driverData: any) {
  try {
    const res = await fetch('/api/add-driver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverData)
    });
    if (!res.ok) throw new Error('Error');
    return await res.json();
  } catch (err) {
    const newDrv: Driver = {
      id: `DRV-LOCAL-${Date.now()}`,
      name: driverData.name,
      document: driverData.document || '',
      rfidCard: driverData.rfidCard,
      dailyLimitLiters: Number(driverData.dailyLimitLiters || 200),
      monthlyLimitLiters: Number(driverData.monthlyLimitLiters || 3000),
      active: true,
      costCenter: driverData.costCenter || 'Logística',
      createdAt: new Date().toISOString()
    };
    clientDb.drivers.push(newDrv);
    return { success: true, driver: newDrv };
  }
}

/**
 * Acknowledge or resolve alerts
 */
export async function acknowledgeAlert(alertId: string, comments: string, username: string) {
  try {
    const res = await fetch('/api/acknowledge-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, comments, resolvedBy: username })
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (err) {
    const alert = clientDb.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.resolvedBy = username;
      alert.comments = comments;
    }
    return { success: true, alert };
  }
}

export async function resolveAlert(alertId: string, comments: string, username: string) {
  try {
    const res = await fetch('/api/resolve-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, comments, resolvedBy: username })
    });
    if (!res.ok) throw new Error();
    return await res.json();
  } catch (err) {
    const alert = clientDb.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedBy = username;
      alert.comments = comments;
    }
    return { success: true, alert };
  }
}

/**
 * Trigger ESP32 simulator payload locally or server-side (POST /api/telemetry)
 */
export async function simulateTelemetryPost(payload: {
  tank_id: string;
  volume_liters: number;
  height_mm: number;
  temperature_c: number;
  water_mm: number;
  signal_rssi: number;
  battery_percent: number;
  sensor_status: 'normal' | 'low_stock' | 'critical_low' | 'high_level' | 'no_comm' | 'leak_suspect';
}, apiKey: string) {
  try {
    const res = await fetch('/api/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    // Local simulation
    const tank = clientDb.tanks.find(t => t.id === payload.tank_id);
    if (tank) {
      tank.currentVolumeLiters = payload.volume_liters;
      tank.currentHeightMm = payload.height_mm;
      tank.temperatureC = payload.temperature_c;
      tank.waterMm = payload.water_mm;
      tank.signalRssi = payload.signal_rssi;
      tank.batteryPercent = payload.battery_percent;
      tank.sensorStatus = payload.sensor_status;
      tank.lastUpdated = new Date().toISOString();
      
      // Auto-warning
      if (tank.currentVolumeLiters <= tank.capacityLiters * 0.15) {
        tank.sensorStatus = 'critical_low';
      } else if (tank.currentVolumeLiters <= tank.capacityLiters * 0.25) {
        tank.sensorStatus = 'low_stock';
      } else {
        tank.sensorStatus = 'normal';
      }
    }
    return { success: true, message: 'Simulated telemetry stored on client context (Offline)' };
  }
}

/**
 * Trigger ESP32 Surtidores Status Simulator
 */
export async function simulateDispenserPost(dispenser_id: string, status: any, driver: string, vehicle: string, plate: string, liters: number, amount: number, apiKey: string) {
  const payload = {
    dispensers: [
      {
        dispenser_id,
        status,
        driver,
        vehicle,
        plate,
        last_sale_liters: liters,
        last_sale_amount: amount,
        odometer: 140000,
        authorization_method: 'RFID'
      }
    ]
  };

  try {
    const res = await fetch('/api/dispenser-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    const disp = clientDb.dispensers.find(d => d.id === dispenser_id);
    if (disp) {
      disp.status = status;
      disp.activeDriver = driver || undefined;
      disp.activeVehicle = vehicle || undefined;
      disp.activePlate = plate || undefined;
      disp.lastSaleLiters = liters || disp.lastSaleLiters;
      disp.lastSaleAmount = amount || disp.lastSaleAmount;
      disp.lastUpdated = new Date().toISOString();
    }
    return { success: true };
  }
}

/**
 * Register transaction via ESP32 simulator
 */
export async function simulateTransactionPost(txn: {
  dispenser_id: string;
  product_id: string;
  liters: number;
  amount: number;
  price_per_liter: number;
  driver_id: string;
  vehicle_id: string;
  vehicle_plate: string;
  odometer: number;
  authorization_method: 'RFID' | 'QR' | 'APP' | 'MANUAL';
}, apiKey: string) {
  try {
    const res = await fetch('/api/fuel-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        transaction_id: `TX-SIM-${Date.now()}`,
        dispenser_id: txn.dispenser_id,
        hose: 1,
        product_id: txn.product_id,
        liters: Number(txn.liters),
        amount: Number(txn.amount),
        price_per_liter: Number(txn.price_per_liter),
        driver_id: txn.driver_id,
        vehicle_id: txn.vehicle_id,
        vehicle_plate: txn.vehicle_plate,
        odometer: txn.odometer,
        authorization_method: txn.authorization_method
      })
    });
    return await res.json();
  } catch (err) {
    // Client-side execution in fallback
    const newTx: FuelTransaction = {
      id: `TX-SIM-${Date.now()}`,
      siteId: 'ESTACION-001',
      dispenserId: txn.dispenser_id,
      hose: 1,
      productId: txn.product_id,
      liters: Number(txn.liters),
      amount: Number(txn.amount),
      pricePerLiter: Number(txn.price_per_liter),
      driverId: txn.driver_id,
      vehicleId: txn.vehicle_id,
      vehiclePlate: txn.vehicle_plate,
      odometer: txn.odometer,
      timestampStart: new Date(Date.now() - 3 * 60000).toISOString(),
      timestampEnd: new Date().toISOString(),
      authorizationMethod: txn.authorization_method,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    clientDb.transactions.unshift(newTx);
    
    // Reduce levels
    const tank = clientDb.tanks.find(t => t.productId === txn.product_id && t.siteId === 'ESTACION-001');
    if (tank) {
      tank.currentVolumeLiters = Math.max(0, tank.currentVolumeLiters - newTx.liters);
      tank.currentHeightMm = Math.round((tank.currentVolumeLiters / tank.capacityLiters) * tank.heightMm);
      tank.lastUpdated = new Date().toISOString();
    }

    // Free dispenser
    const disp = clientDb.dispensers.find(d => d.id === txn.dispenser_id);
    if (disp) {
      disp.status = 'available';
      disp.lastSaleLiters = txn.liters;
      disp.lastSaleAmount = txn.amount;
      disp.lastUpdated = new Date().toISOString();
    }
    
    return { success: true };
  }
}

/**
 * Register or update a Tank
 */
export async function saveTank(tankData: any) {
  try {
    const res = await fetch('/api/tanks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tankData)
    });
    if (!res.ok) throw new Error('Error saving tank on backend');
    return await res.json();
  } catch (err) {
    console.warn('[SENSINA API] Post failed, performing client-side simulation.', err);
    const existingIndex = clientDb.tanks.findIndex(t => t.id === tankData.id);
    const newTank = {
      id: tankData.id || `ANK-${Date.now()}`,
      siteId: tankData.siteId || 'rosario-01',
      productId: tankData.productId,
      name: tankData.name,
      capacityLiters: Number(tankData.capacityLiters),
      heightMm: Number(tankData.heightMm || 2000),
      currentVolumeLiters: Number(tankData.currentVolumeLiters ?? (tankData.capacityLiters * 0.7)),
      currentHeightMm: Number(tankData.currentHeightMm ?? (tankData.heightMm ? tankData.heightMm * 0.7 : 1400)),
      temperatureC: Number(tankData.temperatureC ?? 15),
      waterMm: Number(tankData.waterMm ?? 0),
      batteryV: Number(tankData.batteryV ?? 3.6),
      batteryPercent: Number(tankData.batteryPercent ?? 100),
      signalRssi: Number(tankData.signalRssi ?? -55),
      sensorStatus: tankData.sensorStatus || 'normal',
      sensorType: tankData.sensorType || 'magnetostrictive',
      lastUpdated: new Date().toISOString(),
      createdAt: tankData.createdAt || new Date().toISOString()
    } as any;

    if (existingIndex > -1) {
      clientDb.tanks[existingIndex] = { ...clientDb.tanks[existingIndex], ...newTank };
    } else {
      clientDb.tanks.push(newTank);
    }
    return { success: true, tank: newTank };
  }
}

/**
 * Delete a Tank
 */
export async function deleteTank(id: string) {
  try {
    const res = await fetch(`/api/tanks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete tank on backend');
    return await res.json();
  } catch (err) {
    console.warn('[SENSINA API] Delete failed, performing client-side simulation.', err);
    clientDb.tanks = clientDb.tanks.filter(t => t.id !== id);
    return { success: true };
  }
}

/**
 * Register or update Dispenser
 */
export async function saveDispenser(dispData: any) {
  try {
    const res = await fetch('/api/dispensers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dispData)
    });
    if (!res.ok) throw new Error('Error saving dispenser on backend');
    return await res.json();
  } catch (err) {
    console.warn('[SENSINA API] Post failed, performing client-side simulation.', err);
    const existingIndex = clientDb.dispensers.findIndex(d => d.id === dispData.id);
    const newDisp = {
      id: dispData.id || `DSP-${Date.now()}`,
      siteId: dispData.siteId || 'rosario-01',
      name: dispData.name,
      hose: Number(dispData.hose || 1),
      productId: dispData.productId,
      suctionTankId: dispData.suctionTankId || undefined,
      status: dispData.status || 'available',
      lastSaleLiters: Number(dispData.lastSaleLiters ?? 0),
      lastSaleAmount: Number(dispData.lastSaleAmount ?? 0),
      lastUpdated: new Date().toISOString(),
      createdAt: dispData.createdAt || new Date().toISOString()
    } as any;

    if (existingIndex > -1) {
      clientDb.dispensers[existingIndex] = { ...clientDb.dispensers[existingIndex], ...newDisp };
    } else {
      clientDb.dispensers.push(newDisp);
    }
    return { success: true, dispenser: newDisp };
  }
}

/**
 * Delete Dispenser
 */
export async function deleteDispenser(id: string) {
  try {
    const res = await fetch(`/api/dispensers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete dispenser on backend');
    return await res.json();
  } catch (err) {
    console.warn('[SENSINA API] Delete failed, performing client-side simulation.', err);
    clientDb.dispensers = clientDb.dispensers.filter(d => d.id !== id);
    return { success: true };
  }
}

/**
 * Register or update Product
 */
export async function saveProduct(prodData: any) {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    });
    if (!res.ok) throw new Error('Error saving product on backend');
    return await res.json();
  } catch (err) {
    console.warn('[SENSINA API] Post failed, performing client-side simulation.', err);
    const existingIndex = clientDb.products.findIndex(p => p.id === prodData.id);
    const newProd = {
      id: prodData.id || `prod-${prodData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: prodData.name,
      type: prodData.type,
      referenceDensity: Number(prodData.referenceDensity || 840),
      color: prodData.color || 'border-teal-500',
      hexColor: prodData.hexColor || '#0ea5e9',
      pricePerLiter: Number(prodData.pricePerLiter),
      minStock: Number(prodData.minStock || 2000),
      maxStock: Number(prodData.maxStock || 40000),
      unit: prodData.unit || 'L',
      active: prodData.active ?? true,
      createdAt: prodData.createdAt || new Date().toISOString()
    } as any;

    if (existingIndex > -1) {
      clientDb.products[existingIndex] = newProd;
    } else {
      clientDb.products.push(newProd);
    }
    return { success: true, product: newProd };
  }
}

/**
 * Delete Product
 */
export async function deleteProduct(id: string) {
  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product on backend');
    return await res.json();
  } catch (err) {
    console.warn('[SENSINA API] Delete failed, performing client-side simulation.', err);
    clientDb.products = clientDb.products.filter(p => p.id !== id);
    return { success: true };
  }
}

/**
 * Resets backend / frontend mock registers
 */
export async function resetSystemData() {
  try {
    const res = await fetch('/api/reset-data', { method: 'POST' });
    return await res.json();
  } catch (err) {
    clientDb = {
      sites: [...mockSites],
      products: [...mockProducts],
      tanks: [] as Tank[],
      dispensers: [] as Dispenser[],
      drivers: [...mockDrivers],
      vehicles: [...mockVehicles],
      transactions: [] as FuelTransaction[],
      deliveries: [] as Delivery[],
      reconciliations: [] as InventoryReconciliation[],
      alerts: [] as Alert[],
      devices: [...mockDevices],
      users: [...mockUsers],
      auditLogs: [] as AuditLog[]
    };
    return { success: true };
  }
}

/**
 * Save or update User
 */
export async function saveUser(userData: any) {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Error saving user on backend');
    return await res.json();
  } catch (err) {
    console.warn('[SENSINA API] Post failed, performing client-side simulation.', err);
    const existingIndex = clientDb.users.findIndex(u => u.id === userData.id || u.username === userData.username);
    const newUser = {
      id: userData.id || `usr-${Date.now().toString().slice(-4)}`,
      name: userData.name,
      email: userData.email || `${userData.username}@sensina.cloud`,
      username: userData.username,
      role: userData.role,
      siteId: userData.siteId || 'ESTACION-001',
      active: userData.active ?? true,
      createdAt: userData.createdAt || new Date().toISOString()
    };

    if (existingIndex > -1) {
      clientDb.users[existingIndex] = newUser;
    } else {
      clientDb.users.push(newUser);
    }
    return { success: true, user: newUser };
  }
}

/**
 * Delete User
 */
export async function deleteUser(id: string) {
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete user on backend');
    return await res.json();
  } catch (err) {
    console.warn('[SENSINA API] Delete failed, performing client-side simulation.', err);
    clientDb.users = clientDb.users.filter(u => u.id !== id);
    return { success: true };
  }
}
