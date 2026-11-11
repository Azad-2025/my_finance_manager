import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types/finance';
import { formatDate } from './formatters';

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
