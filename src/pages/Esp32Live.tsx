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
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h> // Requiere la librería ArduinoJson (v6 o v7)

// Credenciales Wi-Fi del Establecimiento
const char* ssid = "SU_WIFI_SSID";
const char* password = "SU_WIFI_PASSWORD";

// Configuración de Identificación de Sitio / Establecimiento
const char* site_id       = "ESTACION-001";              // Identificador único de la Estación / Establecimiento
const char* site_name     = "Estación Rosario Principal"; // Nombre amigable de la Locación/Sucursal
const char* site_location = "Ruta 9, Km 280, Rosario";    // Dirección / Coordenadas

// Parámetros de Conexión de Servidor C.E.S.T.I.
const char* base_url = "${baseUrl}"; 
const char* api_key = "cesti-demo-key-123"; // Token de autorización Bearer

// Función auxiliar para realizar el POST tolerando HTTPS por SSL Insecure
int realizarPostHTTPS(String url, String json_str) {
  HTTPClient http;
  int httpCode = -1;
  
  if (url.startsWith("https")) {
    WiFiClientSecure client;
    client.setInsecure(); // Conectar a servidores HTTPS sin configurar CAs manualmente
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

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  Serial.print("Conectando a Wi-Fi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWi-Fi Conectado con éxito!");
  Serial.print("Dirección IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // -------------------------------------------------------------
    // 1. REGISTRO Y ACTUALIZACIÓN DINÁMICA DE CISTERNAS (TANQUES)
    // -------------------------------------------------------------
    // Se declaran las capacidades volumétricas y combustibles de cada cisterna.
    // El backend las inserta y configura automáticamente si no existen.
    
    // Gasoil Premium (GP) en Tanque 1 - Capacidad: 30,000 Litros - Precio: $1.450,20 - Densidad: 835
    enviarTelemetriaTanque("tank_01", 2150, 21500, 16.4, 0, 30000, "GP", "Gasoil Grado 3 (Infinia Diesel)", "premium", 1450.20, 835, "#0d9488", "Cisterna Gasoil Premium");
    delay(1500);

    // Diesel Común (GO2) en Tanque 2 - Capacidad: 20,000 Litros - Precio: $1.210,40 - Densidad: 840
    enviarTelemetriaTanque("tank_02", 1520, 12160, 15.8, 4, 20000, "GO2", "Gasoil Grado 2 (Ultra Diesel)", "gasoil", 1210.40, 840, "#10b981", "Cisterna Diesel Comun");
    delay(1500);

    // Nafta Súper (NS) en Tanque 3 - Capacidad: 15,000 Litros - Precio: $1.280,90 - Densidad: 735
    enviarTelemetriaTanque("tank_03", 940, 7050, 17.2, 0, 15000, "NS", "Nafta Super", "nafta", 1280.90, 735, "#3b82f6", "Cisterna Nafta Super");
    delay(1500);


    // -------------------------------------------------------------
    // 2. CONGLOMERADO Y MAPEO DE SURTIDORES (SUCCIONES)
    // -------------------------------------------------------------
    // Se asocian las mangueras de los surtidores a las cisternas de donde succionan.
    // Esto vincula mecánicamente los despachos físicos a la reducción volumétrica.
    
    enviarEstadoPlayon();
    delay(2000);


    // -------------------------------------------------------------
    // 3. EJEMPLO EVENTUAL: DESPACHO CONCLUIDO POR RFID
    // -------------------------------------------------------------
    // Simular un despacho de 52 litros de Nafta Súper en Surtidor 2 de forma eventual.
    // En producción, esto se gatilla al colgar el pico del surtidor.
    
    /*
    registrarTransaccionCompletada(
      "TX-ESP32-9844",    // ID de Transacción Única
      "surtidor_02",       // ID del Surtidor
      1,                  // Número de Manguera (Nozzle)
      "NS",               // ID de Combustible (Nafta Super)
      52.3,               // Litros despachados
      48300.0,            // Monto en $
      "Martin Rodriguez", // Chofer validado por RFID
      "Toyota Hilux - Flota B", // Vehículo
      "AE123BB",          // Patente
      142500              // Odómetro del vehículo
    );
    */

    Serial.println("Establecimiento sincronizado correctamente. Próxima trampa en 30 Seg.");
    delay(30000); // Frecuencia de ciclo principal
  } else {
    Serial.println("Wi-Fi desconectado. Esperando reconexión...");
    WiFi.begin(ssid, password);
    delay(5000);
  }
}

// Envía la telemetría individual de una cisterna para persistencia y auto-morfismo
void enviarTelemetriaTanque(const char* tank_id, int altura_mm, int volumen_litros, float temp, int agua_mm, int capacidad, const char* prod_id, const char* prod_name, const char* prod_type, float prod_price, int prod_density, const char* prod_color, const char* nombre) {
  String url = String(base_url) + "/api/telemetry";

  // Crear documento JSON dinámico
  StaticJsonDocument<512> doc;
  doc["tank_id"] = tank_id;
  doc["height_mm"] = altura_mm;
  doc["volume_liters"] = volumen_litros;
  doc["temperature_c"] = temp;
  doc["water_mm"] = agua_mm;
  doc["battery_v"] = 3.62;
  doc["battery_percent"] = 100;
  doc["signal_rssi"] = WiFi.RSSI();
  doc["sensor_status"] = "normal";
  doc["capacity_liters"] = capacidad;
  
  // Metadatos de Combustible de la Cisterna Sincronizados on-the-fly
  doc["product_id"] = prod_id;
  doc["product_name"] = prod_name;
  doc["product_type"] = prod_type;
  doc["product_price"] = prod_price;
  doc["product_density"] = prod_density;
  doc["product_color"] = prod_color;
  
  doc["tank_name"] = nombre;

  // Metadatos de geolocalización de playón auto-registrados
  doc["site_id"] = site_id;
  doc["site_name"] = site_name;
  doc["site_location"] = site_location;

  String json_str;
  serializeJson(doc, json_str);

  int httpCode = realizarPostHTTPS(url, json_str);
  if (httpCode > 0) {
    Serial.printf("[Tanque %s] POST Exitoso, Respuesta: %d\\n", tank_id, httpCode);
  } else {
    Serial.printf("[Tanque %s] Error de Conexión\\n", tank_id);
  }
}

// Envía el estado del playón definiendo qué mangueras succionan de qué tanques
void enviarEstadoPlayon() {
  String url = String(base_url) + "/api/dispenser-status";

  StaticJsonDocument<1024> doc;
  JsonArray dispensers = doc.createNestedArray("dispensers");

  // Surtidor 1 - Manguera 1: Gasoil Premium (Succiona de tank_01)
  JsonObject disp1 = dispensers.createNestedObject();
  disp1["dispenser_id"] = "surtidor_01";
  disp1["status"] = "available"; // available, unauthorized, fueling, offline
  disp1["nozzle"] = 1;
  disp1["product_id"] = "GP";
  disp1["suction_tank_id"] = "tank_01";
  disp1["last_sale_liters"] = 45.5;
  disp1["last_sale_amount"] = 54600;

  // Surtidor 1 - Manguera 2: Diesel Común (Succiona de tank_02)
  JsonObject disp2 = dispensers.createNestedObject();
  disp2["dispenser_id"] = "surtidor_01";
  disp2["status"] = "available";
  disp2["nozzle"] = 2;
  disp2["product_id"] = "GO2";
  disp2["suction_tank_id"] = "tank_02";
  disp2["last_sale_liters"] = 115.0;
  disp2["last_sale_amount"] = 109250;

  // Surtidor 2 - Manguera 1: Nafta Súper (Succiona de tank_03)
  JsonObject disp3 = dispensers.createNestedObject();
  disp3["dispenser_id"] = "surtidor_02";
  disp3["status"] = "fueling"; // Simula que está despachando en este instante
  disp3["nozzle"] = 1;
  disp3["product_id"] = "NS";
  disp3["suction_tank_id"] = "tank_03";
  disp3["driver"] = "Martin Rodriguez"; // Chofer identificado por RFID
  disp3["vehicle"] = "Toyota Hilux - Flota B";
  disp3["plate"] = "AE123BB";
  disp3["odometer"] = 142500;
  disp3["authorization_method"] = "RFID";

  String json_str;
  serializeJson(doc, json_str);

  int httpCode = realizarPostHTTPS(url, json_str);
  if (httpCode > 0) {
    Serial.printf("[Playon] Estado de surtidores actualizado: %d\\n", httpCode);
  } else {
    Serial.printf("[Playon] Error de Conexión\\n");
  }
}

// Envía y asienta el despacho final para reducir stock y reiniciar estado de surtidor
void registrarTransaccionCompletada(const char* tx_id, const char* disp_id, int nozzle, const char* prod_id, float litros, float monto, const char* driver, const char* vehicle, const char* plate, int odometro) {
  String url = String(base_url) + "/api/fuel-transactions";

  StaticJsonDocument<512> doc;
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

  int httpCode = realizarPostHTTPS(url, json_str);
  if (httpCode > 0) {
    Serial.printf("[Despacho] Transaccion registrada exitosamente: %d\\n", httpCode);
  } else {
    Serial.printf("[Despacho] Error en registro de transaccion\\n");
  }
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
