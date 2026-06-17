/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle,
  Database,
  Cpu,
  Key,
  Trash2,
  Edit3,
  Plus,
  Save,
  PlusCircle,
  Droplets,
  Zap,
  Tag,
  Compass,
  AlertTriangle,
  Layers,
  User,
  UserPlus,
  Users,
  Shield,
  Activity,
  Wifi
} from 'lucide-react';

import { formatLiters, formatCurrency } from '../utils/formatters';
import { saveTank, deleteTank, saveDispenser, deleteDispenser, saveProduct, deleteProduct, resetSystemData, wipeSystemData, saveUser, deleteUser } from '../services/api';

import Esp32Live from './Esp32Live';
import CommunicationsDiag from './CommunicationsDiag';

interface SettingsProps {
  data: any;
  onRefresh: () => void;
  onSimulateTelemetry: (payload: any) => Promise<any>;
  whiteLabel?: any;
  onUpdateWhiteLabel?: (newBranding: any) => void;
}

export default function Settings({ data, onRefresh, onSimulateTelemetry, whiteLabel, onUpdateWhiteLabel }: SettingsProps) {
  // Extract data arrays from props
  const { tanks = [], products = [], dispensers = [], users = [], sites = [] } = data || {};

  const [activeSubTab, setActiveSubTab] = useState<'hardware' | 'tanks' | 'dispensers' | 'products' | 'esp32_live' | 'comms_diag' | 'users' | 'branding'>('hardware');

  // Corporate Profile Setup states
  const [companyName, setCompanyName] = useState('SENSINA Logistics SA');
  const [managerEmail, setManagerEmail] = useState('supervisor@sensina.com.ar');
  const [apiKey, setApiKey] = useState('SEC_SENSINA_ESP32_DEV_KEY_2026');

  // Telemetry Simulator states
  const [simTankId, setSimTankId] = useState(tanks[0]?.id || 'ANK-001');
  const [simHeight, setSimHeight] = useState('1450');
  const [simWater, setSimWater] = useState('0');
  const [simTemp, setSimTemp] = useState('18.5');
  const [simBattery, setSimBattery] = useState('100');
  const [simRssi, setSimRssi] = useState('-65');

  const [isLoadingSim, setIsLoadingSim] = useState(false);
  const [simResponse, setSimResponse] = useState<any>(null);
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  // Form states - Tanks List & Actions
  const [editingTankId, setEditingTankId] = useState<string | null>(null);
  const [tankName, setTankName] = useState('');
  const [tankProductId, setTankProductId] = useState(products[0]?.id || '');
  const [tankCapacity, setTankCapacity] = useState('20000');
  const [tankHeight, setTankHeight] = useState('2000');
  const [tankSensorType, setTankSensorType] = useState<'hydrostatic' | 'magnetostrictive' | 'ultrasonic' | 'manual'>('magnetostrictive');

  // Form states - Dispensers List & Actions
  const [editingDispId, setEditingDispId] = useState<string | null>(null);
  const [dispName, setDispName] = useState('');
  const [dispHose, setDispHose] = useState('1');
  const [dispProductId, setDispProductId] = useState(products[0]?.id || '');
  const [dispSuctionTankId, setDispSuctionTankId] = useState('');

  // Form states - Products List & Actions
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodId, setProdId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodType, setProdType] = useState<'gasoil' | 'nafta' | 'premium' | 'urea' | 'lubricants' | 'other'>('nafta');
  const [prodReferenceDensity, setProdReferenceDensity] = useState('840');
  const [prodPrice, setProdPrice] = useState('1100');
  const [prodMinStock, setProdMinStock] = useState('5000');
  const [prodMaxStock, setProdMaxStock] = useState('50000');
  const [prodHexColor, setProdHexColor] = useState('#0fb5a9');

  // Form states - Plataforma Users Setup & Actions
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'supervisor' | 'operator' | 'technician'>('operator');
  const [userSiteId, setUserSiteId] = useState('ESTACION-001');
  const [userActive, setUserActive] = useState(true);

  // --- CONFIGURACIÓN DE MARCA BLANCA / WHITE-LABEL ---
  const initialBranding = whiteLabel || {
    platformName: 'C.E.S.T.I.',
    tagline: 'TELEMETRÍA',
    logoType: 'emoji', // 'icon' | 'emoji' | 'url' | 'base64'
    logoIcon: 'C',
    logoEmoji: '⛽',
    logoUrl: '',
    logoBase64: '',
    primaryColor: 'teal',
    supportEmail: 'soporte@cesti.com.ar',
    supportPhone: '+54 9 11 1234-5678',
    footerCompany: 'C.E.S.T.I. S.A.',
    hideSensinaBranding: false
  };

  const [brandPlatformName, setBrandPlatformName] = useState(initialBranding.platformName);
  const [brandTagline, setBrandTagline] = useState(initialBranding.tagline);
  const [brandLogoType, setBrandLogoType] = useState<'icon' | 'emoji' | 'url' | 'base64'>(initialBranding.logoType);
  const [brandLogoIcon, setBrandLogoIcon] = useState(initialBranding.logoIcon);
  const [brandLogoEmoji, setBrandLogoEmoji] = useState(initialBranding.logoEmoji);
  const [brandLogoUrl, setBrandLogoUrl] = useState(initialBranding.logoUrl);
  const [brandLogoBase64, setBrandLogoBase64] = useState(initialBranding.logoBase64);
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(initialBranding.primaryColor);
  const [brandSupportEmail, setBrandSupportEmail] = useState(initialBranding.supportEmail);
  const [brandSupportPhone, setBrandSupportPhone] = useState(initialBranding.supportPhone);
  const [brandFooterCompany, setBrandFooterCompany] = useState(initialBranding.footerCompany);
  const [brandHideSensina, setBrandHideSensina] = useState(initialBranding.hideSensinaBranding ?? false);

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      platformName: brandPlatformName,
      tagline: brandTagline,
      logoType: brandLogoType,
      logoIcon: brandLogoIcon,
      logoEmoji: brandLogoEmoji,
      logoUrl: brandLogoUrl,
      logoBase64: brandLogoBase64,
      primaryColor: brandPrimaryColor,
      supportEmail: brandSupportEmail,
      supportPhone: brandSupportPhone,
      footerCompany: brandFooterCompany,
      hideSensinaBranding: brandHideSensina
    };
    if (onUpdateWhiteLabel) {
      onUpdateWhiteLabel(updated);
      triggerToast('Configuración de Marca Blanca guardada con éxito. El sistema se ha personalizado por completo.');
    } else {
      triggerToast('Error: El gestor de estado superior no está disponible.', true);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        triggerToast('Error: El archivo supera el tamaño máximo de 2 MB.', true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoBase64(reader.result as string);
        triggerToast('Imagen convertida a Base64 con éxito. Guarde para aplicar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userUsername || !userRole) {
      triggerToast('El nombre, usuario y rol de usuario son obligatorios.', true);
      return;
    }

    const payload = {
      id: editingUserId || undefined,
      name: userName,
      username: userUsername,
      email: userEmail,
      role: userRole,
      siteId: userSiteId,
      active: userActive
    };

    try {
      await saveUser(payload);
      triggerToast(editingUserId ? 'Usuario actualizado con éxito.' : 'Nuevo usuario registrado con éxito.');
      setEditingUserId(null);
      setUserName('');
      setUserUsername('');
      setUserEmail('');
      setUserRole('operator');
      setUserSiteId(sites[0]?.id || 'ESTACION-001');
      setUserActive(true);
      onRefresh();
    } catch (err) {
      triggerToast('Error al registrar/guardar el usuario.', true);
    }
  };

  const handleEditUser = (u: any) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserUsername(u.username);
    setUserEmail(u.email || '');
    setUserRole(u.role);
    setUserSiteId(u.siteId || (sites[0]?.id || 'ESTACION-001'));
    setUserActive(u.active ?? true);
  };

  const handleDeleteUserObj = async (id: string, username: string) => {
    if (username === 'admin') {
      triggerToast('Modificaciones denegadas: El usuario "admin" principal no puede ser eliminado.', true);
      return;
    }
    if (!window.confirm(`¿Seguro de remover al usuario "${username}" del acceso de la plataforma?`)) {
      return;
    }
    try {
      await deleteUser(id);
      triggerToast(`Usuario "${username}" desvinculado con éxito.`);
      onRefresh();
    } catch (err) {
      triggerToast('No se pudo remover el usuario.', true);
    }
  };

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorToast(msg);
      setTimeout(() => setErrorToast(''), 3500);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(''), 3550);
    }
  };

  // Run telemetry ESP32 simulation
  const handleRunSimulation = async () => {
    setIsLoadingSim(true);
    setSimResponse(null);

    const payload = {
      apiKey: apiKey,
      tankId: simTankId,
      heightMm: Number(simHeight),
      waterMm: Number(simWater),
      temperatureC: Number(simTemp),
      batteryPercent: Number(simBattery),
      signalRssi: Number(simRssi)
    };

    try {
      const res = await onSimulateTelemetry(payload);
      setSimResponse(res);
      triggerToast('Trama ESP32 HTTPS POST simulada con éxito. Servidor API respondió OK.');
      onRefresh(); // Refresh context
    } catch (err: any) {
      setSimResponse({ error: err.message || 'Error de red con el servidor Express' });
      triggerToast('Fallo al conectar con la API central.', true);
    } finally {
      setIsLoadingSim(false);
    }
  };

  // Reset original mock values
  const handleResetSystemData = async () => {
    if (!window.confirm('¿Seguro que desea restablecer la base de datos a los valores predeterminados de fábrica?')) {
      return;
    }
    try {
      await resetSystemData();
      triggerToast('Base de datos simulada restablecida a valores iniciales.');
      onRefresh();
    } catch (e) {
      triggerToast('Fallo al restaurar datos.', true);
    }
  };

  // Wipe out all database data to start from a completely clean slate
  const handleWipeSystemData = async () => {
    if (!window.confirm('¿ATENCIÓN CRÍTICA: Seguro que desea borrar absolutamente toda la información de la plataforma?\n\nEsto eliminará todas las cisternas, despachos, vehículos, choferes, alertas e histórico de telemetría de forma permanente. La plataforma quedará completamente vacía para iniciar con un nuevo cliente.')) {
      return;
    }
    if (!window.confirm('¿Confirma que desea proceder con el borrado definitivo? Esta acción NO se puede deshacer.')) {
      return;
    }
    try {
      await wipeSystemData();
      triggerToast('Éxito: Plataforma vaciada por completo. Todos los registros fueron eliminados.');
      onRefresh();
    } catch (e) {
      triggerToast('Fallo al vaciar los datos de la plataforma.', true);
    }
  };

  // Tank Submit Handler (Add or Update)
  const handleTankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tankName || !tankCapacity || !tankHeight) {
      triggerToast('Todos los campos del tanque son obligatorios.', true);
      return;
    }

    const payload = {
      id: editingTankId || undefined,
      name: tankName,
      productId: tankProductId || products[0]?.id,
      capacityLiters: Number(tankCapacity),
      heightMm: Number(tankHeight),
      sensorType: tankSensorType
    };

    try {
      await saveTank(payload);
      triggerToast(editingTankId ? 'Cisterna actualizada con éxito.' : 'Nueva Cisterna registrada con éxito.');
      // Reset form
      setEditingTankId(null);
      setTankName('');
      setTankCapacity('20000');
      setTankHeight('2000');
      onRefresh();
    } catch (err) {
      triggerToast('Error al guardar el tanque.', true);
    }
  };

  const handleEditTank = (t: any) => {
    setEditingTankId(t.id);
    setTankName(t.name);
    setTankProductId(t.productId);
    setTankCapacity(t.capacityLiters.toString());
    setTankHeight(t.heightMm.toString());
    setTankSensorType(t.sensorType || 'magnetostrictive');
  };

  const handleDeleteTankObj = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que desea eliminar el tanque "${name}"? Los datos históricos asociados podrían re-calibrarse.`)) {
      return;
    }
    try {
      await deleteTank(id);
      triggerToast(`Tanque "${name}" removido del playón.`);
      onRefresh();
    } catch (err) {
      triggerToast('Error al eliminar tanque.', true);
    }
  };

  // Dispenser Submit Handler (Add or Update)
  const handleDispenserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispName || !dispProductId) {
      triggerToast('Complete el nombre y combustible para el cargador.', true);
      return;
    }

    const payload = {
      id: editingDispId || undefined,
      name: dispName,
      hose: Number(dispHose || 1),
      productId: dispProductId,
      suctionTankId: dispSuctionTankId || undefined
    };

    try {
      await saveDispenser(payload);
      triggerToast(editingDispId ? 'Punto de carga / Surtidor corregido.' : 'Nuevo Punto de Carga registrado.');
      setEditingDispId(null);
      setDispName('');
      setDispHose('1');
      setDispSuctionTankId('');
      onRefresh();
    } catch (err) {
      triggerToast('Error al registrar surtidor.', true);
    }
  };

  const handleEditDispenser = (d: any) => {
    setEditingDispId(d.id);
    setDispName(d.name);
    setDispHose(d.hose.toString());
    setDispProductId(d.productId);
    setDispSuctionTankId(d.suctionTankId || '');
  };

  const handleDeleteDispenserObj = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro de remover el punto de carga "${name}"?`)) {
      return;
    }
    try {
      await deleteDispenser(id);
      triggerToast(`Surtidor "${name}" desactivado de los precintos.`);
      onRefresh();
    } catch (err) {
      triggerToast('No se pudo desactivar el surtidor.', true);
    }
  };

  // Product Submit Handler (Add or Update)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodReferenceDensity) {
      triggerToast('Información de combustible indispensable faltante.', true);
      return;
    }

    const payload = {
      id: editingProdId || prodId || undefined,
      name: prodName,
      type: prodType,
      referenceDensity: Number(prodReferenceDensity),
      pricePerLiter: Number(prodPrice),
      minStock: Number(prodMinStock),
      maxStock: Number(prodMaxStock),
      hexColor: prodHexColor,
      color: 'border-teal-500' // Base default color outline
    };

    try {
      await saveProduct(payload);
      triggerToast(editingProdId ? 'Especificación de Combustible actualizada.' : 'Combustible añadido al catálogo logístico.');
      setEditingProdId(null);
      setProdId('');
      setProdName('');
      setProdPrice('1100');
      setProdReferenceDensity('840');
      onRefresh();
    } catch (err) {
      triggerToast('Error de catálogo de productos.', true);
    }
  };

  const handleEditProduct = (p: any) => {
    setEditingProdId(p.id);
    setProdId(p.id);
    setProdName(p.name);
    setProdType(p.type);
    setProdReferenceDensity(p.referenceDensity.toString());
    setProdPrice(p.pricePerLiter.toString());
    setProdMinStock(p.minStock.toString());
    setProdMaxStock(p.maxStock.toString());
    setProdHexColor(p.hexColor || '#0fb5a9');
  };

  const handleDeleteProductObj = async (id: string, name: string) => {
    // Check if tanks depend on this product
    const containsTanks = tanks.some((t: any) => t.productId === id);
    if (containsTanks) {
      triggerToast(`Error: No puede eliminar "${name}" porque hay tanques activos vinculados a este combustible.`, true);
      return;
    }
    if (!window.confirm(`¿Seguro que desea eliminar el combustible "${name}" del catálogo?`)) {
      return;
    }
    try {
      await deleteProduct(id);
      triggerToast(`Producto "${name}" purgado de los registros.`);
      onRefresh();
    } catch (err) {
      triggerToast('Error al remover combustible.', true);
    }
  };

  return (
    <div className="space-y-6" id="settings-tab-view">
      
      {/* Toast elements */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-red-900 border border-red-700 text-white px-5 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4.5 h-4.5 text-red-300" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Primary Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm font-sans">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-500" />
            Configuraciones de la Plataforma
          </h1>
          <p className="text-xs text-slate-500">Gestione la arquitectura física, telemetría de cisternas, dispensadores de playón y catálogo de combustibles.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleWipeSystemData}
            className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm font-sans"
          >
            <Trash2 className="w-3.5 h-3.5" />
            VACIAR PLATAFORMA (EMPEZAR DE CERO)
          </button>

          <button
            onClick={handleResetSystemData}
            className="cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-800 text-[11px] font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET FACTORY DEFAULT
          </button>
        </div>
      </div>

      {/* Sub-Tab navigation bar */}
      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-lg gap-1 border border-slate-205 shadow-2xs max-w-full font-sans">
        <button
          onClick={() => setActiveSubTab('hardware')}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeSubTab === 'hardware'
              ? 'bg-white text-teal-700 shadow-sm border-b-2 border-teal-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Perfil Conectividad</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('tanks');
            setEditingTankId(null);
          }}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeSubTab === 'tanks'
              ? 'bg-white text-teal-700 shadow-sm border-b-2 border-teal-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cisternas / Tanques ({tanks.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('dispensers');
            setEditingDispId(null);
          }}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeSubTab === 'dispensers'
              ? 'bg-white text-teal-700 shadow-sm border-b-2 border-teal-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Surtidores ({dispensers.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('products');
            setEditingProdId(null);
          }}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeSubTab === 'products'
              ? 'bg-white text-teal-700 shadow-sm border-b-2 border-teal-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>Combustibles Precios ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('esp32_live')}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeSubTab === 'esp32_live'
              ? 'bg-white text-teal-700 shadow-sm border-b-2 border-teal-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Protocolo IoT / ESP32</span>
        </button>

        <button
          onClick={() => setActiveSubTab('comms_diag')}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeSubTab === 'comms_diag'
              ? 'bg-white text-teal-700 shadow-sm border-b-2 border-teal-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Wifi className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span>Diagnóstico de Red</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('users');
            setEditingUserId(null);
          }}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeSubTab === 'users'
              ? 'bg-white text-teal-700 shadow-sm border-b-2 border-teal-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-teal-600" />
          <span>Gestión de Usuarios ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branding')}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
            activeSubTab === 'branding'
              ? 'bg-white text-teal-700 shadow-sm border-b-2 border-teal-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Marca Blanca / Custom Logo</span>
        </button>
      </div>

      {/* Rendering Selected configuration panel */}
      {activeSubTab === 'hardware' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
          
          {/* Company identity & telemetry token configuration */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 text-xs font-semibold text-slate-600">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              PERFIL CORPORATIVO SENSINA
            </span>
            
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-slate-400 mb-1.5">Empresa / Razón Social Propietaria *</label>
                <input 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Correo del Administrador de Logística *</label>
                <input 
                  type="email"
                  value={managerEmail} 
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Clave Privada API del Playón (Device API Key) *</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono" 
                  />
                  <Key className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                </div>
                <span className="block text-[10px] font-normal text-slate-400 mt-1 lines-normal leading-normal">
                  Esta clave autoriza las tramas decodificadas procedentes del Firmware ESP32 de las sondas magnetostrictivas instaladas en playón.
                </span>
              </div>
            </div>
          </div>

          {/* Real-time playon integration status diagnostic box (Replaces Simulator) */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
              <Cpu className="w-5 h-5 text-teal-650" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Estatus de Sincronización Inalámbrica</h3>
                <p className="text-[10px] text-slate-400">Todo el equipamiento físico es integrado en tiempo real s/ tramas de red.</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-600 leading-normal">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100/80 text-emerald-800 space-y-2">
                <p className="font-extrabold uppercase text-[10px] tracking-wider">MODO AUTO-CONFIGURACIÓN ACTIVO</p>
                <p className="font-normal text-[11px]">
                  El modo demo estático de la plataforma ha dejado de funcionar de manera definitiva. 
                  Todos los tanques, capacidades, succión y surtidores se declaran e integran de forma dinámica en base a las tramas de datos del ESP32.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 font-mono text-[11px]">
                <span className="font-extrabold text-slate-600 block border-b pb-1">COMPORTAMIENTO REGLAMENTARIO:</span>
                <p><strong>• Auto-Registro:</strong> Al recibir una trama para un Tanque ID o Surtidor ID nuevo, el sistema crea dinámicamente el dispositivo en playón con los metadatos indicados de combustible, productos y mangueras.</p>
                <p><strong>• Choferes y Flota:</strong> Deben darse de alta manualmente desde la sección de Flotas como está actualmente para validar la carga de RFID.</p>
              </div>

              <p className="text-[10px] text-slate-400 font-normal">
                Para verificar las especificaciones exactas del protocolo, consulte la pestaña de <strong className="text-teal-600">Integración Física</strong> en el menú lateral.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cisternas/Tanques Setup SubTab */}
      {activeSubTab === 'tanks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          
          {/* Form Side */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-fit">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
              <Database className="w-4.5 h-4.5 text-teal-600" />
              {editingTankId ? 'EDITAR CISTERNA' : 'CONFIGURAR NUEVO TANQUE'}
            </span>

            <form onSubmit={handleTankSubmit} className="space-y-4 text-xs font-semibold text-slate-650">
              <div>
                <label className="block text-slate-400 mb-1">Designación / Nombre del Tanque *</label>
                <input
                  type="text"
                  placeholder="ej. Tanque N° 5 Jet-A1"
                  value={tankName}
                  onChange={(e) => setTankName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Combustible Asignado *</label>
                <select
                  value={tankProductId}
                  onChange={(e) => setTankProductId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                >
                  <option value="">-- Seleccionar Combustible --</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} (Densidad: {p.referenceDensity} kg/m³)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Capacidad Máx. (Liters) *</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={tankCapacity}
                    onChange={(e) => setTankCapacity(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Altura Física (mm) *</label>
                  <input
                    type="number"
                    placeholder="2200"
                    value={tankHeight}
                    onChange={(e) => setTankHeight(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tecnología de Sonda Instalada *</label>
                <select
                  value={tankSensorType}
                  onChange={(e: any) => setTankSensorType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                >
                  <option value="magnetostrictive">Magnetoestrictiva de Alta Precisión (SENSINA SP-300)</option>
                  <option value="hydrostatic">Presión Hidrostática Sumergible</option>
                  <option value="ultrasonic">Ultrasonido sin Contacto Digital</option>
                  <option value="manual">Manual / Regletado Físico Periódico</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="cursor-pointer flex-1 bg-teal-600 text-white py-2 px-3.5 rounded-lg font-bold hover:bg-teal-700 flex items-center justify-center gap-1 transition-all"
                >
                  {editingTankId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingTankId ? 'Actualizar Cisterna' : 'Agregar Cisterna'}</span>
                </button>

                {editingTankId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTankId(null);
                      setTankName('');
                      setTankCapacity('20000');
                      setTankHeight('2000');
                    }}
                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-650 py-2 px-3.5 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Side */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-3.5">
              CISTERNAS ACTIVAS EN PLANTA
            </span>

            {tanks.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                No hay cisternas registradas. Utilice el panel lateral para asociar su primer tanque de telemedición.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                    <tr>
                      <th className="py-2.5 px-3">Tanque/ID</th>
                      <th className="py-2.5 px-3">Combustible</th>
                      <th className="py-2.5 px-3 text-right">Capacidad</th>
                      <th className="py-2.5 px-3 text-right">Fondo/Altura</th>
                      <th className="py-2.5 px-3">Tecnología Sonda</th>
                      <th className="py-2.5 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tanks.map((t: any) => {
                      const associatedProduct = products.find((p: any) => p.id === t.productId);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-extrabold text-slate-800">
                            <div>{t.name}</div>
                            <span className="text-[9px] text-slate-400 font-mono font-medium uppercase">{t.id}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold">
                            {associatedProduct ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: associatedProduct.hexColor }} />
                                <span>{associatedProduct.name}</span>
                              </div>
                            ) : (
                              <span className="text-red-500 font-medium font-mono">Sin combustible</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-700">
                            {formatLiters(t.capacityLiters)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500">
                            {t.heightMm} mm
                          </td>
                          <td className="py-3 px-3 font-semibold uppercase text-[10px]">
                            {t.sensorType === 'magnetostrictive' ? (
                              <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-100">Magnetostrictiva</span>
                            ) : t.sensorType === 'hydrostatic' ? (
                              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded border border-yellow-100">Presión</span>
                            ) : t.sensorType === 'ultrasonic' ? (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">Ultrasonido</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Manual / Varilla</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditTank(t)}
                                className="cursor-pointer p-1 text-slate-400 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 border border-slate-150 rounded transition-colors"
                                title="Editar parámetros"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTankObj(t.id, t.name)}
                                className="cursor-pointer p-1 text-slate-400 hover:text-red-650 bg-slate-50 hover:bg-red-50 border border-slate-150 rounded transition-colors"
                                title="Borrar cisterna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Surtidores/Puntos de Carga Setup SubTab */}
      {activeSubTab === 'dispensers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          
          {/* Form Column */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-fit">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
              <Zap className="w-4.5 h-4.5 text-teal-600" />
              {editingDispId ? 'EDITAR DETALES SURTIDOR' : 'CONFIGURAR PUNTO DE CARGA'}
            </span>

            <form onSubmit={handleDispenserSubmit} className="space-y-4 text-xs font-semibold text-slate-650">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Identificador (ej. Surtidor N° 2 Camiones) *</label>
                <input
                  type="text"
                  placeholder="ej. Surtidor Diesel Rápido"
                  value={dispName}
                  onChange={(e) => setDispName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mapeo de Boca / Pico N° *</label>
                <input
                  type="number"
                  placeholder="1"
                  value={dispHose}
                  onChange={(e) => setDispHose(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Combustible Surtido *</label>
                <select
                  value={dispProductId}
                  onChange={(e) => setDispProductId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                >
                  <option value="">-- Seleccionar Combustible --</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cisterna de Origen (SUCCIÓN)</label>
                <select
                  value={dispSuctionTankId}
                  onChange={(e) => setDispSuctionTankId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-bold text-slate-700"
                >
                  <option value="">-- Sin Mapeo de Succión direct --</option>
                  {tanks.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Establece de qué cisterna succiona físicamente este pico.
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="cursor-pointer flex-1 bg-teal-600 text-white py-2 px-3.5 rounded-lg font-bold hover:bg-teal-700 flex items-center justify-center gap-1 transition-all"
                >
                  {editingDispId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingDispId ? 'Guardar Cambios' : 'Registrar Boca Despacho'}</span>
                </button>

                {editingDispId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDispId(null);
                      setDispName('');
                      setDispHose('1');
                    }}
                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-650 py-2 px-3.5 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Column */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-3.5">
              SURTIDORES REGISTRADOS EN LA RED ESP32
            </span>

            {dispensers.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                No hay cargadores instalados. Utilice el panel lateral para dar de alta una nueva boca de despacho.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                    <tr>
                      <th className="py-2.5 px-3">Boca Identificación</th>
                      <th className="py-2.5 px-3">Combustible Mapeado</th>
                      <th className="py-2.5 px-3">Succión de Cisterna</th>
                      <th className="py-2.5 px-3">Pico / Manguera N°</th>
                      <th className="py-2.5 px-3">Estado Línea</th>
                      <th className="py-2.5 px-3 text-right">Última Entrega</th>
                      <th className="py-2.5 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dispensers.map((d: any) => {
                      const associatedProduct = products.find((p: any) => p.id === d.productId);
                      const associatedTank = tanks?.find((t: any) => t.id === d.suctionTankId);
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-extrabold text-slate-800">
                            <div>{d.name}</div>
                            <span className="text-[9px] text-slate-400 font-mono font-medium uppercase">{d.id}</span>
                          </td>
                          <td className="py-3 px-3 font-semibold">
                            {associatedProduct ? (
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: associatedProduct.hexColor }} />
                                <span>{associatedProduct.name}</span>
                              </div>
                            ) : (
                              <span className="text-red-500 font-bold">Inoperativo - Desasignado</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {associatedTank ? (
                              <div className="flex flex-col">
                                <span className="font-extrabold text-teal-700 text-xs">{associatedTank.name}</span>
                                <span className="text-[9px] font-mono text-slate-400">CAP: {associatedTank.capacityLiters} L | {associatedTank.id}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium italic text-[11px]">No asignada (Sin Línea)</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">
                            PICO N° {d.hose || 1}
                          </td>
                          <td className="py-3 px-3">
                            {d.status === 'available' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px] uppercase">Disponible</span>
                            ) : d.status === 'dispensing' ? (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-805 rounded font-bold text-[9px] uppercase animate-pulse">Surtidor Entregando</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] uppercase">{d.status}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                            {d.lastSaleLiters ? `${d.lastSaleLiters} L` : 'Sin despachos'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditDispenser(d)}
                                className="cursor-pointer p-1 text-slate-400 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 border border-slate-150 rounded transition-colors"
                                title="Editar Surtidor"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDispenserObj(d.id, d.name)}
                                className="cursor-pointer p-1 text-slate-400 hover:text-red-650 bg-slate-50 hover:bg-red-50 border border-slate-150 rounded transition-colors"
                                title="Borrar manguera"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Combustibles Catalog Setup SubTab */}
      {activeSubTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          
          {/* Form Column */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-fit">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-3.5 flex items-center gap-1.5">
              <Droplets className="w-4.5 h-4.5 text-teal-600" />
              {editingProdId ? 'EDITAR PARAMETROS COMBÚSTIBLE' : 'NUEVA ESPECIFICACIÓN QUÍMICA'}
            </span>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-semibold text-slate-650">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Código ID Alternativo *</label>
                  <input
                    type="text"
                    placeholder="ej. PROD-GNC"
                    value={prodId}
                    onChange={(e) => editingProdId ? null : setProdId(e.target.value)}
                    disabled={!!editingProdId}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Categoría General *</label>
                  <select
                    value={prodType}
                    onChange={(e: any) => setProdType(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded"
                  >
                    <option value="nafta">Nafta Súper</option>
                    <option value="premium">Grado 3 Premium</option>
                    <option value="gasoil">Gasoil Ultra / Diesel</option>
                    <option value="urea">Urea Líquida (ARN32)</option>
                    <option value="lubricants">Lubricantes Envases</option>
                    <option value="other">Otros Derivados</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nombre Comercial de Producto *</label>
                <input
                  type="text"
                  placeholder="ej. Ultra Diesel Grado 2"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Precio x Litro (Boca de Expendio) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="1140"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full pl-6 pr-2 p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono text-xs font-bold"
                    />
                    <span className="absolute left-2.5 top-2.5 text-slate-400">$</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Densidad Referencia (kg/m³) *</label>
                  <input
                    type="number"
                    placeholder="840"
                    value={prodReferenceDensity}
                    onChange={(e) => setProdReferenceDensity(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Alerta Stock Bajo (L) *</label>
                  <input
                    type="number"
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Capacidad Máxima Canal (L) *</label>
                  <input
                    type="number"
                    value={prodMaxStock}
                    onChange={(e) => setProdMaxStock(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Color de Representación *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={prodHexColor}
                    onChange={(e) => setProdHexColor(e.target.value)}
                    className="cursor-pointer w-10 h-8 border border-slate-200 rounded bg-slate-50"
                  />
                  <span className="text-[11px] font-mono text-slate-500 uppercase font-black">{prodHexColor}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="cursor-pointer flex-1 bg-teal-600 text-white py-2 px-3.5 rounded-lg font-bold hover:bg-teal-700 flex items-center justify-center gap-1 transition-all"
                >
                  {editingProdId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingProdId ? 'Guardar Cambios' : 'Añadir Combustible'}</span>
                </button>

                {editingProdId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProdId(null);
                      setProdName('');
                      setProdPrice('1100');
                      setProdReferenceDensity('840');
                    }}
                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-650 py-2 px-3.5 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Column */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-3.5">
              CATÁLOGO DE PRODUCTOS RESTRIGIDOS SENSINA
            </span>

            {products.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                No hay productos cargados en el catálogo central. Use el formulario lateral.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                    <tr>
                      <th className="py-2.5 px-3">Código/Combustible</th>
                      <th className="py-2.5 px-3">Clasificación Base</th>
                      <th className="py-2.5 px-3 text-right">Precio x Litro</th>
                      <th className="py-2.5 px-3 text-right">Densidad Referencia</th>
                      <th className="py-2.5 px-3 text-right">Mínimo Stock</th>
                      <th className="py-2.5 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-extrabold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: p.hexColor || '#334155' }} />
                            <span>{p.name}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono font-medium block mt-0.5">{p.id}</span>
                        </td>
                        <td className="py-3 px-3 capitalize font-bold text-slate-500">
                          {p.type}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-teal-700">
                          {formatCurrency(p.pricePerLiter)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {p.referenceDensity} kg/m³
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {p.minStock ? formatLiters(p.minStock) : 'Sin límite'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="cursor-pointer p-1 text-slate-400 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 border border-slate-150 rounded transition-colors"
                              title="Editar combustible"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProductObj(p.id, p.name)}
                              className="cursor-pointer p-1 text-slate-400 hover:text-red-650 bg-slate-50 hover:bg-red-50 border border-slate-150 rounded transition-colors"
                              title="Remover de catálogo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ESP32 LIVE SUITE SUBTAB */}
      {activeSubTab === 'esp32_live' && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm font-sans">
          <Esp32Live />
        </div>
      )}

      {/* 3. COMMUNICATIONS DIAG SUBTAB */}
      {activeSubTab === 'comms_diag' && (
        <div className="bg-white p-6 rounded-xl border border-slate-105 shadow-sm font-sans col-span-full">
          <CommunicationsDiag data={data} onRefresh={onRefresh} />
        </div>
      )}

      {/* 4. PLATFORMS USER MANAGEMENT SUBTAB */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          {/* Form Column */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm h-fit">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-3.5">
              {editingUserId ? 'EDITAR CREDENCIAL DE USUARIO' : 'REGISTRAR NUEVO USUARIO'}
            </span>
            
            <form onSubmit={handleUserSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nombre de Usuario (Login) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUserId}
                  placeholder="Ej. jperez"
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej. jperez@sensina.cloud"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Rol / Permisos *</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none text-slate-700 capitalize"
                >
                  <option value="admin">Administrador Central (Full Acceso)</option>
                  <option value="supervisor">Supervisor de Estación (Verificación & Control)</option>
                  <option value="operator">Operador / Despachador (Solo Registro)</option>
                  <option value="technician">Soporte Técnico Especialista</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Asignación Geográfica / Estación</label>
                <select
                  value={userSiteId}
                  onChange={(e) => setUserSiteId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none text-slate-700"
                >
                  {sites.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                  <option value="GLOBAL">Acceso Global / Central</option>
                </select>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="user_active_chk"
                  checked={userActive}
                  onChange={(e) => setUserActive(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-550"
                />
                <label htmlFor="user_active_chk" className="cursor-pointer select-none text-slate-700">
                  Usuario Activo (Permitir Ingreso)
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="cursor-pointer flex-1 bg-teal-600 text-white py-2 px-3.5 rounded-lg font-bold hover:bg-teal-700 flex items-center justify-center gap-1 transition-all"
                >
                  {editingUserId ? <Save className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{editingUserId ? 'Guardar Cambios' : 'Registrar'}</span>
                </button>

                {editingUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUserId(null);
                      setUserName('');
                      setUserUsername('');
                      setUserEmail('');
                      setUserRole('operator');
                      setUserSiteId(sites[0]?.id || 'ESTACION-001');
                      setUserActive(true);
                    }}
                    className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-650 py-2 px-3.5 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table Column */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <span className="text-xs font-black text-slate-400 block tracking-wider uppercase mb-3.5">
              USUARIOS REGISTRADOS EN SENSINA PLATAFORMA ({users.length})
            </span>

            {users.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-semibold">
                No hay usuarios registrados en el sistema.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Usuario / Perfil</th>
                      <th className="py-2.5 px-3">Nombre / Correo</th>
                      <th className="py-2.5 px-3">Sucursal Asignada</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-center text-slate-550">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                              u.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' :
                              u.role === 'supervisor' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              u.role === 'technician' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-750 border border-slate-205'
                            }`}>
                              {u.username.slice(0, 2)}
                            </span>
                            <div>
                              <span className="font-extrabold text-slate-800">{u.username}</span>
                              <span className={`text-[9px] font-bold block capitalize mt-0.5 ${
                                u.role === 'admin' ? 'text-red-650' :
                                u.role === 'supervisor' ? 'text-indigo-600' :
                                u.role === 'technician' ? 'text-amber-600' :
                                'text-slate-500'
                              }`}>
                                {u.role === 'admin' ? 'Administrador' :
                                 u.role === 'supervisor' ? 'Supervisor' :
                                 u.role === 'technician' ? 'Técnico' : 'Operador'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700 block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{u.email || '-'}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-500">
                          {sites.find((s: any) => s.id === u.siteId)?.name || u.siteId || 'Global / Admin'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            u.active 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {u.active ? 'Activo' : 'Suspendido'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditUser(u)}
                              className="cursor-pointer p-1 text-slate-400 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 border border-slate-150 rounded transition-colors"
                              title="Editar Usuario"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUserObj(u.id, u.username)}
                              disabled={u.username === 'admin'}
                              className="cursor-pointer p-1 text-slate-400 hover:text-red-650 bg-slate-50 hover:bg-red-50 border border-slate-150 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none"
                              title="Eliminar Usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. WHITE LABEL BRANDING CUSTOMISATION SUBTAB */}
      {activeSubTab === 'branding' && (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm font-sans space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="p-2.5 rounded-full bg-emerald-55 text-emerald-700">
              <Tag className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">CONFIGURACIÓN DE MARCA BLANCA / DISTRIBUIDOR</h2>
              <p className="text-xs text-slate-500 mt-0.5">Personalice la plataforma con la identidad corporativa de su empresa o clientes (Logotipos, Nombre, Eslogan, Colores y Contactos de Soporte).</p>
            </div>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-6 text-xs font-semibold text-slate-600">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Seccion 1 - Identidad Visual y Nombres */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">01. Identidad de Marca</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Nombre Comercial de la Plataforma</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. C.E.S.T.I."
                      value={brandPlatformName}
                      onChange={(e) => setBrandPlatformName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block font-medium">Reemplaza el nombre de la esquina superior izquierda.</span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Eslogan o Subtítulo Operativo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. TELEMETRÍA"
                      value={brandTagline}
                      onChange={(e) => setBrandTagline(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block font-medium">Se muestra debajo del nombre comercial de la plataforma.</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-slate-400 font-bold">Tipo de Logotipo a Utilizar</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'emoji', label: '⛽ Emoji Combustible' },
                      { key: 'icon', label: '🔠 Inicial Textual' },
                      { key: 'url', label: '🌐 URL de Imagen' },
                      { key: 'base64', label: '📂 Archivo PNG/JPG' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setBrandLogoType(item.key as any)}
                        className={`cursor-pointer p-2.5 rounded border text-center transition-all ${
                          brandLogoType === item.key
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-500 font-bold shadow-2xs'
                            : 'bg-slate-50 text-slate-550 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* dynamic Logo Input options based on type */}
                {brandLogoType === 'emoji' && (
                  <div>
                    <label className="block text-slate-400 mb-1">Emoji del Logo</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={brandLogoEmoji}
                      onChange={(e) => setBrandLogoEmoji(e.target.value)}
                      className="w-full sm:w-1/3 p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-sans text-lg text-center"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block font-medium">Ej: ⛽, ⚡, 💧, 🚛, 🏭, 💼 para dar estilo instantáneo sin subir archivos.</span>
                  </div>
                )}

                {brandLogoType === 'icon' && (
                  <div>
                    <label className="block text-slate-400 mb-1">Letra Inicial Representativa (1 caracter)</label>
                    <input
                      type="text"
                      maxLength={1}
                      placeholder="C"
                      value={brandLogoIcon}
                      onChange={(e) => setBrandLogoIcon(e.target.value)}
                      className="w-full sm:w-1/3 p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono text-center text-md font-bold uppercase"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block font-medium">Ej: "C" para CESTI, "S" para SENSINA, "L" para Logística, etc.</span>
                  </div>
                )}

                {brandLogoType === 'url' && (
                  <div>
                    <label className="block text-slate-400 mb-1">URL de Imagen del Logotipo Web</label>
                    <input
                      type="url"
                      placeholder="https://su-distribuidora.com/logo.png"
                      value={brandLogoUrl}
                      onChange={(e) => setBrandLogoUrl(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block font-medium">Debe ser un enlace HTTPS público directo a una imagen cuadrada de aprox 64x64px.</span>
                  </div>
                )}

                {brandLogoType === 'base64' && (
                  <div className="space-y-2">
                    <label className="block text-slate-400">Subir Archivo de Logo Corporativo (Max. 2 MB)</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 py-2 px-3 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors w-fit">
                        <span>Seleccionar Imagen...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                      </label>
                      {brandLogoBase64 ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={brandLogoBase64}
                            alt="Logo Vista Previa"
                            className="w-10 h-10 object-contain rounded bg-slate-50 border border-slate-200 p-1"
                          />
                          <button
                            type="button"
                            onClick={() => setBrandLogoBase64('')}
                            className="text-red-650 hover:text-red-850 text-[10px] font-bold underline cursor-pointer"
                          >
                            Eliminar imagen
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium font-mono">Ninguna imagen cargada para Marca Blanca.</span>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Seccion 2 - Color del Tema y Soporte */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">02. Colores y Contacto de Soporte Técnico</span>

                <div className="space-y-3">
                  <label className="block text-slate-400">Paleta de Color de la Interfaz</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                    {[
                      { key: 'teal', label: 'Elegante Teal', bgClass: 'bg-teal-650' },
                      { key: 'blue', label: 'Azul Eléctrico', bgClass: 'bg-blue-600' },
                      { key: 'emerald', label: 'Verde Esmeralda', bgClass: 'bg-emerald-600' },
                      { key: 'indigo', label: 'Índigo Smart', bgClass: 'bg-indigo-650' },
                      { key: 'rose', label: 'Rojo Alerta', bgClass: 'bg-red-600' },
                      { key: 'slate', label: 'Gris Slate', bgClass: 'bg-slate-700' },
                    ].map((color) => (
                      <button
                        key={color.key}
                        type="button"
                        onClick={() => setBrandPrimaryColor(color.key)}
                        className={`cursor-pointer p-2 rounded border text-[10px] text-left flex items-center justify-between transition-all ${
                          brandPrimaryColor === color.key
                            ? 'bg-emerald-50 border-emerald-500 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate pr-1 uppercase">{color.label}</span>
                        <span className={`w-3 h-3 rounded-full shrink-0 ${color.bgClass}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Correo Electrónico de Soporte</label>
                    <input
                      type="email"
                      placeholder="Ej. mesa@su-empresa.com"
                      value={brandSupportEmail}
                      onChange={(e) => setBrandSupportEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Teléfono o WhatsApp de Soporte</label>
                    <input
                      type="text"
                      placeholder="Ej. +54 9 11 1234-5678"
                      value={brandSupportPhone}
                      onChange={(e) => setBrandSupportPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nombre Comercial pie de página (Copyright)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora del Norte S.R.L."
                    value={brandFooterCompany}
                    onChange={(e) => setBrandFooterCompany(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-1.5 select-none text-slate-700">
                  <input
                    type="checkbox"
                    id="chk_hide_sensina"
                    checked={brandHideSensina}
                    onChange={(e) => setBrandHideSensina(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-550 cursor-pointer"
                  />
                  <label htmlFor="chk_hide_sensina" className="cursor-pointer font-bold">
                    Ocultar logotipos y menciones secundarias a "SENSINA"
                  </label>
                </div>
              </div>

            </div>

            {/* Vista Previa de la marca */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-150 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">VISTA PREVIA EN TIEMPO REAL COHESIVA</span>
              <div className="bg-white p-3 border border-slate-200 rounded max-w-sm flex items-center gap-3">
                {brandLogoType === 'icon' && (
                  <div className="w-8 h-8 bg-teal-600 text-white font-bold rounded flex items-center justify-center text-sm shadow-xs">
                    {brandLogoIcon || 'C'}
                  </div>
                )}
                {brandLogoType === 'emoji' && (
                  <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-xl select-none">
                    {brandLogoEmoji || '⛽'}
                  </div>
                )}
                {(brandLogoType === 'url' || brandLogoType === 'base64') && (
                  <img
                    src={(brandLogoType === 'base64' ? brandLogoBase64 : brandLogoUrl) || 'https://via.placeholder.com/32'}
                    alt="Logo"
                    className="w-8 h-8 object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block leading-tight">{brandPlatformName || 'Nombre de Plataforma'}</span>
                  <span className="text-[9px] text-teal-600 font-bold block leading-none tracking-widest mt-0.5 uppercase">{brandTagline || 'Eslogan'}</span>
                </div>
              </div>
            </div>

            {/* Botón de envío */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-md transition-all text-sm font-sans"
              >
                <Save className="w-4 h-4 animate-bounce" />
                GUARDAR Y APLICAR BRANDING CORPORATIVO
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
