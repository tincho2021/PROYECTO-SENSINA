/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tank, FuelTransaction } from '../types';

/**
 * Calculates current fill percentage of a tank
 */
export function calculateTankPercentage(currentLiters: number, capacityLiters: number): number {
  if (capacityLiters <= 0) return 0;
  return Math.min(100, Math.max(0, (currentLiters / capacityLiters) * 100));
}

/**
 * Estimates autonomy in days based on average consumption
 */
export function estimateAutonomyDays(
  currentVolume: number,
  tankId: string,
  transactions: FuelTransaction[],
  defaultAvgDaily = 800
): number {
  // Let's filter transactions for this tank (which corresponds to its dispenser products)
  // Or simply fetch standard average consumption which we can calculate
  const tankTx = transactions.filter(tx => tx.status === 'completed');
  
  if (tankTx.length === 0) {
    return Math.round((currentVolume / defaultAvgDaily) * 10) / 10;
  }

  // Calculate sum of last 14 days of consumption for this product/site if transaction logs are diverse
  const totalLit = tankTx.reduce((sum, tx) => sum + tx.liters, 0);
  // Max days in log
  const uniqueDays = new Set(tankTx.map(tx => tx.createdAt.substring(0, 10))).size || 1;
  const avgDaily = totalLit / uniqueDays;

  const autonomy = currentVolume / (avgDaily || defaultAvgDaily);
  return Math.round(autonomy * 10) / 10;
}

/**
 * Calculates stock difference (theoretical vs measured)
 */
export function calculateInventoryVariance(
  theoreticalStock: number,
  measuredStock: number
): { diffLiters: number; diffPct: number } {
  const diffLiters = measuredStock - theoreticalStock;
  const diffPct = theoreticalStock > 0 ? (diffLiters / theoreticalStock) * 100 : 0;
  return {
    diffLiters,
    diffPct: Math.round(diffPct * 100) / 100
  };
}

/**
 * Gives recommendation on criticality levels of sensor alerts
 */
export function parseAlertCriticality(level: 'info' | 'warning' | 'critical'): {
  colorClass: string;
  badgeClass: string;
  label: string;
} {
  switch (level) {
    case 'critical':
      return {
        colorClass: 'text-red-600 bg-red-50 border-red-200',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
        label: 'Crítica'
      };
    case 'warning':
      return {
        colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        label: 'Advertencia'
      };
    case 'info':
    default:
      return {
        colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Informativa'
      };
  }
}

/**
 * Classifies the level color based on status or signal RSSI
 */
export function parseRssiStrength(rssi: number): { label: string; color: string; percent: number } {
  if (rssi >= -65) return { label: 'Excelente', color: 'text-emerald-500', percent: 100 };
  if (rssi >= -75) return { label: 'Buena', color: 'text-teal-500', percent: 75 };
  if (rssi >= -85) return { label: 'Regular', color: 'text-amber-500', percent: 45 };
  return { label: 'Deficiente / Crítica', color: 'text-red-500', percent: 15 };
}

/**
 * Helper to display battery health styling
 */
export function parseBatteryStatus(percent: number): { color: string; label: string } {
  if (percent > 60) return { color: 'text-emerald-500', label: 'Excelente' };
  if (percent > 20) return { color: 'text-amber-500', label: 'Baja' };
  return { color: 'text-red-500', label: 'Reemplazo Crítico' };
}

/**
 * Assigns a stable random-looking hex color based on the product ID or name
 */
export function getProductColorHex(productId: string): string {
  if (!productId) return '#0d9488'; // teal-600 default
  
  // Stable color array that looks beautiful, distinct and vibrant
  const colors = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
    '#14b8a6', // teal-500
    '#22c55e', // green-500
    '#a855f7', // purple-500
    '#0d9488', // teal-600
    '#6366f1', // indigo-500
  ];
  
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

