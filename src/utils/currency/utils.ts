import { CurrencyCode, Price } from './types';
import { CURRENCY_FORMATS, DEFAULT_CURRENCY } from './constants';

export function formatPrice(price: number | Price): string {
  if (typeof price === 'number') {
    // Default to EUR for backward compatibility
    return formatPriceWithCurrency(price, DEFAULT_CURRENCY);
  }

  const format = CURRENCY_FORMATS[price.currency];
  return formatPriceWithCurrency(price.amount, price.currency);
}

function formatPriceWithCurrency(amount: number, currency: CurrencyCode): string {
  const format = CURRENCY_FORMATS[currency];
  const formattedAmount = amount.toFixed(2)
    .replace('.', format.decimalSeparator)
    .replace(/\B(?=(\d{3})+(?!\d))/g, format.thousandSeparator);
  
  return format.position === 'before' 
    ? `${format.symbol}${formattedAmount}`
    : `${formattedAmount}${format.symbol}`;
}

export function parsePrice(text: string, currency: CurrencyCode = DEFAULT_CURRENCY): Price | null {
  if (!text) return null;

  const format = CURRENCY_FORMATS[currency];
  
  // Remove currency symbols and normalize separators
  const normalized = text
    .replace(/[€$£¥]/g, '')
    .replace(format.thousandSeparator, '')
    .replace(format.decimalSeparator, '.')
    .replace(/[^\d.]/g, '')
    .trim();

  const amount = parseFloat(normalized);
  return isNaN(amount) ? null : { amount, currency };
}