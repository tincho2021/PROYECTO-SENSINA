/**
 * C.E.S.T.I. TELEMETRIA
 * Page: Esp32Live.tsx
 * 
 * Interfaz ultra-minimalista enfocada en proporcionar las credenciales de conexión (URL, API KEY)
 * y el estado de enlace del dispositivo ESP32 en tiempo real.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Wifi,
  Battery,
  Thermometer,
  Database,
  ArrowDown,
  Copy,
  Check,
  Signal,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { fetchLatestTelemetry } from '../services/telemetryService';
import { TelemetryPayload } from '../types';
const getEsp32CodeTemplate = (baseUrl: string) => `#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h> // Requiere la librería ArduinoJson (v6 o v7)

// ======================================================
// CONFIGURACIÓN WIFI
// ======================================================

const char* ssid     = "SU_WIFI_SSID";
const char* password = "SU_WIFI_PASSWORD";

// ======================================================
// CONFIGURACIÓN GENERAL DEL SITIO / ESTACIÓN
// ======================================================

const char* site_id       = "ESTACION-ECONORTE";
const char* site_name     = "ESCOBAR";
const char* site_location = "Av. Circunvalacion 1420, Rosario";

// ======================================================
// SERVIDOR CENTRAL C.E.S.T.I. COOPERATIVO
// ======================================================

const char* base_url = "${baseUrl}";
const char* api_key  = "cesti-demo-key-123";

// ======================================================
// SERVIDOR WEB LOCAL DEL ESP32 (Simulador Puerto 80)
// ======================================================

WebServer server(80);

// ======================================================
// ESTRUCTURAS DE DATOS DE TELEMETRÍA Y SURTIDORES
// ======================================================

struct Tank {
  String tank_id;
  String tank_name;
  int height_mm;
  float volume_liters;
  float capacity_liters;
  float temperature_c;
  int water_mm;
  float battery_v;
  int battery_percent;
  int signal_rssi;
  String sensor_status;
  String product_id;
  String product_name;
  String product_type;
  float product_price;
  int product_density;
  String product_color;
};

struct Nozzle {
  String dispenser_id;
  int nozzle;
  String status;
  String product_id;
  String suction_tank_id;
  bool fueling;
  float current_sale_liters;
  float current_sale_amount;
  float last_sale_liters;
  float last_sale_amount;
  String driver;
  String vehicle;
  String plate;
  long odometer;
  String authorization_method;
  float flow_liters_per_second;
};

// ======================================================
// CACHE LOCAL DE FLOTA AUTORIZADA (Sincronización Cloud)
// ======================================================

struct AllowedDriver {
  String id;
  String name;
  String rfid_card;
};

struct AllowedVehicle {
  String id;
  String plate;
  String brand;
  String model;
};

AllowedDriver cached_drivers[15];
int cached_drivers_count = 0;

AllowedVehicle cached_vehicles[15];
int cached_vehicles_count = 0;

// ======================================================
// DATOS INICIALES (MOCK SIMULADO)
// ======================================================

Tank tanks[3] = {
  {
    "tank_01",
    "Cisterna Gasoil Premium",
    2150,
    21500,
    30000,
    16.4,
    0,
    3.62,
    100,
    -55,
    "normal",
    "GP",
    "Gasoil Grado 3 Infinia Diesel",
    "premium",
    1450.20,
    835,
    "#0d9488"
  },
  {
    "tank_02",
    "Cisterna Diesel Comun",
    1520,
    12160,
    20000,
    15.8,
    4,
    3.60,
    96,
    -58,
    "normal",
    "GO2",
    "Gasoil Grado 2 Ultra Diesel",
    "gasoil",
    1210.40,
    840,
    "#10b981"
  },
  {
    "tank_03",
    "Cisterna Nafta Super",
    940,
    7050,
    15000,
    17.2,
    0,
    3.61,
    98,
    -62,
    "normal",
    "NS",
    "Nafta Super",
    "nafta",
    1280.90,
    735,
    "#3b82f6"
  }
};

Nozzle nozzles[2] = {
  {
    "surtidor_01",
    1,
    "available",
    "GP",
    "tank_01",
    false,
    0,
    0,
    45.5,
    65984.10,
    "",
    "",
    "",
    0,
    "RFID",
    0.25
  },
  {
    "surtidor_02",
    1,
    "available",
    "NS",
    "tank_03",
    false,
    0,
    0,
    0,
    0,
    "",
    "",
    "",
    0,
    "RFID",
    0.20
  }
};

// ======================================================
// TEMPORIZACIÓN DEL SIMULADOR
// ======================================================

unsigned long lastSimulationMillis = 0;
const unsigned long simulationInterval = 1000;

// ======================================================
// HTML DE LA INTERFAZ WEB LOCAL (SERVIDO POR EL ESP32)
// ======================================================

const char MAIN_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Simulador C.E.S.T.I. - ESP32</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; background: #0f172a; color: #e5e7eb; margin: 0; padding: 20px; }
    h1, h2 { color: #38bdf8; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.35); }
    label { display: block; margin-top: 8px; font-size: 13px; color: #cbd5e1; }
    input, select { width: 100%; padding: 8px; margin-top: 3px; border-radius: 6px; border: 1px solid #475569; background: #020617; color: white; box-sizing: border-box; }
    button { margin-top: 10px; padding: 10px 12px; border: none; border-radius: 8px; background: #0284c7; color: white; font-weight: bold; cursor: pointer; }
    button:hover { background: #0369a1; }
    .danger { background: #dc2626; }
    .danger:hover { background: #b91c1c; }
    .success { background: #16a34a; }
    .success:hover { background: #15803d; }
    .warning { background: #d97706; }
    .warning:hover { background: #b45309; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .row button { flex: 1; }
    .small { font-size: 12px; color: #94a3b8; }
    .bar { height: 16px; background: #020617; border: 1px solid #475569; border-radius: 10px; overflow: hidden; margin-top: 8px; }
    .fill { height: 100%; background: #22c55e; width: 0%; }
    .status { font-weight: bold; color: #facc15; }
    pre { background: #020617; padding: 12px; border-radius: 8px; overflow-x: auto; color: #a7f3d0; font-family: monospace; }
    .fleet-box { background: rgba(56, 189, 248, 0.08); border: 1px dashed #38bdf8; border-radius: 8px; padding: 12px; margin-top: 12px; margin-bottom: 12px; }
    .fleet-title { font-weight: bold; color: #38bdf8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>Simulador de Telemetría ESP32</h1>
  <p class="small">Controlador de Tanques, Mangueras y Despachos con Sincronización de Flota</p>

  <div class="row">
    <button type="button" class="success" onclick="sendAll()">Enviar todo al servidor</button>
    <button type="button" class="warning" onclick="syncFleetPlatform()">Sincronizar Flota desde Server</button>
    <button type="button" onclick="loadState(true)">Actualizar pantalla</button>
  </div>

  <h2>Tanques</h2>
  <div id="tanks" class="grid"></div>

  <h2>Puntos de carga</h2>
  <div id="nozzles" class="grid"></div>

  <h2>Respuesta / Registro de Red</h2>
  <pre id="log">Sonda offline en espera...</pre>

<script>
let state = null;
let editing = false;
let refreshTimer = null;

function log(msg) {
  document.getElementById("log").textContent = msg;
}

function markEditing() { editing = true; }

function stopEditingSoon() {
  setTimeout(() => {
    const active = document.activeElement;
    const isInput = active && (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA");
    if (!isInput) editing = false;
  }, 300);
}

async function loadState(force = false) {
  if (editing && !force) return;
  try {
    const res = await fetch("/api/state?nocache=" + Date.now());
    state = await res.json();
    render();
  } catch (e) {
    log("Error cargando estado: " + e);
  }
}

function render() {
  renderTanks();
  renderNozzles();
}

function renderTanks() {
  const cont = document.getElementById("tanks");
  cont.innerHTML = "";
  state.tanks.forEach((t, i) => {
    const percent = Math.min(100, Math.max(0, (t.volume_liters / t.capacity_liters) * 100));
    cont.innerHTML += '<div class="card">' +
      '<h3>' + t.tank_id + '</h3>' +
      '<div class="small">' + t.tank_name + '</div>' +
      '<div class="bar"><div class="fill" style="width:' + percent + '%"></div></div>' +
      '<div class="small">' + percent.toFixed(1) + ' % de capacidad</div>' +
      '<label>Volumen litros</label>' +
      '<input id="volume_liters_' + i + '" type="number" step="0.1" value="' + t.volume_liters + '" onfocus="markEditing()" onblur="stopEditingSoon()">' +
      '<label>Temperatura °C</label>' +
      '<input id="temperature_c_' + i + '" type="number" step="0.1" value="' + t.temperature_c + '" onfocus="markEditing()" onblur="stopEditingSoon()">' +
      '<button type="button" onclick="saveTank(' + i + ')">Guardar tanque</button>' +
      '</div>';
  });
}

function renderNozzles() {
  const cont = document.getElementById("nozzles");
  cont.innerHTML = "";
  state.nozzles.forEach((n, i) => {
    let driverOptions = '<option value="">-- Manual o Sin Asociar --</option>';
    if (state.cached_drivers && state.cached_drivers.length > 0) {
      state.cached_drivers.forEach(d => {
        driverOptions += '<option value="' + d.name + '" data-rfid="' + d.rfid_card + '" ' + (n.driver == d.name ? "selected" : "") + '>' + d.name + ' (' + d.rfid_card + ')</option>';
      });
    }

    let vehicleOptions = '<option value="">-- Manual o Sin Asociar --</option>';
    if (state.cached_vehicles && state.cached_vehicles.length > 0) {
      state.cached_vehicles.forEach(v => {
        vehicleOptions += '<option value="' + v.brand + ' ' + v.model + '" data-plate="' + v.plate + '" ' + (n.plate == v.plate ? "selected" : "") + '>' + v.brand + ' ' + v.model + ' [' + v.plate + ']</option>';
      });
    }

    cont.innerHTML += '<div class="card">' +
      '<h3>' + n.dispenser_id + ' - Manguera ' + n.nozzle + '</h3>' +
      '<p>Estado: <span class="status">' + n.status + '</span></p>' +
      '<div class="fleet-box">' +
      '<div class="fleet-title">⚡ Vincular de Flota Cloud</div>' +
      '<label>Seleccionar Chofer</label>' +
      '<select id="select_driver_' + i + '" onchange="autofillDriver(' + i + ')">' + driverOptions + '</select>' +
      '<label>Seleccionar Vehículo</label>' +
      '<select id="select_vehicle_' + i + '" onchange="autofillVehicle(' + i + ')">' + vehicleOptions + '</select>' +
      '</div>' +
      '<label>Chofer</label>' +
      '<input id="driver_' + i + '" value="' + (n.driver || "") + '" onfocus="markEditing()" onblur="stopEditingSoon()">' +
      '<label>Vehículo</label>' +
      '<input id="vehicle_' + i + '" value="' + (n.vehicle || "") + '" onfocus="markEditing()" onblur="stopEditingSoon()">' +
      '<label>Patente</label>' +
      '<input id="plate_' + i + '" value="' + (n.plate || "") + '" onfocus="markEditing()" onblur="stopEditingSoon()">' +
      '<label>Odómetro</label>' +
      '<input id="odometer_' + i + '" type="number" value="' + (n.odometer || 100000) + '" onfocus="markEditing()" onblur="stopEditingSoon()">' +
      '<label>Método autorización</label>' +
      '<input id="authorization_method_' + i + '" value="' + (n.authorization_method || "RFID") + '" onfocus="markEditing()" onblur="stopEditingSoon()">' +
      '<p>Despacho actual: ' + Number(n.current_sale_liters).toFixed(2) + ' L / $' + Number(n.current_sale_amount).toFixed(2) + '</p>' +
      '<p>Último despacho: ' + Number(n.last_sale_liters).toFixed(2) + ' L / $' + Number(n.last_sale_amount).toFixed(2) + '</p>' +
      '<button type="button" onclick="saveNozzle(' + i + ')">Guardar datos de despacho</button>' +
      '<div class="row">' +
      '<button type="button" class="success" onclick="startFueling(' + i + ')">Iniciar</button>' +
      '<button type="button" class="danger" onclick="stopFueling(' + i + ')">Detener</button>' +
      '<button type="button" class="warning" onclick="resetSale(' + i + ')">Reset</button>' +
      '</div>' +
      '</div>';
  });
}

function autofillDriver(i) {
  const sel = document.getElementById("select_driver_" + i);
  if (!sel) return;
  const val = sel.value;
  if (!val) {
    document.getElementById("driver_" + i).value = "";
    return;
  }
  const opt = sel.options[sel.selectedIndex];
  const rfid = opt.getAttribute("data-rfid");
  document.getElementById("driver_" + i).value = val;
  document.getElementById("authorization_method_" + i).value = "RFID";
}

function autofillVehicle(i) {
  const sel = document.getElementById("select_vehicle_" + i);
  if (!sel) return;
  const val = sel.value;
  if (!val) {
    document.getElementById("vehicle_" + i).value = "";
    document.getElementById("plate_" + i).value = "";
    return;
  }
  const opt = sel.options[sel.selectedIndex];
  const plate = opt.getAttribute("data-plate");
  document.getElementById("vehicle_" + i).value = val;
  document.getElementById("plate_" + i).value = plate;
}

async function saveTank(i) {
  const data = {
    index: i,
    volume_liters: Number(document.getElementById("volume_liters_" + i).value),
    temperature_c: Number(document.getElementById("temperature_c_" + i).value)
  };
  const res = await fetch("/api/tank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  log(await res.text());
  await loadState(true);
}

async function saveNozzle(i) {
  const data = {
    index: i,
    driver: document.getElementById("driver_" + i).value,
    vehicle: document.getElementById("vehicle_" + i).value,
    plate: document.getElementById("plate_" + i).value,
    odometer: Number(document.getElementById("odometer_" + i).value),
    authorization_method: document.getElementById("authorization_method_" + i).value
  };
  const res = await fetch("/api/nozzle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  log(await res.text());
  await loadState(true);
}

async function startFueling(i) {
  const res = await fetch("/api/nozzle/start?index=" + i);
  log(await res.text());
  await loadState(true);
}

async function stopFueling(i) {
  const res = await fetch("/api/nozzle/stop?index=" + i);
  log(await res.text());
  await loadState(true);
}

async function resetSale(i) {
  const res = await fetch("/api/nozzle/reset?index=" + i);
  log(await res.text());
  await loadState(true);
}

async function sendAll() {
  const res = await fetch("/api/send");
  log(await res.text());
}

async function syncFleetPlatform() {
  log("Conectando con plataforma central... Descargando flotas...");
  try {
    const res = await fetch("/api/sync-fleet");
    log(await res.text());
    await loadState(true);
  } catch(e) {
    log("Error de sincronizacion: " + e);
  }
}

setInterval(() => { if (!editing) loadState(false); }, 2000);
loadState(true);
</script>
</body>
</html>
)rawliteral";

// ======================================================
// UTILIDADES COMPLEMENTARIAS
// ======================================================

int findTankIndexById(String id) {
  for (int i = 0; i < 3; i++) {
    if (tanks[i].tank_id == id) return i;
  }
  return -1;
}

// Envía un POST HTTPS tolerando redirecciones y certificados vencidos (SSL Insecure)
int realizarPostHTTPS(String url, String json_str) {
  HTTPClient http;
  int httpCode = -1;
  if (url.startsWith("https")) {
    WiFiClientSecure client;
    client.setInsecure();
    if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", "Bearer " + String(api_key));
      httpCode = http.POST(json_str);
      http.end();
    }
  } else {
    WiFiClient client;
    if (http.begin(client, url)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", "Bearer " + String(api_key));
      httpCode = http.POST(json_str);
      http.end();
    }
  }
  return httpCode;
}

// Descarga choferes/vehículos activos para cachear de manera offline en el ESP32
void checkAndSyncFleet() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = String(base_url) + "/api/fleet";
  int httpCode = -1;
  String payload = "";

  if (url.startsWith("https")) {
    WiFiClientSecure client;
    client.setInsecure();
    if (http.begin(client, url)) {
      http.addHeader("Authorization", "Bearer " + String(api_key));
      httpCode = http.GET();
      if (httpCode == 200) payload = http.getString();
      http.end();
    }
  } else {
    WiFiClient client;
    if (http.begin(client, url)) {
      http.addHeader("Authorization", "Bearer " + String(api_key));
      httpCode = http.GET();
      if (httpCode == 200) payload = http.getString();
      http.end();
    }
  }

  if (httpCode == 200 && payload != "") {
    DynamicJsonDocument doc(12000);
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      JsonArray drivers = doc["drivers"];
      cached_drivers_count = 0;
      for (JsonObject d : drivers) {
        if (cached_drivers_count >= 15) break;
        cached_drivers[cached_drivers_count].id = d["id"].as<String>();
        cached_drivers[cached_drivers_count].name = d["name"].as<String>();
        cached_drivers[cached_drivers_count].rfid_card = d["rfid_card"].as<String>();
        cached_drivers_count++;
      }
      JsonArray vehicles = doc["vehicles"];
      cached_vehicles_count = 0;
      for (JsonObject v : vehicles) {
        if (cached_vehicles_count >= 15) break;
        cached_vehicles[cached_vehicles_count].id = v["id"].as<String>();
        cached_vehicles[cached_vehicles_count].plate = v["plate"].as<String>();
        cached_vehicles[cached_vehicles_count].brand = v["brand"].as<String>();
        cached_vehicles[cached_vehicles_count].model = v["model"].as<String>();
        cached_vehicles_count++;
      }
      Serial.printf("[C.E.S.T.I. FLOTA] Sincronizado: %d choferes y %d vehiculos.\\n", cached_drivers_count, cached_vehicles_count);
    }
  }
}

// Envía la telemetría individual de una cisterna
bool sendTankTelemetry(int i) {
  DynamicJsonDocument doc(2048);
  doc["tank_id"] = tanks[i].tank_id;
  doc["height_mm"] = tanks[i].height_mm;
  doc["volume_liters"] = tanks[i].volume_liters;
  doc["temperature_c"] = tanks[i].temperature_c;
  doc["water_mm"] = tanks[i].water_mm;
  doc["battery_v"] = tanks[i].battery_v;
  doc["battery_percent"] = tanks[i].battery_percent;
  doc["signal_rssi"] = WiFi.RSSI();
  doc["sensor_status"] = tanks[i].sensor_status;
  doc["capacity_liters"] = tanks[i].capacity_liters;
  doc["product_id"] = tanks[i].product_id;
  doc["product_name"] = tanks[i].product_name;
  doc["product_type"] = tanks[i].product_type;
  doc["product_price"] = tanks[i].product_price;
  doc["product_density"] = tanks[i].product_density;
  doc["product_color"] = tanks[i].product_color;
  doc["tank_name"] = tanks[i].tank_name;
  doc["site_id"] = site_id;
  doc["site_name"] = site_name;
  doc["site_location"] = site_location;

  String json;
  serializeJson(doc, json);
  return realizarPostHTTPS(String(base_url) + "/api/telemetry", json) == 200;
}

// Envía el estado del playón definiendo qué mangueras succionan de qué tanques
bool sendDispenserStatus() {
  DynamicJsonDocument doc(4096);
  doc["site_id"] = site_id;
  doc["site_name"] = site_name;
  doc["site_location"] = site_location;
  JsonArray dispensers = doc.createNestedArray("dispensers");
  for (int i = 0; i < 2; i++) {
    JsonObject d = dispensers.createNestedObject();
    d["dispenser_id"] = nozzles[i].dispenser_id;
    d["status"] = nozzles[i].status;
    d["nozzle"] = nozzles[i].nozzle;
    d["product_id"] = nozzles[i].product_id;
    d["suction_tank_id"] = nozzles[i].suction_tank_id;
    d["current_sale_liters"] = nozzles[i].current_sale_liters;
    d["current_sale_amount"] = nozzles[i].current_sale_amount;
    d["last_sale_liters"] = nozzles[i].last_sale_liters;
    d["last_sale_amount"] = nozzles[i].last_sale_amount;
    d["driver"] = nozzles[i].driver;
    d["vehicle"] = nozzles[i].vehicle;
    d["plate"] = nozzles[i].plate;
    d["odometer"] = nozzles[i].odometer;
    d["authorization_method"] = nozzles[i].authorization_method;
  }
  String json;
  serializeJson(doc, json);
  return realizarPostHTTPS(String(base_url) + "/api/dispenser-status", json) == 200;
}

// Envía y asienta el despacho final para reducir stock y registrar la transacción
void registrarTransaccionCompletada(const char* tx_id, const char* disp_id, int nozzle, const char* prod_id, float litros, float monto, const char* driver, const char* vehicle, const char* plate, int odometro) {
  DynamicJsonDocument doc(1024);
  doc["transaction_id"] = tx_id;
  doc["dispenser_id"] = disp_id;
  doc["hose"] = nozzle;
  doc["product_id"] = prod_id;
  doc["liters"] = litros;
  doc["amount"] = monto;
  doc["price_per_liter"] = monto / litros;
  doc["driver_id"] = driver;
  doc["vehicle_id"] = vehicle;
  doc["vehicle_plate"] = plate;
  doc["odometer"] = odometro;
  doc["authorization_method"] = "RFID";

  String json_str;
  serializeJson(doc, json_str);
  int code = realizarPostHTTPS(String(base_url) + "/api/fuel-transactions", json_str);
  Serial.printf("[C.E.S.T.I. DESPACHO] Post Transaccion: %d\\n", code);
}

// Simulor cíclico de caudal de combustible
void updateSimulation() {
  unsigned long now = millis();
  if (now - lastSimulationMillis < simulationInterval) return;
  lastSimulationMillis = now;
  for (int i = 0; i < 2; i++) {
    if (!nozzles[i].fueling) continue;
    int tankIndex = findTankIndexById(nozzles[i].suction_tank_id);
    if (tankIndex < 0 || tanks[tankIndex].volume_liters <= 0) {
      nozzles[i].fueling = false;
      nozzles[i].status = "available";
      continue;
    }
    float litersToAdd = nozzles[i].flow_liters_per_second;
    float price = tanks[tankIndex].product_price;
    if (tanks[tankIndex].volume_liters < litersToAdd) litersToAdd = tanks[tankIndex].volume_liters;
    nozzles[i].current_sale_liters += litersToAdd;
    nozzles[i].current_sale_amount = nozzles[i].current_sale_liters * price;
    tanks[tankIndex].volume_liters -= litersToAdd;
  }
}

// ======================================================
// MANEJADORES DE SERVIDORES WEB (ESP32 LOCAL)
// ======================================================

void handleRoot() { server.send_P(200, "text/html", MAIN_page); }

void handleState() {
  DynamicJsonDocument doc(8192);
  doc["site_id"] = site_id;
  doc["site_name"] = site_name;
  JsonArray tankArray = doc.createNestedArray("tanks");
  for (int i = 0; i < 3; i++) {
    JsonObject t = tankArray.createNestedObject();
    t["tank_id"] = tanks[i].tank_id;
    t["tank_name"] = tanks[i].tank_name;
    t["volume_liters"] = tanks[i].volume_liters;
    t["capacity_liters"] = tanks[i].capacity_liters;
    t["temperature_c"] = tanks[i].temperature_c;
  }
  JsonArray nozzleArray = doc.createNestedArray("nozzles");
  for (int i = 0; i < 2; i++) {
    JsonObject n = nozzleArray.createNestedObject();
    n["dispenser_id"] = nozzles[i].dispenser_id;
    n["nozzle"] = nozzles[i].nozzle;
    n["status"] = nozzles[i].status;
    n["product_id"] = nozzles[i].product_id;
    n["suction_tank_id"] = nozzles[i].suction_tank_id;
    n["fueling"] = nozzles[i].fueling;
    n["current_sale_liters"] = nozzles[i].current_sale_liters;
    n["current_sale_amount"] = nozzles[i].current_sale_amount;
    n["last_sale_liters"] = nozzles[i].last_sale_liters;
    n["last_sale_amount"] = nozzles[i].last_sale_amount;
    n["driver"] = nozzles[i].driver;
    n["vehicle"] = nozzles[i].vehicle;
    n["plate"] = nozzles[i].plate;
    n["odometer"] = nozzles[i].odometer;
    n["authorization_method"] = nozzles[i].authorization_method;
  }

  JsonArray dArr = doc.createNestedArray("cached_drivers");
  for (int i = 0; i < cached_drivers_count; i++) {
    JsonObject dObj = dArr.createNestedObject();
    dObj["id"] = cached_drivers[i].id;
    dObj["name"] = cached_drivers[i].name;
    dObj["rfid_card"] = cached_drivers[i].rfid_card;
  }
  JsonArray vArr = doc.createNestedArray("cached_vehicles");
  for (int i = 0; i < cached_vehicles_count; i++) {
    JsonObject vObj = vArr.createNestedObject();
    vObj["id"] = cached_vehicles[i].id;
    vObj["plate"] = cached_vehicles[i].plate;
    vObj["brand"] = cached_vehicles[i].brand;
    vObj["model"] = cached_vehicles[i].model;
  }

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleUpdateTank() {
  DynamicJsonDocument doc(1024);
  deserializeJson(doc, server.arg("plain"));
  int index = doc["index"] | 0;
  if (doc.containsKey("volume_liters")) tanks[index].volume_liters = doc["volume_liters"];
  if (doc.containsKey("temperature_c")) tanks[index].temperature_c = doc["temperature_c"];
  server.send(200, "text/plain", "Tanque actualizado");
}

void handleUpdateNozzle() {
  DynamicJsonDocument doc(1536);
  deserializeJson(doc, server.arg("plain"));
  int index = doc["index"] | 0;
  if (doc.containsKey("driver")) nozzles[index].driver = doc["driver"].as<String>();
  if (doc.containsKey("vehicle")) nozzles[index].vehicle = doc["vehicle"].as<String>();
  if (doc.containsKey("plate")) nozzles[index].plate = doc["plate"].as<String>();
  if (doc.containsKey("odometer")) nozzles[index].odometer = doc["odometer"];
  if (doc.containsKey("authorization_method")) nozzles[index].authorization_method = doc["authorization_method"].as<String>();
  server.send(200, "text/plain", "Datos de despacho autorizados");
}

void handleStartFueling() {
  int index = server.arg("index").toInt();
  nozzles[index].current_sale_liters = 0;
  nozzles[index].current_sale_amount = 0;
  nozzles[index].fueling = true;
  nozzles[index].status = "fueling";
  server.send(200, "text/plain", "Combustible despachando...");
}

void handleStopFueling() {
  int index = server.arg("index").toInt();
  nozzles[index].fueling = false;
  nozzles[index].status = "available";
  nozzles[index].last_sale_liters = nozzles[index].current_sale_liters;
  nozzles[index].last_sale_amount = nozzles[index].current_sale_amount;

  if (nozzles[index].last_sale_liters > 0) {
    char txId[32];
    snprintf(txId, sizeof(txId), "TX-ESP32-%05ld", random(10000, 99999));
    registrarTransaccionCompletada(
      txId,
      nozzles[index].dispenser_id.c_str(),
      nozzles[index].nozzle,
      nozzles[index].product_id.c_str(),
      nozzles[index].last_sale_liters,
      nozzles[index].last_sale_amount,
      nozzles[index].driver.c_str(),
      nozzles[index].vehicle.c_str(),
      nozzles[index].plate.c_str(),
      nozzles[index].odometer
    );
  }
  server.send(200, "text/plain", "Despacho completado y guardado.");
}

void handleResetSale() {
  int index = server.arg("index").toInt();
  nozzles[index].current_sale_liters = 0;
  nozzles[index].current_sale_amount = 0;
  nozzles[index].last_sale_liters = 0;
  nozzles[index].last_sale_amount = 0;
  server.send(200, "text/plain", "Venta reseteada");
}

void handleSendAll() {
  bool ok = sendDispenserStatus();
  for (int i=0; i<3; i++) sendTankTelemetry(i);
  server.send(200, "text/plain", ok ? "Telemetria integral transmitida" : "Fallo de conexion parcial");
}

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(0));
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\nWiFi Conectado!");

  // Sincronizar cache de flotas activas autorizadas en inicio
  checkAndSyncFleet();

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/state", HTTP_GET, handleState);
  server.on("/api/tank", HTTP_POST, handleUpdateTank);
  server.on("/api/nozzle", HTTP_POST, handleUpdateNozzle);
  server.on("/api/nozzle/start", HTTP_GET, handleStartFueling);
  server.on("/api/nozzle/stop", HTTP_GET, handleStopFueling);
  server.on("/api/nozzle/reset", HTTP_GET, handleResetSale);
  server.on("/api/send", HTTP_GET, handleSendAll);
  server.on("/api/sync-fleet", HTTP_GET, []() {
    checkAndSyncFleet();
    server.send(200, "text/plain", "Sincronizacion de flota completada.");
  });

  server.begin();
  Serial.print("Servidor listo en: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  server.handleClient();
  updateSimulation();
}
`;

export default function Esp32Live() {
  const [customServerBase, setCustomServerBase] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cesti_custom_iot_server');
      if (saved) {
        if (saved.includes('ais-dev-')) {
          return saved.replace('ais-dev-', 'ais-pre-');
        }
        return saved;
      }
      const origin = window.location.origin;
      if (origin.includes('ais-dev-')) {
        return origin.replace('ais-dev-', 'ais-pre-');
      }
      return origin;
    }
    return 'https://velvety-vacherin-c43b91.netlify.app';
  });

  const esp32CodeTemplate = getEsp32CodeTemplate(customServerBase);

  const [inputServerBase, setInputServerBase] = useState<string>(customServerBase);
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryPayload | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPayload[]>([]);
  const [isPollingActive, setIsPollingActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const historyRef = useRef<TelemetryPayload[]>([]);

  // Copiar parámetros de conexión
  const handleCopyText = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveServerBase = (url: string) => {
    let sanitized = url.replace(/\/+$/, '').trim();
    if (sanitized.includes('ais-dev-')) {
      sanitized = sanitized.replace('ais-dev-', 'ais-pre-');
    }
    setCustomServerBase(sanitized);
    setInputServerBase(sanitized);
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const originPre = origin.includes('ais-dev-') ? origin.replace('ais-dev-', 'ais-pre-') : origin;
      if (sanitized === '' || sanitized === origin || sanitized === originPre) {
        localStorage.removeItem('cesti_custom_iot_server');
      } else {
        localStorage.setItem('cesti_custom_iot_server', sanitized);
      }
    }
  };

  const pollTelemetry = async () => {
    const data = await fetchLatestTelemetry();
    if (data) {
      setLatestTelemetry(data);
      const isNewTimestamp = !historyRef.current.some(item => item.received_at === data.received_at);
      if (isNewTimestamp && data.received_at) {
        const updatedHistory = [data, ...historyRef.current].slice(0, 15);
        historyRef.current = updatedHistory;
        setTelemetryHistory(updatedHistory);
      }
    }
  };

  useEffect(() => {
    pollTelemetry();
    let intervalId: NodeJS.Timeout | null = null;
    if (isPollingActive) {
      intervalId = setInterval(pollTelemetry, 4000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPollingActive, customServerBase]);

  const clearSessionHistory = () => {
    historyRef.current = [];
    setTelemetryHistory([]);
  };

  const formatLitersLocal = (liters: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'decimal', maximumFractionDigits: 0 }).format(liters) + ' L';
  };

  const formatDateLocal = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + 
             date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const telemetryUrl = `${customServerBase}/api/telemetry`;
  const dispenserUrl = `${customServerBase}/api/dispenser-status`;
  const transactionUrl = `${customServerBase}/api/fuel-transactions`;
  const fleetUrl = `${customServerBase}/api/fleet`;
  const apiKey = 'cesti-demo-key-123';

  return (
    <div className="space-y-6" id="esp32-live-view">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-650" />
            Integración Inalámbrica ESP32
          </h1>
          <p className="text-xs text-slate-500">Credenciales de transmisión HTTP del playón inteligente en formato JSON.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsLoading(true);
              pollTelemetry().then(() => setIsLoading(false));
            }}
            className="cursor-pointer flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono font-bold"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            REFRESCAR LECTURA
          </button>
        </div>
      </div>

      {/* Grid Central */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Parámetros de Conexión (Lado Izquierdo: 7 Columnas) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block mb-1">
                Configuración del Dispositivo
              </span>
              <h2 className="text-base font-bold text-slate-800">Parámetros de Red IoT</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Configure su boceto de C++ en el ESP32 para realizar peticiones HTTP POST estructuradas utilizando los siguientes campos:
              </p>
            </div>

            {/* Alerta de Desvío de Red para Google AI Studio */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1.5 shadow-sm">
              <div className="font-bold flex items-center gap-2 text-amber-800 text-xs uppercase">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                ¿Por qué ocurre el código HTTP 302 (Found) en ais-dev- y ais-pre-?
              </div>
              <p>
                Tanto las URLs de desarrollo (<code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-slate-800">ais-dev-</code>) como las compartidas (<code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-slate-800">ais-pre-</code>) 
                dentro de Google AI Studio están protegidas por proxies seguros que autentican la sesión del desarrollador. Cualquier petición realizada por un cliente HTTP externo sin cookies de sesión (como tu placa <strong>ESP32</strong>) 
                será redirigida a la pantalla de login de la plataforma, resultando en un código de estado <strong>HTTP 302 Found</strong>.
              </p>
              <p>
                <strong>La Solución Definitiva (Google Cloud):</strong> 
                Para conectar tu ESP32 directamente en vivo, puedes desplegar de manera gratuita esta aplicación a tu propio entorno de <strong>Google Cloud Run</strong> desde el menú superior de la interfaz de AI Studio (o utilizando la opción de Netlify/Vercel si lo prefieres para pruebas rápidos).
              </p>
              <p>
                Al desplegar el servidor en Google Cloud Run, obtendrás una URL de producción pública (por ej. <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-slate-800">https://cesti-telemetria-xxxxx.a.run.app</code>) 
                que no requiere autenticación de cookies para las APIs. Esa URL es la que debes colocar en la configuración de abajo para generar tu código C++.
              </p>
              <p className="font-semibold text-amber-800">
                ¡Actualizado con soporte SSL seguro! El código C++ inferior ahora incluye <code className="bg-amber-150 px-1 py-0.5 rounded font-mono font-bold text-slate-800">WiFiClientSecure</code> para asegurar conexiones HTTPS estables a Google Cloud.
              </p>
            </div>

            <div className="space-y-4">
              {/* Endpoint Telemetría */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>URL TELEMEDICIÓN TANQUES:</span>
                  <button
                    onClick={() => handleCopyText('tel', telemetryUrl)}
                    className="cursor-pointer flex items-center gap-1 text-teal-650 hover:text-teal-700 font-bold font-sans text-[10px]"
                  >
                    {copiedField === 'tel' ? <Check className="w-3" /> : <Copy className="w-3" />}
                    {copiedField === 'tel' ? 'Copiado' : 'Copiar URL'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 font-mono text-xs text-slate-700 rounded-xl border border-slate-200 flex justify-between items-center overflow-x-auto whitespace-nowrap">
                  {telemetryUrl}
                </div>
              </div>

              {/* Endpoint Surtidores */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>URL ESTADO REGLAMENTARIO SURTIDORES:</span>
                  <button
                    onClick={() => handleCopyText('disp', dispenserUrl)}
                    className="cursor-pointer flex items-center gap-1 text-teal-650 hover:text-teal-700 font-bold font-sans text-[10px]"
                  >
                    {copiedField === 'disp' ? <Check className="w-3" /> : <Copy className="w-3" />}
                    {copiedField === 'disp' ? 'Copiado' : 'Copiar URL'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 font-mono text-xs text-slate-700 rounded-xl border border-slate-200 flex justify-between items-center overflow-x-auto whitespace-nowrap">
                  {dispenserUrl}
                </div>
              </div>

              {/* Endpoint Transacciones */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>URL TRANSACCIONES DE COMBUSTIBLE:</span>
                  <button
                    onClick={() => handleCopyText('tx', transactionUrl)}
                    className="cursor-pointer flex items-center gap-1 text-teal-650 hover:text-teal-700 font-bold font-sans text-[10px]"
                  >
                    {copiedField === 'tx' ? <Check className="w-3" /> : <Copy className="w-3" />}
                    {copiedField === 'tx' ? 'Copiado' : 'Copiar URL'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 font-mono text-xs text-slate-700 rounded-xl border border-slate-200 flex justify-between items-center overflow-x-auto whitespace-nowrap">
                  {transactionUrl}
                </div>
              </div>

              {/* Endpoint Flotas Autorizadas */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>URL CREDENCIALES DE CHOFERES Y VEHÍCULOS (FLOTA):</span>
                  <button
                    onClick={() => handleCopyText('fleet', fleetUrl)}
                    className="cursor-pointer flex items-center gap-1 text-teal-650 hover:text-teal-700 font-bold font-sans text-[10px]"
                  >
                    {copiedField === 'fleet' ? <Check className="w-3" /> : <Copy className="w-3" />}
                    {copiedField === 'fleet' ? 'Copiado' : 'Copiar URL'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 font-mono text-xs text-slate-700 rounded-xl border border-slate-200 flex justify-between items-center overflow-x-auto whitespace-nowrap">
                  {fleetUrl}
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span>API KEY DE AUTORIZACIÓN BearerToken:</span>
                  <button
                    onClick={() => handleCopyText('key', apiKey)}
                    className="cursor-pointer flex items-center gap-1 text-teal-650 hover:text-teal-700 font-bold font-sans text-[10px]"
                  >
                    {copiedField === 'key' ? <Check className="w-3" /> : <Copy className="w-3" />}
                    {copiedField === 'key' ? 'Copiado' : 'Copiar Token'}
                  </button>
                </div>
                <div className="p-3 bg-slate-50 font-mono text-xs text-slate-700 rounded-xl border border-slate-200 flex justify-between items-center">
                  Bearer {apiKey}
                </div>
              </div>
            </div>

            {/* Selector de servidor personalizado */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div>
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">
                  Cambiar Servidor de Telemetría
                </span>
                <p className="text-[10.5px] text-slate-450 mt-0.5 leading-normal">
                  Por defecto utiliza el puerto actual. Si desea redirigir a un servidor de Netlify de producción de C.E.S.T.I., ingrese allí la dirección web:
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputServerBase}
                  onChange={(e) => setInputServerBase(e.target.value)}
                  placeholder="https://su-estacion.netlify.app"
                  className="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  onClick={() => handleSaveServerBase(inputServerBase)}
                  className="cursor-pointer text-[11px] font-extrabold px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm whitespace-nowrap text-xs flex items-center"
                >
                  Establecer
                </button>
              </div>

              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://velvety-vacherin-c43b91.netlify.app';
                    const targetUrl = origin.includes('ais-dev-') ? origin.replace('ais-dev-', 'ais-pre-') : origin;
                    setInputServerBase(targetUrl);
                    handleSaveServerBase(targetUrl);
                  }}
                  className="cursor-pointer text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 duration-150 px-2 py-1 rounded"
                >
                  Restaurar a Origin local público
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Monitoreo en Tiempo Real (Lado Derecho: 5 Columnas) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Tarjeta de Recepción en Tiempo Real */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Enlace de Datos Activos
            </span>

            <div className="flex gap-3 items-center">
              <div className={`p-2.5 rounded-full ${latestTelemetry ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-amber-50 text-amber-500 animate-pulse'}`}>
                <Signal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-700 block uppercase tracking-tight">
                  {latestTelemetry ? 'ENLACE DE SONDA ACTIVO' : 'ESPERANDO SEÑAL INALÁMBRICA'}
                </span>
                <span className="text-[10.5px] text-slate-400 block mt-0.5">
                  {latestTelemetry ? 'Recibiendo volumen continuo' : 'Por favor encienda el ESP32 para iniciar lecturas'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-100 text-slate-400">
              <span>Consulta de telemetría automática (long polling)</span>
              <button
                onClick={() => setIsPollingActive(!isPollingActive)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  isPollingActive 
                    ? 'bg-emerald-55 border border-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 border border-slate-150 text-slate-500'
                }`}
              >
                {isPollingActive ? 'ACTIVO' : 'PAUSADO'}
              </button>
            </div>
          </div>

          {/* Últimos Metadatos Recibidos */}
          {latestTelemetry && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Lecturas Instantáneas de la Sonda
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 block">Identificador Tanque</span>
                  <span className="text-sm font-bold text-slate-700 font-mono whitespace-nowrap block mt-0.5">{latestTelemetry.tank_id}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 block">Volumen Calculado</span>
                  <span className="text-sm font-black text-slate-800 font-mono block mt-0.5">{formatLitersLocal(latestTelemetry.volume_liters)}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block">Altura de Combustible</span>
                    <span className="text-xs font-bold text-slate-700 font-mono block">{latestTelemetry.height_mm} mm</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block">Temperatura Interna</span>
                    <span className="text-xs font-bold text-slate-700 font-mono block">{latestTelemetry.temperature_c.toFixed(1)} °C</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Battery className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block">Voltaje de Celda</span>
                    <span className="text-xs font-bold text-slate-700 font-mono block">{latestTelemetry.battery_v.toFixed(2)} V</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block">Calidad de Señal RSSI</span>
                    <span className="text-xs font-bold text-slate-700 font-mono block">{latestTelemetry.signal_rssi} dBm</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono text-right pb-1">
                Recibido: {formatDateLocal(latestTelemetry.received_at)}
              </div>
            </div>
          )}

          {/* Historial de Tramas Recibidas en la Sesión */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">
                Historial de Tramas en la Sesión
              </span>
              {telemetryHistory.length > 0 && (
                <button
                  onClick={clearSessionHistory}
                  className="text-[10px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpiar
                </button>
              )}
            </div>

            {telemetryHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Ninguna trama física recibida en esta sesión todavía.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {telemetryHistory.map((t, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-mono flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-700 uppercase tracking-tight text-[10px]">{t.tank_id}</span>
                      <span className="text-[9px] text-slate-400">{formatDateLocal(t.received_at).split(' ')[0]}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-450">
                      <span>{formatLitersLocal(t.volume_liters)} | {t.height_mm} mm | {t.temperature_c.toFixed(1)}°C</span>
                      <span className="text-teal-650 font-bold">{t.signal_rssi} dBm</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* CÓDIGO DE EJEMPLO COMPLETO PARA ESP32 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block mb-1">
              FIRMWARE DE INTEGRACIÓN REGLAMENTARIA
            </span>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">Código C++ de Ejemplo Completo para ESP32</h2>
            <p className="text-xs text-slate-500">
              Cargue este boceto en el IDE de Arduino para declarar y sincronizar dinámicamente cisternas, surtidores y despachos RFID.
            </p>
          </div>
          <button
            onClick={() => handleCopyText('cppCode', esp32CodeTemplate)}
            className="cursor-pointer self-start sm:self-center flex items-center gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl shadow-sm transition-all font-mono"
          >
            {copiedField === 'cppCode' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedField === 'cppCode' ? 'COPIADO' : 'COPIAR CÓDIGO C++'}
          </button>
        </div>

        <div className="bg-slate-900 text-slate-200 rounded-xl relative overflow-hidden border border-slate-800">
          <div className="bg-slate-800/60 border-b border-slate-700/60 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>cesti_esp32_iot_firmware.ino</span>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
          </div>
          <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed max-h-[480px] overflow-y-auto font-mono text-emerald-400">
            {esp32CodeTemplate}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-slate-600 leading-relaxed pt-2">
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
            <h4 className="font-bold text-slate-700 uppercase">1. Auto-configuración</h4>
            <p className="text-[11px] text-slate-500">
              No requiere declarar tanques previamente en la web. El servidor interpreta "tank_id", "capacity_liters", "product_id" y los crea automáticamente en playón al vuelo.
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
            <h4 className="font-bold text-slate-700 uppercase">2. Vínculo de Succiones</h4>
            <p className="text-[11px] text-slate-500">
              Al enviar el estado de surtidores, declare "suction_tank_id" para asociar de qué cisterna succiona cada manguera, mapeando los caudales regulatorios.
            </p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
            <h4 className="font-bold text-slate-700 uppercase">3. Despachos por Transacción</h4>
            <p className="text-[11px] text-slate-500">
              Al concluir un suministro de combustible, dispare un POST hacia "/api/fuel-transactions" para asentar el despacho e impactar el descuento físico en el tanque asociado en tiempo real.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
