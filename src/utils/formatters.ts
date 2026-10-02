/**
 * Format number into Indonesian Rupiah (e.g., Rp 1.500.000)
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = absAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
}

export const formatCurrency = formatRupiah;

/**
 * Format raw number string for input fields with thousand separators
 */
export function formatNumberWithDots(val: number | string): string {
  if (val === '' || val === null || val === undefined) return '';
  const clean = val.toString().replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parse numeric value from dotted input (e.g., "1.500.000" -> 1500000)
 */
export function parseNumberFromDots(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/\./g, '').replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
}

/**
 * Format YYYY-MM-DD to Indonesian human date
 */
export function formatIndoDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${day} ${months[(month - 1) || 0]} ${year}`;
}

/**
 * Format relative date (Hari Ini, Kemarin, or Indonesian date)
 */
export function formatRelativeDate(dateStr: string): { label: string; fullDate: string } {
  if (!dateStr) return { label: '', fullDate: '' };
  const today = new Date();
  const todayStr = getTodayDateString(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getTodayDateString(yesterday);

  const fullDate = formatIndoDate(dateStr);

  if (dateStr === todayStr) {
    return { label: 'Hari Ini', fullDate };
  } else if (dateStr === yesterdayStr) {
    return { label: 'Kemarin', fullDate };
  }
  return { label: fullDate, fullDate };
}

/**
 * Get YYYY-MM-DD from Date
 */
export function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get YYYY-MM from Date
 */
export function getCurrentMonthString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format YYYY-MM to readable Indonesian Month (e.g. "September 2026")
 */
export function formatMonthName(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${months[(month - 1) || 0]} ${year}`;
}

/**
 * Shift month string by delta (e.g. +1 or -1)
 */
export function shiftMonthString(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return getCurrentMonthString(date);
}

/**
 * Download CSV helper
 */
export function exportToCSV(filename: string, rows: string[][]): void {
  // UTF-8 BOM for Indonesian Excel compatibility
  const BOM = '\uFEFF';
  const csvContent = BOM + rows.map(e => e.map(field => `"${(field ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Check if color is light or dark for readable contrast text
 */
export function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  let color = hex.replace('#', '');
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }
  const r = parseInt(color.substring(0, 2), 16) || 0;
  const g = parseInt(color.substring(2, 4), 16) || 0;
  const b = parseInt(color.substring(4, 6), 16) || 0;
  // Perceived brightness formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150;
}
