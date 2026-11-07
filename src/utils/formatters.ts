/**
 * Formats a number to Bangladeshi Taka (BDT / ৳)
 * Supports the South Asian numbering format (lakhs & crores)
 * e.g., 150000 -> ৳1,50,000
 */
export function formatBDT(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '৳0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // Format with standard 2 decimal places
  const [integerPart, decimalPart] = absAmount.toFixed(2).split('.');
  
  // Bangladeshi numbering system: last 3 digits, then groups of 2
  let result = '';
  if (integerPart.length <= 3) {
    result = integerPart;
  } else {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const remaining = integerPart.substring(0, integerPart.length - 3);
    
    // Group remaining digits in twos from right to left
    const grouped = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    result = `${grouped},${lastThree}`;
  }

  const formatted = decimalPart === '00' ? result : `${result}.${decimalPart}`;
  return `${isNegative ? '-' : ''}৳${formatted}`;
}

/**
 * Format date for Asia/Dhaka or user locale
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Today's date string YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
