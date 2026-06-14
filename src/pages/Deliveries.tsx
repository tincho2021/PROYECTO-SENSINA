/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle,
  FileCheck2,
  Trash2,
  Paperclip
} from 'lucide-react';

import { formatLiters, formatDate } from '../utils/formatters';

interface DeliveriesProps {
  data: any;
  onRefresh: () => void;
  onAddDelivery: (deliveryData: any) => Promise<any>;
  isAdmin?: boolean;
}

export default function Deliveries({ data, onRefresh, onAddDelivery, isAdmin = true }: DeliveriesProps) {
  const { deliveries = [], products = [], tanks = [] } = data || {};
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [productId, setProductId] = useState('');
  const [tankId, setTankId] = useState('');
  const [litersDeclared, setLitersDeclared] = useState('');
  const [operator, setOperator] = useState('Operador de Guardia');
  const [notes, setNotes] = useState('');
  const [density, setDensity] = useState('840');
  const [temperature, setTemperature] = useState('20.4');

  const [toastMsg, setToastMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!productId && products.length > 0) {
      setProductId(products[0].id);
    }
  }, [products, productId]);

  useEffect(() => {
    if (!tankId && tanks.length > 0) {
      setTankId(tanks[0].id);
    }
  }, [tanks, tankId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !invoiceNumber || !litersDeclared) return;

    setIsLoading(true);

    const deliveryPayload = {
      supplier,
      invoiceNumber,
      productId,
      tankId,
      litersDeclared: Number(litersDeclared),
      operator,
      notes,
      density: Number(density),
      temperature: Number(temperature)
    };

    const res = await onAddDelivery(deliveryPayload);
    setIsLoading(false);
    setShowAddForm(false);
    
    // Reset fields
    setSupplier('');
    setInvoiceNumber('');
    setLitersDeclared('');
    setNotes('');

    setToastMsg(`Descarga de ${litersDeclared} L asentada con éxito. Stock del tanque destino ajustado.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="space-y-6" id="deliveries-tab-view">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header frame */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Registro de Descargas de Combustible</h1>
          <p className="text-xs text-slate-500 font-medium">Asentamiento de remitos físicos de camión cisterna repartidor, cubicación en tanques y auditoría volumétrica.</p>
        </div>
        {isAdmin ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="cursor-pointer flex items-center justify-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            REGISTRAR DESCARGA
          </button>
        ) : (
          <span className="text-[11px] text-slate-400 font-bold bg-slate-205 border border-slate-200 px-2.5 py-1 rounded bg-slate-50 uppercase tracking-wide">
            Solo Lectura (Supervisor)
          </span>
        )}
      </div>

      {/* Main Grid: Left table log, Right summary metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Deliveries Table Logs (takes 3 cols width) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold text-slate-500 select-none">
            <span>HISTORIAL DE REMITOS Y DESCARGAS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-4">Fecha / Hora</th>
                  <th className="py-2.5 px-4">Proveedor</th>
                  <th className="py-2.5 px-4">Factura/Nro Remito</th>
                  <th className="py-2.5 px-4">Tanque Destino</th>
                  <th className="py-2.5 px-4">Litros Decl.</th>
                  <th className="py-2.5 px-4">Medidos Antes / Después</th>
                  <th className="py-2.5 px-4">Discrepancia</th>
                  <th className="py-2.5 px-4">Operador</th>
                  <th className="py-2.5 px-4 text-right">Adjunto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium font-mono">
                {deliveries.map((d: any) => {
                  const prod = products.find((p: any) => p.id === d.productId);
                  const isDifferenceSuspicious = Math.abs(d.differenceLiters) > 150;

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-sans text-slate-500">{formatDate(d.timestamp)}</td>
                      <td className="py-3 px-4 text-slate-900 font-sans font-bold">
                        <div className="flex flex-col">
                          <span>{d.supplier}</span>
                          {(d.id?.startsWith('DL-AUTO-') || d.supplier?.toLowerCase().includes('automát') || d.operator?.toLowerCase().includes('sensor') || d.notes?.toLowerCase().includes('automát')) && (
                            <span className="inline-block bg-cyan-50 text-cyan-700 border border-cyan-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-1 w-fit uppercase tracking-wider font-sans">
                              Sonda IoT ⚡
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-600">{d.invoiceNumber}</td>
                      <td className="py-3 px-4 font-sans text-[11px]">{tanks.find((t: any) => t.id === d.tankId)?.name || d.tankId}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{formatLiters(d.litersDeclared)}</td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">{formatLiters(d.litersMeasuredBefore).split(' ')[0]} &rarr; {formatLiters(d.litersMeasuredAfter).split(' ')[0]}</td>
                      <td className={`py-3 px-4 ${isDifferenceSuspicious ? 'text-red-600 font-black bg-red-50/40 rounded' : 'text-slate-500'}`}>
                        {d.differenceLiters > 0 ? '+' : ''}{d.differenceLiters} L
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 text-[11px] truncate max-w-[100px]">{d.operator}</td>
                      <td className="py-3 px-4 text-right font-sans text-[11px]">
                        {d.hasAttachmentUrl ? (
                          <span className="text-emerald-600 hover:underline cursor-pointer flex items-center justify-end gap-1 font-bold">
                            <Paperclip className="w-3.5 h-3.5" /> VER PDF
                          </span>
                        ) : (
                          <span className="text-slate-400">Sin archivo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Simple summaries / tips */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
            <div className="bg-emerald-500 p-2 text-white rounded">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Control de Descarga</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                El sistema contrasta la telemedición de sonda inicial y final, calculando diferencias para mitigar fugas o mermas mecánicas.
              </p>
            </div>
          </div>

          <div className="text-xs space-y-3 pt-3">
            <span className="text-xs font-black text-slate-400 block tracking-widest uppercase">REGLAS CLAVE</span>
            <div className="bg-slate-50 p-2.5 rounded text-slate-500 leading-normal">
              <strong>1. Control de Precintos:</strong> Siempre asiente los milímetros declarados previo a la descarga.
            </div>
            <div className="bg-slate-50 p-2.5 rounded text-slate-500 leading-normal">
              <strong>2. Calibración Térmica:</strong> Los litros varían según el calor ambiente. Registre los °C reales del líquido.
            </div>
          </div>
        </div>

      </div>

      {/* Register load floating form popup */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="delivery-add-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Registrar Descarga de Camión Cisterna</h3>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="cursor-pointer text-slate-400 p-1 bg-slate-200 rounded-full"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-medium text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Distribuidor / Proveedor *</label>
                  <input 
                    required 
                    placeholder="Ej. YPF S.A. Agro" 
                    value={supplier} 
                    onChange={(e) => setSupplier(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Número de Remito / Factura *</label>
                  <input 
                    required 
                    placeholder="Ej. 0001-02948271" 
                    value={invoiceNumber} 
                    onChange={(e) => setInvoiceNumber(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Combustible Cargado</label>
                  <select 
                    value={productId} 
                    onChange={(e) => setProductId(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  >
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Cisterna / Tanque Destino</label>
                  <select 
                    value={tankId} 
                    onChange={(e) => setTankId(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  >
                    {tanks.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Litros Declarados en Factura *</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="Ej. 15000" 
                    value={litersDeclared} 
                    onChange={(e) => setLitersDeclared(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono" 
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Operador Responsable</label>
                  <input 
                    placeholder="Operador" 
                    value={operator} 
                    onChange={(e) => setOperator(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Densidad Medida (kg/m³ a 15°C)</label>
                  <input 
                    placeholder="Ej. 840" 
                    value={density} 
                    onChange={(e) => setDensity(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono" 
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Temperatura Termómetro (°C)</label>
                  <input 
                    placeholder="Ej. 20" 
                    value={temperature} 
                    onChange={(e) => setTemperature(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Observaciones de Precintos / Estado de Válvulas</label>
                <textarea 
                  placeholder="Ej. Precintos nros 9843 correspondientes a válvula principal..." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded h-16 focus:outline-none" 
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-slate-900 text-white px-5 py-2 hover:bg-slate-800 rounded font-bold cursor-pointer"
                >
                  {isLoading ? 'Registrando volumetría...' : 'Asentar en Base de Datos'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="px-5 py-2 border border-slate-200 text-slate-700 bg-white rounded cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
