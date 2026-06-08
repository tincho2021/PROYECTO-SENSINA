/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Brain,
  TrendingDown,
  ShieldAlert,
  Sliders,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
  CheckCircle,
  TrendingUp,
  AlertOctagon
} from 'lucide-react';

import { formatLiters } from '../utils/formatters';

interface InsightsProps {
  data: any;
}

export default function Insights({ data }: InsightsProps) {
  const { tanks, transactions, vehicles } = data;
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [engineFinished, setEngineFinished] = useState(true);

  const handleRunEngine = () => {
    setIsRunningEngine(true);
    setTimeout(() => {
      setIsRunningEngine(false);
      setEngineFinished(true);
    }, 1500);
  };

  // Rule-based diagnostic summaries
  const ruleAnomalies = [
    {
      id: "ANOM-01",
      title: "Desvío Evaporación / Merma Estática",
      target: "Tanque 02 - Gasoil Grado 3 (Rosario Norte)",
      severity: "warning",
      trigger: "Stock reduce ~3.4 L/hora continuas sin mangueras activas en banda horaria 01:00 am - 05:00 am.",
      diagnose: "Fuga capilar por cañería, falla en sello de válvula de descarga, o evaporación anormal por desgasificado continuo de venteo.",
      confidence: "82% - Sensor de presión hidrostática calibrado"
    },
    {
      id: "ANOM-02",
      title: "Cargar Fuera de Programación de Reparto",
      target: "Patente HJJ-990 - Iveco Trakker",
      severity: "critical",
      trigger: "Extracción de 680 L autorizada con llavero RFID a las 03:14 AM durante fin de semana largo.",
      diagnose: "Posible desvío de combustible. La manguera estuvo activa 12 minutos. No hay hoja de ruta vinculada para el Iveco en esa fecha.",
      confidence: "95% - Registro cruzado GPS"
    },
    {
      id: "ANOM-03",
      title: "Deterioro Eficiencia Kilométrica (Km/L)",
      target: "Camión Tolva VW - Patente KKL-009",
      severity: "warning",
      trigger: "Eficiencia disminuyó de 4.2 Km/L históricos a sólo 2.8 Km/L en los últimos 4 despachos asentados.",
      diagnose: "Inyección obstruida, pinchadura de manguera de retorno de combustible, o sobrecarga física en pendientes.",
      confidence: "74% - Coincidencia odómetro de playón"
    }
  ];

  return (
    <div className="space-y-6" id="insights-tab-view">
      
      {/* Upper banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm font-sans">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Brain className="w-6 h-6 text-emerald-600" />
            Motor AI de Reglas SENSINA
          </h1>
          <p className="text-xs text-slate-500 font-medium">Algoritmos heurísticos de playón que vigilan mermas estacionales, desvíos kilométricos y comportamientos nocturnos de mangueras.</p>
        </div>
        <button
          onClick={handleRunEngine}
          disabled={isRunningEngine}
          className="cursor-pointer flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-4 py-2 rounded-lg font-bold shadow-md transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningEngine ? 'animate-spin' : ''}`} />
          {isRunningEngine ? 'EJECUTANDO HEURÍSTICA...' : 'FORZAR ESCANEO AI'}
        </button>
      </div>

      {engineFinished && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="insights-alerts-deck">
          {ruleAnomalies.map((an) => (
            <div key={an.id} className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              
              <div className="p-5 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <span className="font-mono text-slate-400 font-bold">{an.id}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    an.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {an.severity === 'critical' ? 'CRÍTICO' : 'DESVÍO'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-800 leading-tight uppercase tracking-tight">{an.title}</h3>
                  <span className="text-[10px] text-slate-400 block font-mono font-bold mt-0.5">{an.target}</span>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-600 font-medium bg-slate-50 p-2.5 rounded border border-slate-100">
                  <strong className="block text-[9.5px] uppercase tracking-wider text-slate-400 font-sans mb-1">Gatillador Heurístico:</strong>
                  {an.trigger}
                </p>

                <p className="text-[11px] leading-relaxed text-slate-500">
                  <strong className="block text-[9.5px] uppercase tracking-wider text-emerald-600 font-sans mb-0.5">Diagnóstico Predictivo:</strong>
                  {an.diagnose}
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-400 font-mono tracking-wider font-bold">
                <span>CONFIABILIDAD DE REGLA: {an.confidence}</span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Basic explanation cards on how engine works */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">¿Cómo opera el Motor SENSINA Cloud?</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed font-semibold">
          <div className="space-y-1 bg-slate-50 p-4 border border-slate-200/50 rounded-xl">
            <span className="text-slate-400 text-lg block font-mono">01/</span>
            <h4 className="font-bold text-slate-800 uppercase">Muestreo Hidrostático</h4>
            <p className="font-medium text-slate-500">Compara el mm de nivel bruto enviado cada 5 minutos por la sonda SENSINA en estado inactivo con la curva de descarga volumétrica.</p>
          </div>
          <div className="space-y-1 bg-slate-50 p-4 border border-slate-200/50 rounded-xl">
            <span className="text-slate-400 text-lg block font-mono">02/</span>
            <h4 className="font-bold text-slate-800 uppercase">Control Cruzado RFID</h4>
            <p className="font-medium text-slate-500">Garantiza que toda apertura de válvula de manguera cuente con una lectura exitosa de tarjeta habilitada por la flota.</p>
          </div>
          <div className="space-y-1 bg-slate-50 p-4 border border-slate-200/50 rounded-xl">
            <span className="text-slate-400 text-lg block font-mono">03/</span>
            <h4 className="font-bold text-slate-800 uppercase">Evaporación Térmica</h4>
            <p className="font-medium text-slate-500">Aplica polinomios de calibración térmica para asentar mermas estacionales de manera justa según la ley de hidrocarburos.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
