/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'supervisor' | 'operator' | 'technician' | 'readonly';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: Role;
  siteId?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  taxId: string;
  active: boolean;
  createdAt: string;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'gasoil' | 'nafta' | 'premium' | 'urea' | 'lubricants' | 'other';
  referenceDensity: number; // kg/m^3 at 15°C
  color: string; // Tailwind border or bg color class
  hexColor: string; // Hex code for custom styling/charts
  pricePerLiter: number;
  minStock: number;
  maxStock: number;
  unit: string; // "L" or "Kg"
  active: boolean;
  createdAt: string;
}

export interface Tank {
  id: string;
  siteId: string;
  productId: string;
  name: string;
  capacityLiters: number;
  heightMm: number;
  // Current real-time states
  currentVolumeLiters: number;
  currentHeightMm: number;
  temperatureC: number;
  waterMm: number;
  batteryV: number;
  batteryPercent: number;
  signalRssi: number;
  sensorStatus: 'normal' | 'low_stock' | 'critical_low' | 'high_level' | 'no_comm' | 'leak_suspect';
  sensorType: 'hydrostatic' | 'magnetostrictive' | 'ultrasonic' | 'manual';
  modbusAddress?: string;
  lastUpdated: string;
  createdAt: string;
}

export interface TankMeasurement {
  id: string;
  tankId: string;
  timestamp: string;
  heightMm: number;
  volumeLiters: number;
  temperatureC: number;
  waterMm: number;
  batteryV: number;
  signalRssi: number;
}

export type DispenserState = 'available' | 'calling' | 'authorized' | 'dispensing' | 'completed' | 'offline' | 'error';

export interface Dispenser {
  id: string;
  siteId: string;
  name: string; // e.g., "Surtidor 01"
  hose: number;
  productId: string;
  suctionTankId?: string;
  status: DispenserState;
  lastSaleLiters: number;
  lastSaleAmount: number;
  activeDriver?: string;
  activeVehicle?: string;
  activePlate?: string;
  odometerReading?: number;
  authorizationMethod?: 'RFID' | 'QR' | 'APP' | 'MANUAL';
  lastUpdated: string;
  createdAt: string;
}

export interface FuelTransaction {
  id: string;
  siteId: string;
  dispenserId: string;
  hose: number;
  productId: string;
  liters: number;
  amount: number;
  pricePerLiter: number;
  driverId?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  odometer?: number;
  timestampStart: string;
  timestampEnd: string;
  authorizationMethod: 'RFID' | 'QR' | 'APP' | 'MANUAL';
  status: 'completed' | 'voided' | 'pending' | 'flagged';
  notes?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  document: string;
  rfidCard: string;
  enabledVehicles?: string[]; // IDs of vehicles authorized to driver
  dailyLimitLiters: number;
  monthlyLimitLiters: number;
  active: boolean;
  costCenter: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  type: string;
  costCenter: string;
  tankCapacityLiters: number;
  expectedKmL: number;
  lastOdometer: number;
  active: boolean;
  createdAt: string;
}

export interface Delivery {
  id: string;
  timestamp: string;
  supplier: string;
  invoiceNumber: string;
  productId: string;
  tankId: string;
  litersDeclared: number;
  litersMeasuredBefore: number;
  litersMeasuredAfter: number;
  differenceLiters: number;
  temperatureC: number;
  density?: number;
  operator: string;
  notes?: string;
  hasAttachmentUrl?: boolean;
}

export interface InventoryReconciliation {
  id: string;
  periodStart: string;
  periodEnd: string;
  productId: string;
  initialStock: number;
  deliveries: number;
  dispensed: number;
  adjustments: number;
  theoreticalStock: number;
  measuredStock: number;
  differenceLiters: number;
  differencePct: number;
  status: 'acceptable' | 'warning' | 'critical';
  suspicionType?: 'normal' | 'table_error' | 'unregistered_delivery' | 'unregistered_dispense' | 'leak_suspect' | 'theft_suspect' | 'temperature_shift';
  createdAt: string;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  timestamp: string;
  source: string; // e.g. "Tanque 01", "Surtidor S03", "Sistema"
  description: string;
  status: 'new' | 'acknowledged' | 'resolved';
  resolvedBy?: string;
  comments?: string;
  recommendation: string;
}

export interface DeviceRegistry {
  id: string;
  deviceId: string; // e.g. "SENSINA-TX-0001"
  siteId: string;
  type: 'tank_telemetry' | 'dispenser_controller' | 'gateway';
  apiKey: string;
  lastSeen: string;
  status: 'online' | 'offline';
  description: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export type SensorStatus = 'normal' | 'low_stock' | 'critical_low' | 'high_level' | 'error' | 'offline';

export interface TelemetryPayload {
  device_id?: string;
  site_id?: string;
  tank_id: string;
  timestamp?: string;
  height_mm: number;
  volume_liters: number;
  capacity_liters?: number;
  temperature_c: number;
  water_mm: number;
  battery_v: number;
  battery_percent: number;
  signal_rssi: number;
  sensor_status: SensorStatus;
  received_at?: string;
  source_ip?: string;
  event_type?: 'tank_telemetry';
}

export interface TelemetryResponse {
  ok: boolean;
  data: TelemetryPayload | null;
  message?: string;
  error?: string;
}

// ENDPOINT 2: DESPACHOS / CARGAS DE COMBUSTIBLE
export type FuelTransactionStatus = 'pending' | 'authorized' | 'dispensing' | 'completed' | 'cancelled' | 'error' | 'rejected';
export type AuthorizationMethod = 'manual' | 'RFID' | 'QR' | 'app' | 'operator' | 'external_pos' | 'unknown';

export interface FuelTransactionPayload {
  device_id: string;
  site_id: string;
  transaction_id: string;
  timestamp_start: string;
  timestamp_end: string;
  dispenser_id: string;
  hose_id: string;
  nozzle: number;
  product: string;
  product_id: string;
  liters: number;
  amount: number;
  price_per_liter: number;
  driver_id?: string;
  driver_name?: string;
  vehicle_id?: string;
  vehicle_plate?: string;
  odometer?: number;
  authorization_method: AuthorizationMethod;
  authorization_id?: string;
  status: FuelTransactionStatus;
  received_at?: string;
  event_type?: 'fuel_transaction';
}

export interface FuelTransactionResponse {
  ok: boolean;
  data: FuelTransactionPayload | null;
  message?: string;
  error?: string;
}

// ENDPOINT 3: ESTADO DE SURTIDORES
export type DispenserStatusType = 'available' | 'calling' | 'authorized' | 'dispensing' | 'completed' | 'offline' | 'error' | 'locked' | 'maintenance';

export interface DispenserStatusItem {
  dispenser_id: string;
  hose_id: string;
  nozzle: number;
  product: string;
  status: DispenserStatusType;
  last_transaction_id: string | null;
  last_sale_liters: number;
  last_sale_amount: number;
  current_liters: number;
  current_amount: number;
  error_code: string | null;
  operator_message: string;
}

export interface DispenserStatusPayload {
  device_id: string;
  site_id: string;
  timestamp: string;
  dispensers: DispenserStatusItem[];
  received_at?: string;
  event_type?: 'dispenser_status';
}

export interface DispenserStatusResponse {
  ok: boolean;
  data: DispenserStatusPayload | null;
  message?: string;
  error?: string;
}

// ENDPOINT 4: ALARMAS
export type AlarmType = 'liquid_leak' | 'gas_leak' | 'low_stock' | 'critical_low_stock' | 'high_level' | 'water_detected' | 'battery_low' | 'sensor_error' | 'communication_lost' | 'dispenser_error' | 'unauthorized_fueling' | 'inventory_difference' | 'power_failure' | 'tamper' | 'generic';
export type AlarmSeverity = 'info' | 'warning' | 'critical';
export type AlarmSourceType = 'tank_sensor' | 'leak_sensor' | 'gas_sensor' | 'dispenser' | 'gateway' | 'battery' | 'system' | 'manual';
export type AlarmStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlarmPayload {
  device_id: string;
  site_id: string;
  timestamp: string;
  alarm_id: string;
  alarm_type: AlarmType;
  severity: AlarmSeverity;
  source_type: AlarmSourceType;
  source_id: string;
  tank_id?: string | null;
  dispenser_id?: string | null;
  message: string;
  value: number;
  unit: string;
  status: AlarmStatus;
  received_at?: string;
  event_type?: 'alarm';
}

export interface AlarmResponse {
  ok: boolean;
  data: AlarmPayload | null;
  message?: string;
  error?: string;
}

