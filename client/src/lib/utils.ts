import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  
  if (absAmount >= 10000000) {
    const crores = absAmount / 10000000;
    return `${isNegative ? '-' : ''}₹${crores.toFixed(2)}Cr`;
  } else if (absAmount >= 100000) {
    const lakhs = absAmount / 100000;
    return `${isNegative ? '-' : ''}₹${lakhs.toFixed(2)}L`;
  } else {
    return `${isNegative ? '-' : ''}₹${absAmount.toLocaleString('en-IN')}`;
  }
}

export function formatINRDetailed(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatDate(date: Date | any, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } else if (format === 'long') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } else {
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function maskPAN(pan: string): string {
  if (pan.length !== 10) return pan;
  return `${pan.substring(0, 2)}XXXXX${pan.substring(7)}`;
}

export function maskAadhar(aadhar: string): string {
  const clean = aadhar.replace(/\s/g, '');
  if (clean.length !== 12) return aadhar;
  return `XXXX XXXX ${clean.substring(8)}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 10) return phone;
  return `XXXXXX${phone.slice(-4)}`;
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / 12 / 100;
  
  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }
  
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
               (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  return Math.round(emi);
}
