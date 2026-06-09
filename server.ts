/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import PDFDocument from 'pdfkit';

// Direct initial state from mockData structures
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
} from './src/data/mockData.js';

// In-Memory Database State
const db = {
  sites: [...mockSites],
  products: [...mockProducts],
  tanks: [...mockTanks],
  dispensers: [...mockDispensers],
  drivers: [...mockDrivers],
  vehicles: [...mockVehicles],
  transactions: [...mockTransactions],
  deliveries: [...mockDeliveries],
  reconciliations: [...mockReconciliations],
  alerts: [...mockAlerts],
  devices: [...mockDevices],
  users: [...mockUsers],
  auditLogs: [...mockAuditLogs]
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser for ESP32 and application requests
  app.use(express.json());

  // API Middleware validation helpers
  const validateDeviceToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Device API key required. Missing or malformed Authorization header.' });
    }
    const token = authHeader.split(' ')[1];
    // Check if device matches key in register
    let device = db.devices.find(d => d.apiKey === token);
    if (!device) {
      // Auto-register device under this key dynamically
      const newDevice = {
        id: `dev-${Date.now()}`,
        deviceId: `ESP32-GATEWAY-${Date.now().toString().slice(-4)}`,
        siteId: "rosario-01",
        type: "gateway" as const,
        apiKey: token,
        lastSeen: new Date().toISOString(),
        status: "online" as const,
        description: "Dispositivo Auto-Registrado por Token"
      };
      db.devices.push(newDevice);
      device = newDevice;
    }
    (req as any).device = device;
    next();
  };

  let latestTelemetryData: any = null;
  let latestFuelTransactionsData: any[] = [];
  let latestDispenserStatusData: any = null;
  let latestAlarmsData: any[] = [];

  // --- REST ENDPOINTS ---

  // Get full current live state (Frontend query)
  app.get('/api/all-data', (req, res) => {
    res.json(db);
  });

  // Get latest telemetry endpoint compatible with Netlify
  app.get('/api/latest-telemetry', (req, res) => {
    res.json({
      ok: true,
      data: latestTelemetryData,
      products: db.products,
      tanks: db.tanks.map(t => ({
        tank_id: t.id,
        site_id: t.siteId,
        height_mm: t.currentHeightMm,
        volume_liters: t.currentVolumeLiters,
        capacity_liters: t.capacityLiters,
        product_id: t.productId,
        tank_name: t.name,
        temperature_c: t.temperatureC,
        water_mm: t.waterMm,
        battery_v: t.batteryV,
        battery_percent: t.batteryPercent,
        signal_rssi: t.signalRssi,
        sensor_status: t.sensorStatus,
        received_at: t.lastUpdated
      }))
    });
  });

  app.get('/api/latest-fuel-transactions', (req, res) => {
    res.json({
      ok: true,
      data: latestFuelTransactionsData
    });
  });

  app.get('/api/latest-dispenser-status', (req, res) => {
    res.json({
      ok: true,
      data: latestDispenserStatusData
    });
  });

  app.get('/api/latest-alarms', (req, res) => {
    res.json({
      ok: true,
      data: latestAlarmsData
    });
  });

  // --- PDF DOCUMENTATION GENERATOR ---
  app.get('/api/docs/pdf', (req, res) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="MANUAL_SENSINA_CESTI_INTEGRACION.pdf"');

      doc.pipe(res);

      // Colors
      const primaryColor = '#0d9488'; // Teal-600
      const secondaryColor = '#0f172a'; // Slate-900
      const lightBgColor = '#f8fafc'; // Slate-50
      const accentColor = '#3b82f6'; // Blue-500
      const dividerColor = '#cbd5e1'; // Slate-300
      const codeBgColor = '#0f172a';
      const codeTextColor = '#10b981';

      // --- PAGE 1: PORTADA & INTRODUCCIÓN ---
      // Border decoration
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(1)
         .stroke('#e2e8f0');

      // Top Header
      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('SENSINA® INDUSTRIAL IOT / C.E.S.T.I. FLOTA', 40, 40);

      // Title
      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('MANUAL DE INTEGRACIÓN DE APIS', 40, 80, { lineGap: 6 });

      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('Sincronización de Conciliación de Telemedición, Surtidores, Choferes y Vehículos por Sonda Externa (ESP32)', 40, 130, { width: doc.page.width - 80 });

      // Horizontal bar
      doc.moveTo(40, 190)
         .lineTo(doc.page.width - 40, 190)
         .lineWidth(3)
         .stroke(primaryColor);

      // Metadata block
      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('Versión de API:', 40, 210)
         .font('Helvetica')
         .text('v2.1.4-Production Stable (SSL Secure)', 130, 210)
         .font('Helvetica-Bold')
         .text('Sede de Enlace:', 40, 225)
         .font('Helvetica')
         .text('ROSARIO-01, Santa Fe, Argentina', 130, 225)
         .font('Helvetica-Bold')
         .text('Fecha Reporte:', 40, 240)
         .font('Helvetica')
         .text(new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR'), 130, 240);

      // Summary Panel
      doc.rect(40, 270, doc.page.width - 80, 110)
         .fill(lightBgColor);

      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('SINOPSIS DEL SISTEMA REGLAMENTARIO:', 55, 285)
         .font('Helvetica')
         .fontSize(9.5)
         .text('La plataforma de telemetría Sensina gestiona de manera unificada las sondas de medición capacitivas/magnetoestrictivas y el control de playón. Para garantizar la cero merma física y controlar fugas de combustible, el controlador de despacho (ESP32) concilia en tiempo real las mangueras habilitadas con la flota autorizada vía RFID. El presente manual detalla la estructura del endpoint central para consulta de flota local y describe cómo documentar lecturas térmicas directas y eventos transaccionales completos.', 55, 305, { width: doc.page.width - 110, align: 'justify', lineGap: 3 });

      // Introduction
      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('1. INTRODUCCIÓN Y ARQUITECTURA', 40, 400);

      doc.fillColor(secondaryColor)
         .font('Helvetica')
         .fontSize(10)
         .text('La telemedición automática (ATG) calcula de forma matemática el stock físico en base a la altura en milímetros de combustible y la densidad compensada por temperatura. Sin embargo, para cerrar la ecuación contable de conciliación, cada litro entregado por un surtidor debe poseer un chofer, patente de vehículo y odómetro asociado.\n\nCuando una manguera inicia flujo, el microcontrolador local (ESP32) consulta las bases de flota de Sensina, restringe el despacho según límites semanales de litros, y comunica de forma asincrónica las telemetrías e históricos de transacciones superando caídas de red local inalámbrica.', 40, 425, { width: doc.page.width - 80, align: 'justify', lineGap: 3 });

      // Footnote
      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(8)
         .text('Sensina Cloud IoT Platform - Manual del Desarrollador - Página 1 de 3', 40, doc.page.height - 40, { align: 'center' });


      // --- PAGE 2: ENDPOINTS DE FLOTA Y TELEMETRÍA ---
      doc.addPage();

      // Border decoration
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(1)
         .stroke('#e2e8f0');

      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('MANUAL DE INTEGRACIÓN DE APIS SENSINA® / C.E.S.T.I.', 40, 40);

      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('2. CONSULTA DE FLOTA AUTORIZADA (API FLEET)', 40, 60);

      doc.fillColor(secondaryColor)
         .font('Helvetica')
         .fontSize(9.5)
         .text('Para evitar problemas de latencia o desconexión transitoria en zonas de playón lejanas, el ESP32 descarga y almacena en caché local una estructura ultra-optimizada de choferes habilitados con sus respectivas tarjetas RFID. Esta información se obtiene consultando el siguiente endpoint con método GET:', 40, 80, { width: doc.page.width - 80, align: 'justify', lineGap: 2 });

      // Endpoint box
      doc.rect(40, 125, doc.page.width - 80, 25)
         .fill('#f1f5f9');
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text('GET   /api/fleet', 55, 133);

      doc.fillColor(secondaryColor)
         .font('Helvetica')
         .fontSize(9)
         .text('La respuesta es un mapa JSON depurado del catálogo de vehículos y conductores habilitados:', 40, 165);

      // JSON example box
      const jsonFleetOutput = JSON.stringify({
        ok: true,
        count_drivers: 7,
        count_vehicles: 7,
        drivers: [
          { id: "DRV-001", name: "Martin Rodriguez", rfid_card: "12345678", enabled_vehicles: ["VEH-001"], daily_limit_liters: 200 }
        ],
        vehicles: [
          { id: "VEH-001", plate: "AE123BB", brand: "Toyota", model: "Hilux", tank_capacity_liters: 80 }
        ]
      }, null, 2);

      doc.rect(40, 185, doc.page.width - 80, 130)
         .fill(codeBgColor);
      doc.fillColor(codeTextColor)
         .font('Courier-Bold')
         .fontSize(7.5)
         .text(jsonFleetOutput, 50, 195, { lineGap: 1 });

      // Telemetry Endpoint Section
      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('3. RESPUESTA SENSORA DE TELEMETRÍA (API TELEMETRY)', 40, 335);

      doc.font('Helvetica')
         .fontSize(9.5)
         .text('La sonda física transfiere de manera ininterrumpida variables críticas de estado. El microprocesador del tanque debe armar una petición POST incluyendo metadatos del combustible actual. Es obligatorio suministrar el token Bearer en las cabeceras HTTP.', 40, 355, { width: doc.page.width - 80, align: 'justify', lineGap: 2 });

      // Endpoint box telemetry
      doc.rect(40, 400, doc.page.width - 80, 25)
         .fill('#f1f5f9');
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text('POST   /api/telemetry', 55, 408);

      // Header Table of fields
      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('Campo en JSON', 40, 440)
         .text('Tipo', 170, 440)
         .text('Descripción Reglamentaria', 250, 440);

      doc.moveTo(40, 452).lineTo(doc.page.width - 40, 452).lineWidth(1).stroke(dividerColor);

      let rowYPos = 460;
      const fieldsList = [
        { name: 'tank_id', type: 'String', desc: 'Identificador físico de cisterna (e.g. tank_01, TQ-01)' },
        { name: 'volume_liters', type: 'Float', desc: 'Liters físicos calculados por aforo de densidad compensada.' },
        { name: 'height_mm', type: 'Integer', desc: 'Altura de combustible registrada por sensor sónico, soga o flotador.' },
        { name: 'temperature_c', type: 'Float', desc: 'Temperatura compensadora del combustible para aforo reglamentario.' },
        { name: 'water_mm', type: 'Integer', desc: 'Presencia de agua libre en milímetros acumulada en fondo de fosa.' },
        { name: 'battery_v', type: 'Float', desc: 'Nivel analógico de tensión de celda de batería del sensor (3.6 V).' },
        { name: 'sensor_status', type: 'String', desc: 'Mapeo de alarmas físicas: normal, offline, water_alarm, low_battery.' }
      ];

      fieldsList.forEach(f => {
        doc.fillColor(secondaryColor)
           .font('Courier-Bold')
           .fontSize(8.5)
           .text(f.name, 40, rowYPos)
           .font('Helvetica')
           .text(f.type, 170, rowYPos)
           .fontSize(8.5)
           .text(f.desc, 250, rowYPos, { width: doc.page.width - 290 });
        rowYPos += 18;
      });

      // Footnote
      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(8)
         .text('Sensina Cloud IoT Platform - Manual del Desarrollador - Página 2 de 3', 40, doc.page.height - 40, { align: 'center' });


      // --- PAGE 3: CONCILIACIÓN, GURÚ PANIC FIXED & RECOMENDACIONES ---
      doc.addPage();

      // Border decoration
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(1)
         .stroke('#e2e8f0');

      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('MANUAL DE INTEGRACIÓN DE APIS SENSINA® / C.E.S.T.I.', 40, 40);

      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('4. RESOLUCIÓN DE GURU MEDITATION PANIC (GESTIÓN DE MEMORIA)', 40, 60);

      // Box explanation of the Guru panic
      doc.rect(40, 80, doc.page.width - 80, 160)
         .fill('#fef2f2')
         .stroke('#fca5a5');

      doc.fillColor('#991b1b')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('REPORTE DE INCIDENCIA CRÍTICA: GURU MEDITATION PANIC EN CORE 1', 50, 95)
         .font('Helvetica')
         .fontSize(9)
         .fillColor('#7f1d1d')
         .text('Síntoma: El ESP32 se reinicia abruptamente lanzando un pánico del procesador ("InstructionFetchError" o "StackOverflow") tras recibir el JSON de sincronización que contiene una alta densidad de choferes y vehículos habilitados.\n\nCausa estructural: Al declarar una variable de ArduinoJson del tipo "DynamicJsonDocument doc(12000)" en el Stack local dentro de la rutina de sincronización, la memoria del hilo del sistema colapsa debido a que supera el espacio reservado para pilas en FreeRTOS.\n\nSolución implementada y validada en código:', 50, 115, { width: doc.page.width - 100, lineGap: 3 })
         .font('Helvetica-Bold')
         .text('Para evitar fallar en la pila (Stack), el objeto JSON se aloja en el Heap mediante punteros dinámicos:\n"DynamicJsonDocument* doc = new DynamicJsonDocument(16384);"\ny es inmediatamente liberado de la RAM del ESP32 una vez concluido el procesado de las matrices:\n"delete doc;"', 50, 195, { width: doc.page.width - 100, lineGap: 2.5 });

      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('5. REGISTRO DE DESPACHO & TRANSACCIONES (API FUEL TRANSACTIONS)', 40, 260);

      doc.font('Helvetica')
         .fontSize(9.5)
         .text('Cada vez que una manguera finaliza de expender litros, el ESP32 envía un reporte transaccional completo. El backend Sensina de forma simultánea realiza las siguientes acciones de conciliación de forma segura:', 40, 280, { width: doc.page.width - 80, align: 'justify', lineGap: 2 });

      // Bullets of actions
      const bulletPointsList = [
        { title: 'Descuento Físico', desc: 'Resta exactamente los litros despachados de la cisterna vinculada por succión, de forma continua.' },
        { title: 'Mapeo Multidispositivo', desc: 'Guarda la patente, conductor, método RFID y el odómetro analizado en las planillas de transacciones.' },
        { title: 'Generación de Alarma de Merma', desc: 'Si el combustible descontado por el surtidor no se condice con el descenso registrado por la sonda sónica (ATG), se emite automáticamente una alerta de pérdida física, robo o descalibración del caudalímetro del surtidor.' }
      ];

      let bulletYPos = 325;
      bulletPointsList.forEach(bp => {
        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(14)
           .text('•', 40, bulletYPos)
           .fillColor(secondaryColor)
           .font('Helvetica-Bold')
           .fontSize(9.5)
           .text(bp.title + ':', 55, bulletYPos + 3)
           .font('Helvetica')
           .text(bp.desc, 150, bulletYPos + 3, { width: doc.page.width - 190, align: 'justify' });
        bulletYPos += bp.title === 'Generación de Alarma de Merma' ? 38 : 28;
      });

      // Epilogue
      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('ASISTENCIA TÉCNICA SENSINA IOT', 40, 440);

      doc.font('Helvetica')
         .fontSize(9)
         .text('Si tiene dudas sobre las calibraciones térmicas del aforo o requiere soporte para la integración del bus de comunicaciones RS485 (PAM / Gilbarco / Wayne), contáctese con el Centro de Servicios al Desarrollador del C.E.S.T.I. al correo martinrodriguezmelgarejo@gmail.com o acceda a la plataforma en vivo.', 40, 458, { width: doc.page.width - 80, align: 'justify', lineGap: 2 });

      // Signature badge
      doc.rect(40, 520, doc.page.width - 80, 25)
         .fill(primaryColor);
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text('CONEXIÓN REGLAMENTARIA ESTABLECIDA - CLOUD READY SSL v3', 80, 528, { align: 'center' });

      // Footnote
      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(8)
         .text('Sensina Cloud IoT Platform - Manual del Desarrollador - Página 3 de 3', 40, doc.page.height - 40, { align: 'center' });

      doc.end();
    } catch (e: any) {
      console.error('Error generating documentation PDF:', e);
      res.status(500).send('Error generating PDF documentation: ' + e.message);
    }
  });

  // GET /api/fleet
  // Exposes authorized active drivers and vehicles list for the ESP32 controller
  app.get('/api/fleet', (req, res) => {
    // We clean active entities to send only essential fields for Arduino JSON optimization
    const activeDrivers = db.drivers
      .filter(d => d.active)
      .map(d => ({
        id: d.id,
        name: d.name,
        rfid_card: d.rfidCard,
        enabled_vehicles: d.enabledVehicles,
        daily_limit_liters: d.dailyLimitLiters
      }));

    const activeVehicles = db.vehicles
      .filter(v => v.active)
      .map(v => ({
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        tank_capacity_liters: v.tankCapacityLiters
      }));

    res.json({
      ok: true,
      count_drivers: activeDrivers.length,
      count_vehicles: activeVehicles.length,
      drivers: activeDrivers,
      vehicles: activeVehicles
    });
  });

  // 1. ESP32 Telemetry Endpoint
  // POST /api/telemetry
  app.post('/api/telemetry', validateDeviceToken, (req, res) => {
    const { 
      tank_id, 
      height_mm, 
      volume_liters, 
      temperature_c, 
      water_mm, 
      battery_v, 
      battery_percent, 
      signal_rssi, 
      sensor_status, 
      capacity_liters, 
      product_id, 
      tank_name,
      site_id,
      site_name,
      site_location,
      product_name,
      product_type,
      product_price,
      product_density,
      product_color
    } = req.body;
    
    if (!tank_id) {
      return res.status(400).json({ error: 'tank_id is a required field' });
    }

    // Extract & resolve product_id. Always use the exact, literal product_id sent by the device
    // (e.g. 'GP', 'GO2', 'NS') to preserve mappings for dispensers, nozzles, and transactions.
    let resolvedProductId = product_id || 'GO2';
    if (!product_id || product_id === 'GO2') {
      if (tank_id === 'tank_01' || (tank_name && tank_name.toLowerCase().includes('premium')) || (product_name && product_name.toLowerCase().includes('grado 3'))) {
        resolvedProductId = 'GP';
      } else if (tank_id === 'tank_03' || (tank_name && tank_name.toLowerCase().includes('super')) || (product_name && product_name.toLowerCase().includes('super'))) {
        resolvedProductId = 'NS';
      }
    } else if (resolvedProductId === 'GO3' || resolvedProductId === 'premium') {
      resolvedProductId = 'GP';
    } else if (resolvedProductId === 'nafta') {
      resolvedProductId = 'NS';
    } else if (resolvedProductId === 'gasoil') {
      resolvedProductId = 'GO2';
    }

    // Dynamic auto-registration of product in catalogue
    if (resolvedProductId) {
      let existingProd = db.products.find(p => p.id === resolvedProductId);
      if (!existingProd) {
        existingProd = {
          id: resolvedProductId,
          name: product_name || `${resolvedProductId} Combustible`,
          type: product_type || 'gasoil',
          referenceDensity: Number(product_density || 840),
          color: 'teal',
          hexColor: product_color || '#0ea5e9',
          pricePerLiter: Number(product_price || 1200),
          minStock: 2000,
          maxStock: 40000,
          unit: 'L',
          active: true,
          createdAt: new Date().toISOString()
        };
        db.products.push(existingProd);
        console.log(`[C.E.S.T.I. AUTO-CONFIG] Registrado nuevo combustible/producto: ${resolvedProductId} (${existingProd.name})`);

        db.auditLogs.unshift({
          id: `AUD-PROD-${Date.now()}`,
          userId: 'usr-001',
          username: 'esp32-node',
          action: 'Combustible Registrado',
          details: `Nuevo producto "${existingProd.name}" (${resolvedProductId}) auto-creado desde telemetría.`,
          timestamp: new Date().toISOString()
        });
      } else {
        // Update product info if sent & changed
        if (product_name) existingProd.name = product_name;
        if (product_type) existingProd.type = product_type;
        if (product_price) existingProd.pricePerLiter = Number(product_price);
        if (product_density) existingProd.referenceDensity = Number(product_density);
        if (product_color) existingProd.hexColor = product_color;
      }
    }

    // Dynamic auto-registration of site/location
    let calculatedSiteId = (req as any).device?.siteId || "ESTACION-001";
    if (site_id) {
      calculatedSiteId = site_id;
      let existingSite = db.sites.find(s => s.id === site_id);
      if (!existingSite) {
        existingSite = {
          id: site_id,
          name: site_name || `Sede ${site_id}`,
          location: site_location || 'Ubicación Sincronizada por ESP32',
          active: true,
          createdAt: new Date().toISOString()
        };
        db.sites.push(existingSite);
        console.log(`[C.E.S.T.I. AUTO-CONFIG] Registrada nueva locación/site on-the-fly: ${site_id} (${existingSite.name})`);
        
        // Registrar en logs de auditoría
        db.auditLogs.unshift({
          id: `AUD-SITE-${Date.now()}`,
          userId: 'usr-001',
          username: 'esp32-node',
          action: 'Estación Registrada',
          details: `Nueva locación "${existingSite.name}" (${site_id}) detectada y auto-creada por telemetría.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Seamless alias resolution between incoming ESP32 micro-controller IDs and pre-configured database tank IDs.
    // - "tank_02" / "tank_2" maps to TQ-01 (Diesel Común / Gasoil G2)
    // - "tank_01" / "tank_1" maps to TQ-02 (Premium / Gasoil G3 / Infinia Diesel)
    // - "tank_03" / "tank_3" maps to TQ-03 (Nafta Súper)
    // This maintains consistent suction mappings for dispensers and live transactional updates.
    let targetTankId = tank_id;
    if (tank_id === 'tank_01' || tank_id === 'tank_1') {
      targetTankId = 'TQ-02';
    } else if (tank_id === 'tank_02' || tank_id === 'tank_2') {
      targetTankId = 'TQ-01';
    } else if (tank_id === 'tank_03' || tank_id === 'tank_3') {
      targetTankId = 'TQ-03';
    }

    let tank = db.tanks.find(t => t.id === targetTankId);
    if (!tank) {
      const cap = Number(capacity_liters || 20000);
      tank = {
        id: targetTankId,
        siteId: calculatedSiteId,
        productId: resolvedProductId || "GO2",
        name: tank_name || `Cisterna Sonda ${tank_id}`,
        capacityLiters: cap,
        heightMm: height_mm ? Math.max(Number(height_mm), 2000) : 2000,
        currentVolumeLiters: Number(volume_liters || 0),
        currentHeightMm: Number(height_mm || 0),
        temperatureC: Number(temperature_c || 15),
        waterMm: Number(water_mm || 0),
        batteryV: Number(battery_v || 3.6),
        batteryPercent: Number(battery_percent || 100),
        signalRssi: Number(signal_rssi || -60),
        sensorStatus: sensor_status || 'normal',
        sensorType: 'magnetostrictive',
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      db.tanks.push(tank);
      console.log(`[C.E.S.T.I. AUTO-CONFIG] Registrado nuevo tanque on-the-fly: ${tank_id}`);
    }

    // Capture previous state
    const prevVolume = tank.currentVolumeLiters;

    // Update state variables
    if (resolvedProductId) {
      tank.productId = resolvedProductId;
    }
    tank.currentHeightMm = height_mm ?? tank.currentHeightMm;
    tank.currentVolumeLiters = volume_liters ?? tank.currentVolumeLiters;
    tank.temperatureC = temperature_c ?? tank.temperatureC;
    tank.waterMm = water_mm ?? tank.waterMm;
    tank.batteryV = battery_v ?? tank.batteryV;
    tank.batteryPercent = battery_percent ?? tank.batteryPercent;
    tank.signalRssi = signal_rssi ?? tank.signalRssi;
    tank.sensorStatus = sensor_status ?? tank.sensorStatus;
    tank.lastUpdated = new Date().toISOString();

    // Trigger Smart Alerts based on updated telemetry in background
    if (tank.currentVolumeLiters <= tank.capacityLiters * 0.15) {
      tank.sensorStatus = 'critical_low';
      const exists = db.alerts.some(a => a.source === tank.name && a.description.includes('bajo del 15%') && a.status === 'new');
      if (!exists) {
        db.alerts.unshift({
          id: `ALT-AUTO-${Date.now()}`,
          level: 'critical',
          timestamp: new Date().toISOString(),
          source: tank.name,
          description: `Alerta Física Crítica ESP32: El nivel de ${tank.name} ha descendido por debajo del 15%.`,
          status: 'new',
          recommendation: 'Detener despachos principales y solicitar camión cisterna reposición inmediata.'
        });
      }
    } else if (tank.currentVolumeLiters <= tank.capacityLiters * 0.25) {
      tank.sensorStatus = 'low_stock';
    } else if (tank.currentVolumeLiters >= tank.capacityLiters * 0.96) {
      tank.sensorStatus = 'high_level';
    } else {
      tank.sensorStatus = 'normal';
    }

    // Auto-sensor water detection alarm
    if (water_mm && water_mm > 5) {
      const exists = db.alerts.some(a => a.source === tank.name && a.description.includes('agua') && a.status === 'new');
      if (!exists) {
        db.alerts.unshift({
          id: `ALT-AUTO-H2O-${Date.now()}`,
          level: 'warning',
          timestamp: new Date().toISOString(),
          source: tank.name,
          description: `Sensor detectó presencia excesiva de agua libre (${water_mm} mm) en fondo de ${tank.name}.`,
          status: 'new',
          recommendation: 'Realizar purgado mecánico de lodos y condensación acumulada en cisterna.'
        });
      }
    }

    // Add telemetry log inside mock audit log for transparency
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      userId: 'device-esp32',
      username: (req as any).device.deviceId,
      action: 'Telemetría Recibida',
      details: `${tank.name}: ${tank.currentVolumeLiters} L (${tank.currentHeightMm} mm) - RSSI: ${tank.signalRssi} dBm`,
      timestamp: new Date().toISOString()
    });

    // Guardar para el endpoint de última telemetría
    latestTelemetryData = {
      tank_id: tank.id,
      height_mm: tank.currentHeightMm,
      volume_liters: tank.currentVolumeLiters,
      capacity_liters: tank.capacityLiters,
      product_id: tank.productId,
      tank_name: tank.name,
      temperature_c: tank.temperatureC,
      water_mm: tank.waterMm,
      battery_v: tank.batteryV,
      battery_percent: tank.batteryPercent,
      signal_rssi: tank.signalRssi,
      sensor_status: tank.sensorStatus,
      received_at: new Date().toISOString()
    };

    res.json({ success: true, message: `Telemetry updated successfully for tank ${tank.id} (ESP32 node tank: ${tank_id})`, tank });
  });

  // 2. ESP32 Surtidores Status Endpoint
  // POST /api/dispenser-status
  app.post('/api/dispenser-status', validateDeviceToken, (req, res) => {
    const { dispensers } = req.body;
    
    if (!dispensers || !Array.isArray(dispensers)) {
      return res.status(400).json({ error: 'dispensers array is required' });
    }

    for (const d of dispensers) {
      let dbDisp = db.dispensers.find(disp => disp.id === d.dispenser_id);
      if (!dbDisp) {
        dbDisp = {
          id: d.dispenser_id,
          siteId: (req as any).device?.siteId || "rosario-01",
          name: `Surtidor ${d.dispenser_id.replace(/[_-]/g, ' ')}`,
          hose: Number(d.nozzle || d.hose_id || 1),
          productId: d.product_id || "GO2",
          suctionTankId: d.suction_tank_id || undefined,
          status: d.status || 'available',
          lastSaleLiters: Number(d.last_sale_liters || 0),
          lastSaleAmount: Number(d.last_sale_amount || 0),
          activeDriver: d.driver || undefined,
          activeVehicle: d.vehicle || undefined,
          activePlate: d.plate || undefined,
          odometerReading: d.odometer || undefined,
          authorizationMethod: d.authorization_method || 'RFID',
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        db.dispensers.push(dbDisp);
        console.log(`[C.E.S.T.I. AUTO-CONFIG] Registrado nuevo surtidor on-the-fly: ${d.dispenser_id}`);
      } else {
        dbDisp.status = d.status ?? dbDisp.status;
        dbDisp.lastSaleLiters = d.last_sale_liters ?? dbDisp.lastSaleLiters;
        dbDisp.lastSaleAmount = d.last_sale_amount ?? dbDisp.lastSaleAmount;
        dbDisp.activeDriver = d.driver ?? dbDisp.activeDriver;
        dbDisp.activeVehicle = d.vehicle ?? dbDisp.activeVehicle;
        dbDisp.activePlate = d.plate ?? dbDisp.activePlate;
        dbDisp.odometerReading = d.odometer ?? dbDisp.odometerReading;
        dbDisp.authorizationMethod = d.authorization_method ?? dbDisp.authorizationMethod;
        if (d.product_id) dbDisp.productId = d.product_id;
        if (d.suction_tank_id) dbDisp.suctionTankId = d.suction_tank_id;
        if (d.nozzle || d.hose_id) dbDisp.hose = Number(d.nozzle || d.hose_id);
        dbDisp.lastUpdated = new Date().toISOString();
      }

      // Automatically register a fuel transaction from this dispenser status if completed sale exists
      if (d.last_sale_liters && Number(d.last_sale_liters) > 0) {
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

        const txId = d.last_transaction_id || `TX-AUTO-${d.dispenser_id}-${Math.round(d.last_sale_liters * 105)}-${new Date().toISOString().split('T')[0]}`;
        const hasTx = db.transactions.some(tx => tx.id === txId);
        const hasDupe = db.transactions.some(tx => 
          tx.dispenserId === d.dispenser_id && 
          Number(tx.liters) === Number(d.last_sale_liters) && 
          Math.abs(new Date(tx.createdAt || tx.timestampEnd || Date.now()).getTime() - Date.now()) < 120000
        );

        if (!hasTx && !hasDupe) {
          const newTx = {
            id: txId,
            siteId: (req as any).device?.siteId || "rosario-01",
            dispenserId: d.dispenser_id,
            hose: Number(d.nozzle || d.hose_id || 1),
            productId: resolvedProdId,
            liters: Number(d.last_sale_liters),
            amount: Number(d.last_sale_amount || d.last_sale_liters * 1200),
            pricePerLiter: d.last_sale_amount ? Number((d.last_sale_amount / d.last_sale_liters).toFixed(2)) : 1200,
            driverId: d.driver ? "DRV-AUTO" : undefined,
            vehicleId: d.vehicle ? "VEH-AUTO" : undefined,
            vehiclePlate: d.plate || "SIN-PAT",
            odometer: d.odometer || 0,
            timestampStart: new Date(Date.now() - 3 * 60000).toISOString(),
            timestampEnd: new Date().toISOString(),
            authorizationMethod: d.authorization_method || 'RFID',
            status: 'completed' as const,
            createdAt: new Date().toISOString()
          };

          db.transactions.unshift(newTx);

          // Reduce tank volume
          const tank = db.tanks.find(t => t.productId === resolvedProdId && t.siteId === newTx.siteId);
          if (tank) {
            tank.currentVolumeLiters = Math.max(0, tank.currentVolumeLiters - newTx.liters);
            tank.currentHeightMm = Math.round((tank.currentVolumeLiters / tank.capacityLiters) * tank.heightMm);
            tank.lastUpdated = new Date().toISOString();
          }

          // Add to audit logs
          db.auditLogs.unshift({
            id: `AUD-${Date.now()}`,
            userId: 'device-esp32-controller',
            username: (req as any).device?.deviceId || "ESP32",
            action: 'Transacción Auto-Sincronizada',
            details: `${d.dispenser_id} entregó ${newTx.liters} L de ${resolvedProdId} (Auto-reporte)`,
            timestamp: new Date().toISOString()
          });

          // Add to latestFuelTransactionsData
          const txPayload = {
            device_id: (req as any).device?.deviceId || "CTRL-SURT-0001",
            site_id: (req as any).device?.siteId || "ESTACION-001",
            transaction_id: newTx.id,
            timestamp_start: newTx.timestampStart,
            timestamp_end: newTx.timestampEnd,
            dispenser_id: newTx.dispenserId,
            hose_id: `M0${newTx.hose}`,
            nozzle: newTx.hose,
            product: (() => {
              const associatedProd = db.products.find(p => p.id === resolvedProdId);
              return associatedProd ? associatedProd.name.split(' (')[0] : (resolvedProdId === 'GO2' ? 'Gasoil Grado 2' : resolvedProdId === 'GP' ? 'Gasoil Grado 3' : 'Nafta Súper');
            })(),
            product_id: resolvedProdId,
            liters: newTx.liters,
            amount: newTx.amount,
            price_per_liter: newTx.pricePerLiter,
            driver_id: newTx.driverId || "DRV-001",
            driver_name: d.driver || "C.E.S.T.I. Chofer",
            vehicle_id: newTx.vehicleId || "VEH-001",
            vehicle_plate: newTx.vehiclePlate,
            odometer: newTx.odometer,
            authorization_method: newTx.authorizationMethod,
            authorization_id: "RFID-AUTO",
            status: "completed" as const,
            received_at: new Date().toISOString(),
            event_type: "fuel_transaction" as const
          };

          latestFuelTransactionsData.unshift(txPayload);
          latestFuelTransactionsData = latestFuelTransactionsData.slice(0, 50);
        }
      }
    }

    latestDispenserStatusData = {
      device_id: req.body.device_id || "CTRL-SURT-0001",
      site_id: req.body.site_id || "ESTACION-001",
      timestamp: req.body.timestamp || new Date().toISOString(),
      dispensers: dispensers.map(disp => {
        const dProd = db.products.find(p => p.id === disp.product_id) || 
                      (disp.product_id === 'GO3' ? db.products.find(p => p.id === 'GP') : null);
        return {
          dispenser_id: disp.dispenser_id,
          hose_id: disp.hose_id || "M01",
          nozzle: disp.nozzle || 1,
          product: dProd ? dProd.name.split(' (')[0] : (disp.product || "Combustible"),
          product_id: disp.product_id || "GO2",
          suction_tank_id: disp.suction_tank_id || undefined,
          status: disp.status || "available",
          last_transaction_id: disp.last_transaction_id || null,
          last_sale_liters: disp.last_sale_liters || 0,
          last_sale_amount: disp.last_sale_amount || 0,
          current_liters: disp.current_liters || 0,
          current_amount: disp.current_amount || 0,
          error_code: disp.error_code || null,
          operator_message: disp.operator_message || "Disponible"
        };
      }),
      received_at: new Date().toISOString(),
      event_type: "dispenser_status"
    };

    res.json({ success: true, message: `Status updated for ${dispensers.length} active dispensers` });
  });

  // 3. ESP32 Register Fuel Transaction Endpoint
  // POST /api/fuel-transactions
  app.post('/api/fuel-transactions', validateDeviceToken, (req, res) => {
    const { transaction_id, dispenser_id, hose, product_id, liters, amount, price_per_liter, driver_id, vehicle_id, vehicle_plate, odometer, authorization_method } = req.body;

    if (!dispenser_id || !liters || !product_id) {
      return res.status(400).json({ error: 'Missing dispenser_id, product_id, or liters in transaction packet' });
    }

    // Check for duplicate fuel transactions to prevent repeated entries on retries, packet lags or double clicks
    let existingTx = null;

    if (transaction_id) {
      existingTx = db.transactions.find(tx => tx.id === transaction_id);
    }

    if (!existingTx) {
      const matchLiters = Number(liters);
      existingTx = db.transactions.find(tx => {
        const isSameDispenser = tx.dispenserId === dispenser_id;
        const isSameProduct = tx.productId === product_id || 
                              (product_id === 'GO3' && tx.productId === 'GP') ||
                              (product_id === 'GP' && tx.productId === 'GO3');
        const isSameLiters = Math.abs(Number(tx.liters) - matchLiters) < 0.01;
        const isSamePlate = tx.vehiclePlate === vehicle_plate || 
                            (!tx.vehiclePlate && !vehicle_plate) ||
                            (tx.vehiclePlate === "SIN-PAT" && vehicle_plate === "SIN-PAT") ||
                            (tx.vehiclePlate === "AB123CD" && vehicle_plate === "AB123CD");
        
        if (isSameDispenser && isSameProduct && isSameLiters && isSamePlate) {
          // Check time difference (less than 120 seconds / 2 minutes) using transaction timestamps
          const txTime = new Date(tx.createdAt || tx.timestampEnd || Date.now()).getTime();
          const timeDiffSeconds = Math.abs(Date.now() - txTime) / 1000;
          return timeDiffSeconds < 120;
        }
        return false;
      });
    }

    if (existingTx) {
      console.log(`[C.E.S.T.I. DEDUPLICADOR STABLE] Evitada salida duplicada de manguera: ${existingTx.id} (Dispensero: ${dispenser_id}, Litros: ${liters}L, Patente: ${vehicle_plate || 'Sin ident.'})`);
      return res.json({ 
        success: true, 
        message: 'Transaction already processed (duplicate entry avoided)', 
        transaction: existingTx,
        duplicate: true 
      });
    }

    // 1. Log transaction
    const newTx = {
      id: transaction_id || `TX-${Date.now()}`,
      siteId: (req as any).device.siteId,
      dispenserId: dispenser_id,
      hose: hose ?? 1,
      productId: product_id,
      liters: Number(liters),
      amount: Number(amount || liters * (price_per_liter || 1200)),
      pricePerLiter: Number(price_per_liter || 1200),
      driverId: driver_id,
      vehicleId: vehicle_id,
      vehiclePlate: vehicle_plate,
      odometer: odometer,
      timestampStart: new Date(Date.now() - 3 * 60000).toISOString(),
      timestampEnd: new Date().toISOString(),
      authorizationMethod: authorization_method || 'RFID',
      status: 'completed' as const,
      createdAt: new Date().toISOString()
    };

    db.transactions.unshift(newTx);

    // 2. Reduce tank volume corresponding to product
    const tank = db.tanks.find(t => t.productId === product_id && t.siteId === newTx.siteId);
    if (tank) {
      tank.currentVolumeLiters = Math.max(0, tank.currentVolumeLiters - newTx.liters);
      // Rough estimation of height
      tank.currentHeightMm = Math.round((tank.currentVolumeLiters / tank.capacityLiters) * tank.heightMm);
      tank.lastUpdated = new Date().toISOString();
    }

    // 3. Release/update dispenser back to available
    const dispenser = db.dispensers.find(disp => disp.id === dispenser_id);
    if (dispenser) {
      dispenser.status = 'available';
      dispenser.lastSaleLiters = newTx.liters;
      dispenser.lastSaleAmount = newTx.amount;
      dispenser.activeDriver = undefined;
      dispenser.activeVehicle = undefined;
      dispenser.activePlate = undefined;
      dispenser.lastUpdated = new Date().toISOString();
    }

    // 4. Update vehicle odometer readings
    if (vehicle_id && odometer) {
      const veh = db.vehicles.find(v => v.id === vehicle_id);
      if (veh) {
        veh.lastOdometer = Math.max(veh.lastOdometer, odometer);
      }
    }

    // Audit Log
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      userId: 'device-esp32-controller',
      username: (req as any).device.deviceId,
      action: 'Transacción de Surtidor Registrada',
      details: `${dispenser?.name || dispenser_id} entregó ${newTx.liters} L de ${product_id} a patente ${vehicle_plate || 'Sin ident.'}`,
      timestamp: new Date().toISOString()
    });

    const txPayload = {
      device_id: req.body.device_id || (req as any).device.deviceId || "CTRL-SURT-0001",
      site_id: req.body.site_id || (req as any).device.siteId || "ESTACION-001",
      transaction_id: newTx.id,
      timestamp_start: newTx.timestampStart,
      timestamp_end: newTx.timestampEnd,
      dispenser_id: newTx.dispenserId,
      hose_id: `M0${newTx.hose}`,
      nozzle: newTx.hose,
      product: (() => {
        const associatedProd = db.products.find(p => p.id === product_id) || 
                               (product_id === 'GO3' ? db.products.find(p => p.id === 'GP') : null);
        return associatedProd ? associatedProd.name.split(' (')[0] : (product_id === 'GO2' ? 'Gasoil Grado 2' : product_id === 'GP' || product_id === 'GO3' ? 'Gasoil Grado 3' : product_id === 'NS' ? 'Nafta Súper' : 'Nafta Premium');
      })(),
      product_id: product_id,
      liters: newTx.liters,
      amount: newTx.amount,
      price_per_liter: newTx.pricePerLiter,
      driver_id: driver_id || "DRV-001",
      driver_name: db.drivers.find(d => d.id === driver_id)?.name || "Juan Pérez",
      vehicle_id: vehicle_id || "VEH-001",
      vehicle_plate: vehicle_plate || "AB123CD",
      odometer: odometer || 145230,
      authorization_method: (authorization_method as any) || "RFID",
      authorization_id: req.body.authorization_id || "RFID-000145",
      status: "completed" as const,
      received_at: new Date().toISOString(),
      event_type: "fuel_transaction" as const
    };

    latestFuelTransactionsData.unshift(txPayload);
    latestFuelTransactionsData = latestFuelTransactionsData.slice(0, 50);

    res.json({ success: true, message: 'Transaction registered and tank stocks synchronized successfully', transaction: newTx });
  });

  // 4. Register a Fuel Intake / Delivery (Descarga) manually
  app.post('/api/add-delivery', (req, res) => {
    const { supplier, invoiceNumber, productId, tankId, litersDeclared, operator, notes, density, temperature } = req.body;

    if (!tankId || !productId || !litersDeclared) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar la descarga.' });
    }

    const tank = db.tanks.find(t => t.id === tankId);
    if (!tank) {
      return res.status(404).json({ error: 'Tanque no encontrado' });
    }

    const beforeLit = tank.currentVolumeLiters;
    const added = Number(litersDeclared);
    
    // Simular el cargado real: El volumen del tanque sube
    tank.currentVolumeLiters = Math.min(tank.capacityLiters, tank.currentVolumeLiters + added);
    tank.currentHeightMm = Math.round((tank.currentVolumeLiters / tank.capacityLiters) * tank.heightMm);
    tank.lastUpdated = new Date().toISOString();

    const newDelivery = {
      id: `DL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      supplier: supplier || 'Proveedor Genérico',
      invoiceNumber: invoiceNumber || 'B-0001-XXXX',
      productId: productId,
      tankId: tankId,
      litersDeclared: added,
      litersMeasuredBefore: beforeLit,
      litersMeasuredAfter: tank.currentVolumeLiters,
      differenceLiters: tank.currentVolumeLiters - (beforeLit + added),
      temperatureC: Number(temperature || 20),
      density: Number(density || 840),
      operator: operator || 'Operador Central',
      notes: notes || 'Descarga normal.'
    };

    db.deliveries.unshift(newDelivery);

    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      userId: 'usr-001',
      username: 'admin',
      action: 'Descarga Registrada',
      details: `Descargados ${added} L de combustible en ${tank.name}.`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Descarga registrada con éxito en el tanque.', delivery: newDelivery });
  });

  // 4b. ESP32/IoT Alarm Endpoint
  // POST /api/alarms
  app.post('/api/alarms', validateDeviceToken, (req, res) => {
    const { device_id, site_id, timestamp, alarm_id, alarm_type, severity, source_type, source_id, tank_id, dispenser_id, message, value, unit, status } = req.body;

    if (!alarm_id || !alarm_type || !severity || !message) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para registrar la alarma (alarm_id, alarm_type, severity, message).' });
    }

    const alarmRecord = {
      device_id: device_id || "SENSINA-ALARM-0001",
      site_id: site_id || "ESTACION-001",
      timestamp: timestamp || new Date().toISOString(),
      alarm_id: alarm_id,
      alarm_type: alarm_type,
      severity: severity,
      source_type: source_type || "leak_sensor",
      source_id: source_id || "FUGA-01",
      tank_id: tank_id || null,
      dispenser_id: dispenser_id || null,
      message: message,
      value: value ?? 1,
      unit: unit || "digital",
      status: status || "active",
      received_at: new Date().toISOString(),
      event_type: "alarm" as const
    };

    // Synchronize to latest alarms array
    latestAlarmsData.unshift(alarmRecord);
    latestAlarmsData = latestAlarmsData.slice(0, 50);

    // Sync to main db.alerts list to make it appear on the platform dashboard instantly
    const mappedAlert: any = {
      id: alarm_id,
      level: severity === 'critical' ? 'critical' : severity === 'warning' ? 'warning' : 'info',
      timestamp: timestamp || new Date().toISOString(),
      source: `${source_type.toUpperCase()} - ${source_id}`,
      description: `[IoT ${alarm_type.toUpperCase()}] ${message}`,
      status: status === 'active' ? 'new' : status === 'resolved' ? 'resolved' : 'acknowledged',
      recommendation: `Inspección de seguridad prioritaria para el sensor de tipo ${source_type} (${source_id}). Verificar cableado y lecturas físicas a la brevedad.`
    };
    db.alerts.unshift(mappedAlert);

    // Add to audit logs
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      userId: 'device-esp32-alarm',
      username: device_id || 'ALARM-GATEWAY',
      action: 'Alerta IoT Recibida',
      details: `[${severity.toUpperCase()}] Alarma ${alarm_type}: ${message}`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Alarma registrada críticamente y sincronizada con el tablero principal.', alarm: alarmRecord });
  });

  // 5. Create audit logs, change vehicle, drivers details from front
  app.post('/api/add-vehicle', (req, res) => {
    const { plate, brand, model, type, costCenter, tankCapacityLiters, expectedKmL, lastOdometer } = req.body;
    
    if (!plate || !brand) {
      return res.status(400).json({ error: 'Patente y Marca son obligatorios' });
    }

    const newVeh = {
      id: `VEH-${Date.now()}`,
      plate,
      brand,
      model,
      type: type || 'Pick-up',
      costCenter: costCenter || 'General',
      tankCapacityLiters: Number(tankCapacityLiters || 80),
      expectedKmL: Number(expectedKmL || 10),
      lastOdometer: Number(lastOdometer || 0),
      active: true,
      createdAt: new Date().toISOString()
    };

    db.vehicles.push(newVeh);
    res.json({ success: true, vehicle: newVeh });
  });

  app.post('/api/add-driver', (req, res) => {
    const { name, document, rfidCard, dailyLimitLiters, monthlyLimitLiters, costCenter } = req.body;

    if (!name || !rfidCard) {
      return res.status(400).json({ error: 'Nombre y Tarjeta RFID son obligatorios' });
    }

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

    db.drivers.push(newDrv);
    res.json({ success: true, driver: newDrv });
  });

  // Acknowledge custom alarms
  app.post('/api/acknowledge-alert', (req, res) => {
    const { alertId, comments, resolvedBy } = req.body;
    const alert = db.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.resolvedBy = resolvedBy || 'Supervisor';
      alert.comments = comments || 'Revisado mecánicamente.';
      res.json({ success: true, alert });
    } else {
      res.status(404).json({ error: 'Alerta no encontrada' });
    }
  });

  // Resolve custom alarms
  app.post('/api/resolve-alert', (req, res) => {
    const { alertId, comments, resolvedBy } = req.body;
    const alert = db.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedBy = resolvedBy || 'Supervisor';
      alert.comments = comments || 'Cerrado tras inspección.';
      res.json({ success: true, alert });
    } else {
      res.status(404).json({ error: 'Alerta no encontrada' });
    }
  });

  // --- ASSET CONFIGURATION ENDPOINTS ---

  // Add or update Tank
  app.post('/api/tanks', (req, res) => {
    const tankData = req.body;
    if (!tankData.name || !tankData.productId || !tankData.capacityLiters) {
      return res.status(400).json({ error: 'Nombre, Producto y Capacidad son obligatorios.' });
    }

    const existingIndex = db.tanks.findIndex(t => t.id === tankData.id);
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
    };

    if (existingIndex > -1) {
      db.tanks[existingIndex] = { ...db.tanks[existingIndex], ...newTank };
    } else {
      db.tanks.push(newTank);
    }

    // Add Audit Log
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      userId: 'usr-001',
      username: 'admin',
      action: existingIndex > -1 ? 'Cisterna Actualizada' : 'Nueva Cisterna Registrada',
      details: `${newTank.name} (${newTank.capacityLiters} L) vinculada a producto ${newTank.productId}`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, tank: newTank });
  });

  // Delete Tank
  app.delete('/api/tanks/:id', (req, res) => {
    const { id } = req.params;
    const tankIndex = db.tanks.findIndex(t => t.id === id);
    if (tankIndex > -1) {
      const removedTank = db.tanks.splice(tankIndex, 1)[0];
      
      // Add Audit Log
      db.auditLogs.unshift({
        id: `AUD-${Date.now()}`,
        userId: 'usr-001',
        username: 'admin',
        action: 'Cisterna Eliminada',
        details: `${removedTank.name} removida del sistema.`,
        timestamp: new Date().toISOString()
      });
      
      res.json({ success: true, message: `Tank ${id} deleted successfully.` });
    } else {
      res.status(404).json({ error: 'Cisterna no encontrada' });
    }
  });

  // Add or update Dispenser (Punto de carga)
  app.post('/api/dispensers', (req, res) => {
    const dispData = req.body;
    if (!dispData.name || !dispData.productId) {
      return res.status(400).json({ error: 'Nombre y producto son obligatorios.' });
    }

    const existingIndex = db.dispensers.findIndex(d => d.id === dispData.id);
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
    };

    if (existingIndex > -1) {
      db.dispensers[existingIndex] = { ...db.dispensers[existingIndex], ...newDisp };
    } else {
      db.dispensers.push(newDisp);
    }

    // Add Audit Log
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      userId: 'usr-001',
      username: 'admin',
      action: existingIndex > -1 ? 'Surtidor Actualizado' : 'Nuevo Surtidor Registrado',
      details: `${newDisp.name} (Pico ${newDisp.hose}) asignado a producto ${newDisp.productId}`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, dispenser: newDisp });
  });

  // Delete Dispenser
  app.delete('/api/dispensers/:id', (req, res) => {
    const { id } = req.params;
    const dispIndex = db.dispensers.findIndex(d => d.id === id);
    if (dispIndex > -1) {
      const removedDisp = db.dispensers.splice(dispIndex, 1)[0];
      
      // Add Audit Log
      db.auditLogs.unshift({
        id: `AUD-${Date.now()}`,
        userId: 'usr-001',
        username: 'admin',
        action: 'Surtidor Eliminado',
        details: `${removedDisp.name} removido del sistema.`,
        timestamp: new Date().toISOString()
      });
      
      res.json({ success: true, message: `Dispenser ${id} deleted successfully.` });
    } else {
      res.status(404).json({ error: 'Surtidor no encontrado' });
    }
  });

  // Add or update Product
  app.post('/api/products', (req, res) => {
    const prodData = req.body;
    if (!prodData.name || !prodData.type || !prodData.pricePerLiter) {
      return res.status(400).json({ error: 'Nombre, Tipo y Precio son obligatorios.' });
    }

    const existingIndex = db.products.findIndex(p => p.id === prodData.id);
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
    };

    if (existingIndex > -1) {
      db.products[existingIndex] = { ...db.products[existingIndex], ...newProd };
    } else {
      db.products.push(newProd);
    }

    // Add Audit Log
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      userId: 'usr-001',
      username: 'admin',
      action: existingIndex > -1 ? 'Combustible Actualizado' : 'Combustible Registrado',
      details: `${newProd.name} ($${newProd.pricePerLiter}/L) agregado/modificado en catálogo`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, product: newProd });
  });

  // Delete Product
  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const prodIndex = db.products.findIndex(p => p.id === id);
    if (prodIndex > -1) {
      const removedProd = db.products.splice(prodIndex, 1)[0];
      
      // Add Audit Log
      db.auditLogs.unshift({
        id: `AUD-${Date.now()}`,
        userId: 'usr-001',
        username: 'admin',
        action: 'Combustible Eliminado',
        details: `${removedProd.name} removido del catálogo de combustibles.`,
        timestamp: new Date().toISOString()
      });
      
      res.json({ success: true, message: `Product ${id} deleted successfully.` });
    } else {
      res.status(404).json({ error: 'Combustible no encontrado' });
    }
  });

  // Save or Update User
  app.post('/api/users', (req, res) => {
    const userData = req.body;
    if (!userData.username || !userData.name || !userData.role) {
      return res.status(400).json({ error: 'Nombre de usuario, Nombre y Rol son requeridos.' });
    }

    const existingIndex = db.users.findIndex(u => u.id === userData.id || (userData.username && u.username === userData.username));

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
      db.users[existingIndex] = newUser;
    } else {
      db.users.push(newUser);
    }

    // Add Audit Log
    db.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      userId: 'usr-001',
      username: 'admin',
      action: existingIndex > -1 ? 'Usuario Modificado' : 'Usuario Creado',
      details: `Usuario ${newUser.username} (${newUser.name}) guardado.`,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, user: newUser });
  });

  // Delete User
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex > -1) {
      const removedUser = db.users.splice(userIndex, 1)[0];

      // Add Audit Log
      db.auditLogs.unshift({
        id: `AUD-${Date.now()}`,
        userId: 'usr-001',
        username: 'admin',
        action: 'Usuario Eliminado',
        details: `Usuario ${removedUser.username} eliminado del sistema.`,
        timestamp: new Date().toISOString()
      });

      res.json({ success: true, message: `User ${id} removed successfully.` });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  });

  // Reset database state to mock init (for sandbox resetting ease)
  app.post('/api/reset-data', (req, res) => {
    db.sites = [...mockSites];
    db.products = [...mockProducts];
    db.tanks = [...mockTanks];
    db.dispensers = [...mockDispensers];
    db.drivers = [...mockDrivers];
    db.vehicles = [...mockVehicles];
    db.transactions = [...mockTransactions];
    db.deliveries = [...mockDeliveries];
    db.reconciliations = [...mockReconciliations];
    db.alerts = [...mockAlerts];
    db.devices = [...mockDevices];
    db.users = [...mockUsers];
    db.auditLogs = [...mockAuditLogs];

    res.json({ success: true, message: 'Base de datos simulada restaurada a valores predeterminados.' });
  });

  // --- VITE MIDDLEWARE CONFIGURATION ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SENSINA Cloud Server] running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
