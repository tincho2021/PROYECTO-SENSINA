/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Home,
  Database,
  Zap,
  FileText,
  Truck,
  Scale,
  TrendingUp,
  Compass,
  LineChart,
  Table,
  Bell,
  Brain,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
  RefreshCw,
  Cpu,
  Wifi
} from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Telemetry from './pages/Telemetry';
import Esp32Live from './pages/Esp32Live';
import Dispensers from './pages/Dispensers';
import Transactions from './pages/Transactions';
import Fleet from './pages/Fleet';
import Inventory from './pages/Inventory';
import Deliveries from './pages/Deliveries';
import Products from './pages/Products';
import Statistics from './pages/Statistics';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import CommunicationsDiag from './pages/CommunicationsDiag';

import * as api from './services/api';
import { mockSites, mockProducts, mockTanks, mockDispensers, mockDrivers, mockVehicles, mockTransactions, mockDeliveries, mockReconciliations, mockAlerts, mockDevices, mockUsers } from './data/mockData';

export default function App() {
  const [user, setUser] = useState<any>(null); // State of active user session
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data sync states
  const [data, setData] = useState<any>({
    sites: mockSites,
    products: mockProducts,
    tanks: mockTanks,
    dispensers: mockDispensers,
    drivers: mockDrivers,
    vehicles: mockVehicles,
    transactions: mockTransactions,
    deliveries: mockDeliveries,
    reconciliations: mockReconciliations,
    alerts: mockAlerts,
    devices: mockDevices,
    users: mockUsers,
    activeSiteName: 'Estación Norte',
    activeSiteLocation: 'Ruta 9, Km 280, Rosario'
  });
  const [isLoading, setIsLoading] = useState(false);

  // --- CONFIGURACIÓN DE MARCA BLANCA / WHITE-LABEL ---
  const [whiteLabel, setWhiteLabel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cesti_white_label_layout');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("No se pudo cargar la configuración de marca blanca", e);
        }
      }
    }
    return {
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
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${whiteLabel.platformName || 'C.E.S.T.I.'} - Telemetría Inteligente`;
    }
  }, [whiteLabel.platformName]);

  const handleUpdateWhiteLabel = (newBranding: any) => {
    setWhiteLabel(newBranding);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cesti_white_label_layout', JSON.stringify(newBranding));
    }
  };

  // Generar anulaciones de estilos de marca en tiempo de ejecución (inyecta CSS para clases de color)
  const getBrandOverrides = () => {
    let primary = '#0d9488'; // teal-600
    let primaryDark = '#0f766e'; // teal-700
    let primaryDarkest = '#115e59'; // teal-800
    let primaryLight = '#f0fdfa'; // teal-50
    let primaryLightBorder = '#ccfbf1'; // teal-100
    let textOnPrimaryLight = '#0f766e'; // teal-700

    switch (whiteLabel.primaryColor) {
      case 'blue':
        primary = '#2563eb';
        primaryDark = '#1d4ed8';
        primaryDarkest = '#1e40af';
        primaryLight = '#eff6ff';
        primaryLightBorder = '#dbeafe';
        textOnPrimaryLight = '#1d4ed8';
        break;
      case 'emerald':
        primary = '#10b981';
        primaryDark = '#059669';
        primaryDarkest = '#047857';
        primaryLight = '#ecfdf5';
        primaryLightBorder = '#d1fae5';
        textOnPrimaryLight = '#059669';
        break;
      case 'indigo':
        primary = '#4f46e5';
        primaryDark = '#4338ca';
        primaryDarkest = '#3730a3';
        primaryLight = '#f5f3ff';
        primaryLightBorder = '#e0e7ff';
        textOnPrimaryLight = '#4338ca';
        break;
      case 'rose':
        primary = '#dc2626';
        primaryDark = '#b91c1c';
        primaryDarkest = '#991b1b';
        primaryLight = '#fef2f2';
        primaryLightBorder = '#fee2e2';
        textOnPrimaryLight = '#b91c1c';
        break;
      case 'slate':
        primary = '#334155';
        primaryDark = '#1e293b';
        primaryDarkest = '#0f172a';
        primaryLight = '#f8fafc';
        primaryLightBorder = '#f1f5f9';
        textOnPrimaryLight = '#1e293b';
        break;
      case 'teal':
      default:
        primary = '#0d9488';
        primaryDark = '#0f766e';
        primaryDarkest = '#115e59';
        primaryLight = '#f0fdfa';
        primaryLightBorder = '#ccfbf1';
        textOnPrimaryLight = '#0f7654';
        break;
    }

    return `
      /* Marca Blanca: Inyección Dinámica de Colores */
      :root {
        --brand-primary: ${primary};
        --brand-primary-dark: ${primaryDark};
        --brand-primary-darkest: ${primaryDarkest};
        --brand-primary-light: ${primaryLight};
        --brand-primary-light-border: ${primaryLightBorder};
      }
      
      .bg-teal-500, .bg-teal-600, .bento-highlight { background-color: ${primary} !important; }
      .bg-teal-700 { background-color: ${primaryDark} !important; }
      .bg-teal-850, .bg-teal-800, .bg-teal-900 { background-color: ${primaryDarkest} !important; }
      
      .hover\\:bg-teal-700:hover { background-color: ${primaryDark} !important; }
      .hover\\:bg-teal-850:hover, .hover\\:bg-teal-800:hover { background-color: ${primaryDarkest} !important; }
      .hover\\:bg-teal-550:hover, .hover\\:bg-teal-600:hover { background-color: ${primary} !important; }
      
      .text-teal-600 { color: ${primary} !important; }
      .text-teal-700, .text-teal-650 { color: ${primaryDark} !important; }
      .text-teal-800 { color: ${primaryDarkest} !important; }
      
      .border-teal-600 { border-color: ${primary} !important; }
      .border-teal-200 { border-color: ${primaryLightBorder} !important; }
      .border-teal-500 { border-color: ${primary} !important; }
      
      .bg-teal-50 { background-color: ${primaryLight} !important; }
      .text-teal-50 { color: ${primaryLight} !important; }
      .bg-teal-100 { background-color: ${primaryLightBorder} !important; }
      
      .bg-teal-50.text-teal-700 {
        background-color: ${primaryLight} !important;
        color: ${textOnPrimaryLight} !important;
      }
      
      .bento-highlight {
        background-color: ${primary} !important;
        border-color: ${primaryDark} !important;
      }
      .bento-highlight:hover {
        background-color: ${primaryDark} !important;
      }
    `;
  };

  // Sync with full-stack server
  const loadDatabase = async () => {
    setIsLoading(true);
    try {
      const fullSuite = await api.fetchAllData();
      setData(fullSuite);
    } catch (err) {
      console.warn('[SENSINA App] Failed to dynamically sync full stack, using local states.', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, [user]);

  // Polling dinámico de IoT integrado para C.E.S.T.I.
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchWithFallback = async (localUrl: string, fallbackUrl: string) => {
      try {
        const req = await fetch(localUrl);
        if (req.ok) {
          const res = await req.json();
          if (res && res.ok) {
            return res;
          }
        }
      } catch (e) {
        console.warn(`Local endpoint ${localUrl} failed, trying fallback:`, e);
      }

      // Try the fallback web endpoint if local fails
      try {
        const req = await fetch(fallbackUrl);
        if (req.ok) {
          const res = await req.json();
          if (res && res.ok) return { ...res, isFallback: true };
        }
      } catch (e) {
        console.error(`Fallback endpoint ${fallbackUrl} failed as well:`, e);
      }
      return null;
    };

    // Polling rápido para parámetros de sonda, surtidores y alarmas (cada 15 segundos)
    const pollFastIot = async () => {
      // Obtener URL base personalizada de localStorage si existe
      let customBase = '';
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('cesti_custom_iot_server');
        if (saved && saved.trim() !== '') {
          customBase = saved.trim().replace(/\/+$/, '');
        }
      }

      const telemetryUrl = customBase ? `${customBase}/api/latest-telemetry` : '/api/latest-telemetry';
      const dispenserUrl = customBase ? `${customBase}/api/latest-dispenser-status` : '/api/latest-dispenser-status';
      const alarmsUrl = customBase ? `${customBase}/api/latest-alarms` : '/api/latest-alarms';

      try {
        const [telRes, dispRes, almRes] = await Promise.all([
          fetchWithFallback(telemetryUrl, 'https://velvety-vacherin-c43b91.netlify.app/api/latest-telemetry'),
          fetchWithFallback(dispenserUrl, 'https://velvety-vacherin-c43b91.netlify.app/api/latest-dispenser-status'),
          fetchWithFallback(alarmsUrl, 'https://velvety-vacherin-c43b91.netlify.app/api/latest-alarms')
        ]);

        if (!isMounted) return;

        setData((prev: any) => {
          let updatedTanks = [...prev.tanks];
          let updatedDispensers = [...prev.dispensers];
          let updatedAlerts = [...prev.alerts];

          // 1. Integrar telemetría de tanques
          if (telRes && telRes.ok) {
            const telemetries = telRes.tanks && Array.isArray(telRes.tanks) 
              ? telRes.tanks 
              : telRes.data 
                ? [telRes.data] 
                : [];
            
            telemetries.forEach((tel: any) => {
              if (tel && tel.tank_id) {
                // Sincronización transparente de alias físicos vs. lógicos (tank_xx <-> TQ-xx)
                const aliases: Record<string, string> = {
                  'tank_01': 'TQ-02', 'tank_1': 'TQ-02', 'TQ-02': 'tank_01',
                  'tank_02': 'TQ-01', 'tank_2': 'TQ-01', 'TQ-01': 'tank_02',
                  'tank_03': 'TQ-03', 'tank_3': 'TQ-03', 'TQ-03': 'tank_03'
                };
                const mappedAlias = aliases[tel.tank_id];
                const tankIndex = updatedTanks.findIndex((t: any) => t.id === tel.tank_id || (mappedAlias && t.id === mappedAlias));

                let pId = tel.product_id || 'GO2';
                const contextStr = (
                  (tel.product_id || '') + ' ' + 
                  (tel.product_name || '') + ' ' + 
                  (tel.product_type || '') + ' ' + 
                  (tel.tank_name || '') + ' ' + 
                  (tel.tank_id || '')
                ).toLowerCase();

                if (contextStr.includes('nafta') || contextStr.includes('super') || contextStr.includes('súper') || contextStr.includes('ns') || tel.tank_id === 'tank_03') {
                  pId = 'NS';
                } else if (contextStr.includes('premium') || contextStr.includes('infinia') || contextStr.includes('grado 3') || contextStr.includes('grado3') || contextStr.includes('gp') || tel.tank_id === 'tank_01' || tel.tank_id === 'tank_1') {
                  pId = 'GP';
                } else if (contextStr.includes('gasoil') || contextStr.includes('diesel') || contextStr.includes('ultra') || contextStr.includes('comun') || contextStr.includes('común') || contextStr.includes('go2') || tel.tank_id === 'tank_02' || tel.tank_id === 'tank_2') {
                  pId = 'GO2';
                } else {
                  if (pId === "GO3" || pId === "premium") {
                    pId = "GP";
                  } else if (pId === "nafta" || pId === "NF") {
                    pId = "NS";
                  } else if (pId === "gasoil") {
                    pId = "GO2";
                  }
                }

                const targetId = tankIndex > -1 ? updatedTanks[tankIndex].id : tel.tank_id;
                const tankObj = {
                  id: targetId,
                  siteId: tel.site_id || "rosario-01",
                  productId: pId,
                  name: tel.tank_name || `Cisterna Sonda ${tel.tank_id}`,
                  capacityLiters: tel.capacity_liters || 20000,
                  heightMm: tel.height_mm ? Math.max(tel.height_mm, 2000) : 2000,
                  currentHeightMm: tel.height_mm,
                  currentVolumeLiters: tel.volume_liters,
                  temperatureC: tel.temperature_c ?? 15,
                  waterMm: tel.water_mm ?? 0,
                  batteryV: tel.battery_v ?? 3.6,
                  batteryPercent: tel.battery_percent ?? 100,
                  signalRssi: tel.signal_rssi ?? -60,
                  sensorStatus: tel.sensor_status || "normal",
                  sensorType: "magnetostrictive",
                  lastUpdated: tel.received_at || new Date().toISOString()
                };

                if (tankIndex > -1) {
                  updatedTanks[tankIndex] = { ...updatedTanks[tankIndex], ...tankObj };
                } else {
                  updatedTanks.push(tankObj);
                }
              }
            });
          }

          // 2. Integrar estado de surtidores
          if (dispRes && dispRes.ok && dispRes.data) {
            const dispPayload = dispRes.data;
            if (Array.isArray(dispPayload.dispensers)) {
              dispPayload.dispensers.forEach((updatedDisp: any) => {
                const dispIndex = updatedDispensers.findIndex((origDisp: any) => 
                  origDisp.id === updatedDisp.dispenser_id && origDisp.hose === Number(updatedDisp.nozzle || updatedDisp.hose_id || 1)
                );
                const existingDisp = dispIndex > -1 ? updatedDispensers[dispIndex] : null;
                const dispObj = {
                  id: updatedDisp.dispenser_id,
                  siteId: dispPayload.site_id || "rosario-01",
                  name: `Surtidor ${updatedDisp.dispenser_id.replace(/[_-]/g, ' ')}`,
                  hose: updatedDisp.nozzle || 1,
                  productId: updatedDisp.product_id || "GO2",
                  suctionTankId: updatedDisp.suction_tank_id || undefined,
                  status: updatedDisp.status === 'fueling' ? 'dispensing' : (updatedDisp.status || "available"),
                  lastSaleLiters: (updatedDisp.last_sale_liters && Number(updatedDisp.last_sale_liters) > 0)
                    ? Number(updatedDisp.last_sale_liters)
                    : (existingDisp ? existingDisp.lastSaleLiters || 0 : 0),
                  lastSaleAmount: (updatedDisp.last_sale_amount && Number(updatedDisp.last_sale_amount) > 0)
                    ? Number(updatedDisp.last_sale_amount)
                    : (existingDisp ? existingDisp.lastSaleAmount || 0 : 0),
                  activeDriver: updatedDisp.driver || undefined,
                  activeVehicle: updatedDisp.vehicle || undefined,
                  activePlate: updatedDisp.plate || undefined,
                  odometerReading: updatedDisp.odometer || undefined,
                  authorizationMethod: updatedDisp.authorization_method || "RFID",
                  lastUpdated: dispPayload.received_at || new Date().toISOString()
                };

                if (dispIndex > -1) {
                  updatedDispensers[dispIndex] = { ...updatedDispensers[dispIndex], ...dispObj };
                } else {
                  updatedDispensers.push(dispObj);
                }
              });
            }
          }

          // 3. Integrar alertas / pérdidas del sensor de alarma
          if (almRes && almRes.ok && Array.isArray(almRes.data)) {
            const alarmsList = almRes.data;
            alarmsList.forEach((alm: any) => {
              const exists = updatedAlerts.some((a: any) => a.id === alm.alarm_id);
              if (!exists) {
                const mappedAlert: any = {
                  id: alm.alarm_id,
                  level: alm.severity === 'critical' ? 'critical' : alm.severity === 'warning' ? 'warning' : 'info',
                  timestamp: alm.timestamp || new Date().toISOString(),
                  source: `${alm.source_type.toUpperCase()} - ${alm.source_id}`,
                  description: `[IoT ${alm.alarm_type.toUpperCase()}] ${alm.message}`,
                  status: alm.status === 'active' ? 'new' : alm.status === 'resolved' ? 'resolved' : 'acknowledged',
                  recommendation: 'Inspección de seguridad física prioritaria en zona ' + alm.source_id + '. Medir de forma manual para contrastar diferencias.'
                };
                updatedAlerts.unshift(mappedAlert);
              }
            });
          }

          const updatedProducts = (telRes && telRes.products && Array.isArray(telRes.products) && !telRes.isFallback) 
            ? telRes.products 
            : prev.products;

          let detectedSiteName = prev.activeSiteName || 'Estación Norte';
          let detectedSiteLocation = prev.activeSiteLocation || 'Ruta 9, Km 280, Rosario';

          if (telRes && telRes.ok) {
            if (telRes.data?.site_name && telRes.data.site_name.trim() !== '') {
              detectedSiteName = telRes.data.site_name;
            } else if (telRes.site_name && telRes.site_name.trim() !== '') {
              detectedSiteName = telRes.site_name;
            }

            if (telRes.data?.site_location && telRes.data.site_location.trim() !== '') {
              detectedSiteLocation = telRes.data.site_location;
            } else if (telRes.site_location && telRes.site_location.trim() !== '') {
              detectedSiteLocation = telRes.site_location;
            }

            const telemetries = telRes.tanks && Array.isArray(telRes.tanks) 
              ? telRes.tanks 
              : telRes.data 
                ? [telRes.data] 
                : [];
            
            telemetries.forEach((t: any) => {
              if (t.site_name && t.site_name.trim() !== '') {
                detectedSiteName = t.site_name;
              }
              if (t.site_location && t.site_location.trim() !== '') {
                detectedSiteLocation = t.site_location;
              }
            });
          }

          if (dispRes && dispRes.ok && dispRes.data) {
            const dispPayload = dispRes.data;
            if (dispPayload.site_name && dispPayload.site_name.trim() !== '') {
              detectedSiteName = dispPayload.site_name;
            }
            if (dispPayload.site_location && dispPayload.site_location.trim() !== '') {
              detectedSiteLocation = dispPayload.site_location;
            }
          }

          return {
            ...prev,
            tanks: updatedTanks,
            dispensers: updatedDispensers,
            alerts: updatedAlerts,
            products: updatedProducts,
            activeSiteName: detectedSiteName,
            activeSiteLocation: detectedSiteLocation
          };
        });
      } catch (err) {
        console.warn("[Polling Central IoT Fast] Falló polling en vivo:", err);
      }
    };

    // Polling más lento para transacciones y despachos de combustible (cada 30 segundos)
    const pollSlowIot = async () => {
      // Obtener URL base personalizada de localStorage si existe
      let customBase = '';
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('cesti_custom_iot_server');
        if (saved && saved.trim() !== '') {
          customBase = saved.trim().replace(/\/+$/, '');
        }
      }

      const transactionsUrl = customBase ? `${customBase}/api/latest-fuel-transactions` : '/api/latest-fuel-transactions';

      try {
        const txsRes = await fetchWithFallback(transactionsUrl, 'https://velvety-vacherin-c43b91.netlify.app/api/latest-fuel-transactions');
        if (!isMounted) return;

        if (txsRes && txsRes.ok && Array.isArray(txsRes.data)) {
          const freshTxns = txsRes.data;
          setData((prev: any) => {
            let updatedTransactions = [...prev.transactions];
            freshTxns.forEach((newTx: any) => {
              const exists = updatedTransactions.some((tx: any) => tx.id === newTx.transaction_id);
              if (!exists) {
                const mappedTx: any = {
                  id: newTx.transaction_id,
                  siteId: newTx.site_id,
                  dispenserId: newTx.dispenser_id,
                  hose: newTx.nozzle || 1,
                  productId: newTx.product_id,
                  liters: newTx.liters,
                  amount: newTx.amount,
                  pricePerLiter: newTx.price_per_liter,
                  driverId: newTx.driver_id,
                  vehicleId: newTx.vehicle_id,
                  vehiclePlate: newTx.vehicle_plate,
                  odometer: newTx.odometer,
                  timestampStart: newTx.timestamp_start,
                  timestampEnd: newTx.timestamp_end,
                  authorizationMethod: newTx.authorization_method,
                  status: newTx.status,
                  createdAt: newTx.received_at || new Date().toISOString(),
                  isLiveIot: true
                };
                updatedTransactions.unshift(mappedTx);
              }
            });
            return {
              ...prev,
              transactions: updatedTransactions.slice(0, 100)
            };
          });
        }
      } catch (err) {
        console.warn("[Polling Central IoT Slow] Falló polling de transacciones:", err);
      }

      // Polling de descargas automáticas o manuales registradas en producción (Netlify / Central)
      const deliveriesUrl = customBase ? `${customBase}/api/latest-deliveries` : '/api/latest-deliveries';

      try {
        const delsRes = await fetchWithFallback(deliveriesUrl, 'https://velvety-vacherin-c43b91.netlify.app/api/latest-deliveries');
        if (!isMounted) return;

        if (delsRes && delsRes.ok && Array.isArray(delsRes.data)) {
          const freshDels = delsRes.data;
          setData((prev: any) => {
            let updatedDeliveries = [...prev.deliveries];
            freshDels.forEach((newDel: any) => {
              const exists = updatedDeliveries.some((dl: any) => dl.id === newDel.id);
              if (!exists) {
                updatedDeliveries.unshift({
                  ...newDel,
                  // Ensure formatting and mapping of any missing/raw objects matches standard Delivery type
                  isLiveIot: true
                });
              }
            });
            return {
              ...prev,
              deliveries: updatedDeliveries.slice(0, 100)
            };
          });
        }
      } catch (err) {
        console.warn("[Polling Central IoT Slow] Falló polling de descargas:", err);
      }
    };

    // Lanzar inmediatamente
    pollFastIot();
    pollSlowIot();

    const fastInterval = setInterval(pollFastIot, 15000);
    const slowInterval = setInterval(pollSlowIot, 30000);

    return () => {
      isMounted = false;
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, [user]);

  // Handle simulated login callback
  const handleLoginSuccess = (username: string, role: string, name: string) => {
    setUser({ username, role, name });
  };

  // Log out mechanism
  const handleLogOut = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  // Transaction modification (flagging or approving)
  const handleModifyTransaction = (txId: string, updates: any) => {
    const freshTxns = data.transactions.map((t: any) => {
      if (t.id === txId) {
        return { ...t, ...updates };
      }
      return t;
    });
    setData((prev: any) => ({ ...prev, transactions: freshTxns }));
  };

  // Add fleet vehicle live
  const handleAddVehicle = async (vehData: any) => {
    const res = await api.registerVehicle(vehData);
    loadDatabase();
  };

  // Add fleet driver live
  const handleAddDriver = async (drvData: any) => {
    const res = await api.registerDriver(drvData);
    loadDatabase();
  };

  // Register delivery remito live
  const handleAddDelivery = async (delData: any) => {
    const res = await api.registerDelivery(delData);
    await loadDatabase();
    return res;
  };

  // Acknowledge alert status
  const handleAcknowledgeAlert = async (id: string, comments: string, user: string) => {
    await api.acknowledgeAlert(id, comments, user);
    loadDatabase();
  };

  // Resolve alert status
  const handleResolveAlert = async (id: string, comments: string, user: string) => {
    await api.resolveAlert(id, comments, user);
    loadDatabase();
  };

  // Simulate hardware sensor POST
  const handleSimulateTelemetry = async (payload: any) => {
    // API uses: tank_id, volume_liters, height_mm, temperature_c, water_mm, signal_rssi, battery_percent, sensor_status
    // Let's translate variables for the backend
    const capacity = data.tanks.find((t: any) => t.id === payload.tankId)?.capacityLiters || 20000;
    const heightLimit = data.tanks.find((t: any) => t.id === payload.tankId)?.heightMm || 2000;
    
    // Volume estimated linearly from height
    const calculatedVolume = Math.round((payload.heightMm / heightLimit) * capacity);

    const apiPayload = {
      tank_id: payload.tankId,
      volume_liters: calculatedVolume,
      height_mm: payload.heightMm,
      temperature_c: payload.temperatureC,
      water_mm: payload.waterMm,
      signal_rssi: payload.signalRssi,
      battery_percent: payload.batteryPercent,
      sensor_status: 'normal' as any
    };

    const res = await api.simulateTelemetryPost(apiPayload, payload.apiKey);
    return res;
  };

  // Render auth gateway first if no active session
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isUserAdmin = user.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard General', icon: <Home className="w-4 h-4" /> },
    { id: 'telemetry', label: 'Sondas Telemedición', icon: <Database className="w-4 h-4" /> },
    { id: 'dispensers', label: 'Control Surtidores', icon: <Zap className="w-4 h-4" /> },
    { id: 'transactions', label: 'Registro Despachos', icon: <FileText className="w-4 h-4" /> },
    { id: 'fleet', label: 'Control de Flotas', icon: <Truck className="w-4 h-4 text-teal-600" /> },
    { id: 'inventory', label: 'Conciliación Diaria', icon: <Scale className="w-4 h-4" /> },
    { id: 'deliveries', label: 'Recepciones Remitos', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'products', label: 'Combustibles Líquidos', icon: <Compass className="w-4 h-4" /> },
    { id: 'statistics', label: 'Análisis de Consumo', icon: <LineChart className="w-4 h-4" /> },
    { id: 'reports', label: 'Reportes e Impresión', icon: <Table className="w-4 h-4" /> },
    { id: 'alerts', label: 'Incongruencias Alertas', icon: <Bell className="w-4 h-4" />, count: data.alerts.filter((a: any) => a.status === 'new').length },
    { id: 'insights', label: 'Predicciones AI', icon: <Brain className="w-4 h-4 text-teal-600" /> },
    ...(isUserAdmin ? [{ id: 'settings', label: 'Configuración', icon: <SettingsIcon className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-slate-800 font-sans" id="sensina-app-root">
      <style dangerouslySetInnerHTML={{ __html: getBrandOverrides() }} />
      
      {/* 1. Sidebar desktop navigation (hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          {whiteLabel.logoType === 'icon' && (
            <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center text-white font-bold text-sm tracking-tighter" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
              {whiteLabel.logoIcon || 'C'}
            </div>
          )}
          {whiteLabel.logoType === 'emoji' && (
            <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-xl select-none">
              {whiteLabel.logoEmoji || '⛽'}
            </div>
          )}
          {whiteLabel.logoType === 'url' && (
            <img 
              src={whiteLabel.logoUrl || 'https://via.placeholder.com/32'} 
              alt="Logo" 
              className="w-8 h-8 object-contain rounded" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
          {whiteLabel.logoType === 'base64' && (
            <img 
              src={whiteLabel.logoBase64 || 'https://via.placeholder.com/32'} 
              alt="Logo" 
              className="w-8 h-8 object-contain rounded" 
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <span className="text-md font-extrabold tracking-tight text-slate-900 block leading-none truncate max-w-[140px]">
              {whiteLabel.platformName || 'C.E.S.T.I.'}
            </span>
            <span className="text-[9px] text-teal-600 font-bold uppercase tracking-wider mt-1 block leading-none truncate max-w-[140px]">
              {whiteLabel.tagline || 'TELEMETRIA'}
            </span>
          </div>
        </div>

        {/* User context badge */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center font-bold text-xs text-teal-700">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div className="truncate text-xs">
            <span className="font-semibold text-slate-900 block truncate">{user.name}</span>
            <span className="text-[10px] text-slate-400 capitalize block font-medium mt-0.5">{user.role === 'admin' ? 'Admin Global' : 'Operador de Playón'}</span>
          </div>
        </div>

        {/* Tab links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`cursor-pointer w-full flex items-center justify-between text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-teal-50 text-teal-700 font-medium'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.count ? (
                <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[9px] min-w-5 h-5 flex items-center justify-center animate-pulse">
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Log out bottom section */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogOut}
            className="cursor-pointer w-full flex items-center gap-2.5 text-xs font-bold text-red-650 hover:bg-red-50 hover:text-red-800 py-2.5 px-4 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 2. Main screen panel (contains top responsive header bar + tabs content) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Responsive Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded bg-slate-50 border border-slate-200 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-md font-bold text-slate-900 hidden md:block">Centro de Operaciones: {data.activeSiteName || 'Estación Norte'}</h1>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Sistema Estable
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Última Actualización Sync</p>
              <p className="text-xs font-mono text-slate-700">03 Jun 2026, 21:32:45</p>
            </div>
            
            {/* Quick warning of new alerts */}
            {data.alerts.some((a: any) => a.level === 'critical' && a.status === 'new') && (
              <div 
                onClick={() => setActiveTab('alerts')}
                className="cursor-pointer bg-red-105 border border-red-200 text-red-700 flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold animate-pulse"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>ALARMA CRÍTICA ACTIVA</span>
              </div>
            )}
          </div>
        </header>

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-6" id="sensina-main-viewport">
          
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs text-slate-500 font-bold font-mono">ENLAZANDO TELEMETRÍA CENTRAL...</span>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard data={data} onRefresh={loadDatabase} onNavigate={setActiveTab} />}
          {activeTab === 'telemetry' && <Telemetry data={data} onRefresh={loadDatabase} onNavigate={setActiveTab} />}
          {activeTab === 'dispensers' && <Dispensers data={data} onRefresh={loadDatabase} />}
          {activeTab === 'transactions' && <Transactions data={data} onModifyTransaction={handleModifyTransaction} isAdmin={isUserAdmin} />}
          {activeTab === 'fleet' && <Fleet data={data} onAddVehicle={handleAddVehicle} onAddDriver={handleAddDriver} isAdmin={isUserAdmin} />}
          {activeTab === 'inventory' && <Inventory data={data} onRefresh={loadDatabase} />}
          {activeTab === 'deliveries' && <Deliveries data={data} onRefresh={loadDatabase} onAddDelivery={handleAddDelivery} isAdmin={isUserAdmin} />}
          {activeTab === 'products' && <Products data={data} />}
          {activeTab === 'statistics' && <Statistics data={data} />}
          {activeTab === 'reports' && <Reports data={data} />}
          {activeTab === 'alerts' && <Alerts data={data} onRefresh={loadDatabase} onAcknowledgeAlert={handleAcknowledgeAlert} onResolveAlert={handleResolveAlert} />}
          {activeTab === 'insights' && <Insights data={data} />}
          {activeTab === 'settings' && isUserAdmin && (
            <Settings 
              data={data} 
              onRefresh={loadDatabase} 
              onSimulateTelemetry={handleSimulateTelemetry} 
              whiteLabel={whiteLabel}
              onUpdateWhiteLabel={handleUpdateWhiteLabel}
            />
          )}
          {activeTab === 'settings' && !isUserAdmin && (
            <div className="p-8 bg-red-50 border border-red-200 text-red-700 rounded-2xl max-w-2xl mx-auto shadow-sm text-center my-12">
              <span className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-650 font-bold text-xl mx-auto mb-4">
                ⚠
              </span>
              <h2 className="text-lg font-bold">ACCESO DENEGADO / CONFIGURACIÓN BLOQUEADA</h2>
              <p className="text-sm text-red-655 font-medium mt-2 leading-relaxed">
                Su perfil operativo ("{user.role}") no posee permisos de edición para microcontroladores ESP32, tanques físicos ni calibración de productos. Se ha bloqueado esta sección para salvaguardar la estabilidad del sistema C.E.S.T.I.
              </p>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="mt-6 px-4 py-2 bg-slate-900 border border-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                Volver al Dashboard Operativo
              </button>
            </div>
          )}

        </main>

      </div>

      {/* 3. Mobile slider drawer navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="w-64 bg-white flex flex-col h-full shadow-2xl relative">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-b border-slate-100 font-sans flex items-center gap-3">
              {whiteLabel.logoType === 'emoji' ? (
                <div className="text-xl">{whiteLabel.logoEmoji || '⛽'}</div>
              ) : whiteLabel.logoType === 'url' || whiteLabel.logoType === 'base64' ? (
                <img src={whiteLabel.logoUrl || whiteLabel.logoBase64 || 'https://via.placeholder.com/32'} alt="Logo" className="w-6 h-6 object-contain rounded" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center text-white font-bold text-xs">{whiteLabel.logoIcon || 'C'}</div>
              )}
              <div>
                <span className="text-sm font-extrabold text-slate-800 tracking-wide uppercase">{whiteLabel.platformName || 'C.E.S.T.I.'}</span>
                <span className="text-[10px] text-teal-600 block mt-0.5 font-bold uppercase tracking-wider">{whiteLabel.tagline || 'TELEMETRÍA GENERAL'}</span>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count ? (
                    <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[9px]">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={handleLogOut}
                className="w-full flex items-center gap-2 text-xs font-semibold text-red-650 hover:bg-red-50 py-2 px-3 rounded transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
