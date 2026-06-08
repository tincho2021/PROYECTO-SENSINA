/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Battery,
  Wifi,
  Thermometer,
  ShieldAlert,
  Database,
  Cpu,
  RefreshCw,
  Clock,
  Activity
} from 'lucide-react';

import { formatLiters, formatDate } from '../utils/formatters';
import { calculateTankPercentage, parseBatteryStatus, parseRssiStrength, getProductColorHex } from '../utils/calculations';

interface TelemetryProps {
  data: any;
  onRefresh: () => void;
  onNavigate: (tabId: string) => void;
}

export default function Telemetry({ data, onRefresh, onNavigate }: TelemetryProps) {
  const { tanks = [], products = [], devices = [] } = data || {};
  const [selectedTankId, setSelectedTankId] = useState<string>('');

  useEffect(() => {
    if (!selectedTankId && tanks.length > 0) {
      setSelectedTankId(tanks[0].id);
    }
  }, [tanks, selectedTankId]);
  
  const selectedTank = tanks.find((t: any) => t.id === selectedTankId) || tanks[0];
  const selectedProduct = products.find((p: any) => p.id === selectedTank?.productId);
  const selectedProdColor = selectedProduct?.hexColor || selectedProduct?.product_color || getProductColorHex(selectedTank?.productId);
  
  const tankPercentage = selectedTank 
    ? calculateTankPercentage(selectedTank.currentVolumeLiters, selectedTank.capacityLiters)
    : 0;

  if (tanks.length === 0) {
    return (
      <div className="space-y-6" id="telemetry-tab-view">
        {/* Upper bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Telemedición de Cisternas</h1>
            <p className="text-xs text-slate-500">Volumen continuo, milímetros brutos, temperatura y detección de agua en fondos.</p>
          </div>
          <button
            onClick={onRefresh}
            className="cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono"
          >
            REFRESCAR CONEXIÓN
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto my-12 space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
            <Database className="w-8 h-8 text-emerald-600 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">C.E.S.T.I. - ESPERANDO CONFIGURACIÓN DE TANQUES</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            La plataforma no registra cisternas activas por defecto (modo demo desactivado). 
            La estación de servicio se configurará automáticamente en tiempo real tan pronto como el microcontrolador <strong>ESP32</strong> transmita su primer paquete de datos.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs font-mono max-w-md mx-auto space-y-2">
            <span className="font-bold text-slate-600 block border-b pb-1">PARÁMETROS DE TRANSMISIÓN:</span>
            <p><strong>Endpoint:</strong> <code className="text-teal-600">{window.location.origin}/api/telemetry</code></p>
            <p><strong>Método:</strong> <code className="text-slate-800">POST</code></p>
            <p><strong>Token:</strong> <code className="text-slate-800">Bearer cesti-demo-key-123</code></p>
          </div>

          <p className="text-[11px] text-slate-400">
            Una vez recibido el primer paquete, el depósito físico, su capacidad, combustible, y lecturas se crearán de forma instantánea.
          </p>
        </div>
      </div>
    );
  }

  // Render visual cylinder element
  const getSensorStatusBadge = (status: string) => {
    switch (status) {
      case 'critical_low':
        return <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">STOCK CRÍTICO BAJO</span>;
      case 'low_stock':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">BAJO STOCK</span>;
      case 'high_level':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">NIVEL ALTO</span>;
      case 'no_comm':
        return <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">S/ COMUNICACIÓN</span>;
      case 'normal':
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVO / NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6" id="telemetry-tab-view">
      
      {/* Banner info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Telemedición de Cisternas</h1>
          <p className="text-xs text-slate-500">Volumen continuo, milímetros brutos, temperatura y detección de agua en fondos.</p>
        </div>
        <button
          onClick={onRefresh}
          className="cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          FORZAR LECTURA SENSINA
        </button>
      </div>

      {/* Grid of tanks quick summary list + Detailed Tank Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Tank selection sidebar list */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3 h-fit lg:col-span-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">SELECCIONAR TANQUE</span>
          <div className="space-y-2">
            {tanks.map((t: any) => {
              const isSelected = t.id === selectedTankId;
              const prod = products.find((p: any) => p.id === t.productId);
              const pct = calculateTankPercentage(t.currentVolumeLiters, t.capacityLiters);
              const tColor = prod?.hexColor || prod?.product_color || getProductColorHex(t.productId);

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTankId(t.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'shadow-sm'
                      : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-50'
                  }`}
                  style={isSelected ? { backgroundColor: `${tColor}12`, borderColor: tColor } : {}}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-extrabold text-slate-800 block truncate">{t.name}</span>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0 font-mono">{t.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{prod?.name?.split(' (')[0] || t.productId || 'Gasoil'}</span>
                    <span className="text-[10px] font-bold text-slate-700 font-mono">{Math.round(pct)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ width: `${pct}%`, backgroundColor: tColor }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cylinder Visual focus model */}
        {selectedTank && (
          <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
            
            {/* Upper Tank Focus Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">{selectedTank.name}</h2>
                  {getSensorStatusBadge(selectedTank.sensorStatus)}
                </div>
                <p className="text-xs text-slate-500">ID Físico del Sensor: <strong className="font-mono text-slate-700">{selectedTank.id}</strong> | Tipo: <strong className="uppercase">{selectedTank.sensorType}</strong></p>
              </div>
              <div className="text-right sm:text-right font-mono text-xs text-slate-400">
                <span className="block">ÚLTIMO REGISTRO ENVIADO</span>
                <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded mt-0.5 font-bold text-slate-600 justify-end">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(selectedTank.lastUpdated)}
                </span>
              </div>
            </div>

            {/* Cylinder level & variable gauges */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Cylinder Animation Frame */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                <div className="relative w-36 h-64 bg-slate-200 rounded-2xl border-2 border-slate-300 shadow-inner flex items-end overflow-hidden">
                  
                  {/* Grid background on cylinder */}
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[10%] z-0" />
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[20%] z-0" />
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[30%] z-0" />
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[40%] z-0" />
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[50%] z-0" />
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[60%] z-0" />
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[70%] z-0" />
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[80%] z-0" />
                  <div className="absolute inset-x-0 h-[10%] border-t border-slate-300/60 top-[90%] z-0" />

                  {/* Water layer representation at bottom if detected */}
                  {selectedTank.waterMm > 0 && (
                    <div 
                      className="absolute bottom-0 inset-x-0 bg-blue-600/70 border-t border-blue-400 z-10 animate-pulse transition-all duration-300"
                      style={{ height: '12px' }}
                    />
                  )}

                  {/* Liquid volume */}
                  <div 
                    className="w-full relative transition-all duration-700 ease-out" 
                    style={{ height: `${tankPercentage}%`, backgroundColor: selectedProdColor }}
                  >
                    {/* Wavy top reflection */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/30 animate-pulse" />
                    
                    {/* Center stats */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded">Lleno</span>
                      <span className="text-xl font-black font-mono leading-none">{Math.round(tankPercentage)}%</span>
                    </div>
                  </div>

                </div>

                {/* Legend Water layer indicators below */}
                {selectedTank.waterMm > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    Agua detectada en fondo: {selectedTank.waterMm} mm
                  </div>
                )}
              </div>

              {/* Tank Digital Stats (mm, liters, temperature, battery, signal) */}
              <div className="md:col-span-8 grid grid-cols-2 gap-4">
                
                {/* Liters Card */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Volumen Disponible</span>
                  <span className="text-2xl font-black text-slate-800 font-mono">{formatLiters(selectedTank.currentVolumeLiters).split(' ')[0]}</span>
                  <span className="text-xs text-slate-500 font-mono block">/ {formatLiters(selectedTank.capacityLiters)}</span>
                </div>

                {/* Millimeter heights */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Altura de Combustible</span>
                  <span className="text-2xl font-black text-slate-800 font-mono">{selectedTank.currentHeightMm}</span>
                  <span className="text-xs text-slate-500 block">Milímetros (mm) bruto s/ sonda</span>
                </div>

                {/* Temperature Celsius */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Temperatura</span>
                    <span className="text-xl font-extrabold text-slate-800 font-mono">{selectedTank.temperatureC || 15} °C</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Ref. Densidad: {selectedProduct?.referenceDensity || 840} kg/m³</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded text-amber-500">
                    <Thermometer className="w-5 h-5" />
                  </div>
                </div>

                {/* Sensor Battery status */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Batería del Sensor</span>
                    <span className="text-xl font-extrabold text-slate-800 font-mono">{selectedTank.batteryPercent}%</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Tensión Vcc: {selectedTank.batteryV || 3.72} V</span>
                  </div>
                  <div className={`p-2 rounded ${selectedTank.batteryPercent > 20 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-50 animate-pulse text-red-500'}`}>
                    <Battery className="w-5 h-5" />
                  </div>
                </div>

                {/* Wireless Signal Strength / RSSI */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Señal Inalámbrica</span>
                    <span className="text-xl font-extrabold text-slate-800 font-mono">{selectedTank.signalRssi} dBm</span>
                    <span className="text-[10px] text-slate-400 block">Espectro: {parseRssiStrength(selectedTank.signalRssi).label}</span>
                  </div>
                  <div className="bg-sky-50 p-2 rounded text-sky-500">
                    <Wifi className="w-5 h-5" />
                  </div>
                </div>

                {/* Product spec block info */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Precio Asociado</span>
                    <span className="text-xl font-extrabold text-slate-800 font-mono">${selectedProduct?.pricePerLiter || 0} /L</span>
                    <span className="text-[10px] block font-mono truncate" style={{ color: selectedProdColor }}>{selectedProduct?.name?.split(' (')[0] || selectedTank?.productId || 'Gasoil'}</span>
                  </div>
                  <div className="p-2 rounded text-white" style={{ backgroundColor: selectedProdColor }}>
                    <Database className="w-5 h-5" />
                  </div>
                </div>

              </div>
            </div>

            {/* Technical device log Modbus frame metadata */}
            <div className="border-t border-slate-100 pt-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">TRAMA TÉCNICA RECIENTE DE TELEMEDICIÓN ESP32</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3">Sensor GUID ID</th>
                      <th className="py-2.5 px-3">Tanque Asoc.</th>
                      <th className="py-2.5 px-3">Protocolo Red</th>
                      <th className="py-2.5 px-3">Tipo Sensor</th>
                      <th className="py-2.5 px-3">Modbus Addr</th>
                      <th className="py-2.5 px-3">Última trama hexadecimal bruta</th>
                      <th className="py-2.5 px-3 text-right">RSSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-800">{`SENSINA-TX-${selectedTank.siteId.endsWith('001') ? '0001' : '0003'}`}</td>
                      <td className="py-3 px-3 text-slate-600">{selectedTank.id}</td>
                      <td className="py-3 px-3 text-slate-500">HTTPS POST payload</td>
                      <td className="py-3 px-3 uppercase text-slate-600">{selectedTank.sensorType}</td>
                      <td className="py-3 px-3">ADDR {selectedTank.modbusAddress || '01'}</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]" style={{ letterSpacing: '0.05em' }}>{`0x1102${Math.round(selectedTank.currentHeightMm).toString(16).padStart(4, '0')}000${selectedTank.waterMm.toString(16)}038a`}</td>
                      <td className="py-3 px-3 text-right text-slate-700">{selectedTank.signalRssi} dBm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
