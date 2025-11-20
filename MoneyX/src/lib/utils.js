import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in BDT
 */
export function formatCurrency(amount, showSymbol = true) {
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return showSymbol ? `৳${formatted}` : formatted;
}

/**
 * Format date to readable string
 */
export function formatDate(date, format = 'long') {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : date.toDate();
  
  if (format === 'short') {
    return new Intl.DateTimeFormat('en-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(dateObj);
  }
  
  if (format === 'time') {
    return new Intl.DateTimeFormat('en-BD', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Get month key for database queries (e.g., "2025-11")
 */
export function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get month name from month key
 */
export function getMonthName(monthKey) {
  const [year, month] = monthKey.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return new Intl.DateTimeFormat('en-BD', { 
    month: 'long', 
    year: 'numeric' 
  }).format(date);
}

/**
 * Parse month key to year and month numbers
 */
export function parseMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
}

/**
 * Get previous month key
 */
export function getPreviousMonthKey(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

/**
 * Get next month key
 */
export function getNextMonthKey(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if date is today
 */
export function isToday(date) {
  const today = new Date();
  const checkDate = date instanceof Date ? date : date.toDate();
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

/**
 * Get start of day timestamp
 */
export function getStartOfDay(date = new Date()) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Get end of day timestamp
 */
export function getEndOfDay(date = new Date()) {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}