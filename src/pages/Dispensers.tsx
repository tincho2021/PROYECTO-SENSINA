/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Zap,
  UserCheck,
  RotateCcw,
  Gauge,
  CircleAlert,
  Radio,
  FileSpreadsheet,
  Activity
} from 'lucide-react';

import { formatLiters, formatCurrency, formatDate } from '../utils/formatters';

interface DispensersProps {
  data: any;
  onRefresh: () => void;
}

export default function Dispensers({ data, onRefresh }: DispensersProps) {
  const { dispensers = [], products = [], transactions = [] } = data || {};

  if (dispensers.length === 0) {
    return (
      <div className="space-y-6" id="dispensers-tab-view">
        {/* Upper bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Consola de Control de Surtidores</h1>
            <p className="text-xs text-slate-500">Estado de mangueras, auditoría de despachos físicos e indicaciones de seguridad RFID/QR.</p>
          </div>
          <button
            onClick={onRefresh}
            className="cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono"
          >
            REFRESCAR CONEXIÓN
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto my-12 space-y-5">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-2xl font-bold">
            <Activity className="w-8 h-8 text-teal-600 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">C.E.S.T.I. - ESPERANDO CONFIGURACIÓN DE SURTIDORES</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            La consola de control no tiene surtidores mapeados. Toda la configuración del playón es provista dinámicamente desde el microcontrolador <strong>ESP32</strong>.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs font-mono max-w-md mx-auto space-y-2">
            <span className="font-bold text-slate-600 block border-b pb-1">PARÁMETROS DE INTANGIBILIDAD:</span>
            <p><strong>Endpoint:</strong> <code className="text-teal-600">{window.location.origin}/api/dispenser-status</code></p>
            <p><strong>Método:</strong> <code className="text-slate-800">POST</code></p>
            <p><strong>Token:</strong> <code className="text-slate-800">Bearer cesti-demo-key-123</code></p>
          </div>

          <p className="text-[11px] text-slate-400">
            Los surtidores informados, su manguera asignada, producto, nivel y estados operativos se cargarán al recibir el primer flujo de bytes.
          </p>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'dispensing':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          indicator: 'bg-orange-500 animate-pulse',
          label: 'DESPACHANDO'
        };
      case 'calling':
        return {
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-800',
          indicator: 'bg-amber-400 animate-ping',
          label: 'SOLICITANDO AUTORIZR.'
        };
      case 'authorized':
        return {
          bg: 'bg-indigo-50 border-indigo-200',
          text: 'text-indigo-800',
          indicator: 'bg-indigo-500',
          label: 'AUTORIZADO'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          indicator: 'bg-red-600',
          label: 'ERROR FALLA MANGUERA'
        };
      case 'offline':
        return {
          bg: 'bg-slate-100 border-slate-200',
          text: 'text-slate-500',
          indicator: 'bg-slate-400',
          label: 'DESCONECTADO'
        };
      case 'available':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          text: 'text-emerald-800',
          indicator: 'bg-emerald-500',
          label: 'DISPONIBLE'
        };
    }
  };

  return (
    <div className="space-y-6" id="dispensers-tab-view">
      
      {/* Upper bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Consola de Control de Surtidores</h1>
          <p className="text-xs text-slate-500">Estado de mangueras, auditoría de despachos físicos e indicaciones de seguridad RFID/QR.</p>
        </div>
        <button
          onClick={onRefresh}
          className="cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          REFRESCAR CONSOLA
        </button>
      </div>

      {/* Grid of dispensers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="dispenser-console-grid">
        {dispensers.map((d: any) => {
          const statusStyle = getStatusInfo(d.status);
          const prod = products.find((p: any) => p.id === d.productId);
          const isDispensing = d.status === 'dispensing' || d.status === 'calling';

          return (
            <div 
              key={d.id} 
              className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isDispensing ? 'ring-2 ring-orange-400' : 'border-slate-100'
              }`}
            >
              <div>
                {/* Header Dispenser Row */}
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 truncate" style={{ maxWidth: '140px' }}>{d.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {d.id} | Hose {d.hose}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusStyle.indicator}`} />
                    <span className={`text-[9px] font-bold font-mono tracking-wider ${statusStyle.text}`}>{statusStyle.label}</span>
                  </div>
                </div>

                {/* Main status area */}
                <div className="space-y-3 mb-4">
                  {/* Product label */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Combustible:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 border text-slate-700`} style={{ borderColor: prod?.hexColor }}>
                      {prod?.name?.split(' (')[0] || d.productId}
                    </span>
                  </div>

                  {/* Liters and amount */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200/50">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">Último Despacho</span>
                      <span className="text-lg font-black text-slate-800 font-mono">{formatLiters(d.lastSaleLiters)}</span>
                    </div>
                    <div className="flex justify-between mt-1 text-[11px] text-slate-500 font-mono">
                      <span>Importe Total:</span>
                      <span className="font-bold">{formatCurrency(d.lastSaleAmount)}</span>
                    </div>
                  </div>

                  {/* Driver / Vehicle assigned if exists */}
                  {d.activeDriver ? (
                    <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{d.activeDriver}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <span className="block">{d.activeVehicle}</span>
                        <div className="flex justify-between font-mono">
                          <span>Patente: <strong className="text-slate-700 uppercase">{d.activePlate}</strong></span>
                          {d.odometerReading && <span>Km: <strong className="text-slate-700">{d.odometerReading}</strong></span>}
                        </div>
                        <span className="block text-[9px] text-slate-400 font-mono">Autorización: {d.authorizationMethod || 'RFID CARD'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50 border border-dotted border-slate-200 rounded-lg text-center text-[10px] text-slate-400">
                      Surtidor libre. Esperando lectura de tarjeta habilitada.
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-2 bg-slate-50 px-2 py-1 rounded">
                <Radio className="w-3.5 h-3.5 text-slate-300 animate-pulse" />
                <span>Últ. Reporte: {d.lastUpdated ? d.lastUpdated.substring(11, 19) : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auxiliary table: Recent authorization log */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">Eventos Recientes de Despachadores</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                <th className="py-2.5 px-3">Fecha y Hora</th>
                <th className="py-2.5 px-3">Surtidor</th>
                <th className="py-2.5 px-3">ID Manguera</th>
                <th className="py-2.5 px-3">Chofer Autorizado</th>
                <th className="py-2.5 px-3">Patente Vehículo</th>
                <th className="py-2.5 px-3">Litros</th>
                <th className="py-2.5 px-3 text-right">Método</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
              {transactions.slice(0, 5).map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-slate-500">{formatDate(tx.createdAt)}</td>
                  <td className="py-3 px-3 font-bold text-slate-700">{tx.dispenserId}</td>
                  <td className="py-3 px-3">HOSE {tx.hose}</td>
                  <td className="py-3 px-3 text-slate-700">{tx.driverId || 'Control Remoto'}</td>
                  <td className="py-3 px-3 uppercase">{tx.vehiclePlate || 'N/A'}</td>
                  <td className="py-3 px-3 text-slate-800 font-bold">{formatLiters(tx.liters)}</td>
                  <td className="py-3 px-3 text-right">{tx.authorizationMethod || 'RFID'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
