/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  Droplet,
  Truck,
  AlertTriangle,
  RefreshCw,
  Clock,
  CircleDot,
  Radio,
  FileText,
  Brain,
  Zap,
  Thermometer,
  Droplets,
  Wifi,
  Battery,
  Layers,
  Gauge
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import {
  formatLiters,
  formatCurrency,
  formatDate
} from '../utils/formatters';

import {
  calculateTankPercentage,
  estimateAutonomyDays,
  getProductColorHex
} from '../utils/calculations';

import {
  mockHistoricalStockData,
  mockDailyConsumptionData
} from '../data/mockData';

const getBarColorHex = (status: string) => {
  switch (status) {
    case 'low_stock':
      return '#f59e0b'; // amber-500
    case 'critical_low':
      return '#f43f5e'; // rose-500
    case 'high_level':
      return '#3b82f6'; // blue-500
    case 'no_comm':
      return '#94a3b8'; // slate-400
    default:
      return '#0d9488'; // teal-600
  }
};

// Visual Tank Gauge Widgets Component definition
export function VisualTanksSection({ tanks, products, onNavigate }: { tanks: any[]; products: any[]; onNavigate: (tab: string) => void }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monitoreo de Telemedición de Tanques</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5 font-mono">Sondas Magnetoestrictivas C.E.S.T.I. en Directo</p>
        </div>
        <span onClick={() => onNavigate('telemetry')} className="text-xs text-teal-650 hover:underline cursor-pointer font-bold flex items-center gap-1">
          Histórico e Inventario &rarr;
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
        {tanks.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <p className="text-xs text-slate-450 italic">Esperando que el ESP32 transmita la primera telemetría para registrar los tanques de combustible.</p>
            <button 
              onClick={() => onNavigate('esp32-live')}
              className="text-[11px] font-extrabold text-teal-600 hover:underline cursor-pointer tracking-wider uppercase font-mono"
            >
              Configurar Parámetros ESP32 &rarr;
            </button>
          </div>
        ) : (
          tanks.map((t: any) => {
            const pct = calculateTankPercentage(t.currentVolumeLiters, t.capacityLiters);
            const isLow = t.sensorStatus === 'low_stock' || t.sensorStatus === 'critical_low';
            const isNoComm = t.sensorStatus === 'no_comm';
            const isHigh = t.sensorStatus === 'high_level';

            let badgeBg = 'bg-teal-50 text-teal-700 border-teal-100';
            let badgeText = 'Estable';
            
            if (isLow) {
              badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
              badgeText = 'Stock Bajo';
            }
            if (t.sensorStatus === 'critical_low') {
              badgeBg = 'bg-rose-100 text-rose-700 border-rose-200 animate-pulse';
              badgeText = 'Stock Crítico';
            }
            if (isHigh) {
              badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
              badgeText = 'Nivel Alto';
            }
            if (isNoComm) {
              badgeBg = 'bg-slate-100 text-slate-500 border-slate-200';
              badgeText = 'Fuera Línea';
            }

            const associatedProd = products.find((p: any) => p.id === t.productId);
            const prodName = associatedProd?.name?.split(' (')[0] || t.productId || 'Gasoil';
            const barLeftColor = associatedProd?.hexColor || associatedProd?.product_color || getProductColorHex(t.productId);

            return (
              <div 
                key={t.id} 
                onClick={() => onNavigate('telemetry')}
                className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-slate-300 hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between relative overflow-hidden group select-none"
              >
                {/* Brand status outline on top */}
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: barLeftColor }} />

                {/* Header section of the card */}
                <div className="flex justify-between items-start gap-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-800 tracking-tight truncate block">{t.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono tracking-wide">({t.id})</span>
                    </div>
                    {/* Fuel badge type */}
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9.5px] font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200 tracking-wider">
                      {prodName}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${badgeBg}`}>
                    {badgeText}
                  </span>
                </div>

                {/* Main body split layout: left column metadata, right column graphical glass thermometer cylinder */}
                <div className="grid grid-cols-12 gap-3 my-4 items-center">
                  
                  {/* Left Column: Values & Metrics */}
                  <div className="col-span-7 space-y-3">
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Volumen Neto</p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-slate-950 tracking-tight font-mono">
                          {isNoComm ? '---' : formatLiters(t.currentVolumeLiters).split(' ')[0]}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">Litros</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: barLeftColor }} />
                        {isNoComm ? 'Sonda desconectada' : `${Math.round(pct)}% de capacidad`}
                      </p>
                    </div>

                    {/* Miniature sensor items grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      {/* Temperature */}
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono font-medium truncate">
                          {isNoComm ? '---' : `${(t.temperatureC ?? 15.0).toFixed(1)} °C`}
                        </span>
                      </div>
                      
                      {/* Water detection */}
                      <div className={`flex items-center gap-1 ${t.waterMm > 0 ? 'text-amber-600 font-bold' : ''}`}>
                        <Droplets className={`w-3.5 h-3.5 shrink-0 ${t.waterMm > 0 ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
                        <span className="font-mono truncate">
                          Agua: {isNoComm ? '---' : `${t.waterMm ?? 0} mm`}
                        </span>
                      </div>

                      {/* Battery level */}
                      <div className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono truncate">
                          Bat: {t.batteryPercent ?? 100}%
                        </span>
                      </div>

                      {/* RSSI Wifi strength */}
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono truncate">
                          {t.signalRssi ?? -60} dBm
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 3D-ish Glass Cylinder level */}
                  <div className="col-span-5 flex flex-col items-center justify-center">
                    <div className="relative w-16 h-32 bg-slate-50 border border-slate-200 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] flex flex-col justify-end overflow-hidden p-[3px]">
                      
                      {/* Top metal ring cap on the tube */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border-b border-slate-300 rounded-t-xl z-20" />

                      {/* Graduation vertical Ticks */}
                      <div className="absolute inset-y-2 left-1.5 w-1 flex flex-col justify-between text-slate-400 opacity-40 select-none text-[6px] font-mono pointer-events-none z-20">
                        <span className="border-t border-slate-800 w-1.5"></span>
                        <span className="border-t border-slate-800 w-1"></span>
                        <span className="border-t border-slate-800 w-1"></span>
                        <span className="border-t border-slate-800 w-1.5"></span>
                        <span className="border-t border-slate-800 w-1"></span>
                        <span className="border-t border-slate-800 w-1"></span>
                        <span className="border-t border-slate-800 w-1.5"></span>
                      </div>

                      {/* Dynamic liquid height level containing gradient blocks */}
                      <div 
                        className="w-full rounded-b-lg transition-all duration-700 ease-out relative overflow-hidden" 
                        style={{ 
                          height: isNoComm ? '0%' : `${Math.max(6, Math.min(pct, 100))}%`,
                        }}
                      >
                        {/* High-fidelity wave/cap line */}
                        {!isNoComm && (
                          <div 
                            className="absolute top-0 left-0 right-0 h-1.5 border-t-2 opacity-90 z-20"
                            style={{ borderColor: barLeftColor }}
                          />
                        )}

                        {/* Liquid volume solid gradient */}
                        <div 
                          className="w-full h-full relative"
                          style={{
                            backgroundColor: isNoComm ? '#cbd5e1' : barLeftColor,
                            backgroundImage: isNoComm ? 'none' : `linear-gradient(to right, ${barLeftColor}, ${barLeftColor}dd 40%, ${barLeftColor}bb)`
                          }}
                        >
                          {/* Shimmer light reflect on liquid left side */}
                          <div className="absolute inset-y-0 left-1 w-2.5 bg-white/20 blur-[0.2px] rounded-l-full pointer-events-none" />
                        </div>
                      </div>

                      {/* Glass light reflection/shading layer overlays */}
                      <div className="absolute top-2 right-2 bottom-1 w-3 bg-white/10 rounded-full pointer-events-none z-20 filter blur-[0.5px]" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-white/5 to-black/5 pointer-events-none z-10 rounded-xl" />

                      {/* Float percent badge centered on glass tube */}
                      <div className="absolute inset-0 flex items-center justify-center z-30 font-extrabold text-slate-800 pointer-events-none text-xs tracking-tight select-none mt-2 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] font-mono">
                        {isNoComm ? 'N/A' : `${Math.round(pct)}%`}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom line: Design limit label */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[9.5px] text-slate-400 font-bold font-mono tracking-wider">
                  <span>CAPACIDAD DE CISTERNA</span>
                  <span className="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono font-bold">
                    {t.capacityLiters.toLocaleString()} L
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface DashboardProps {
  data: any;
  onRefresh: () => void;
  onNavigate: (tabId: string) => void;
}

export default function Dashboard({ data, onRefresh, onNavigate }: DashboardProps) {
  const { tanks = [], dispensers = [], transactions = [], alerts = [], products = [] } = data || {};

  // Get dynamic names of products based on registered IDs, falling back to default labels
  const g2Name = products.find((p: any) => p.id === 'GO2')?.name?.split(' (')[0] || 'Gasoil G2';
  const g3Name = products.find((p: any) => p.id === 'GP')?.name?.split(' (')[0] || 'Gasoil G3';
  const nsName = products.find((p: any) => p.id === 'NS')?.name?.split(' (')[0] || 'Nafta Súper';

  // Check if there are any completed transactions from preceding days. 
  // If not, it means the database has been wiped clean / reset to start fresh of today (15/6)
  const hasHistory = transactions.length > 0 && transactions.some((tx: any) => {
    const txDate = new Date(tx.createdAt || tx.timestampStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return txDate < today;
  });

  // Stock history timeline of the last 15 days
  const dynamicHistoricalData = mockHistoricalStockData.map((item: any, idx: number) => {
    // Find current live volumes for each fuel type
    const g2Vol = tanks.filter((t: any) => t.productId === 'GO2' || t.product_id === 'GO2').reduce((sum: number, t: any) => sum + (t.currentVolumeLiters || 0), 0);
    const g3Vol = tanks.filter((t: any) => t.productId === 'GP' || t.productId === 'premium' || t.productId === 'GO3' || t.product_id === 'GP' || t.product_id === 'premium' || t.product_id === 'GO3').reduce((sum: number, t: any) => sum + (t.currentVolumeLiters || 0), 0);
    const nsVol = tanks.filter((t: any) => t.productId === 'NS' || t.productId === 'NF' || t.productId === 'nafta' || t.product_id === 'NS' || t.product_id === 'NF' || t.product_id === 'nafta').reduce((sum: number, t: any) => sum + (t.currentVolumeLiters || 0), 0);

    // Check if any active tanks exist for each fuel type
    const hasG2Active = tanks.some((t: any) => t.productId === 'GO2' || t.product_id === 'GO2');
    const hasG3Active = tanks.some((t: any) => t.productId === 'GP' || t.productId === 'premium' || t.productId === 'GO3' || t.product_id === 'GP' || t.product_id === 'premium' || t.product_id === 'GO3');
    const hasNSActive = tanks.some((t: any) => t.productId === 'NS' || t.productId === 'NF' || t.productId === 'nafta' || t.product_id === 'NS' || t.product_id === 'NF' || t.product_id === 'nafta');

    // Today reference mock values to calculate scaling factor
    const todayG2Mock = mockHistoricalStockData[14]["Gasoil G2 (L)"] || 1;
    const todayG3Mock = mockHistoricalStockData[14]["Gasoil G3 (L)"] || 1;
    const todayNSMock = mockHistoricalStockData[14]["Nafta Súper (L)"] || 1;

    // Scale the historical trend series if active, otherwise set strictly to 0
    const g2Val = hasG2Active ? Math.round((item["Gasoil G2 (L)"] / todayG2Mock) * g2Vol) : 0;
    const g3Val = hasG3Active ? Math.round((item["Gasoil G3 (L)"] / todayG3Mock) * g3Vol) : 0;
    const nsVal = hasNSActive ? Math.round((item["Nafta Súper (L)"] / todayNSMock) * nsVol) : 0;

    return {
      name: item.name,
      [`${g2Name} (L)`]: g2Val,
      [`${g3Name} (L)`]: g3Val,
      [`${nsName} (L)`]: nsVal
    };
  });

  // Daily consumption per branch timeline matching the last 14 days
  const dynamicDailyConsumptionData = mockDailyConsumptionData.map((item: any, idx: number) => {
    if (hasHistory) {
      // Simulation/demo mode is active: Use predefined mock consumption
      return item;
    } else {
      // Clean start/wiped mode - Set previous days to 0.
      // Calculate today's real volume dispensed from live transactions.
      const isToday = idx === mockDailyConsumptionData.length - 1;
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const getSumForSite = (siteKeys: string[]) => {
        return transactions
          .filter((tx: any) => {
            const isCompleted = tx.status === 'completed';
            const txDate = new Date(tx.createdAt || tx.timestampStart);
            const isTodayTx = txDate >= todayStart;
            // Map sites dynamically
            const siteNameMatch = siteKeys.some(k => 
              (tx.siteId && String(tx.siteId).toLowerCase().includes(k.toLowerCase())) ||
              (tx.siteName && String(tx.siteName).toLowerCase().includes(k.toLowerCase())) ||
              (tx.dispenserId && String(tx.dispenserId).toLowerCase().includes(k.toLowerCase()))
            );
            return isCompleted && isTodayTx && siteNameMatch;
          })
          .reduce((sum: number, tx: any) => sum + (tx.liters || 0), 0);
      };

      // If there are transactions today but without specific site, default them to Rosario (main branch)
      const unfilteredToday = transactions
        .filter((tx: any) => tx.status === 'completed' && new Date(tx.createdAt || tx.timestampStart) >= todayStart)
        .reduce((sum: number, tx: any) => sum + (tx.liters || 0), 0);

      let rosarioLiters = getSumForSite(['rosario', 'norte', 'ESTACION-001', 'surt', 'ctrl']);
      if (rosarioLiters === 0 && unfilteredToday > 0) {
        rosarioLiters = unfilteredToday;
      }

      const bahiaLiters = getSumForSite(['bahía', 'bahia', 'sur', 'ESTACION-002']);
      const lujanLiters = getSumForSite(['luján', 'lujan', 'oeste', 'ESTACION-003']);

      return {
        name: item.name,
        Rosario: isToday ? rosarioLiters : 0,
        "Bahía Blanca": isToday ? bahiaLiters : 0,
        Luján: isToday ? lujanLiters : 0
      };
    }
  });

  // 1. KPI Calculations
  const totalLitersAvailable = tanks.reduce((sum: number, t: any) => sum + t.currentVolumeLiters, 0);
  const totalCapacity = tanks.reduce((sum: number, t: any) => sum + t.capacityLiters, 0);
  
  // Liters value: Multiply current tank stock * product price
  const totalValue = tanks.reduce((sum: number, t: any) => {
    const prod = products.find((p: any) => p.id === t.productId);
    const price = prod ? prod.pricePerLiter : 1200;
    return sum + t.currentVolumeLiters * price;
  }, 0);

  // Today's total dispensed liters
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dispensedToday = transactions
    .filter((tx: any) => tx.status === 'completed' && new Date(tx.createdAt) >= todayStart)
    .reduce((sum: number, tx: any) => sum + tx.liters, 0);

  // Month-to-date dispensed liters
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0,0,0,0);
  const dispensedMonth = transactions
    .filter((tx: any) => tx.status === 'completed' && new Date(tx.createdAt) >= firstOfMonth)
    .reduce((sum: number, tx: any) => sum + tx.liters, 0);

  const activeAlerts = alerts.filter((a: any) => a.status === 'new');
  const criticalAlertsCount = activeAlerts.filter((a: any) => a.level === 'critical').length;
  
  const connectedSensorsCount = tanks.filter((t: any) => t.sensorStatus !== 'no_comm').length;
  const activeDispensersCount = dispensers.filter((d: any) => d.status === 'dispensing' || d.status === 'calling').length;

  // Estimate general autonomy (Liters / typical rate across sites)
  const averageDailyRate = Math.max(100, Math.round(dispensedMonth / Math.max(1, new Date().getDate())));
  const averageAutonomyDays = Math.round((totalLitersAvailable / (averageDailyRate || 1350)) * 10) / 10;

  // 2. Prepare Stock by Product distribution for Donut Chart
  const productStockMap: { [key: string]: { name: string; value: number; color: string } } = {};
  tanks.forEach((t: any) => {
    const prod = products.find((p: any) => p.id === t.productId);
    if (prod) {
      if (!productStockMap[prod.id]) {
        productStockMap[prod.id] = {
          name: prod.name.split(' (')[0], // Clean name
          value: 0,
          color: prod.hexColor
        };
      }
      productStockMap[prod.id].value += t.currentVolumeLiters;
    }
  });
  const stockByProductData = Object.values(productStockMap);

  // Recharts data sources

  return (
    <div className="space-y-5" id="dashboard-tab-view">
      
      {/* Upper Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Centro de Operaciones: {data.activeSiteName || 'Estación Norte'}</h1>
          <p className="text-xs text-slate-500">
            {data.activeSiteLocation ? `${data.activeSiteLocation} • ` : ''}Resumen operativo general de combustible de tanques, surtidores y flotas en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            TELEMEDICIÓN ESP32: ONLINE
          </span>
          <button
            onClick={onRefresh}
            className="cursor-pointer flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ACTUALIZAR
          </button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlertsCount > 0 && (
        <div 
          onClick={() => onNavigate('alerts')}
          className="flex items-center justify-between gap-3 bg-rose-50 hover:bg-rose-100/80 cursor-pointer border border-rose-200 text-rose-800 p-4 rounded-xl shadow-sm transition-all animate-pulse"
          id="critical-alert-banner"
        >
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-2 rounded-lg text-white">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">¡Atención! Hay {criticalAlertsCount} Alertas Críticas Activas</h4>
              <p className="text-xs text-rose-700/90 leading-normal">Se detectaron quiebres de stock, presencia de agua o sobrellenados de cisternas.</p>
            </div>
          </div>
          <span className="text-xs font-bold underline text-rose-800 font-mono">RESOLVER &rarr;</span>
        </div>
      )}

      {/* KPI Cards Row (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="kpi-cards-grid">
        
        {/* KPI 1: Stock Total Disponible */}
        <div className="bento-box flex flex-col justify-center">
          <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Stock Total Disponible</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{formatLiters(totalLitersAvailable).split(' ')[0]}</span>
            <span className="text-sm text-slate-400 font-bold uppercase">Litros</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-teal-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${calculateTankPercentage(totalLitersAvailable, totalCapacity)}%` }} 
            />
          </div>
          <span className="text-[9.5px] text-slate-400 font-semibold block mt-1">Nivel general: {Math.round(calculateTankPercentage(totalLitersAvailable, totalCapacity))}% de capacidad</span>
        </div>

        {/* KPI 2: Stock Valorizado */}
        <div className="bento-box flex flex-col justify-center">
          <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Patrimonio de Stock</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{formatCurrency(totalValue)}</span>
          </div>
          <div className="text-[9.5px] text-slate-400 font-semibold block mt-2">Valor de mercado oficial s/ cartelera</div>
        </div>

        {/* KPI 3: Despachos Hoy */}
        <div className="bento-box flex flex-col justify-center">
          <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Despachos Hoy</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">{formatLiters(dispensedToday).split(' ')[0]}</span>
            <span className="text-sm text-slate-400 font-bold uppercase">Litros</span>
          </div>
          <div className="text-[9.5px] text-slate-400 font-semibold block mt-2">Mes corriente: {formatLiters(dispensedMonth)}</div>
        </div>

        {/* KPI 4: Transacciones Activas */}
        <div className="bento-box flex flex-col justify-center">
          <p className="text-[10.5px] text-slate-450 font-bold uppercase tracking-wider">Transacciones Activas</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-teal-600 tracking-tight font-mono">
              {activeDispensersCount} <span className="text-sm font-medium text-slate-500">de</span> {dispensers.length}
            </span>
            <span className="text-xs text-slate-400 font-bold uppercase">Surtidores</span>
          </div>
          <div className="text-[9.5px] text-slate-400 font-semibold block mt-2">
            Consumo promedio: {averageDailyRate} L/día • {dispensers.length > 0 ? "Vínculo ESP32 OK" : "Sin conexión"}
          </div>
        </div>

      </div>

      {/* Visual Tank Gauge Widgets */}
      <VisualTanksSection tanks={tanks} products={products} onNavigate={onNavigate} />

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" id="dashboard-charts-layout">
        
        {/* Left column: Historic Stock levels Area Chart (Takes 2 blocks layout wide on desktop) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest leading-none">Evolución del Inventario (Últimos 15 Días)</h3>
              <p className="text-[11px] text-slate-500 mt-1">Variación volumétrica neta de depósitos de combustibles principales.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-500 font-semibold flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: products.find((p: any) => p.id === 'GO2')?.hexColor || '#0d9488' }} /> {g2Name}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: products.find((p: any) => p.id === 'GP')?.hexColor || '#0f766e' }} /> {g3Name}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: products.find((p: any) => p.id === 'NS')?.hexColor || '#3b82f6' }} /> {nsName}</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dynamicHistoricalData}>
                <defs>
                  <linearGradient id="colorG2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={products.find((p: any) => p.id === 'GO2')?.hexColor || '#0d9488'} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={products.find((p: any) => p.id === 'GO2')?.hexColor || '#0d9488'} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorG3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={products.find((p: any) => p.id === 'GP')?.hexColor || '#0f766e'} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={products.find((p: any) => p.id === 'GP')?.hexColor || '#0f766e'} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff4f6" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '11px' }} />
                <Area type="monotone" dataKey={`${g2Name} (L)`} stroke={products.find((p: any) => p.id === 'GO2')?.hexColor || '#0d9488'} fillOpacity={1} fill="url(#colorG2)" strokeWidth={2.5} />
                <Area type="monotone" dataKey={`${g3Name} (L)`} stroke={products.find((p: any) => p.id === 'GP')?.hexColor || '#0f766e'} fillOpacity={1} fill="url(#colorG3)" strokeWidth={2.5} />
                <Area type="monotone" dataKey={`${nsName} (L)`} stroke={products.find((p: any) => p.id === 'NS')?.hexColor || '#3b82f6'} fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column: Highlights and AI Insights card matching the Bento Design HTML */}
        <div className="bg-teal-800 text-white p-6 rounded-xl shadow-sm border border-teal-900 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Droplet className="w-24 h-24 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest text-teal-300 uppercase mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-teal-300" />
              Insights de Inteligencia
            </h2>
            <div className="space-y-3.5">
              <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Cisterna en Alerta</p>
                <p className="text-xs mt-1">El Tanque de Rosario (Cisterna {g2Name}) llegará a nivel de recarga en <span className="font-bold text-amber-300">48 horas</span> según el promedio de consumo histórico.</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Anomalía en Flota</p>
                <p className="text-xs mt-1">El vehículo <span className="font-bold">AB123CD (Scania)</span> presenta un desvío de combustible del 18% superior al promedio registrado.</p>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Eficiencia Operativa</p>
                <p className="text-xs mt-1">Hora pico de carga detectada: <span className="font-bold text-teal-200">07:30 AM a 09:15 AM</span>. Recomendado: Habilitar manguera auxiliar.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-teal-200">
            <span>Predicciones Auto-Sync</span>
            <span className="font-mono font-bold text-[10px]">v2.6</span>
          </div>
        </div>

      </div>

      {/* Two columns bottom panel: Daily Fleet Consumption & Consoles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Right column: Distribution of stock by product */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Stock por Producto</h3>
            <p className="text-[11px] text-slate-500 font-medium">Proporciones volumétricas actuales.</p>
          </div>
          <div className="h-44 relative my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockByProductData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stockByProductData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => formatLiters(val)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Disponible</span>
              <span className="text-lg font-bold text-teal-850 font-mono mt-1">{formatLiters(totalLitersAvailable).split(' ')[0]}</span>
              <span className="text-[9px] text-slate-450 font-mono">L</span>
            </div>
          </div>
          <div className="space-y-1.5 border-t border-slate-100 pt-3.5">
            {stockByProductData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 truncate">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{Math.round((item.value / totalLitersAvailable) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Two columns bottom panel: Daily Fleet Consumption & Consoles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Bar charts site-by-site consumption */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase">Consumo de Flota Diario por Sucursal (L)</h3>
            <p className="text-[11px] text-slate-500 font-medium">Despachos volumétricos registrados diario en Rosario, Bahía Blanca y Luján.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicDailyConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eff4f6" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Rosario" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Bahía Blanca" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Luján" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Active Surtidores/Console State indicators */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase">Surtidores en línea</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium font-sans">Lecturas de consolas conectadas ESP32.</p>
          </div>
          
          <div className="my-4 divide-y divide-slate-100 max-h-56 overflow-y-auto font-sans">
            {dispensers.slice(0, 5).map((d: any) => {
              const active = d.status === 'dispensing' || d.status === 'calling';
              return (
                <div key={d.id} className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-[140px] font-sans">{d.name}</span>
                    <span className="text-[9px] text-slate-450 font-mono font-semibold">P: {d.productId.replace('prod-', '')} - H: {d.hose}</span>
                  </div>
                  <div className="text-right">
                    {active ? (
                      <span className="text-[10px] font-bold text-orange-650 bg-orange-50 border border-orange-200 px-2 rounded-full inline-block animate-pulse">
                        {d.status === 'dispensing' ? 'Despachando' : 'Llamando'}
                      </span>
                    ) : d.status === 'offline' ? (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 rounded-full inline-block">
                        Desconector
                      </span>
                    ) : d.status === 'error' ? (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 rounded-full inline-block">
                        Error
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 rounded-full inline-block">
                        Disponible
                      </span>
                    )}
                    {d.activeVehicle && (
                      <span className="text-[9px] text-slate-500 block font-mono uppercase">{d.activePlate}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div 
            onClick={() => onNavigate('dispensers')}
            className="cursor-pointer border-t border-slate-100 pt-3 text-center text-xs text-teal-650 hover:text-teal-900 font-bold flex items-center justify-center gap-1 font-sans"
          >
            Consola Completa Surtidores &rarr;
          </div>
        </div>

      </div>

      {/* Monitor de Surtidores en Tiempo Real section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm leading-none">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest block leading-none">Monitor de Surtidores en Tiempo Real</h2>
            <p className="text-[11px] text-slate-500 mt-1 font-medium leading-none">Lecturas de consolas activas ESP32 vinculadas a la red ethernet.</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Disponible</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" /> Despachando</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-205 rounded-full" /> Offline</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dispensers.slice(0, 4).map((d: any) => {
            const active = d.status === 'dispensing' || d.status === 'calling';
            const isOffline = d.status === 'offline';
            let statusCardStyle = "border-emerald-100 bg-emerald-50/20";
            let iconColor = "text-emerald-600";
            
            if (active) {
              statusCardStyle = "border-orange-100 bg-orange-50/20 ring-2 ring-orange-500/10";
              iconColor = "text-orange-500 animate-pulse";
            } else if (isOffline) {
              statusCardStyle = "border-slate-200 bg-slate-50 opacity-60";
              iconColor = "text-slate-400";
            }

            return (
              <div key={d.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${statusCardStyle}`}>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">{d.id}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{d.name}</p>
                  <p className="text-[10px] text-slate-650 mt-1 italic font-medium leading-none font-mono">
                    {active ? `Cargando... ${d.hose} (${d.productId.replace('prod-', '')})` : `Último: ${formatLiters(45.2).split(' ')[0]} L`}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-orange-100' : isOffline ? 'bg-slate-200' : 'bg-emerald-100'} ${iconColor}`}>
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
        <div 
          onClick={() => onNavigate('dispensers')}
          className="cursor-pointer border-t border-slate-150 mt-5 pt-3.5 text-center text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center justify-center gap-1.5"
        >
          Consola Operativa Surtidores Completa &rarr;
        </div>
      </div>

    </div>
  );
}
