/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  Plus,
  MessageSquareReply,
  X
} from 'lucide-react';

import { formatDate } from '../utils/formatters';

interface AlertsProps {
  data: any;
  onRefresh: () => void;
  onAcknowledgeAlert: (alertId: string, comments: string, username: string) => void;
  onResolveAlert: (alertId: string, comments: string, username: string) => void;
}

export default function Alerts({ data, onRefresh, onAcknowledgeAlert, onResolveAlert }: AlertsProps) {
  const { alerts } = data;
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  // Interactive resolution variables
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'acknowledge' | 'resolve'>('acknowledge');
  const [comments, setComments] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const activeAlert = alerts.find((a: any) => a.id === activeAlertId);

  const filteredAlerts = alerts.filter((a: any) => {
    if (filterLevel === 'all') return true;
    return a.level === filterLevel;
  });

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200 text-red-900',
          badge: 'bg-red-100 text-red-800 border-red-200',
          label: 'CRÍTICA'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'ADVERTENCIA'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-950',
          badge: 'bg-blue-100 text-blue-800 border-blue-100',
          label: 'INFORMATIVA'
        };
    }
  };

  const handleApplyAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlertId) return;

    if (actionType === 'acknowledge') {
      onAcknowledgeAlert(activeAlertId, comments, 'Supervisor Guardia');
      setToastMsg('La alarma ha sido marcada como VISTA (Aceptada) con éxito.');
    } else {
      onResolveAlert(activeAlertId, comments, 'Supervisor Guardia');
      setToastMsg('La alarma ha sido RESUELTA y cerrada conforme.');
    }

    setComments('');
    setActiveAlertId(null);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6" id="alerts-tab-view">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm font-sans">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Centro de Alertas e Incidentes</h1>
          <p className="text-xs text-slate-500">Eventos de seguridad física, telemetría Modbus inestable, sobredispensación y quiebres de stock en tiempo real.</p>
        </div>
        
        {/* Toggle subtabs */}
        <div className="bg-slate-100 p-1 rounded-lg flex gap-1 text-xs font-semibold shrink-0">
          <button
            onClick={() => setFilterLevel('all')}
            className={`cursor-pointer px-3 py-1.5 rounded transition-all ${filterLevel === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            Todas ({alerts.length})
          </button>
          <button
            onClick={() => setFilterLevel('critical')}
            className={`cursor-pointer px-3 py-1.5 rounded transition-all ${filterLevel === 'critical' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            Críticas ({alerts.filter((a: any) => a.level === 'critical').length})
          </button>
          <button
            onClick={() => setFilterLevel('warning')}
            className={`cursor-pointer px-3 py-1.5 rounded transition-all ${filterLevel === 'warning' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
          >
            Advertencias ({alerts.filter((a: any) => a.level === 'warning').length})
          </button>
        </div>
      </div>

      {/* Grid of issues */}
      <div className="space-y-4" id="alerts-listing-cards">
        {filteredAlerts.map((a: any) => {
          const lvStyle = getLevelStyle(a.level);
          const isPending = a.status === 'new';
          const isAck = a.status === 'acknowledged';

          return (
            <div key={a.id} className={`bg-white border text-xs text-slate-600 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-start md:justify-between gap-4`}>
              
              <div className="flex items-start gap-3.5 max-w-2xl">
                <div className={`p-2.5 rounded-lg shrink-0 ${a.level === 'critical' ? 'bg-red-100 text-red-650' : a.level === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-500'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-850 font-sans tracking-wide text-[12px]">{a.source}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${lvStyle.badge}`}>{lvStyle.label}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      a.status === 'resolved' ? 'bg-slate-100 text-slate-600 border' : isAck ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-red-50 text-red-800 border border-red-100 animate-pulse'
                    }`}>
                      {a.status === 'resolved' ? 'RESUELTA' : isAck ? 'VISTA / EN TRÁMITE' : 'NUEVA'}
                    </span>
                  </div>

                  <p className="text-slate-600 font-sans leading-relaxed text-[11.5px] font-medium">{a.description}</p>
                  
                  {/* Actions recommended or comments block */}
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200/50 space-y-1 mt-2 text-[11px]">
                    <span className="font-bold text-slate-500 font-sans uppercase block text-[9px] tracking-wider">Acción Técnica Recomendada:</span>
                    <span className="text-slate-700 font-medium font-sans leading-relaxed block">{a.recommendation || 'Verificar tramas físicas ESP32.'}</span>
                  </div>

                  {/* Supervisor notes */}
                  {a.comments && (
                    <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded border border-emerald-100 space-y-1 mt-2 text-[11px]">
                      <span className="font-bold uppercase block text-[9px] tracking-wider">Anotaciones del Guardia ({a.resolvedBy || 'Central'}):</span>
                      <p className="font-medium italic leading-relaxed">{a.comments}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions trigger */}
              <div className="text-right shrink-0 flex md:flex-col justify-end gap-2 text-xs font-semibold font-mono">
                <span className="text-slate-400 font-normal block font-mono text-[10px] uppercase text-right self-center md:self-end">
                  {formatDate(a.timestamp)}
                </span>
                
                {a.status !== 'resolved' && (
                  <div className="flex gap-2 justify-end self-center md:self-end mt-2">
                    {a.status === 'new' && (
                      <button
                        onClick={() => {
                          setActiveAlertId(a.id);
                          setActionType('acknowledge');
                        }}
                        className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1.5 rounded text-[10px] border border-slate-300 font-sans flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" /> MARCAR VISTA
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveAlertId(a.id);
                        setActionType('resolve');
                      }}
                      className="cursor-pointer bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 font-bold px-2.5 py-1.5 rounded text-[10px] font-sans flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> RESOLVER ALARMA
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Write Action Comments Dialog Popup */}
      {activeAlertId && activeAlert && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="alert-action-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">
                {actionType === 'acknowledge' ? 'Asentar Recepción de Alerta' : 'Clasificar como Resuelta'}
              </h3>
              <button onClick={() => setActiveAlertId(null)} className="text-slate-400 p-1 bg-slate-200 rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleApplyAction} className="p-5 space-y-4 text-xs font-medium text-slate-600">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px]">DIAGNOSTICO FÍSICO</span>
                <strong className="block text-slate-800 text-[11px] leading-relaxed mb-2">{activeAlert.description}</strong>
              </div>

              <div>
                <label className="block text-slate-500 mb-1.5 font-bold">Anotaciones del Operador de Guardia (Motivo del cierre) *</label>
                <textarea
                  required
                  placeholder="Ej. Se verificó con llave térmica de playón y reconectó sensor Modbus conforme..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg h-24 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button type="submit" className="bg-slate-900 font-bold text-white px-5 py-2 hover:bg-slate-800 rounded cursor-pointer">
                  {actionType === 'acknowledge' ? 'Asentar Vista' : 'Cerrar Conforme Resolviendo Alerta'}
                </button>
                <button type="button" onClick={() => setActiveAlertId(null)} className="px-5 py-2 border border-slate-200 text-slate-700 bg-white rounded cursor-pointer">Cancelar</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
