import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency?: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
}

/**
 * Clean currency string specifically for jsPDF / PDF exports
 * Standard jsPDF default fonts (Helvetica/Times) do not have the Unicode ₹ (U+20B9) glyph,
 * causing it to render as '¹ 4 8 . 0' or garbled characters. Using 'Rs. ' or 'INR ' guarantees perfect PDF rendering!
 */
export function formatCurrencyForPDF(amount: number): string {
  try {
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);
    return `Rs. ${formatted}`;
  } catch {
    return `Rs. ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getDaysRemaining(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusBadgeInfo(expiryDate: string, currentStatus?: string) {
  if (currentStatus === 'cancelled') {
    return { label: 'Cancelled', color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300' };
  }
  const days = getDaysRemaining(expiryDate);
  if (days < 0) {
    return { label: `Expired (${Math.abs(days)}d ago)`, color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400' };
  }
  if (days <= 7) {
    return { label: `Critical (${days}d left)`, color: 'bg-red-50 text-red-700 border-red-200 animate-pulse dark:bg-red-950/50 dark:text-red-400' };
  }
  if (days <= 30) {
    return { label: `Expiring Soon (${days}d)`, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400' };
  }
  return { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400' };
}
