/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number to liters format with thosands separators (e.g., 23.500 L)
 */
export function formatLiters(liters: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    maximumFractionDigits: 1
  }).format(liters) + ' L';
}

/**
 * Formats an amount into Argentine Pesos or default currency ($ 120.400,00)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats a ISO date string to readable format with hour option
 */
export function formatDate(dateStr: string, includeTime = true): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {})
  };
  return new Intl.DateTimeFormat('es-AR', options).format(date);
}

/**
 * Formats time from ISO string, returning only "HH:MM"
 */
export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Truncate strings with ellipses if over text limit
 */
export function truncate(text: string, limit = 30): string {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

/**
 * Resolves a driver's name from list of drivers checking by id, name, rfid or document
 */
export function resolveDriverName(driverId: string | undefined, drivers: any[]): string {
  if (!driverId) return 'Operador Especial';
  if (driverId === "DRV-AUTO" || driverId === "Sin asignar") return 'Sin asignar';

  const tDrvId = String(driverId).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const found = drivers.find((drv: any) => {
    const dId = String(drv.id).toLowerCase();
    const dName = String(drv.name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const dRfid = drv.rfidCard ? String(drv.rfidCard).toLowerCase() : (drv.rfid_card ? String(drv.rfid_card).toLowerCase() : "");
    const dDoc = drv.document ? String(drv.document).toLowerCase() : "";
    
    const cleanRfid = dRfid.replace(/[^a-z0-9]/g, '');
    const cleanDoc = dDoc.replace(/[^a-z0-9]/g, '');
    const cleanTxId = tDrvId.replace(/[^a-z0-9]/g, '');

    return dId === tDrvId || 
           dName === tDrvId || 
           dRfid === tDrvId || 
           dDoc === tDrvId ||
           dName.includes(tDrvId) ||
           tDrvId.includes(dName) ||
           (cleanRfid && cleanRfid === cleanTxId) ||
           (cleanDoc && cleanDoc === cleanTxId);
  });

  if (found) {
    if (found.document) {
      return `${found.name} (DNI ${found.document})`;
    }
    return found.name;
  }

  return driverId;
}
