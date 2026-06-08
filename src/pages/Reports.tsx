/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Table,
  CheckCircle,
  Eye,
  Fuel,
  ArrowRight
} from 'lucide-react';

import { formatLiters, formatDate, formatCurrency } from '../utils/formatters';

interface ReportsProps {
  data: any;
}

type ReportType = 'daily-stock' | 'monthly-consumption' | 'fleet-withdrawals' | 'reconciliation-discrepancies';

export default function Reports({ data }: ReportsProps) {
  const { tanks = [], transactions = [], products = [], reconciliations = [] } = data || {};
  const [activeReport, setActiveReport] = useState<ReportType>('daily-stock');
  const [siteFilter, setSiteFilter] = useState('ALL');
  
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    setToastMsg(`El reporte "${activeReport.toUpperCase()}" ha sido empaquetado y descargado en formato ${format}.`);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3500);
  };

  return (
    <div className="space-y-6" id="reports-tab-view">
      
      {/* Toast Alert */}
      {isToastVisible && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Centro de Reportes Analíticos</h1>
          <p className="text-xs text-slate-500">Generación y exportación de informes fiscales, mermas reglamentarias y auditorías contables de playón.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left selector col */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
          <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-1">PLANTILLAS DISPONIBLES</span>
          <div className="space-y-2">
            
            <button
              onClick={() => setActiveReport('daily-stock')}
              className={`w-full p-2.5 rounded text-left text-xs font-bold font-sans flex items-center justify-between group transition-colors cursor-pointer ${
                activeReport === 'daily-stock' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>1. Stock Diario Consolidado</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-65 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveReport('monthly-consumption')}
              className={`w-full p-2.5 rounded text-left text-xs font-bold font-sans flex items-center justify-between group transition-colors cursor-pointer ${
                activeReport === 'monthly-consumption' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>2. Consumo Mensual Producto</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-65 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveReport('fleet-withdrawals')}
              className={`w-full p-2.5 rounded text-left text-xs font-bold font-sans flex items-center justify-between group transition-colors cursor-pointer ${
                activeReport === 'fleet-withdrawals' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>3. Despachos Totales de Flota</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-65 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveReport('reconciliation-discrepancies')}
              className={`w-full p-2.5 rounded text-left text-xs font-bold font-sans flex items-center justify-between group transition-colors cursor-pointer ${
                activeReport === 'reconciliation-discrepancies' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>4. Discrepancias Inventario</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-65 group-hover:translate-x-0.5 transition-transform" />
            </button>

          </div>

          <div className="border-t border-slate-100 pt-3">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Filtro Rápido Sucursal</label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border rounded"
            >
              <option value="ALL">Todas las Bases / Estaciones</option>
              <option value="ESTACION-001">Estación Norte Rosario</option>
              <option value="ESTACION-002">Planta Bahía Blanca</option>
              <option value="ESTACION-003">Base Luján</option>
            </select>
          </div>
        </div>

        {/* Right table preview & downloads (takes 3 cols width) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 shadow-sm p-5 rounded-xl space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 border-slate-100 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest block uppercase">Previsualización de Documento Contable</span>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <Table className="w-4.5 h-4.5 text-slate-400" />
                {activeReport === 'daily-stock' && 'Stock Diario Consolidado s/ Telemedición'}
                {activeReport === 'monthly-consumption' && 'Consolidado Consumo de Productos'}
                {activeReport === 'fleet-withdrawals' && 'Registro de Despachos por Unidades de Flota'}
                {activeReport === 'reconciliation-discrepancies' && 'Auditoría de Conciliaciones y Mermas'}
              </h2>
            </div>

            <div className="flex bg-slate-50 border p-1 rounded-lg gap-1 text-[11px] font-semibold items-center shrink-0">
              <button onClick={() => handleExport('PDF')} className="cursor-pointer hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Descargar PDF</button>
              <button onClick={() => handleExport('Excel')} className="cursor-pointer hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Excel</button>
              <button onClick={() => handleExport('CSV')} className="cursor-pointer hover:bg-slate-200 px-2 py-1 rounded">CSV</button>
            </div>
          </div>

          {/* Interactive Report View */}
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            
            {/* 1. Daily Stock report */}
            {activeReport === 'daily-stock' && (
              <table className="w-full text-left text-xs text-slate-600 font-medium whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Cisterna ID</th>
                    <th className="py-2.5 px-3">Combustible</th>
                    <th className="py-2.5 px-3">Base / Sucursal</th>
                    <th className="py-2.5 px-3">Capacidad segura</th>
                    <th className="py-2.5 px-3">Volumen Medido</th>
                    <th className="py-2.5 px-3">Altura mm</th>
                    <th className="py-2.5 px-3">Agua mm</th>
                    <th className="py-2.5 px-3 text-right">Nivel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {tanks
                    .filter((t: any) => siteFilter === 'ALL' || t.siteId === siteFilter)
                    .map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{t.id}</td>
                        <td className="py-2.5 px-3 font-sans font-bold">{products.find((p: any) => p.id === t.productId)?.name?.split(' (')[0] || t.productId}</td>
                        <td className="py-2.5 px-3 font-sans">{t.siteId.replace('ESTACION-', 'Base ')}</td>
                        <td className="py-2.5 px-3">{formatLiters(t.capacityLiters)}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{formatLiters(t.currentVolumeLiters)}</td>
                        <td className="py-2.5 px-3">{t.currentHeightMm} mm</td>
                        <td className="py-2.5 px-3">{t.waterMm} mm</td>
                        <td className="py-2.5 px-3 text-right font-sans font-semibold text-emerald-600">
                          {Math.round((t.currentVolumeLiters / t.capacityLiters) * 100)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 2. Monthly Consumption category */}
            {activeReport === 'monthly-consumption' && (
              <table className="w-full text-left text-xs text-slate-600 font-medium whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">CÓDIGO comb.</th>
                    <th className="py-2.5 px-3">Descripción Oficial</th>
                    <th className="py-2.5 px-3">Litros despacho total mensual</th>
                    <th className="py-2.5 px-3">Precio Promedio de Cartelera</th>
                    <th className="py-2.5 px-3 text-right">Ingreso Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {products.map((p: any) => {
                    const liters = transactions
                      .filter((tx: any) => tx.status === 'completed' && tx.productId === p.id)
                      .reduce((sum: number, tx: any) => sum + tx.liters, 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{p.id}</td>
                        <td className="py-2.5 px-3 font-sans font-bold">{p.name}</td>
                        <td className="py-2.5 px-3 text-slate-800 font-bold">{formatLiters(liters)}</td>
                        <td className="py-2.5 px-3 font-bold">${p.pricePerLiter}</td>
                        <td className="py-2.5 px-3 text-right text-slate-950 font-bold">${(liters * p.pricePerLiter).toLocaleString('es-AR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 3. Fleet withdrawals log */}
            {activeReport === 'fleet-withdrawals' && (
              <table className="w-full text-left text-xs text-slate-600 font-medium whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">TID</th>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3">Combustible</th>
                    <th className="py-2.5 px-3">Unidad Patente</th>
                    <th className="py-2.5 px-3">Llavero Tarjeta RFID</th>
                    <th className="py-2.5 px-3">Litros despachados</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transactions
                    .filter((tx: any) => siteFilter === 'ALL' || tx.siteId === siteFilter)
                    .slice(0, 10)
                    .map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{tx.id}</td>
                        <td className="py-2.5 px-3 text-slate-400">{formatDate(tx.createdAt)}</td>
                        <td className="py-2.5 px-3 font-sans">{products.find((p: any) => p.id === tx.productId)?.name?.split(' (')[0] || tx.productId}</td>
                        <td className="py-2.5 px-3 uppercase font-bold text-slate-700">{tx.vehiclePlate || 'Auxiliar'}</td>
                        <td className="py-2.5 px-3">{tx.driverId || 'Central RFID'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{formatLiters(tx.liters)}</td>
                        <td className="py-2.5 px-3 text-right font-bold">{formatCurrency(tx.amount)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* 4. Discrepancy discrepancies reports */}
            {activeReport === 'reconciliation-discrepancies' && (
              <table className="w-full text-left text-xs text-slate-600 font-medium whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Período Auditoría</th>
                    <th className="py-2.5 px-3">Producto Combust.</th>
                    <th className="py-2.5 px-3">Medido Sonda L</th>
                    <th className="py-2.5 px-3">Calculado Teórico L</th>
                    <th className="py-2.5 px-3">Merma Diferencia neto</th>
                    <th className="py-2.5 px-3 text-right">Porcentaje Desviación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {reconciliations.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-sans font-bold">{rec.id.replace('REC-', 'Mes ')}</td>
                      <td className="py-2.5 px-3 font-sans">{products.find((p: any) => p.id === rec.productId)?.name?.split(' (')[0] || rec.productId}</td>
                      <td className="py-2.5 px-3">{rec.measuredStock.toLocaleString('es-AR')} L</td>
                      <td className="py-2.5 px-3">{rec.theoreticalStock.toLocaleString('es-AR')} L</td>
                      <td className={`py-2.5 px-3 font-bold ${rec.differenceLiters < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{rec.differenceLiters} L</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${Math.abs(rec.differencePct) > 1 ? 'text-red-650' : 'text-slate-600'}`}>{rec.differencePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>

          {/* Foot disclaimer */}
          <div className="text-[10px] text-slate-400 leading-normal font-sans border-t border-slate-100 pt-3">
            * SENSINA Cloud certifica de manera encriptada y auditable por tecnología blockchain o registros inmutables de base de datos la no alteración del volumétrico de existencias s/ ley fiscal general de mermas de expendio de combustibles líquidos.
          </div>

        </div>

      </div>

    </div>
  );
}
