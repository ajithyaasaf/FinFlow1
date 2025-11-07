export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRDetailed(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)}K`;
  }
  return `₹${amount.toFixed(0)}`;
}

export function parseINR(formattedAmount: string): number {
  return parseFloat(formattedAmount.replace(/[₹,]/g, ''));
}

export function formatIndianNumber(num: number): string {
  const parts = num.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';
  
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  
  const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree + decimalPart;
  return result;
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

export function generateLoanNumber(prefix: string = 'L'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

export function getFinancialYear(): { startDate: Date; endDate: Date } {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const fyStart = currentMonth >= 3 
    ? new Date(currentYear, 3, 1) 
    : new Date(currentYear - 1, 3, 1);
  
  const fyEnd = currentMonth >= 3 
    ? new Date(currentYear + 1, 2, 31) 
    : new Date(currentYear, 2, 31);
  
  return { startDate: fyStart, endDate: fyEnd };
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function getFileExtension(fileName: string): string {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
}

export function isValidPAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

export function isValidAadhar(aadhar: string): boolean {
  const aadharRegex = /^\d{12}$/;
  return aadharRegex.test(aadhar.replace(/\s/g, ''));
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
