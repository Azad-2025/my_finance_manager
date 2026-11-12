import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Transaction,
  SalaryAdvance,
  SalaryAdjustment,
  Borrowing,
  BorrowingRepayment,
  Lending,
  LendingCollection,
} from '../types/finance';
import { formatDate } from './formatters';
import { getSavedUserProfile } from '../lib/supabase';

export interface PDFExportOptions {
  periodTitle?: string;
  totalExpense: number;
  totalReimbursed: number;
  pendingReimbursement: number;
}

/**
 * Format numbers as BDT string for PDF output
 */
function formatCurrency(amount: number): string {
  return 'BDT ' + Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Generates and downloads a clean, branded PDF report for Office Expenses
 */
export function exportOfficeExpensesToPDF(
  expenses: Transaction[],
  summary: PDFExportOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  
  // Format current date & time in Dhaka timezone (UTC+6)
  const generatedAt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MY FINANCE MANAGER', 14, 12);

  // Subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('OFFICE EXPENSES & REIMBURSEMENT REPORT', 14, 19);

  // Generation Date on Right
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${generatedAt} (BST)`, pageWidth - 14, 19, { align: 'right' });

  // 2. Summary KPI Box
  const summaryTop = 34;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, summaryTop, pageWidth - 28, 24, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 4;

  // KPI 1: Total Office Expenses
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL OFFICE EXPENSES', 18, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(formatCurrency(summary.totalExpense), 18, summaryTop + 17);

  // KPI 2: Total Reimbursed
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL REIMBURSED', 18 + colWidth, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(formatCurrency(summary.totalReimbursed), 18 + colWidth, summaryTop + 17);

  // KPI 3: Pending Receivable
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('PENDING RECEIVABLE', 18 + colWidth * 2, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(formatCurrency(summary.pendingReimbursement), 18 + colWidth * 2, summaryTop + 17);

  // KPI 4: Period / Scope
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT PERIOD', 18 + colWidth * 3, summaryTop + 8);
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(summary.periodTitle || 'All Time', 18 + colWidth * 3, summaryTop + 17);

  // 3. Transactions Table
  const tableData = expenses.map((tx, idx) => {
    const reimbursed = Number(tx.reimbursed_amount || 0);
    const pending = Math.max(0, Number(tx.amount || 0) - reimbursed);
    return [
      (idx + 1).toString(),
      formatDate(tx.date),
      tx.description || '-',
      tx.category || 'Office',
      tx.project_name || '-',
      tx.payment_method || '-',
      formatCurrency(tx.amount),
      formatCurrency(reimbursed),
      formatCurrency(pending),
      tx.reimbursement_status || 'Not Submitted',
    ];
  });

  autoTable(doc, {
    startY: summaryTop + 30,
    head: [[
      '#',
      'Date',
      'Description',
      'Category',
      'Project',
      'Paid Via',
      'Amount',
      'Reimbursed',
      'Pending',
      'Status',
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [217, 119, 6] },
      9: { cellWidth: 22, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = 'Page ' + doc.internal.pages.length + ' · Confidential Financial Statement';
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        str,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    },
  });

  // Generate safe filename with date
  const dateStr = now.toISOString().slice(0, 10);
  const fileName = `Office_Expenses_${summary.periodTitle ? summary.periodTitle.replace(/\s+/g, '_') : 'Report'}_${dateStr}.pdf`;
  doc.save(fileName);
}

export interface SalaryAdvancePDFOptions {
  employeeName?: string;
  employeePhone?: string;
  totalAdvanceReceived: number;
  totalSalaryAdjusted: number;
  outstandingAdvance: number;
  salaryMonthFilter?: string;
}

/**
 * Generates and downloads an official, professional PDF statement for Salary Advances and Adjustments.
 * Enables the employee to show exactly how much advance was received, how much was deducted,
 * and the remaining balance with complete itemized history and authorization signature blocks.
 */
export function exportSalaryAdvanceStatementToPDF(
  advances: SalaryAdvance[],
  adjustments: SalaryAdjustment[],
  options: SalaryAdvancePDFOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();

  // Retrieve employee details from saved profile or options
  const profile = getSavedUserProfile();
  const employeeName = options.employeeName || profile.name || 'Employee';
  const employeePhone = options.employeePhone || profile.phone || '';

  // Format date in Asia/Dhaka (UTC+6)
  const generatedAt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  // 1. Header Banner (Deep Slate with Emerald Accent)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Emerald highlight bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Brand & Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('MY FINANCE MANAGER', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(209, 250, 229); // emerald-100
  doc.text('SALARY ADVANCE & SETTLEMENT STATEMENT', 14, 19);

  // Employee & Date info on Header Right
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Employee: ${employeeName}`, pageWidth - 14, 12, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  const metaLine = `${employeePhone ? employeePhone + ' · ' : ''}Generated: ${generatedAt} (BST)`;
  doc.text(metaLine, pageWidth - 14, 19, { align: 'right' });

  // 2. Summary KPI Box
  const summaryTop = 36;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, summaryTop, pageWidth - 28, 24, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 3;

  // KPI 1: Total Advance Received
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL ADVANCE RECEIVED', 18, summaryTop + 8);
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(formatCurrency(options.totalAdvanceReceived), 18, summaryTop + 17);

  // KPI 2: Total Salary Adjusted
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL SALARY ADJUSTED', 18 + colWidth, summaryTop + 8);
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(formatCurrency(options.totalSalaryAdjusted), 18 + colWidth, summaryTop + 17);

  // KPI 3: Outstanding Advance Balance
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('OUTSTANDING ADVANCE BALANCE', 18 + colWidth * 2, summaryTop + 8);
  doc.setFontSize(12);
  if (options.outstandingAdvance > 0) {
    doc.setTextColor(217, 119, 6); // amber-600
  } else {
    doc.setTextColor(16, 185, 129); // emerald-500
  }
  doc.text(formatCurrency(options.outstandingAdvance), 18 + colWidth * 2, summaryTop + 17);

  // 3. Section 1: Salary Advances Received Table
  let currentY = summaryTop + 30;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Itemized Salary Advances Received from Office', 14, currentY);

  const advancesTableData = advances.map((adv, idx) => [
    (idx + 1).toString(),
    formatDate(adv.date),
    adv.purpose || 'Salary Advance',
    adv.received_from || 'Office Manager',
    adv.payment_method || 'Cash',
    formatCurrency(adv.amount),
  ]);

  if (advancesTableData.length === 0) {
    advancesTableData.push(['-', '-', 'No advances recorded', '-', '-', formatCurrency(0)]);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Date', 'Purpose / Note', 'Received From', 'Payment Method', 'Advance Amount']],
    body: advancesTableData,
    foot: [[
      '',
      '',
      'Total Advance Received',
      '',
      '',
      formatCurrency(options.totalAdvanceReceived),
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 32 },
      4: { cellWidth: 24 },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 25 },
  });

  // 4. Section 2: Salary Deductions / Adjustments Table
  const lastAutoTable = (doc as any).lastAutoTable;
  currentY = lastAutoTable ? lastAutoTable.finalY + 10 : currentY + 40;

  // If page would overflow, add page
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Monthly Salary Deductions & Payroll Adjustments', 14, currentY);

  const adjustmentsTableData = adjustments.map((adj, idx) => [
    (idx + 1).toString(),
    formatDate(adj.adjustment_date),
    adj.salary_month || '-',
    adj.notes || 'Monthly salary adjustment',
    formatCurrency(adj.amount),
  ]);

  if (adjustmentsTableData.length === 0) {
    adjustmentsTableData.push(['-', '-', 'No monthly deductions recorded yet', '-', formatCurrency(0)]);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [['#', 'Adjustment Date', 'Salary Month', 'Notes / Voucher Ref', 'Deducted Amount']],
    body: adjustmentsTableData,
    foot: [[
      '',
      '',
      'Total Salary Adjusted',
      '',
      formatCurrency(options.totalSalaryAdjusted),
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [5, 150, 105], // emerald-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [5, 150, 105],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'right',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 35 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 35 },
  });

  // 5. Net Settlement Summary & Signatures Block
  const finalTable = (doc as any).lastAutoTable;
  let signatureY = finalTable ? finalTable.finalY + 12 : currentY + 35;

  if (signatureY > pageHeight - 45) {
    doc.addPage();
    signatureY = 25;
  }

  // Net Balance Callout Box
  doc.setFillColor(options.outstandingAdvance > 0 ? 254 : 240, options.outstandingAdvance > 0 ? 243 : 253, options.outstandingAdvance > 0 ? 199 : 244); // amber-50 or emerald-50
  doc.setDrawColor(options.outstandingAdvance > 0 ? 245 : 167, options.outstandingAdvance > 0 ? 158 : 243, options.outstandingAdvance > 0 ? 11 : 208); // amber-500 or emerald-500
  doc.roundedRect(14, signatureY, pageWidth - 28, 14, 1.5, 1.5, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const statusNote = options.outstandingAdvance > 0
    ? `NET REMAINING ADVANCE OWED TO COMPANY: ${formatCurrency(options.outstandingAdvance)} (Payable from subsequent salary)`
    : 'ALL ADVANCES FULLY SETTLED & RECONCILED. NO OUTSTANDING BALANCE.';
  doc.text(statusNote, pageWidth / 2, signatureY + 8.5, { align: 'center' });

  // Signature Block
  const sigLineY = signatureY + 28;
  if (sigLineY <= pageHeight - 15) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');

    // Employee Signature
    doc.line(20, sigLineY, 75, sigLineY);
    doc.text('Employee Signature', 47.5, sigLineY + 5, { align: 'center' });
    doc.text(employeeName, 47.5, sigLineY + 9, { align: 'center' });

    // Approver / Accounts Signature
    doc.line(pageWidth - 75, sigLineY, pageWidth - 20, sigLineY);
    doc.text('Authorized Office Accounts / HR', pageWidth - 47.5, sigLineY + 5, { align: 'center' });
    doc.text('Signature & Date', pageWidth - 47.5, sigLineY + 9, { align: 'center' });
  }

  // Footer for each page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages} · Official Salary Advance & Adjustment Statement · Confidential`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Safe filename
  const dateStr = now.toISOString().slice(0, 10);
  const cleanName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Salary_Advance_Statement_${cleanName}_${dateStr}.pdf`;
  doc.save(fileName);
}

// ============================================================================
// LOANS & DEBTS HUB PDF EXPORTS
// ============================================================================

export interface MoneyLentPDFOptions {
  periodTitle?: string;
  totalLent: number;
  totalCollected: number;
  remainingReceivable: number;
}

/**
 * Generates and downloads Money Lent Report (যে টাকা আমি অন্যকে ধার দিয়েছি)
 * Displays itemized money lent records, collection history, and outstanding receivables.
 */
export function exportMoneyLentReportToPDF(
  records: Lending[],
  collections: LendingCollection[],
  options: MoneyLentPDFOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const profile = getSavedUserProfile();

  const generatedAt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  // 1. Header Banner (Deep Slate with Blue Accent for Lent Money)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('MY FINANCE MANAGER', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254); // blue-200
  doc.text('MONEY LENT REPORT & RECEIVABLES STATEMENT (ধার দেওয়া হিসাব)', 14, 19);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Account Holder: ${profile.name || 'Owner'}`, pageWidth - 14, 12, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const metaLine = `${profile.phone ? profile.phone + ' · ' : ''}Generated: ${generatedAt} (BST)`;
  doc.text(metaLine, pageWidth - 14, 19, { align: 'right' });

  // 2. Summary KPI Box
  const summaryTop = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, summaryTop, pageWidth - 28, 24, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 4;

  // KPI 1: Total Lent
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL MONEY LENT', 18, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(formatCurrency(options.totalLent), 18, summaryTop + 17);

  // KPI 2: Total Collected Back
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL COLLECTED BACK', 18 + colWidth, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(formatCurrency(options.totalCollected), 18 + colWidth, summaryTop + 17);

  // KPI 3: Remaining Receivable
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('REMAINING RECEIVABLE', 18 + colWidth * 2, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(formatCurrency(options.remainingReceivable), 18 + colWidth * 2, summaryTop + 17);

  // KPI 4: Scope / Filter
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('FILTERED PERIOD', 18 + colWidth * 3, summaryTop + 8);
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(options.periodTitle || 'All Records', 18 + colWidth * 3, summaryTop + 17);

  // 3. Section 1: Itemized Money Lent Table
  let currentY = summaryTop + 30;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Itemized Money Lent Records (যে টাকা অন্যকে ধার দেওয়া হয়েছে)', 14, currentY);

  const tableData = records.map((l, idx) => {
    const remaining = Math.max(0, l.amount - (l.collected_amount || 0));
    return [
      (idx + 1).toString(),
      formatDate(l.lending_date),
      l.person_name,
      l.payment_method || 'Cash',
      l.purpose || '-',
      formatCurrency(l.amount),
      formatCurrency(l.collected_amount || 0),
      formatCurrency(remaining),
      l.status,
    ];
  });

  if (tableData.length === 0) {
    tableData.push(['-', '-', 'No money lent records found', '-', '-', formatCurrency(0), formatCurrency(0), formatCurrency(0), '-']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [[
      '#',
      'Date',
      "Borrower's Name",
      'Method',
      'Purpose / Notes',
      'Lent (BDT)',
      'Collected',
      'Remaining',
      'Status',
    ]],
    body: tableData,
    foot: [[
      '',
      '',
      'Total',
      '',
      '',
      formatCurrency(options.totalLent),
      formatCurrency(options.totalCollected),
      formatCurrency(options.remainingReceivable),
      '',
    ]],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [30, 58, 138], // blue-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 58, 138],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 16 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [217, 119, 6] },
      8: { cellWidth: 22, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 25 },
  });

  // 4. Section 2: Collection Installments History (if available)
  const lastTable = (doc as any).lastAutoTable;
  currentY = lastTable ? lastTable.finalY + 10 : currentY + 40;

  if (collections.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. Installment Collection Receipts (আদায়কৃত কিস্তির বিবরণ)', 14, currentY);

    const colTableData = collections.map((c, idx) => {
      const parentLending = records.find((l) => l.id === c.lending_id);
      return [
        (idx + 1).toString(),
        formatDate(c.collection_date),
        parentLending ? parentLending.person_name : 'Lent Loan',
        c.payment_method || 'Cash',
        c.notes || 'Collection receipt',
        formatCurrency(c.amount),
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['#', 'Collection Date', 'Collected From', 'Method', 'Notes / Ref', 'Amount (BDT)']],
      body: colTableData,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [5, 150, 105], // emerald-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 35, fontStyle: 'bold' },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14, bottom: 30 },
    });
  }

  // Signatures Block
  const finalTable = (doc as any).lastAutoTable;
  let signatureY = finalTable ? finalTable.finalY + 14 : currentY + 35;
  if (signatureY > pageHeight - 35) {
    doc.addPage();
    signatureY = 25;
  }

  const sigLineY = signatureY + 16;
  if (sigLineY <= pageHeight - 12) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    doc.line(20, sigLineY, 75, sigLineY);
    doc.text('Lender Signature', 47.5, sigLineY + 5, { align: 'center' });
    doc.text(profile.name || 'Account Holder', 47.5, sigLineY + 9, { align: 'center' });

    doc.line(pageWidth - 75, sigLineY, pageWidth - 20, sigLineY);
    doc.text('Borrower / Witness Acknowledgment', pageWidth - 47.5, sigLineY + 5, { align: 'center' });
    doc.text('Signature & Date', pageWidth - 47.5, sigLineY + 9, { align: 'center' });
  }

  // Footer for each page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages} · Official Money Lent Statement · My Finance Manager`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const dateStr = now.toISOString().slice(0, 10);
  const fileName = `Money_Lent_Report_${dateStr}.pdf`;
  doc.save(fileName);
}

export interface MoneyBorrowedPDFOptions {
  periodTitle?: string;
  totalBorrowed: number;
  totalRepaid: number;
  remainingDebt: number;
}

/**
 * Generates and downloads Money Borrowed & Repaid Report (ধার নেওয়া ও পরিশোধের হিসাব)
 * Clearly separates borrowed liabilities and repayments, showing net remaining debt.
 */
export function exportBorrowedAndRepaidReportToPDF(
  borrowings: Borrowing[],
  repayments: BorrowingRepayment[],
  options: MoneyBorrowedPDFOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const profile = getSavedUserProfile();

  const generatedAt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  // 1. Header Banner (Deep Slate with Orange/Amber Accent for Borrowed Money)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setFillColor(234, 88, 12); // orange-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('MY FINANCE MANAGER', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 215, 170); // orange-200
  doc.text('MONEY BORROWED & REPAID STATEMENT (ধার নেওয়া ও পরিশোধের বিবরণী)', 14, 19);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Borrower: ${profile.name || 'Owner'}`, pageWidth - 14, 12, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const metaLine = `${profile.phone ? profile.phone + ' · ' : ''}Generated: ${generatedAt} (BST)`;
  doc.text(metaLine, pageWidth - 14, 19, { align: 'right' });

  // 2. Summary KPI Box
  const summaryTop = 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, summaryTop, pageWidth - 28, 24, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 4;

  // KPI 1: Total Borrowed
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL BORROWED (GROSS)', 18, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12); // orange-600
  doc.text(formatCurrency(options.totalBorrowed), 18, summaryTop + 17);

  // KPI 2: Total Repaid
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL REPAID TO DATE', 18 + colWidth, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(formatCurrency(options.totalRepaid), 18 + colWidth, summaryTop + 17);

  // KPI 3: Remaining Debt
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('REMAINING DEBT (LIABILITY)', 18 + colWidth * 2, summaryTop + 8);
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38); // red-600
  doc.text(formatCurrency(options.remainingDebt), 18 + colWidth * 2, summaryTop + 17);

  // KPI 4: Scope / Filter
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('FILTERED PERIOD', 18 + colWidth * 3, summaryTop + 8);
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(options.periodTitle || 'All Records', 18 + colWidth * 3, summaryTop + 17);

  // 3. Section 1: Itemized Borrowed Records Table
  let currentY = summaryTop + 30;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Itemized Borrowed Money Records (যে টাকা ধার নেওয়া হয়েছে)', 14, currentY);

  const tableData = borrowings.map((b, idx) => {
    const remaining = Math.max(0, b.amount - (b.repaid_amount || 0));
    return [
      (idx + 1).toString(),
      formatDate(b.borrowed_date),
      b.person_name,
      b.payment_method || 'Cash',
      b.purpose || '-',
      formatCurrency(b.amount),
      formatCurrency(b.repaid_amount || 0),
      formatCurrency(remaining),
      b.status,
    ];
  });

  if (tableData.length === 0) {
    tableData.push(['-', '-', 'No borrowing records found', '-', '-', formatCurrency(0), formatCurrency(0), formatCurrency(0), '-']);
  }

  autoTable(doc, {
    startY: currentY + 3,
    head: [[
      '#',
      'Date',
      "Lender's Name",
      'Method',
      'Purpose / Notes',
      'Borrowed (BDT)',
      'Repaid',
      'Remaining Debt',
      'Status',
    ]],
    body: tableData,
    foot: [[
      '',
      '',
      'Total',
      '',
      '',
      formatCurrency(options.totalBorrowed),
      formatCurrency(options.totalRepaid),
      formatCurrency(options.remainingDebt),
      '',
    ]],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [154, 52, 18], // orange-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [154, 52, 18],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 16 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
      8: { cellWidth: 22, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 25 },
  });

  // 4. Section 2: Repayment Installments History Table
  const lastTable = (doc as any).lastAutoTable;
  currentY = lastTable ? lastTable.finalY + 10 : currentY + 40;

  if (repayments.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. Installment Repayment Vouchers (ঋণ পরিশোধের ভাউচারসমূহ)', 14, currentY);

    const repTableData = repayments.map((r, idx) => {
      const parentBorrowing = borrowings.find((b) => b.id === r.borrowing_id);
      return [
        (idx + 1).toString(),
        formatDate(r.payment_date),
        parentBorrowing ? parentBorrowing.person_name : 'Debt Loan',
        'Repaid (পরিশোধ)',
        r.payment_method || 'bKash',
        r.notes || 'Installment repayment',
        formatCurrency(r.amount),
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['#', 'Repayment Date', 'Repaid To', 'Type', 'Method', 'Notes / Ref', 'Amount (BDT)']],
      body: repTableData,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [5, 150, 105], // emerald-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 32, fontStyle: 'bold' },
        3: { cellWidth: 24 },
        4: { cellWidth: 20 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14, bottom: 30 },
    });
  }

  // Signatures Block
  const finalTable = (doc as any).lastAutoTable;
  let signatureY = finalTable ? finalTable.finalY + 14 : currentY + 35;
  if (signatureY > pageHeight - 35) {
    doc.addPage();
    signatureY = 25;
  }

  const sigLineY = signatureY + 16;
  if (sigLineY <= pageHeight - 12) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    doc.line(20, sigLineY, 75, sigLineY);
    doc.text('Borrower Signature', 47.5, sigLineY + 5, { align: 'center' });
    doc.text(profile.name || 'Account Holder', 47.5, sigLineY + 9, { align: 'center' });

    doc.line(pageWidth - 75, sigLineY, pageWidth - 20, sigLineY);
    doc.text('Lender / Accounts Acknowledgment', pageWidth - 47.5, sigLineY + 5, { align: 'center' });
    doc.text('Signature & Date', pageWidth - 47.5, sigLineY + 9, { align: 'center' });
  }

  // Footer for each page
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages} · Official Money Borrowed Statement · My Finance Manager`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const dateStr = now.toISOString().slice(0, 10);
  const fileName = `Money_Borrowed_And_Repaid_Report_${dateStr}.pdf`;
  doc.save(fileName);
}


