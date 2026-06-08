/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  Flame,
  LineChart,
  BarChart as RechartsBarIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

import { formatLiters, formatCurrency } from '../utils/formatters';

interface StatisticsProps {
  data: any;
}

export default function Statistics({ data }: StatisticsProps) {
  const { transactions = [], vehicles = [], drivers = [], products = [] } = data || {};

  // 1. Calculate vehicle consumptions ranking
  const vehicleConsumptions: { [key: string]: { plate: string; liters: number; brand: string } } = {};
  transactions.forEach((tx: any) => {
    if (tx.status === 'completed' && tx.vehiclePlate) {
      if (!vehicleConsumptions[tx.vehiclePlate]) {
        const veh = vehicles.find((v: any) => v.plate === tx.vehiclePlate);
        vehicleConsumptions[tx.vehiclePlate] = {
          plate: tx.vehiclePlate,
          liters: 0,
          brand: veh ? `${veh.brand} ${veh.model}` : 'Equipo Auxiliar'
        };
      }
      vehicleConsumptions[tx.vehiclePlate].liters += tx.liters;
    }
  });

  const rankedVehicles = Object.values(vehicleConsumptions)
    .sort((a, b) => b.liters - a.liters)
    .slice(0, 5);

  // 2. Weekly Consumption By product category for Bar chart
  const productConsumptions: { [pId: string]: number } = {};
  transactions.forEach((tx: any) => {
    if (tx.status === 'completed') {
      productConsumptions[tx.productId] = (productConsumptions[tx.productId] || 0) + tx.liters;
    }
  });

  const productChartData = Object.entries(productConsumptions).map(([pId, liters]) => {
    const prod = products.find((p: any) => p.id === pId);
    return {
      name: prod ? prod.name.split(' (')[0] : pId,
      'Litros Despachados': liters,
      color: prod ? prod.hexColor : '#10b981'
    };
  });

  // 3. Hourly Activity heatmap mock (24 hours broken into 4 core buckets)
  const hourlyFrequencies = [
    { hourBand: 'Madrugada (00:00 - 06:00)', count: 4, volume: 1200, label: 'Actividad Baja' },
    { hourBand: 'Mañana Turno 1 (06:00 - 12:00)', count: 28, volume: 8400, label: 'Actividad Crítica' },
    { hourBand: 'Tarde Turno 2 (12:00 - 18:00)', count: 19, volume: 5100, label: 'Actividad Moderada' },
    { hourBand: 'Noche Turno 3 (18:00 - 00:00)', count: 12, volume: 2900, label: 'Actividad Moderada' }
  ];

  return (
    <div className="space-y-6" id="statistics-tab-view">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Estadísticas y Rendimiento</h1>
          <p className="text-xs text-slate-500">Métricas analíticas avanzadas de consumo, ranking de eficiencia y bandas horarias operativas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left block: Ranking of high consumptions (wide 2 blocks) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              TOP 5: UNIDADES CON MAYOR CONSUMO ACUMULADO
            </h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            {rankedVehicles.map((rv, index) => {
              const widthPct = rankedVehicles[0] ? (rv.liters / rankedVehicles[0].liters) * 100 : 100;
              return (
                <div key={rv.plate} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center font-mono text-xs">{index + 1}</span>
                    <div>
                      <span className="text-xs font-mono font-bold uppercase block tracking-wider text-slate-800 bg-slate-50 px-2 py-0.5 border rounded w-fit">{rv.plate}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{rv.brand}</span>
                    </div>
                  </div>

                  {/* Visual gauge representation */}
                  <div className="flex-1 max-w-sm hidden sm:block">
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>

                  <strong className="text-xs font-mono text-slate-800 shrink-0">{formatLiters(rv.liters)}</strong>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right block: Total consumption by category */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Consumos por Combustible</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Litros Despachados" fill="#10b981">
                  {productChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Hourly activity heatmap panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-5 h-5 text-emerald-600" />
            Distribución Operativa por Bandas Horarias de Carga
          </h3>
          <p className="text-xs text-slate-400">Picos de demanda para planeamiento logístico de personal de guardia en playón.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {hourlyFrequencies.map((hf) => {
            let heatmapStyle = 'bg-slate-50 text-slate-600 border-slate-200';
            let tagColor = 'bg-slate-200 text-slate-700';

            if (hf.label.includes('Crítica')) {
              heatmapStyle = 'bg-amber-50 border-amber-200 text-amber-900';
              tagColor = 'bg-amber-200 text-amber-800';
            } else if (hf.label.includes('Moderada')) {
              heatmapStyle = 'bg-slate-50 border-slate-200 text-slate-800';
              tagColor = 'bg-emerald-500/20 text-emerald-800';
            }

            return (
              <div key={hf.hourBand} className={`p-4 border rounded-xl flex flex-col justify-between ${heatmapStyle}`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">{hf.hourBand}</span>
                  <div className="flex items-baseline gap-1 mt-1 font-mono">
                    <span className="text-xl font-black">{hf.count}</span>
                    <span className="text-[10px] font-normal font-sans">vueltas</span>
                  </div>
                  <p className="text-[10px] opacity-75 mt-2 font-mono">Litros estimados: {formatLiters(hf.volume)}</p>
                </div>
                <span className={`text-[9px] font-bold rounded px-2 py-0.5 mt-3 block w-fit font-sans uppercase ${tagColor}`}>{hf.label}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
