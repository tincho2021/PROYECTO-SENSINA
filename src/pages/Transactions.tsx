/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Eye,
  X,
  FileText,
  BadgeAlert,
  Download
} from 'lucide-react';

import { formatDate, formatLiters, formatCurrency, resolveDriverName } from '../utils/formatters';

interface TransactionsProps {
  data: any;
  onModifyTransaction: (txId: string, updates: any) => void;
  isAdmin?: boolean;
}

export default function Transactions({ data, onModifyTransaction, isAdmin = true }: TransactionsProps) {
  const { transactions = [], products = [], drivers = [], vehicles = [] } = data || {};

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [minLiters, setMinLiters] = useState('');
  const [maxLiters, setMaxLiters] = useState('');

  // Selected Transaction Details Modal
  const [detailsTxId, setDetailsTxId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const detailTx = transactions.find((tx: any) => tx.id === detailsTxId);

  // Filter Logic
  const filteredTransactions = transactions.filter((tx: any) => {
    // Search by Driver ID/Name or Plate
    const matchesSearch = 
      (tx.driverId && tx.driverId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.vehiclePlate && tx.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProduct = !selectedProduct || tx.productId === selectedProduct;
    const matchesStatus = !selectedStatus || tx.status === selectedStatus;
    const matchesMethod = !selectedMethod || tx.authorizationMethod === selectedMethod;
    
    const liters = tx.liters;
    const matchesMinLiters = !minLiters || liters >= Number(minLiters);
    const matchesMaxLiters = !maxLiters || liters <= Number(maxLiters);

    return matchesSearch && matchesProduct && matchesStatus && matchesMethod && matchesMinLiters && matchesMaxLiters;
  });

  const handleExport = (format: 'CSV' | 'Excel') => {
    setToastMessage(`Exportación de ${filteredTransactions.length} despachos en formato ${format} generada y descargada conforme.`);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 4000);
  };

  const handleFlagTransaction = (id: string) => {
    onModifyTransaction(id, { 
      status: 'flagged', 
      notes: commentText || 'Transacción analizada y marcada como observada por auditoría central.' 
    });
    setCommentText('');
    setToastMessage('La carga ha sido clasificada como OBSERVADA con éxito.');
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  };

  const handleApproveTransaction = (id: string) => {
    onModifyTransaction(id, { 
      status: 'completed', 
      notes: commentText || 'Carga aprobada tras control regular.' 
    });
    setCommentText('');
    setToastMessage('La carga ha sido re-aprobada.' );
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  };

  return (
    <div className="space-y-6" id="transactions-tab-view">
      
      {/* Toast Feedback */}
      {isToastVisible && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with quick layout stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Registro General de Despachos</h1>
          <p className="text-xs text-slate-500">Listado, filtros avanzados, auditoría antifraude y comentarios de control de cargas.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('CSV')}
            className="cursor-pointer flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-xs px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono"
          >
            <Download className="w-4 h-4" />
            EXPORTAR CSV
          </button>
          <button
            onClick={() => handleExport('Excel')}
            className="cursor-pointer flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-xs px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all font-mono"
          >
            <FileSpreadsheet className="w-4 h-4" />
            EXPORTAR EXCEL
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4" id="filters-panel">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4" />
          <span>FILTROS OPERATIVOS DE CARGA</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-medium">
          {/* Search text */}
          <div className="md:col-span-1">
            <label className="block text-slate-500 mb-1">Buscar (Patente, ID...)</label>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-200"
                placeholder="Patente o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-400 w-4 h-4" />
            </div>
          </div>

          {/* Product selector */}
          <div>
            <label className="block text-slate-500 mb-1">Producto</label>
            <select
              className="w-full px-2 py-2 bg-slate-50 rounded-lg border border-slate-200"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Todos los combustibles</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-slate-500 mb-1">Clasificación</label>
            <select
              className="w-full px-2 py-2 bg-slate-50 rounded-lg border border-slate-200"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Todas las cargas</option>
              <option value="completed">Completadas normales</option>
              <option value="flagged">Observadas / Flagged</option>
            </select>
          </div>

          {/* Authorization method */}
          <div>
            <label className="block text-slate-500 mb-1">Autorizador</label>
            <select
              className="w-full px-2 py-2 bg-slate-50 rounded-lg border border-slate-200"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="">Cualquier método</option>
              <option value="RFID">Tarjeta RFID</option>
              <option value="QR">Código QR</option>
              <option value="APP">Aplicación Cloud</option>
              <option value="MANUAL">Clave Manual</option>
            </select>
          </div>

          {/* Liters min */}
          <div>
            <label className="block text-slate-500 mb-1">Mínimo Litros</label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200"
              placeholder="Ej. 100"
              value={minLiters}
              onChange={(e) => setMinLiters(e.target.value)}
            />
          </div>

          {/* Liters max */}
          <div>
            <label className="block text-slate-500 mb-1">Máximo Litros</label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200"
              placeholder="Ej. 1000"
              value={maxLiters}
              onChange={(e) => setMaxLiters(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Grid Table representation */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" id="transactions-data-card">
        <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 font-mono">MOSTRANDO: {filteredTransactions.length} REGISTROS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">TID Transacción</th>
                <th className="py-3 px-4">Fecha/Hora</th>
                <th className="py-3 px-4">Surtidor</th>
                <th className="py-3 px-4">Combustible</th>
                <th className="py-3 px-4">Litros</th>
                <th className="py-3 px-4">Importe</th>
                <th className="py-3 px-4">Chofer Responsable</th>
                <th className="py-3 px-4">Unidad Patente</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {filteredTransactions.map((tx: any) => {
                const prod = products.find((p: any) => p.id === tx.productId);
                const isFlagged = tx.status === 'flagged';
                
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">{tx.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{formatDate(tx.createdAt)}</td>
                    <td className="py-3 px-4">{tx.dispenserId}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: prod?.hexColor }} />
                      {prod ? prod.name.split(' (')[0] : tx.productId}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{formatLiters(tx.liters)}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 px-4 truncate max-w-[120px]">
                      {resolveDriverName(tx.driverId, drivers)}
                    </td>
                    <td className="py-3 px-4 uppercase font-mono">{tx.vehiclePlate || 'Generador C1'}</td>
                    <td className="py-3 px-4 text-center">
                      {isFlagged ? (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          OBSERVADA
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          COMPLETADA
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDetailsTxId(tx.id)}
                        className="p-1 px-2.5 hover:bg-slate-100 rounded text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        AUDITAR
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            Ningún despacho coincide con los filtros aplicados en la consulta de combustible.
          </div>
        )}
      </div>

      {/* Audit & observation detailed sliding modal dialog */}
      {detailTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="detail-transaction-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Modal header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">CONGELAMIENTO DE TRANSACCIÓN FÍSICA</span>
                <h3 className="text-sm font-bold text-slate-800 font-mono">ID: {detailTx.id}</h3>
              </div>
              <button 
                onClick={() => setDetailsTxId(null)}
                className="cursor-pointer text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block mb-0.5">Surtidor Dispenser</span>
                  <strong className="text-slate-800">{detailTx.dispenserId} - M{detailTx.hose}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Volumen neto</span>
                  <strong className="text-slate-800 font-mono">{formatLiters(detailTx.liters)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Chofer Responsable</span>
                  <strong className="text-slate-800">
                    {resolveDriverName(detailTx.driverId, drivers)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Unidad Patente</span>
                  <strong className="text-slate-800 uppercase font-mono">{detailTx.vehiclePlate || 'Generatriz CAT'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Odómetro del vehículo:</span>
                  <strong className="text-slate-800 font-mono">{detailTx.odometer || 'No asignada'} Km</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Autorización</span>
                  <strong className="text-slate-800 font-mono">{detailTx.authorizationMethod || 'RFID CARD'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Monto Total</span>
                  <strong className="text-slate-800 font-mono">{formatCurrency(detailTx.amount)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Precio de cartelera</span>
                  <strong className="text-slate-800 font-mono">{formatCurrency(detailTx.pricePerLiter)} /L</strong>
                </div>
              </div>

              {/* Status flag banner */}
              <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${detailTx.status === 'flagged' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                {detailTx.status === 'flagged' ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Unidad Marcada con Alerta</span>
                      <p className="text-[11px] leading-relaxed mt-0.5">{detailTx.notes || 'Carga catalogada como inconsistente debido a desfase horario o volumétrico.'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Despacho Convalidado</span>
                      <p className="text-[11px] mt-0.5">La telemetría del tanque y la bomba coinciden con los rangos autorizados del chofer.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Modify notes and reasons */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="block font-bold text-slate-700">Agregar comentario o motivo de auditoría externa</label>
                <textarea
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-20 text-xs focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                  placeholder="Ej. Se verificó ticket firmado por chofer en base..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                
                <div className="flex gap-2 justify-end pt-2">
                  {isAdmin ? (
                    detailTx.status !== 'flagged' ? (
                      <button
                        onClick={() => handleFlagTransaction(detailTx.id)}
                        className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-xs flex items-center gap-1.5"
                      >
                        <BadgeAlert className="w-4 h-4" />
                        MARCAR COMO OBSERVADA
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApproveTransaction(detailTx.id)}
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        RE-APROBAR COMPRA
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg italic select-none">
                      Auditador: Solo Lectura (Bloqueado)
                    </span>
                  )}
                  <button
                    onClick={() => setDetailsTxId(null)}
                    className="cursor-pointer hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 px-4 rounded text-xs font-semibold"
                  >
                    Salir
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
