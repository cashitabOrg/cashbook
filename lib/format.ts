export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₦0.00';
  const num = typeof amount === 'string' ? parseFloat(amount.toString().replace(/,/g, '')) : amount;
  if (isNaN(num)) return '₦0.00';
  
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  
  return `₦${formattedNumber}`;
}
