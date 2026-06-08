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

export const mockSites: Site[] = [
  { id: 'ESTACION-001', name: 'Estación Norte', location: 'Ruta 9, Km 280, Rosario', active: true, createdAt: '2025-01-10T08:00:00Z' },
  { id: 'ESTACION-002', name: 'Planta Industrial Sur', location: 'Parque Industrial, Bahía Blanca', active: true, createdAt: '2025-02-15T09:00:00Z' },
  { id: 'ESTACION-003', name: 'Base Logística Oeste', location: 'Acceso Oeste, Km 45, Luján', active: true, createdAt: '2025-03-01T10:00:00Z' }
];

export const mockProducts: Product[] = [
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

export const mockTanks: Tank[] = [
  {
    id: 'TQ-01',
    siteId: 'ESTACION-001',
    productId: 'GO2',
    name: 'Tanque 1 - Gasoil G2',
    capacityLiters: 40000,
    heightMm: 2500,
    currentVolumeLiters: 23500,
    currentHeightMm: 1468,
    temperatureC: 22.4,
    waterMm: 0,
    batteryV: 3.72,
    batteryPercent: 84,
    signalRssi: -72,
    sensorStatus: 'normal',
    sensorType: 'magnetostrictive',
    modbusAddress: '1',
    lastUpdated: '2026-06-04T01:10:00Z',
    createdAt: '2025-01-10T11:00:00Z'
  },
  {
    id: 'TQ-02',
    siteId: 'ESTACION-001',
    productId: 'GP',
    name: 'Tanque 2 - Gasoil G3',
    capacityLiters: 30000,
    heightMm: 2200,
    currentVolumeLiters: 7200, // Bajo stock
    currentHeightMm: 528,
    temperatureC: 21.8,
    waterMm: 4, // Alerta leve agua
    batteryV: 3.65,
    batteryPercent: 78,
    signalRssi: -65,
    sensorStatus: 'low_stock',
    sensorType: 'magnetostrictive',
    modbusAddress: '2',
    lastUpdated: '2026-06-04T01:08:00Z',
    createdAt: '2025-01-10T11:30:00Z'
  },
  {
    id: 'TQ-03',
    siteId: 'ESTACION-001',
    productId: 'NS',
    name: 'Tanque 3 - Nafta Súper',
    capacityLiters: 25000,
    heightMm: 2000,
    currentVolumeLiters: 19800,
    currentHeightMm: 1584,
    temperatureC: 23.1,
    waterMm: 0,
    batteryV: 3.84,
    batteryPercent: 92,
    signalRssi: -74,
    sensorStatus: 'normal',
    sensorType: 'magnetostrictive',
    modbusAddress: '3',
    lastUpdated: '2026-06-04T01:11:00Z',
    createdAt: '2025-01-10T12:00:00Z'
  },
  {
    id: 'TQ-04',
    siteId: 'ESTACION-002',
    productId: 'GO2',
    name: 'Tanque Industrial G2 A',
    capacityLiters: 50000,
    heightMm: 3000,
    currentVolumeLiters: 48900, // Alto nivel
    currentHeightMm: 2934,
    temperatureC: 18.5,
    waterMm: 0,
    batteryV: 3.55, // Batería baja
    batteryPercent: 12,
    signalRssi: -82,
    sensorStatus: 'high_level',
    sensorType: 'hydrostatic',
    modbusAddress: '10',
    lastUpdated: '2026-06-04T00:55:00Z',
    createdAt: '2025-02-15T12:00:00Z'
  },
  {
    id: 'TQ-05',
    siteId: 'ESTACION-002',
    productId: 'GP',
    name: 'Tanque Urea Arnox',
    capacityLiters: 10000,
    heightMm: 1800,
    currentVolumeLiters: 8900,
    currentHeightMm: 1602,
    temperatureC: 19.2,
    waterMm: 0,
    batteryV: 3.91,
    batteryPercent: 99,
    signalRssi: -58,
    sensorStatus: 'normal',
    sensorType: 'ultrasonic',
    modbusAddress: '11',
    lastUpdated: '2026-06-04T00:59:00Z',
    createdAt: '2025-02-15T12:30:00Z'
  },
  {
    id: 'TQ-06',
    siteId: 'ESTACION-003',
    productId: 'GO2',
    name: 'Tanque Logística G2 B',
    capacityLiters: 30000,
    heightMm: 2200,
    currentVolumeLiters: 18400,
    currentHeightMm: 1349,
    temperatureC: 20.3,
    waterMm: 0,
    batteryV: 1.20, // Sin batería real o desconectado
    batteryPercent: 1,
    signalRssi: -110, // Muy mala señal
    sensorStatus: 'no_comm',
    sensorType: 'hydrostatic',
    modbusAddress: '20',
    lastUpdated: '2026-06-03T23:45:00Z', // Hace más de una hora
    createdAt: '2025-03-01T15:00:00Z'
  }
];

export const mockDispensers: Dispenser[] = [
  {
    id: 'S01',
    siteId: 'ESTACION-001',
    name: 'Surtidor 01 (Islote 1)',
    hose: 1,
    productId: 'GO2',
    suctionTankId: 'TQ-01',
    status: 'dispensing',
    lastSaleLiters: 154.2,
    lastSaleAmount: 186644,
    activeDriver: 'Federico Villagra',
    activeVehicle: 'Camión Cisterna 01 (Scania R450)',
    activePlate: 'AA-450-XX',
    odometerReading: 345670,
    authorizationMethod: 'RFID',
    lastUpdated: '2026-06-04T01:13:00Z',
    createdAt: '2025-01-10T14:00:00Z'
  },
  {
    id: 'S02',
    siteId: 'ESTACION-001',
    name: 'Surtidor 02 (Islote 1)',
    hose: 2,
    productId: 'NS',
    suctionTankId: 'TQ-03',
    status: 'available',
    lastSaleLiters: 45.0,
    lastSaleAmount: 57640,
    lastUpdated: '2026-06-04T01:12:00Z',
    createdAt: '2025-01-10T14:15:00Z'
  },
  {
    id: 'S03',
    siteId: 'ESTACION-001',
    name: 'Surtidor 03 (Islote 2)',
    hose: 3,
    productId: 'GP',
    suctionTankId: 'TQ-02',
    status: 'calling',
    lastSaleLiters: 280.0,
    lastSaleAmount: 406056,
    activeDriver: 'Juan Pérez',
    activeVehicle: 'Semirremolque Sider 03',
    activePlate: 'AD-892-JJ',
    odometerReading: 120540,
    authorizationMethod: 'RFID',
    lastUpdated: '2026-06-04T01:13:30Z',
    createdAt: '2025-01-10T14:30:00Z'
  },
  {
    id: 'S04',
    siteId: 'ESTACION-001',
    name: 'Surtidor 04 (Islote 2)',
    hose: 4,
    productId: 'NS',
    suctionTankId: 'TQ-03', // No physical separate premium tank exists, sucked from supervisor premium mapped tank
    status: 'authorized',
    lastSaleLiters: 65.5,
    lastSaleAmount: 102212,
    activeDriver: 'Carlos Gómez',
    activeVehicle: 'Pick-up Mantenimiento (Toyota Hilux)',
    activePlate: 'AB-123-CD',
    odometerReading: 145230,
    authorizationMethod: 'APP',
    lastUpdated: '2026-06-04T01:10:00Z',
    createdAt: '2025-01-10T14:45:00Z'
  },
  {
    id: 'S05',
    siteId: 'ESTACION-002',
    name: 'Despacho Industrial Interno',
    hose: 1,
    productId: 'GO2',
    suctionTankId: 'TQ-04',
    status: 'completed',
    lastSaleLiters: 840.0,
    lastSaleAmount: 1016736,
    activeDriver: 'María Rodríguez',
    activeVehicle: 'Generador Principal A',
    activePlate: 'GEN-01-IND',
    authorizationMethod: 'MANUAL',
    lastUpdated: '2026-06-04T00:54:00Z',
    createdAt: '2025-02-15T15:00:00Z'
  },
  {
    id: 'S06',
    siteId: 'ESTACION-002',
    name: 'Despacho Urea Interno',
    hose: 2,
    productId: 'GP',
    suctionTankId: 'TQ-05',
    status: 'available',
    lastSaleLiters: 22.0,
    lastSaleAmount: 21560,
    lastUpdated: '2026-06-04T00:48:00Z',
    createdAt: '2025-02-15T15:10:00Z'
  },
  {
    id: 'S07',
    siteId: 'ESTACION-003',
    name: 'Despacho Logística Flota',
    hose: 1,
    productId: 'GO2',
    suctionTankId: 'TQ-06',
    status: 'offline', // Sin comunicación
    lastSaleLiters: 110.0,
    lastSaleAmount: 133144,
    lastUpdated: '2026-06-03T23:45:00Z',
    createdAt: '2025-03-01T16:00:00Z'
  },
  {
    id: 'S08',
    siteId: 'ESTACION-003',
    name: 'Despacho Auxiliar Nafta',
    hose: 2,
    productId: 'NS',
    status: 'error', // Estado crítico
    lastSaleLiters: 15.0,
    lastSaleAmount: 19213,
    lastUpdated: '2026-06-04T00:10:00Z',
    createdAt: '2025-03-01T16:15:00Z'
  }
];

export const mockDrivers: Driver[] = [
  { id: 'DRV-001', name: 'Juan Pérez', document: '28.345.981', rfidCard: 'RFID-9843-01', enabledVehicles: ['VEH-001', 'VEH-002'], dailyLimitLiters: 200, monthlyLimitLiters: 3000, active: true, costCenter: 'Logística Oeste', createdAt: '2025-01-15T10:00:00Z' },
  { id: 'DRV-002', name: 'Carlos Gómez', document: '31.254.912', rfidCard: 'RFID-1243-02', enabledVehicles: ['VEH-002'], dailyLimitLiters: 150, monthlyLimitLiters: 2000, active: true, costCenter: 'Mantenimiento Técnico', createdAt: '2025-01-15T10:15:00Z' },
  { id: 'DRV-003', name: 'María Rodríguez', document: '25.983.473', rfidCard: 'RFID-4512-03', enabledVehicles: ['VEH-003'], dailyLimitLiters: 1000, monthlyLimitLiters: 15000, active: true, costCenter: 'Generación Industrial', createdAt: '2025-02-18T11:00:00Z' },
  { id: 'DRV-004', name: 'Federico Villagra', document: '27.411.092', rfidCard: 'RFID-1100-04', enabledVehicles: ['VEH-004', 'VEH-005'], dailyLimitLiters: 900, monthlyLimitLiters: 18000, active: true, costCenter: 'Logística Rosario', createdAt: '2025-01-12T09:00:00Z' },
  { id: 'DRV-005', name: 'Leandro Mercado', document: '33.821.492', rfidCard: 'RFID-7711-05', enabledVehicles: ['VEH-005'], dailyLimitLiters: 500, monthlyLimitLiters: 10000, active: true, costCenter: 'Logística Rosario', createdAt: '2025-01-12T09:30:00Z' },
  { id: 'DRV-006', name: 'Mariano Altuna', document: '29.384.102', rfidCard: 'RFID-5522-06', enabledVehicles: ['VEH-006'], dailyLimitLiters: 400, monthlyLimitLiters: 8000, active: true, costCenter: 'Transporte Agro', createdAt: '2025-02-01T08:00:00Z' },
  { id: 'DRV-007', name: 'Guillermo Ortelli', document: '24.129.584', rfidCard: 'RFID-8833-07', enabledVehicles: ['VEH-007'], dailyLimitLiters: 600, monthlyLimitLiters: 12000, active: false, costCenter: 'Transporte Agro', createdAt: '2025-02-01T08:30:00Z' }, // Inactivo
  { id: 'DRV-008', name: 'Christian Ledesma', document: '26.849.201', rfidCard: 'RFID-9944-08', enabledVehicles: ['VEH-001', 'VEH-008'], dailyLimitLiters: 300, monthlyLimitLiters: 5000, active: true, costCenter: 'Distribución Norte', createdAt: '2025-03-05T09:15:00Z' }
];

export const mockVehicles: Vehicle[] = [
  { id: 'VEH-001', plate: 'AB-123-CD', brand: 'Toyota', model: 'Hilux 4x4', type: 'Pick-up', costCenter: 'Mantenimiento Técnico', tankCapacityLiters: 80, expectedKmL: 10.5, lastOdometer: 145230, active: true, createdAt: '2025-01-15T11:00:00Z' },
  { id: 'VEH-002', plate: 'AD-892-JJ', brand: 'Ford', model: 'Ranger Raptor', type: 'Pick-up', costCenter: 'Supervisión de Base', tankCapacityLiters: 80, expectedKmL: 8.4, lastOdometer: 120540, active: true, createdAt: '2025-01-15T11:15:00Z' },
  { id: 'VEH-003', plate: 'GEN-01-IND', brand: 'Caterpillar', model: 'CAT-3512', type: 'Generador', costCenter: 'Generación Industrial', tankCapacityLiters: 2000, expectedKmL: 0.1, lastOdometer: 8520, active: true, createdAt: '2025-02-18T12:00:00Z' }, // km es horas en generadores
  { id: 'VEH-004', plate: 'AA-450-XX', brand: 'Scania', model: 'R450 Heavy', type: 'Camión Cisterna', costCenter: 'Logística Rosario', tankCapacityLiters: 450, expectedKmL: 3.2, lastOdometer: 345670, active: true, createdAt: '2025-01-12T10:00:00Z' },
  { id: 'VEH-005', plate: 'AA-510-ZZ', brand: 'Mercedes-Benz', model: 'Actros 2651', type: 'Camión Sider', costCenter: 'Logística Rosario', tankCapacityLiters: 500, expectedKmL: 3.5, lastOdometer: 198530, active: true, createdAt: '2025-01-12T10:30:00Z' },
  { id: 'VEH-006', plate: 'AE-320-MM', brand: 'John Deere', model: '8345R', type: 'Tractor Agrícola', costCenter: 'Siembra Campo 1', tankCapacityLiters: 600, expectedKmL: 1.5, lastOdometer: 3410, active: true, createdAt: '2025-02-01T09:10:00Z' },
  { id: 'VEH-007', plate: 'AF-710-DD', brand: 'Iveco', model: 'Stralis 600', type: 'Camión Tolva', costCenter: 'Cosecha Campo 2', tankCapacityLiters: 400, expectedKmL: 3.0, lastOdometer: 54120, active: false, createdAt: '2025-02-01T09:40:00Z' }, // Inactivo
  { id: 'VEH-008', plate: 'AG-912-BB', brand: 'Chevrolet', model: 'S10 CD', type: 'Pick-up', costCenter: 'Distribución Norte', tankCapacityLiters: 76, expectedKmL: 11.2, lastOdometer: 24150, active: true, createdAt: '2025-03-05T10:00:00Z' }
];

export const mockTransactions: FuelTransaction[] = [
  {
    id: 'TX-20260603-001',
    siteId: 'ESTACION-001',
    dispenserId: 'S01',
    hose: 1,
    productId: 'GO2',
    liters: 154.2,
    amount: 186644,
    pricePerLiter: 1210.40,
    driverId: 'DRV-004',
    vehicleId: 'VEH-004',
    vehiclePlate: 'AA-450-XX',
    odometer: 345670,
    timestampStart: '2026-06-03T21:20:00Z',
    timestampEnd: '2026-06-03T21:32:00Z',
    authorizationMethod: 'RFID',
    status: 'completed',
    createdAt: '2026-06-03T21:32:00Z'
  },
  {
    id: 'TX-20260603-002',
    siteId: 'ESTACION-001',
    dispenserId: 'S02',
    hose: 2,
    productId: 'NS',
    liters: 45.0,
    amount: 57640,
    pricePerLiter: 1280.90,
    driverId: 'DRV-002',
    vehicleId: 'VEH-001',
    vehiclePlate: 'AB-123-CD',
    odometer: 145185,
    timestampStart: '2026-06-03T18:10:00Z',
    timestampEnd: '2026-06-03T18:14:15Z',
    authorizationMethod: 'APP',
    status: 'completed',
    createdAt: '2026-06-03T18:14:15Z'
  },
  {
    id: 'TX-20260603-003',
    siteId: 'ESTACION-001',
    dispenserId: 'S04',
    hose: 4,
    productId: 'NS',
    liters: 65.5,
    amount: 102212,
    pricePerLiter: 1560.50,
    driverId: 'DRV-002',
    vehicleId: 'VEH-002',
    vehiclePlate: 'AD-892-JJ',
    odometer: 120540,
    timestampStart: '2026-06-03T14:40:00Z',
    timestampEnd: '2026-06-03T14:44:30Z',
    authorizationMethod: 'RFID',
    status: 'completed',
    createdAt: '2026-06-03T14:44:30Z'
  },
  {
    id: 'TX-20260603-004',
    siteId: 'ESTACION-002',
    dispenserId: 'S05',
    hose: 1,
    productId: 'GO2',
    liters: 840.0,
    amount: 1016736,
    pricePerLiter: 1210.40,
    driverId: 'DRV-003',
    vehicleId: 'VEH-003',
    vehiclePlate: 'GEN-01-IND',
    odometer: 8520,
    timestampStart: '2026-06-03T09:00:00Z',
    timestampEnd: '2026-06-03T09:54:00Z',
    authorizationMethod: 'MANUAL',
    status: 'completed',
    createdAt: '2026-06-03T09:54:00Z'
  },
  {
    id: 'TX-20260603-005',
    siteId: 'ESTACION-002',
    dispenserId: 'S06',
    hose: 2,
    productId: 'GP',
    liters: 22.0,
    amount: 21560,
    pricePerLiter: 980.00,
    driverId: 'DRV-003',
    vehicleId: 'VEH-005',
    vehiclePlate: 'AA-510-ZZ',
    odometer: 198530,
    timestampStart: '2026-06-03T08:30:00Z',
    timestampEnd: '2026-06-03T08:32:00Z',
    authorizationMethod: 'RFID',
    status: 'completed',
    createdAt: '2026-06-03T08:32:00Z'
  },
  {
    id: 'TX-20260602-001',
    siteId: 'ESTACION-001',
    dispenserId: 'S03',
    hose: 3,
    productId: 'GP',
    liters: 320.0,
    amount: 464064,
    pricePerLiter: 1450.20,
    driverId: 'DRV-005',
    vehicleId: 'VEH-005',
    vehiclePlate: 'AA-510-ZZ',
    odometer: 198210,
    timestampStart: '2026-06-02T16:15:00Z',
    timestampEnd: '2026-06-02T16:28:10Z',
    authorizationMethod: 'RFID',
    status: 'completed',
    createdAt: '2026-06-02T16:28:10Z'
  },
  {
    id: 'TX-20260602-002',
    siteId: 'ESTACION-003',
    dispenserId: 'S07',
    hose: 1,
    productId: 'GO2',
    liters: 245.5,
    amount: 297153,
    pricePerLiter: 1210.40,
    driverId: 'DRV-006',
    vehicleId: 'VEH-006',
    vehiclePlate: 'AE-320-MM',
    odometer: 3290,
    timestampStart: '2026-06-02T11:00:00Z',
    timestampEnd: '2026-06-02T11:12:00Z',
    authorizationMethod: 'RFID',
    status: 'completed',
    createdAt: '2026-06-02T11:12:00Z'
  },
  {
    id: 'TX-20260602-003',
    siteId: 'ESTACION-001',
    dispenserId: 'S01',
    hose: 1,
    productId: 'GO2',
    liters: 86.4,
    amount: 104578,
    pricePerLiter: 1210.40,
    driverId: 'DRV-008',
    vehicleId: 'VEH-008',
    vehiclePlate: 'AG-912-BB',
    odometer: 24150,
    timestampStart: '2026-06-02T09:30:00Z',
    timestampEnd: '2026-06-02T09:34:00Z',
    authorizationMethod: 'QR',
    status: 'completed',
    createdAt: '2026-06-02T09:34:00Z'
  },
  {
    id: 'TX-20260602-004',
    siteId: 'ESTACION-001',
    dispenserId: 'S02',
    hose: 2,
    productId: 'NS',
    liters: 55.0,
    amount: 70449,
    pricePerLiter: 1280.90,
    driverId: 'DRV-001',
    vehicleId: 'VEH-001',
    vehiclePlate: 'AB-123-CD',
    odometer: 145020,
    timestampStart: '2026-06-02T08:15:00Z',
    timestampEnd: '2026-06-02T08:18:45Z',
    authorizationMethod: 'APP',
    status: 'completed',
    createdAt: '2026-06-02T08:18:45Z'
  },
  // Alerta transacciones simuladas sospechosas/observadas
  {
    id: 'TX-20260601-015',
    siteId: 'ESTACION-001',
    dispenserId: 'S01',
    hose: 1,
    productId: 'GO2',
    liters: 450.0,
    amount: 544680,
    pricePerLiter: 1210.40,
    driverId: 'DRV-004',
    vehicleId: 'VEH-004',
    vehiclePlate: 'AA-450-XX',
    odometer: 345210,
    timestampStart: '2026-06-01T23:30:00Z', // Fuera de horario
    timestampEnd: '2026-06-01T23:45:00Z',
    authorizationMethod: 'RFID',
    status: 'flagged',
    notes: 'Consumo registrado fuera de horario operativo habitual de la unidad',
    createdAt: '2026-06-01T23:45:00Z'
  },
  // Agregamos más transacciones para completar 30 y que los gráficos tengan volumen representativo
  ...Array.from({ length: 20 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i % 15) - 1);
    const lit = Math.floor(Math.random() * 120) + 30;
    const prodIdx = i % mockProducts.length;
    const p = mockProducts[prodIdx];
    const drivers = mockDrivers.filter(drv => drv.active);
    const drv = drivers[i % drivers.length];
    const vehs = mockVehicles.filter(v => v.active);
    const veh = vehs[i % vehs.length];
    return {
      id: `TX-HIST-${20260500 + i}`,
      siteId: i % 2 === 0 ? 'ESTACION-001' : 'ESTACION-002',
      dispenserId: `S0${(i % 5) + 1}`,
      hose: (i % 2) + 1,
      productId: p.id,
      liters: lit,
      amount: Math.round(lit * p.pricePerLiter),
      pricePerLiter: p.pricePerLiter,
      driverId: drv.id,
      vehicleId: veh.id,
      vehiclePlate: veh.plate,
      odometer: veh.lastOdometer - Math.floor(Math.random() * 2000) - 100,
      timestampStart: d.toISOString().replace(/T.*/, 'T10:00:00Z'),
      timestampEnd: d.toISOString().replace(/T.*/, 'T10:07:00Z'),
      authorizationMethod: 'RFID' as const,
      status: 'completed' as const,
      createdAt: d.toISOString().replace(/T.*/, 'T10:07:00Z')
    };
  })
];

export const mockDeliveries: Delivery[] = [
  {
    id: 'DL-001',
    timestamp: '2026-06-01T15:30:00Z',
    supplier: 'YPF Distribución Directa',
    invoiceNumber: '0001-00049281',
    productId: 'GO2',
    tankId: 'TQ-01',
    litersDeclared: 15000,
    litersMeasuredBefore: 12000,
    litersMeasuredAfter: 26900,
    differenceLiters: -100, // Menos de lo declarado
    temperatureC: 20.2,
    density: 841.5,
    operator: 'Carlos Gómez',
    notes: 'Descarga finalizada con control de precintos conforme.',
    hasAttachmentUrl: true
  },
  {
    id: 'DL-002',
    timestamp: '2026-05-28T10:15:00Z',
    supplier: 'Shell CAPS S.A.',
    invoiceNumber: '0005-00129482',
    productId: 'GP',
    tankId: 'TQ-02',
    litersDeclared: 10000,
    litersMeasuredBefore: 2100,
    litersMeasuredAfter: 12030,
    differenceLiters: -70,
    temperatureC: 19.8,
    density: 834.9,
    operator: 'Federico Villagra',
    notes: 'Diferencia menor por contracción por temperatura de arribo.',
    hasAttachmentUrl: true
  },
  {
    id: 'DL-003',
    timestamp: '2026-05-25T11:00:00Z',
    supplier: 'Axion Energy Agro',
    invoiceNumber: '0002-09431201',
    productId: 'NS',
    tankId: 'TQ-03',
    litersDeclared: 8000,
    litersMeasuredBefore: 12100,
    litersMeasuredAfter: 20120,
    differenceLiters: 20, // Más de lo declarado
    temperatureC: 22.0,
    density: 736.2,
    operator: 'Juan Pérez',
    notes: 'Descarga normal.',
    hasAttachmentUrl: false
  },
  {
    id: 'DL-004',
    timestamp: '2026-05-22T08:45:00Z',
    supplier: 'YPF Agro Planta',
    invoiceNumber: '0001-00048392',
    productId: 'GO2',
    tankId: 'TQ-04',
    litersDeclared: 20000,
    litersMeasuredBefore: 29200,
    litersMeasuredAfter: 48900,
    differenceLiters: -300, // Diferencia sospechosa
    temperatureC: 17.5,
    density: 839.8,
    operator: 'María Rodríguez',
    notes: 'Observada: Discrepancia del caudalímetro analógico del camión vs telemedición magnetostrictiva.',
    hasAttachmentUrl: true
  },
  {
    id: 'DL-005',
    timestamp: '2026-05-18T14:00:00Z',
    supplier: 'ProUrea S.A.',
    invoiceNumber: '0008-00010928',
    productId: 'GP',
    tankId: 'TQ-05',
    litersDeclared: 3000,
    litersMeasuredBefore: 6050,
    litersMeasuredAfter: 9040,
    differenceLiters: -10,
    temperatureC: 18.0,
    density: 1091.2,
    operator: 'María Rodríguez',
    notes: 'Descarga en contenedor plástico IBC centralizado.',
    hasAttachmentUrl: false
  }
];

export const mockReconciliations: InventoryReconciliation[] = [
  {
    id: 'REC-202605',
    periodStart: '2026-05-01T00:00:00Z',
    periodEnd: '2026-05-31T23:59:59Z',
    productId: 'GO2',
    initialStock: 18000,
    deliveries: 35000,
    dispensed: 32600,
    adjustments: -150, // Purgado de cisterna
    theoreticalStock: 20250,
    measuredStock: 19830,
    differenceLiters: -420, // Posible robo o error del sensor de temperatura
    differencePct: -2.07,
    status: 'critical',
    suspicionType: 'leak_suspect',
    createdAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'REC-202605-G3',
    periodStart: '2026-05-01T00:00:00Z',
    periodEnd: '2026-05-31T23:59:59Z',
    productId: 'GP',
    initialStock: 5300,
    deliveries: 10000,
    dispensed: 8120,
    adjustments: 0,
    theoreticalStock: 7180,
    measuredStock: 7145,
    differenceLiters: -35,
    differencePct: -0.48,
    status: 'acceptable',
    suspicionType: 'normal',
    createdAt: '2026-06-01T08:30:00Z'
  },
  {
    id: 'REC-202605-SUP',
    periodStart: '2026-05-01T00:00:00Z',
    periodEnd: '2026-05-31T23:59:59Z',
    productId: 'NS',
    initialStock: 14500,
    deliveries: 8000,
    dispensed: 11200,
    adjustments: -80, // Limpieza de filtro
    theoreticalStock: 11220,
    measuredStock: 11115,
    differenceLiters: -105,
    differencePct: -0.93,
    status: 'warning',
    suspicionType: 'temperature_shift',
    createdAt: '2026-06-01T09:00:00Z'
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'ALT-01',
    level: 'warning',
    timestamp: '2026-06-04T01:08:00Z',
    source: 'Tanque 2 - Gasoil G3',
    description: 'Bajo Stock de Gasoil Grado 3 detected: Volumen actual 7.200 L está muy cercano al stock mínimo (6.000 L). Autonomía sugerida: 2.2 días.',
    status: 'new',
    recommendation: 'Programar carga con el Distribuidor de G3 para evitar quiebre de stock.'
  },
  {
    id: 'ALT-02',
    level: 'critical',
    timestamp: '2026-06-04T00:55:00Z',
    source: 'Tanque Industrial G2 A',
    description: 'Nivel Alto Crítico (Sobre-llenado): Volumen actual 48.900 L excede el 97% de la capacidad operativa segura (50.000 L).',
    status: 'new',
    recommendation: 'Detener de inmediato cualquier operación de descarga o retrobombeo a esta unidad.'
  },
  {
    id: 'ALT-03',
    level: 'critical',
    timestamp: '2026-06-03T23:45:00Z',
    source: 'Tanque Logística G2 B',
    description: 'Pérdida de Comunicación de Sensor: El transductor hidrostático no reporta tramas Modbus/HTTPS desde hace más de 1 hora.',
    status: 'new',
    recommendation: 'Verificar alimentación eléctrica del tablero ESP32 y repetidores inalámbricos de la Base Luján.'
  },
  {
    id: 'ALT-04',
    level: 'warning',
    timestamp: '2026-06-04T00:10:00Z',
    source: 'Despacho Auxiliar Nafta',
    description: 'Estado de Surtidor S08 con Código de Error 102 (Válvula de impulsión trabada o falla de pulsador de caudal).',
    status: 'new',
    recommendation: 'Contactar de forma urgente al servicio técnico oficial para calibración mecánica de la manguera nro 2.'
  },
  {
    id: 'ALT-05',
    level: 'warning',
    timestamp: '2026-06-03T11:20:00Z',
    source: 'Camión Tolva Iveco Stralis',
    description: 'Carga de Combustible con Patente bloqueada AF-710-DD: Vehículo se encuentra temporalmente inhabilitado en flota.',
    status: 'acknowledged',
    resolvedBy: 'Carlos Gómez',
    comments: 'Se autorizó manualmente debido a emergencia en la cosecha de campo 2.',
    recommendation: 'Actualizar estado administrativo de la unidad de transporte en la sección de control de flotas.'
  },
  {
    id: 'ALT-06',
    level: 'warning',
    timestamp: '2026-06-02T16:15:00Z',
    source: 'Tanque 2 - Gasoil G3',
    description: 'Detector de Agua Activado: Se detectó un espesor de fase acuosa libre de 4 mm en fondo de tanque.',
    status: 'acknowledged',
    resolvedBy: 'Juan Pérez',
    comments: 'Pendiente purgado el fin de semana.',
    recommendation: 'Coordinar purgado de cisterna antes de recibir la nueva descarga registrada para evitar contaminación de combustible.'
  },
  {
    id: 'ALT-07',
    level: 'critical',
    timestamp: '2026-06-01T08:00:00Z',
    source: 'Conciliación de Inventario',
    description: 'Diferencia acumulada Crítica en Gasoil G2 de -420 L (-2.07%) en el consolidado de Mayo.',
    status: 'new',
    recommendation: 'Realizar auditoría física de hermeticidad de las tuberías y revisar calibración del caudalímetro del Surtidor S01.'
  },
  {
    id: 'ALT-08',
    level: 'info',
    timestamp: '2026-06-03T18:00:00Z',
    source: 'Dispositivo SENSINA-TX-0004',
    description: 'Batería de sensor hidrostático en nivel bajo (12%). Voltaje actual: 3.55 Vcc.',
    status: 'new',
    recommendation: 'Prever cambio de pack de litio o verificar panel solar asociado en la próxima visita técnica.'
  },
  {
    id: 'ALT-09',
    level: 'warning',
    timestamp: '2026-06-03T21:30:00Z',
    source: 'Surtidor 01 (Rosario)',
    description: 'Consumo anómalo: Patente AA-450-XX superó el consumo promedio semanal asignado en un 25%.',
    status: 'resolved',
    resolvedBy: 'Carlos Gómez',
    comments: 'Se aumentó la ruta por reprogramación logística estacional.',
    recommendation: 'Revaluar límites de combustible asignados al chofer o cambiar perfil de consumo de la unidad Hilux/Scania.'
  },
  {
    id: 'ALT-10',
    level: 'info',
    timestamp: '2026-06-01T15:30:00Z',
    source: 'Descargas de combustible',
    description: 'Descarga finalizada en Tanque 1 con diferencia menor de -100 L frente a lo declarado en remito físico.',
    status: 'resolved',
    resolvedBy: 'Carlos Gómez',
    comments: 'Diferencia dentro de márgenes de contracción volumétrica tolerada.',
    recommendation: 'No se requieren acciones mecánicas inmediatas.'
  }
];

export const mockDevices: DeviceRegistry[] = [
  { id: 'dev-001', deviceId: 'SENSINA-TX-0001', siteId: 'ESTACION-001', type: 'tank_telemetry', apiKey: 'sensina_key_rosario_001_abc98', lastSeen: '2026-06-04T01:10:00Z', status: 'online', description: 'Concentrador de Tanques Telemedición Magnetostrictiva Rosario' },
  { id: 'dev-002', deviceId: 'SENSINA-TX-0002', siteId: 'ESTACION-001', type: 'dispenser_controller', apiKey: 'sensina_key_rosario_002_xyz12', lastSeen: '2026-06-04T01:13:30Z', status: 'online', description: 'Controladora de Surtidores PAM-PC Rosario' },
  { id: 'dev-003', deviceId: 'SENSINA-TX-0003', siteId: 'ESTACION-002', type: 'tank_telemetry', apiKey: 'sensina_key_bahia_003_def45', lastSeen: '2026-06-04T00:59:00Z', status: 'online', description: 'Transmisor Ultrasónico Urea y Presión Hidrostática Tanque Industrial' },
  { id: 'dev-004', deviceId: 'SENSINA-TX-0004', siteId: 'ESTACION-003', type: 'tank_telemetry', apiKey: 'sensina_key_lujan_004_ghi67', lastSeen: '2026-06-03T23:45:00Z', status: 'offline', description: 'ESP32 Telemetría Hidrostática Luján (Sin Red / Baja Batería)' }
];

export const mockUsers: User[] = [
  { id: 'usr-001', name: 'Administrador FuelStock', email: 'admin@sensina.cloud', username: 'admin', role: 'admin', active: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'usr-002', name: 'Carlos Gómez (Resp. Rosario)', email: 'carlos.gomez@sensina.cloud', username: 'cgomez', role: 'supervisor', siteId: 'ESTACION-001', active: true, createdAt: '2025-01-10T10:00:00Z' },
  { id: 'usr-003', name: 'María Rodríguez (Bahía Blanca)', email: 'maria.rod@sensina.cloud', username: 'mrodriguez', role: 'operator', siteId: 'ESTACION-002', active: true, createdAt: '2025-02-15T11:00:00Z' },
  { id: 'usr-004', name: 'Soporte Técnico SENSINA', email: 'tecnico@sensina.cloud', username: 'tech_support', role: 'technician', active: true, createdAt: '2025-01-01T00:00:00Z' }
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'log-001', userId: 'usr-001', username: 'admin', action: 'Configuración de Parámetros', details: 'Se actualizó el stock mínimo del Gasoil Grado 2 a 8.000 L', timestamp: '2026-06-03T18:30:00Z' },
  { id: 'log-002', userId: 'usr-002', username: 'cgomez', action: 'Autorización de Despacho', details: 'Autorización de manguera manually en Surtidor S03 para patente AD-892-JJ', timestamp: '2026-06-03T21:15:00Z' },
  { id: 'log-003', userId: 'usr-003', username: 'mrodriguez', action: 'Registro de Descarga', details: 'Se agregó remito 0001-00048392 para Tanque Industrial G2 A por 20.000 L', timestamp: '2026-06-03T10:00:00Z' },
  { id: 'log-004', userId: 'usr-001', username: 'admin', action: 'Gestión de Terminal', details: 'Dispositivo SENSINA-TX-0004 fue editado y reasignado a Luján', timestamp: '2026-06-02T15:20:00Z' }
];

// Datos históricos simulados para el gráfico de evolución de stock diario
// Gasoil G2 para los últimos 15 días
export const mockHistoricalStockData = Array.from({ length: 15 }).map((_, idx) => {
  const date = new Date();
  date.setDate(date.getDate() - (14 - idx));
  const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
  
  // Variación basada en consumos simulados y recargas
  // En el día 10 (hace 5 días) hubo una descarga importante de unos 15.000 L
  let levelG2 = 25000 - (14 - idx) * 1100;
  if (idx >= 10) {
    levelG2 += 15000;
  }
  // Añadimos fluctuaciones aleatorias sutiles
  levelG2 += Math.floor(Math.sin(idx) * 400);

  let levelG3 = 12000 - (14 - idx) * 450;
  if (idx >= 8) {
    levelG3 += 10000;
  }
  levelG3 += Math.floor(Math.cos(idx) * 200);

  return {
    name: dateStr,
    'Gasoil G2 (L)': Math.max(3000, Math.round(levelG2)),
    'Gasoil G3 (L)': Math.max(2000, Math.round(levelG3)),
    'Nafta Súper (L)': Math.max(4000, Math.round(18000 + Math.sin(idx * 1.5) * 1500)),
    'Urea (L)': Math.max(800, Math.round(5000 + idx * 250))
  };
});

// Consumos diarios por producto de las últimas 2 semanas
export const mockDailyConsumptionData = [
  { name: 'Lun 21', 'Rosario': 1200, 'Bahía Blanca': 850, 'Luján': 600 },
  { name: 'Mar 22', 'Rosario': 1450, 'Bahía Blanca': 900, 'Luján': 710 },
  { name: 'Mié 23', 'Rosario': 1100, 'Bahía Blanca': 1200, 'Luján': 650 },
  { name: 'Jue 24', 'Rosario': 1300, 'Bahía Blanca': 950, 'Luján': 800 },
  { name: 'Vie 25', 'Rosario': 1800, 'Bahía Blanca': 1110, 'Luján': 950 },
  { name: 'Sáb 26', 'Rosario': 900, 'Bahía Blanca': 300, 'Luján': 400 },
  { name: 'Dom 27', 'Rosario': 450, 'Bahía Blanca': 150, 'Luján': 180 },
  { name: 'Lun 28', 'Rosario': 1350, 'Bahía Blanca': 880, 'Luján': 690 },
  { name: 'Mar 29', 'Rosario': 1410, 'Bahía Blanca': 930, 'Luján': 700 },
  { name: 'Mié 30', 'Rosario': 1250, 'Bahía Blanca': 990, 'Luján': 620 },
  { name: 'Jue 31', 'Rosario': 1380, 'Bahía Blanca': 1050, 'Luján': 750 },
  { name: 'Vie 01', 'Rosario': 1950, 'Bahía Blanca': 1200, 'Luján': 990 },
  { name: 'Sáb 02', 'Rosario': 850, 'Bahía Blanca': 350, 'Luján': 420 },
  { name: 'Dom 03', 'Rosario': 480, 'Bahía Blanca': 120, 'Luján': 150 }
];
