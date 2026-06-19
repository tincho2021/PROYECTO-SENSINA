/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileCode2,
  Bookmark,
  DollarSign,
  TrendingUp,
  Sliders,
  Settings2,
  Layers,
  Database
} from 'lucide-react';

import { formatLiters, formatCurrency } from '../utils/formatters';

interface ProductsProps {
  data: any;
}

export default function Products({ data }: ProductsProps) {
  const { products, tanks, transactions } = data;

  const getProductStockSum = (pId: string) => {
    return tanks
      .filter((t: any) => t.productId === pId)
      .reduce((sum: number, t: any) => sum + t.currentVolumeLiters, 0);
  };

  const getProductCapacitySum = (pId: string) => {
    return tanks
      .filter((t: any) => t.productId === pId)
      .reduce((sum: number, t: any) => sum + t.capacityLiters, 0);
  };

  return (
    <div className="space-y-6" id="products-tab-view">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Catálogo de Productos</h1>
          <p className="text-xs text-slate-500">Mapeo de combustibles líquidos, densidades de referencia, umbrales críticos de seguridad y control tarifario.</p>
        </div>
      </div>

      {/* Grid displaying product specifications catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="products-cards-grid">
        {products.map((p: any) => {
          const sumStock = getProductStockSum(p.id);
          const sumCapacity = getProductCapacitySum(p.id);
          const percent = sumCapacity > 0 ? (sumStock / sumCapacity) * 100 : 0;
          const isLow = sumStock < p.minStock;

          return (
            <div key={p.id} className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
              
              {/* Product Banner Color Header */}
              <div className="h-2 w-full" style={{ backgroundColor: p.hexColor }} />
              
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 leading-tight uppercase">{p.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">CÓD: {p.id} | TIPO: {p.type}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isLow ? 'bg-red-50 text-red-800 border border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                    {isLow ? 'REPOSICIÓN REQUERIDA' : 'NIVEL CONFORME'}
                  </span>
                </div>

                {/* Primary numbers */}
                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 font-mono text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Precio Boca Surtidor</span>
                    <strong className="text-slate-800 text-sm">{formatCurrency(p.pricePerLiter)} <span className="font-sans text-[10px] text-slate-400">/L</span></strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Relación Densidad @15°C</span>
                    <strong className="text-slate-800 text-sm">{p.referenceDensity} <span className="font-sans text-[10px] text-slate-400">kg/m³</span></strong>
                  </div>
                </div>

                {/* Volumetric details bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Stock en Planta:</span>
                    <strong className="text-slate-700 font-mono">{formatLiters(sumStock)} <span className="text-slate-400 font-sans font-normal">/ {sumCapacity} L</span></strong>
                  </div>
                  
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${percent}%`, backgroundColor: p.hexColor }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Mín: {p.minStock} L</span>
                    <span>Máx: {p.maxStock} L</span>
                  </div>
                </div>

                {/* Internal parameters */}
                <div className="bg-slate-50 p-2.5 rounded-lg text-[10px] text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Unidad Contable:</span>
                    <strong className="text-slate-700">{p.unit === 'L' ? 'Litros (L)' : p.unit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado del Producto:</span>
                    <strong className="text-emerald-600">ACTIVO</strong>
                  </div>
                </div>

              </div>

              <div className="bg-slate-50/50 p-3 border-t border-slate-100 text-[10.5px] text-slate-500 flex justify-between items-center font-sans">
                <span>ÚLTIMA REPOSICIÓN ACCESO</span>
                <span className="underline font-bold text-slate-600 cursor-pointer hover:text-slate-900">Editar Límites &rarr;</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
