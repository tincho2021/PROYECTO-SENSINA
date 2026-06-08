/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Truck,
  UserCheck,
  Plus,
  Shield,
  CreditCard,
  Building,
  Key,
  Trash2,
  Settings,
  Fuel,
  CheckCircle,
  TrendingDown
} from 'lucide-react';

import { formatLiters } from '../utils/formatters';

interface FleetProps {
  data: any;
  onAddVehicle: (vehicleData: any) => void;
  onAddDriver: (driverData: any) => void;
  isAdmin?: boolean;
}

export default function Fleet({ data, onAddVehicle, onAddDriver, isAdmin = true }: FleetProps) {
  const { vehicles, drivers } = data;
  const [activeSubTab, setActiveSubTab] = useState<'vehicles' | 'drivers'>('vehicles');

  // Popup form switches
  const [showVehForm, setShowVehForm] = useState(false);
  const [showDrvForm, setShowDrvForm] = useState(false);

  // Form states - Vehicle
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('Pick-up');
  const [costCenter, setCostCenter] = useState('');
  const [tankCapacityLiters, setTankCapacityLiters] = useState('80');
  const [expectedKmL, setExpectedKmL] = useState('10.5');
  const [lastOdometer, setLastOdometer] = useState('140000');

  // Form states - Driver
  const [drvName, setDrvName] = useState('');
  const [drvDoc, setDrvDoc] = useState('');
  const [drvRfid, setDrvRfid] = useState('');
  const [drvDaily, setDrvDaily] = useState('200');
  const [drvMonthly, setDrvMonthly] = useState('3000');
  const [drvCostCenter, setDrvCostCenter] = useState('');

  const [toastMsg, setToastMsg] = useState('');

  const handleSubmitVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !brand) return;
    
    onAddVehicle({
      plate: plate.toUpperCase(),
      brand,
      model,
      type,
      costCenter: costCenter || 'General',
      tankCapacityLiters: Number(tankCapacityLiters),
      expectedKmL: Number(expectedKmL),
      lastOdometer: Number(lastOdometer)
    });

    // Reset Form
    setPlate('');
    setBrand('');
    setModel('');
    setShowVehForm(false);
    
    setToastMsg(`Unidad patente ${plate.toUpperCase()} registrada exitosamente con límite y consumos.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSubmitDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drvName || !drvRfid) return;

    onAddDriver({
      name: drvName,
      document: drvDoc,
      rfidCard: drvRfid.toUpperCase(),
      dailyLimitLiters: Number(drvDaily),
      monthlyLimitLiters: Number(drvMonthly),
      costCenter: drvCostCenter || 'Logística Central'
    });

    // Reset Form
    setDrvName('');
    setDrvDoc('');
    setDrvRfid('');
    setShowDrvForm(false);

    setToastMsg(`Chofer ${drvName} enlazado con tarjeta RFID ${drvRfid.toUpperCase()} con éxito.`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="space-y-6" id="fleet-tab-view">
      
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title block with selection tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Control de Flotas de Combustible</h1>
          <p className="text-xs text-slate-500">Mapeo de unidades, choferes habilitados, despacho con tarjeta RFID y control de cuotas.</p>
        </div>
        
        {/* Toggle subtabs */}
        <div className="bg-slate-100 p-1 rounded-lg flex gap-1 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveSubTab('vehicles')}
            className={`cursor-pointer px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'vehicles' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
            }`}
          >
            Directorio Vehículos ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('drivers')}
            className={`cursor-pointer px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'drivers' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
            }`}
          >
            Choferes Autorizados ({drivers.length})
          </button>
        </div>
      </div>

      {/* Main Vehicles Tab */}
      {activeSubTab === 'vehicles' && (
        <div className="space-y-4" id="fleet-vehicles-grid">
          <div className="flex justify-between items-center bg-slate-100 p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600">DIRECTORIO DE TRANSPORTE Y EQUIPOS INDUSTRIALES</span>
            {isAdmin ? (
              <button
                onClick={() => setShowVehForm(true)}
                className="cursor-pointer flex items-center gap-1 bg-slate-900 text-white hover:bg-slate-800 text-xs px-3 py-1.5 rounded font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                NUEVO VEHÍCULO
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-bold bg-slate-205 border border-slate-200 px-2.5 py-1 rounded bg-slate-50 uppercase tracking-wide">
                Solo Lectura (Supervisor)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vehicles.map((v: any) => (
              <div key={v.id} className="bg-white border border-slate-200/70 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="text-xs font-mono font-bold text-slate-400">ID: {v.id}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${v.active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                      {v.active ? 'HABILITADO' : 'SUSPENDIDO'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-slate-100 p-2.5 rounded text-slate-700">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 leading-none">{v.brand} {v.model}</h3>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{v.type}</span>
                    </div>
                  </div>

                  {/* Plates & meters details */}
                  <div className="space-y-2 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Patente:</span>
                      <strong className="text-slate-800 font-mono tracking-wider text-[13px] uppercase">{v.plate}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Centro de Costo:</span>
                      <span className="text-slate-700 block truncate max-w-[120px]">{v.costCenter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cupo Máx Tanque:</span>
                      <span className="text-slate-700 font-mono">{v.tankCapacityLiters} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Consumo Teórico:</span>
                      <span className="text-slate-700">{v.expectedKmL} Km/L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Último Kilometraje:</span>
                      <span className="text-slate-700 font-mono">{v.lastOdometer} Km</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>Alta: {v.createdAt ? v.createdAt.substring(0, 10) : ''}</span>
                  <Settings className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Drivers Tab */}
      {activeSubTab === 'drivers' && (
        <div className="space-y-4" id="fleet-drivers-grid">
          <div className="flex justify-between items-center bg-slate-100 p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600">DIRECTORIO DE OPERADORES Y CHOFERES HABILITADOS</span>
            {isAdmin ? (
              <button
                onClick={() => setShowDrvForm(true)}
                className="cursor-pointer flex items-center gap-1 bg-slate-900 text-white hover:bg-slate-800 text-xs px-3 py-1.5 rounded font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                NUEVO CHOFER
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-bold bg-slate-205 border border-slate-200 px-2.5 py-1 rounded bg-slate-50 uppercase tracking-wide">
                Solo Lectura (Supervisor)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {drivers.map((d: any) => (
              <div key={d.id} className="bg-white border border-slate-200/70 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="text-xs font-mono font-bold text-slate-400">ID: {d.id}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${d.active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200 animate-pulse'}`}>
                      {d.active ? 'ACTIVO' : 'SUSPENDIDO'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-slate-100 p-2.5 rounded text-slate-700">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 leading-none">{d.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">DNI: {d.document || 'Sin DNI'}</span>
                    </div>
                  </div>

                  {/* RFID and Limits details */}
                  <div className="space-y-2 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Llavero RFID:
                      </span>
                      <strong className="text-slate-800 font-mono select-all bg-slate-100 px-1.5 py-0.5 rounded">{d.rfidCard}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" /> Sector Logística:
                      </span>
                      <span className="text-slate-700 block truncate max-w-[120px]">{d.costCenter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cupo Diaria:</span>
                      <strong className="text-slate-700 font-mono">{formatLiters(d.dailyLimitLiters)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cupo Mensual:</span>
                      <strong className="text-slate-700 font-mono">{formatLiters(d.monthlyLimitLiters)}</strong>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                  <span>Alta: {d.createdAt ? d.createdAt.substring(0, 10) : ''}</span>
                  <Settings className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Vehicle Floating Dialog */}
      {showVehForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="vehicle-add-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Registrar Vehículo de Flota</h3>
              <button onClick={() => setShowVehForm(false)} className="text-slate-400 p-1 bg-slate-200 rounded-full cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmitVehicle} className="p-5 space-y-4 text-xs font-medium text-slate-600">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Patente *</label>
                  <input required placeholder="Ej. AB-123-CD" value={plate} onChange={(e) => setPlate(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Marca *</label>
                  <input required placeholder="Ej. Toyota" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Modelo</label>
                  <input placeholder="Ej. Hilux 4x4" value={model} onChange={(e) => setModel(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Tipo Equipo</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200">
                    <option value="Pick-up">Pick-up Hilux Ranger</option>
                    <option value="Camión cistern">Camión Cisterna</option>
                    <option value="Camión Tolva">Camión de Carga</option>
                    <option value="Tractor">Tractor Agrícola</option>
                    <option value="Generatriz">Generador Estacionario</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Centro de Costo</label>
                  <input placeholder="Ej. Logística Rosario" value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Capacidad Tanque (L)</label>
                  <input type="number" placeholder="Ej. 80" value={tankCapacityLiters} onChange={(e) => setTankCapacityLiters(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Cálculo Esperado (Km/L)</label>
                  <input type="text" placeholder="Ej. 10.5" value={expectedKmL} onChange={(e) => setExpectedKmL(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Odómetro Inicial (Km)</label>
                  <input type="number" placeholder="Ej. 140000" value={lastOdometer} onChange={(e) => setLastOdometer(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 font-bold hover:bg-slate-800 rounded cursor-pointer">Guardar Registro en Flota</button>
                <button type="button" onClick={() => setShowVehForm(false)} className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded cursor-pointer">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Driver Floating Dialog */}
      {showDrvForm && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-40" id="driver-add-modal">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Registrar Chofer / Operador</h3>
              <button onClick={() => setShowDrvForm(false)} className="text-slate-400 p-1 bg-slate-200 rounded-full cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmitDriver} className="p-5 space-y-4 text-xs font-medium text-slate-600">
              <div>
                <label className="block text-slate-500 mb-0.5">Nombre Completo *</label>
                <input required placeholder="Ej. Carlos Rodríguez" value={drvName} onChange={(e) => setDrvName(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">Documento Identidad (DNI/CIL)</label>
                <input placeholder="Ej. 30.123.456" value={drvDoc} onChange={(e) => setDrvDoc(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
              </div>
              <div>
                <label className="block text-slate-500 mb-0.5">ID Llavero / Código RFID asignado *</label>
                <input required placeholder="Ej. RFID-3882-AB" value={drvRfid} onChange={(e) => setDrvRfid(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200 font-mono select-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-0.5">Cupo Diario Máx (L)</label>
                  <input type="number" value={drvDaily} onChange={(e) => setDrvDaily(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">Cupo Mensual Máx (L)</label>
                  <input type="number" value={drvMonthly} onChange={(e) => setDrvMonthly(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-0.5">Departamento / Sector de Costos</label>
                <input placeholder="Ej. Logística Rosario Agro" value={drvCostCenter} onChange={(e) => setDrvCostCenter(e.target.value)} className="w-full p-2 bg-slate-50 rounded border border-slate-200" />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 font-bold hover:bg-slate-800 rounded cursor-pointer">Vincular Operador</button>
                <button type="button" onClick={() => setShowDrvForm(false)} className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded cursor-pointer">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
