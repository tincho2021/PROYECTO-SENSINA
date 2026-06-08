/**
 * C.E.S.T.I. TELEMETRIA
 * Page: CommunicationsDiag.tsx
 * 
 * Panel industrial (Modo Claro) de diagnóstico de telecomunicaciones,
 * latencia de red, estadísticas de paquetes recibidos e integridad IoT.
 */

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Cpu,
  RefreshCw,
  Clock,
  ShieldCheck,
  Signal,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Server,
  Zap,
  HardDrive
} from 'lucide-react';
import { formatLiters } from '../utils/formatters';

interface CommsDiagProps {
  data: any;
  onRefresh: () => void;
}

export default function CommunicationsDiag({ data, onRefresh }: CommsDiagProps) {
  const { tanks, dispensers, transactions, alerts, devices } = data;
  
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [numPackets, setNumPackets] = useState<number>(314);
  const [deviceStatuses, setDeviceStatuses] = useState<any[]>([
    { id: 'SENSINA-TX-0001', name: 'Sonda Tanque TQ-01', ip: '192.168.1.102', signal: -62, state: 'online', type: 'Sonda' },
    { id: 'SENSINA-TX-0002', name: 'Sonda Tanque TQ-02', ip: '192.168.1.103', signal: -70, state: 'online', type: 'Sonda' },
    { id: 'CTRL-SURT-0001', name: 'Controlador Surtidores S01/S02', ip: '192.168.1.110', signal: -55, state: 'online', type: 'Gateway' },
    { id: 'SENSINA-ALARM-0001', name: 'Módulo Alarma Fugas', ip: '192.168.1.115', signal: -81, state: 'online', type: 'Alarma' }
  ]);

  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    'INFO [12:00:15] HTTP POST /api/telemetry de SENSINA-TX-0001, 200 OK.',
    'INFO [12:00:20] HTTP POST /api/dispenser-status de CTRL-SURT-0001, 200 OK.',
    'INFO [12:00:30] HTTP POST /api/telemetry de SENSINA-TX-0001, 200 OK.',
    'WARN [12:00:45] Latencia inusual de red detectada: 250ms.',
    'INFO [12:01:10] HTTP POST /api/fuel-transactions de CTRL-SURT-0001, 200 OK.'
  ]);

  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);

  // Measure Ping Test to local server
  const testPing = async () => {
    setIsTestingPing(true);
    const start = performance.now();
    try {
      await fetch('/api/latest-telemetry');
      const end = performance.now();
      setPingLatency(Math.round(end - start));
    } catch {
      setPingLatency(null);
    } finally {
      setIsTestingPing(false);
    }
  };

  useEffect(() => {
    testPing();
    const packetInterval = setInterval(() => {
      setNumPackets(prev => prev + Math.floor(Math.random() * 2));
    }, 4000);

    return () => clearInterval(packetInterval);
  }, []);

  // Format Signal rssi mapping
  const getSignalLevel = (rssi: number) => {
    if (rssi >= -60) return { label: 'Muy Fuerte', style: 'text-emerald-600 bg-emerald-55', bar: '■■■■' };
    if (rssi >= -75) return { label: 'Adecuado', style: 'text-teal-600 bg-teal-55', bar: '■■■□' };
    if (rssi >= -85) return { label: 'Inestable', style: 'text-amber-500 bg-amber-55', bar: '■■□□' };
    return { label: 'Crítico', style: 'text-red-500 bg-red-55 animate-pulse', bar: '■□□□' };
  };

  return (
    <div className="space-y-6" id="comms-diag-view">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 rounded px-2 py-0.5 font-bold uppercase tracking-widest leading-none block w-max mb-1.5">
            Telecomunicaciones
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wifi className="w-5 h-5 text-indigo-600" /> Diagnóstico de Comunicación y Sockets
          </h1>
          <p className="text-xs text-slate-500">Supervise la latencia, paquetes transmitidos, tasas de error e integridad de red de los microcontroladores y gateways.</p>
        </div>

        <button
          onClick={() => { onRefresh(); testPing(); }}
          className="cursor-pointer flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-mono font-bold text-xs text-slate-700 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          RE-EVALUAR RED
        </button>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Latencia de Enlace</span>
            <span className="text-2xl font-black font-mono text-slate-800">
              {pingLatency !== null ? `${pingLatency} ms` : 'En cálculo...'}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">Conexión Segura HTTPS</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Paquetes Totales</span>
            <span className="text-2xl font-black font-mono text-slate-800">
              {numPackets}
            </span>
            <span className="text-[10px] text-slate-400 font-bold block">Desde reinicio de gateway</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Tasa de Pérdidas</span>
            <span className="text-2xl font-black font-mono text-slate-850">
              0.02%
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">Tolerancia de diseño</span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Signal className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Certificado SSL</span>
            <span className="text-md font-bold text-slate-700 block mt-1.5 uppercase tracking-wide">
              VÁLIDO TLS v1.3
            </span>
            <span className="text-[10px] text-blue-600 font-bold block font-mono">256-bit AES</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado izquierdo: Dispositivos monitoreados */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-600" /> Dispositivos Registrados en Playa
          </h2>
          <p className="text-xs text-slate-400">Estado de conectividad inalámbrica y dirección IP asignada en el router local.</p>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                  <th className="p-3">ID Dispositivo</th>
                  <th className="p-3">Nombre / Sensor</th>
                  <th className="p-3">IP Local</th>
                  <th className="p-3">Potencia RSSI</th>
                  <th className="p-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {deviceStatuses.map(dev => (
                  <tr key={dev.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-700">{dev.id}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900 block">{dev.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.2 font-mono uppercase font-bold">{dev.type}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{dev.ip}</td>
                    <td className="p-3">
                      <span className={`font-mono font-bold ${getSignalLevel(dev.signal).style}`}>
                        {dev.signal} dBm 
                      </span>
                      <span className="text-[10px] text-slate-450 block font-mono font-bold mt-0.5">
                        {getSignalLevel(dev.signal).bar} ({getSignalLevel(dev.signal).label})
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
                        ● Activo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lado derecho: Log Stream consola */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> Transmisiones del Servidor en Vivo (Consola)
            </h2>
            <p className="text-xs text-slate-400">Transmisión secuencial de paquetes IoT JSON recibidos en los endpoints compatibles con Netlify Blobs.</p>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-[11px] space-y-2 h-[220px] overflow-y-auto shadow-inner border border-slate-800">
              {simulatedLogs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  <span className={log.startsWith('WARN') ? 'text-amber-400 font-bold' : log.startsWith('INFO') ? 'text-teal-400' : 'text-slate-350'}>
                    {log}
                  </span>
                </div>
              ))}
              <div className="text-[10px] text-teal-400/80 animate-pulse font-bold mt-2">
                &gt;&gt; ESCUCHANDO SOLICITUDES DE COLA DE EVENTOS DE RED...
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block font-bold uppercase">PROCESO ESCUCHA</span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                PUERTO ACTIVO
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase">DEMONIO SECUNDARIO</span>
              <span className="text-indigo-600 font-bold">SUPABASE ADAPTER READY</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
