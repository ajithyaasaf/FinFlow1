import { jsPDF } from 'jspdf';
import type { Quotation } from '@shared/firestoreTypes';
import { formatINRDetailed, formatDate } from '@shared/utils';

export interface QuotationPDFOptions {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
}

export function generateQuotationPDF(
  quotation: Quotation,
  options: QuotationPDFOptions = {}
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const {
    companyName = 'FinFlow Finance Ltd.',
    companyAddress = 'Mumbai, Maharashtra, India',
    companyPhone = '+91 22 1234 5678',
    companyEmail = 'info@finflow.com',
  } = options;

  let yPos = 20;
  
  doc.setFillColor(21, 72, 114);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, pageWidth / 2, 28, { align: 'center' });
  doc.text(`${companyPhone} | ${companyEmail}`, pageWidth / 2, 34, { align: 'center' });
  
  yPos = 55;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAN QUOTATION', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quotation No: ${quotation.quotationNumber}`, 20, yPos);
  doc.text(`Date: ${formatDate(quotation.createdAt, 'short')}`, pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Client Details', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${quotation.clientName}`, 25, yPos);
  yPos += 6;
  doc.text(`Client ID: ${quotation.clientId}`, 25, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Agent Details', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${quotation.agentName}`, 25, yPos);
  yPos += 6;
  doc.text(`Agent ID: ${quotation.agentId}`, 25, yPos);
  
  yPos += 15;
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Loan Details', 20, yPos);
  yPos += 10;
  
  const loanDetails = [
    ['Loan Type', quotation.loanType.charAt(0).toUpperCase() + quotation.loanType.slice(1)],
    ['Loan Amount', formatINRDetailed(quotation.loanAmount)],
    ['Interest Rate', `${quotation.interestRate}% per annum`],
    ['Tenure', `${quotation.tenure} months (${Math.floor(quotation.tenure / 12)} years ${quotation.tenure % 12} months)`],
    ['Processing Fee', quotation.processingFee ? formatINRDetailed(quotation.processingFee) : 'As per policy'],
    ['Monthly EMI', formatINRDetailed(quotation.emi || 0)],
  ];
  
  doc.setFontSize(10);
  const startX = 25;
  const colWidth = (pageWidth - 50) / 2;
  
  loanDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', startX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, startX + colWidth, yPos);
    yPos += 7;
  });
  
  yPos += 10;
  const totalAmount = (quotation.emi || 0) * quotation.tenure;
  const totalInterest = totalAmount - quotation.loanAmount;
  
  doc.setFillColor(245, 247, 250);
  doc.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total Interest Payable:', startX, yPos + 3);
  doc.text(formatINRDetailed(totalInterest), startX + colWidth, yPos + 3);
  yPos += 8;
  doc.setFontSize(12);
  doc.text('Total Amount Payable:', startX, yPos + 3);
  doc.text(formatINRDetailed(totalAmount), startX + colWidth, yPos + 3);
  
  yPos += 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('Terms & Conditions:', 20, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  const terms = [
    '1. This quotation is valid for 30 days from the date of issue.',
    '2. Final loan approval is subject to credit assessment and documentation.',
    '3. Interest rates are subject to change as per RBI guidelines.',
    '4. Processing fees and other charges are non-refundable.',
    '5. Loan disbursement will be done after completion of all formalities.',
  ];
  
  terms.forEach(term => {
    const lines = doc.splitTextToSize(term, pageWidth - 45);
    lines.forEach((line: string) => {
      doc.text(line, 25, yPos);
      yPos += 4;
    });
  });
  
  if (quotation.isHighValue) {
    yPos += 5;
    doc.setFillColor(255, 243, 205);
    doc.rect(20, yPos - 2, pageWidth - 40, 10, 'F');
    doc.setTextColor(197, 90, 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('⚠ HIGH-VALUE QUOTATION - Subject to additional approvals', pageWidth / 2, yPos + 3, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
  
  const footerY = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY, pageWidth - 20, footerY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Authorized Signature', 20, footerY + 8);
  doc.text('Client Signature', pageWidth - 20, footerY + 8, { align: 'right' });
  
  doc.setFontSize(7);
  doc.text(`Generated on ${formatDate(new Date(), 'full')}`, pageWidth / 2, footerY + 18, { align: 'center' });
  doc.text('This is a system-generated document', pageWidth / 2, footerY + 22, { align: 'center' });
  
  return doc;
}

export function generatePayslipPDF(
  payroll: any,
  employee: any
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 20;
  
  doc.setFillColor(21, 72, 114);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SALARY SLIP', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`For the month of ${getMonthName(payroll.month)} ${payroll.year}`, pageWidth / 2, 28, { align: 'center' });
  
  yPos = 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const employeeDetails = [
    ['Employee Name', payroll.employeeName],
    ['Employee ID', payroll.employeeId],
    ['Email', payroll.employeeEmail],
    ['Department', employee.branch || 'N/A'],
  ];
  
  employeeDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, yPos);
    yPos += 7;
  });
  
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Attendance Details', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Working Days: ${payroll.totalWorkingDays}`, 25, yPos);
  doc.text(`Days Present: ${payroll.daysPresent}`, 110, yPos);
  yPos += 6;
  doc.text(`Days Absent: ${payroll.daysAbsent}`, 25, yPos);
  
  yPos += 15;
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Earnings', 25, yPos);
  doc.text('Amount', pageWidth - 50, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Basic Salary', 30, yPos);
  doc.text(formatINRDetailed(payroll.basicSalary), pageWidth - 50, yPos);
  yPos += 7;
  
  const earnings = payroll.components.filter((c: any) => c.type === 'earning');
  earnings.forEach((component: any) => {
    doc.text(component.name, 30, yPos);
    doc.text(formatINRDetailed(component.amount), pageWidth - 50, yPos);
    yPos += 7;
  });
  
  yPos += 5;
  doc.line(25, yPos, pageWidth - 25, yPos);
  yPos += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Gross Salary', 30, yPos);
  doc.text(formatINRDetailed(payroll.grossSalary), pageWidth - 50, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Deductions', 25, yPos);
  yPos += 8;
  
  const deductions = payroll.components.filter((c: any) => c.type === 'deduction');
  doc.setFont('helvetica', 'normal');
  deductions.forEach((component: any) => {
    doc.text(component.name, 30, yPos);
    doc.text(formatINRDetailed(component.amount), pageWidth - 50, yPos);
    yPos += 7;
  });
  
  if (deductions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No deductions', 30, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 7;
  }
  
  yPos += 5;
  doc.line(25, yPos, pageWidth - 25, yPos);
  yPos += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total Deductions', 30, yPos);
  doc.text(formatINRDetailed(payroll.totalDeductions), pageWidth - 50, yPos);
  
  yPos += 15;
  doc.setFillColor(21, 72, 114);
  doc.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('NET SALARY', 30, yPos + 3);
  doc.text(formatINRDetailed(payroll.netSalary), pageWidth - 50, yPos + 3);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const footerY = doc.internal.pageSize.getHeight() - 25;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('This is a system-generated payslip and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated on ${formatDate(new Date(), 'full')}`, pageWidth / 2, footerY + 5, { align: 'center' });
  
  return doc;
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}
