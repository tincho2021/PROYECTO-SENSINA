/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Scale,
  RefreshCw,
  TrendingDown,
  Activity,
  HeartCrack,
  Thermometer,
  ShieldAlert as LeakIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { formatLiters, formatDate } from '../utils/formatters';

interface InventoryProps {
  data: any;
  onRefresh: () => void;
}

export default function Inventory({ data, onRefresh }: InventoryProps) {
  const { reconciliations = [], products = [] } = data || {};

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200 text-red-800',
          dot: 'bg-red-600',
          label: 'DIFERENCIA CRÍTICA / REVISIÓN'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: 'DESVÍO MODERADO'
        };
      case 'acceptable':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          label: 'CONTRACCIÓN ADMISIBLE'
        };
    }
  };

  const getSuspicionTranslate = (susp: string) => {
    switch (susp) {
      case 'leak_suspect':
        return {
          title: 'Sospecha de Fuga o Pérdida Crítica',
          desc: 'La diferencia supera el umbral estacional volumétrico. Puede indicar fisura en tanque, purga defectuosa de lodos o cañería rota.',
          icon: <LeakIcon className="w-5 h-5 text-red-600 shrink-0" />
        };
      case 'temperature_shift':
        return {
          title: 'Contracción por Variación de Temperatura',
          desc: 'Diferencia moderada atribuible al coeficiente de dilatación térmica (Gasoil se reduce ~0.00084/°C). Calibrando...',
          icon: <Thermometer className="w-5 h-5 text-amber-600 shrink-0" />
        };
      case 'table_error':
        return {
          title: 'Inconsistencia en Tabla de Calibración',
          desc: 'Error detectado en tabla de cubicación del tanque. La conversión mm-litro puede estar descalibrada físicamente.',
          icon: <Scale className="w-5 h-5 text-amber-600 shrink-0" />
        };
      case 'normal':
      default:
        return {
          title: 'Parámetros Normales de Distribución',
          desc: 'Las mermas diarias de evaporación y dispensario se encuentran dentro del rango reglamentado del 0.5% conforme.',
          icon: <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
        };
    }
  };

  // Convert reconciliations into recharts readable data
  const chartData = reconciliations.map((rec: any) => {
    const prodName = products.find((p: any) => p.id === rec.productId)?.name?.split(' (')[0] || rec.productId;
    return {
      name: prodName,
      'Stock Teórico': rec.theoreticalStock,
      'Stock Medido': rec.measuredStock
    };
  });

  return (
    <div className="space-y-6" id="inventory-tab-view">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Conciliación de Inventario</h1>
          <p className="text-xs text-slate-500">Balance del Sistema vs Telemedición Física de Sondas para prevenir fugas, mermas o robos indeseados.</p>
        </div>
        <button
          onClick={onRefresh}
          className="cursor-pointer flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          VOLVER A CONCILIAR
        </button>
      </div>

      {/* Main comparative bar chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Balances: Stock Sonda vs Teórico Calculado (L)</h3>
          <p className="text-xs text-slate-400">Teórico = Stock Inicial + Descargas - Despachos Surtidores.</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: '11px' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Stock Teórico" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Stock Medido" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reconciliation ledger checklist */}
      <div className="space-y-4" id="reconciliation-cards-grid">
        {reconciliations.map((rec: any) => {
          const prod = products.find((p: any) => p.id === rec.productId);
          const statusStyle = getStatusIndicator(rec.status);
          const suspInfo = getSuspicionTranslate(rec.suspicionType || 'normal');

          return (
            <div key={rec.id} className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden grid lg:grid-cols-12">
              
              {/* Left wide stats col (takes 8 blocks layout) */}
              <div className="p-5 lg:col-span-8 space-y-4 border-r border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">{prod?.name || rec.productId}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">PERÍODO CONCILIADO: {formatDate(rec.periodStart, false)} AL {formatDate(rec.periodEnd, false)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border rounded-full">
                    <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                    <span className="text-[9px] font-bold font-mono tracking-wider text-slate-600">{statusStyle.label}</span>
                  </div>
                </div>

                {/* Arithmetic breakdown indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
                  <div className="bg-slate-50 p-3 rounded">
                    <span className="text-slate-400 block mb-0.5">Stock Inicial:</span>
                    <span className="font-bold font-mono text-slate-800">{formatLiters(rec.initialStock)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded">
                    <span className="text-slate-400 block mb-0.5">(+) Descargas:</span>
                    <span className="font-bold font-mono text-emerald-600">+{formatLiters(rec.deliveries)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded">
                    <span className="text-slate-400 block mb-0.5">(-) Egresos Venta:</span>
                    <span className="font-bold font-mono text-amber-600">-{formatLiters(rec.dispensed)}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded">
                    <span className="text-slate-400 block mb-0.5">Teórico Neto:</span>
                    <span className="font-bold font-mono text-slate-800">{formatLiters(rec.theoreticalStock)}</span>
                  </div>
                </div>

                {/* Measured offset variance */}
                <div className="bg-slate-50/50 p-4 border border-slate-200/50 rounded-lg grid sm:grid-cols-3 gap-4 font-mono text-xs items-center">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Stock Sonda Medido:</span>
                    <strong className="text-slate-800 text-sm">{formatLiters(rec.measuredStock)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Diferencia Neta:</span>
                    <strong className={`text-sm ${rec.differenceLiters < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {rec.differenceLiters > 0 ? '+' : ''}{rec.differenceLiters} L
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Desvío Porcentual:</span>
                    <strong className={`text-sm ${Math.abs(rec.differencePct) > 1 ? 'text-red-600' : 'text-slate-700'}`}>
                      {rec.differencePct}%
                    </strong>
                  </div>
                </div>

              </div>

              {/* Right suspicion smart diagnostic section (takes 4 blocks layout) */}
              <div className="p-5 lg:col-span-4 bg-slate-50/80 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {suspInfo.icon}
                    <h4 className="text-xs font-bold text-slate-800">{suspInfo.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    {suspInfo.desc}
                  </p>
                </div>

                <div className="border-t border-slate-200/60 pt-4 mt-4 font-sans flex items-center justify-between text-[10px] text-slate-400">
                  <span>ID AUDITORÍA: {rec.id}</span>
                  <span className="underline cursor-pointer text-slate-500 font-bold hover:text-slate-800">Generar Acta &rarr;</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
