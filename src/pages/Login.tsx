/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Fuel, ShieldCheck, Cpu, ChevronRight, Activity } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (userId: string, role: string, name: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('fuel2026');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (
        (username === 'admin' && password === 'fuel2026') ||
        (username === 'cgomez' && password === 'rosario')
      ) {
        setIsLoading(false);
        const name = username === 'admin' ? 'Administrador Central' : 'Carlos Gómez (Rosario)';
        const role = username === 'admin' ? 'admin' : 'supervisor';
        onLoginSuccess(username, role, name);
      } else {
        setIsLoading(false);
        setError('Credenciales inválidas. Use "admin" y "fuel2026", o "cgomez" y "rosario".');
      }
    }, 600);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2 border border-slate-100">
        
        {/* Left Side: Commercial Info & Tech Highlights */}
        <div className="bg-slate-900 p-8 md:p-12 text-slate-100 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background lines */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400">
                <Fuel className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white block">SENSINA</span>
                <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase">FuelStock Cloud</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold font-sans tracking-tight leading-tight text-white mb-6">
              Telemedición de Tanques e Inteligencia de Carga Industrial.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Plataforma robusta para el monitoreo en tiempo real de Cisternas, Surtidores, Conciliaciones Automáticas e Integración IoT nativa con microcontroladores ESP32 y sensores magnetoestrictivos.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-slate-800 p-1.5 rounded text-emerald-400 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Monitoreo IoT 24/7</h4>
                  <p className="text-xs text-slate-400">Lecturas continuas de mm de producto, temperatura y presencia de agua.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-slate-800 p-1.5 rounded text-emerald-400 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Integración con ESP32 / Modbus</h4>
                  <p className="text-xs text-slate-400">Firmware listo para recibir tramas seguras vía HTTPS POST desde campo.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-slate-800 p-1.5 rounded text-emerald-400 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Control Antifraude y Conciliación</h4>
                  <p className="text-xs text-slate-400">Detección temprana de discrepâncias de stock y descargas inconsistentes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono relative z-10">
            <span>PLATFORM VERSION v3.8.2</span>
            <span>SYSTEM YEAR 2026</span>
          </div>
        </div>

        {/* Right Side: Security Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8">
            <span className="text-xs text-emerald-600 font-mono tracking-widest uppercase block mb-1">MÓDULO DE AUTORIZACIÓN</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Ingreso al Sistema</h3>
            <p className="text-sm text-slate-500">Introduzca sus credenciales registradas en SENSINA Cloud.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Usuario de Acceso</label>
              <input
                id="username-input"
                type="text"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. admin"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contraseña de Seguridad</label>
              <input
                id="password-input"
                type="password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
              />
            </div>

            {error && (
              <div id="login-error-msg" className="bg-red-50 text-red-700 border border-red-100 text-xs px-3 py-2.5 rounded-lg font-medium leading-relaxed">
                {error}
              </div>
            )}

            <button
              id="submit-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {isLoading ? (
                <span>Validando Acceso Encriptado...</span>
              ) : (
                <>
                  <span>Ingresar a Consola Operativa</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Acccess Help Box */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-2">ACCESO DEMO PRECARGADO</span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 block">Administrador</span>
                <span className="text-slate-500 font-mono">U: admin</span>
                <span className="text-slate-500 font-mono block">C: fuel2026</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800 block">Supervisor Rosario</span>
                <span className="text-slate-500 font-mono">U: cgomez</span>
                <span className="text-slate-500 font-mono block">C: rosario</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
