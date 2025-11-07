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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}
