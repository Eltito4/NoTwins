export type CurrencyCode = 'EUR' | 'USD';

export interface CurrencyFormat {
  code: CurrencyCode;
  symbol: string;
  position: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
}

export interface Price {
  amount: number;
  currency: CurrencyCode;
}

export const CURRENCY_FORMATS: Record<string, CurrencyFormat> = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    position: 'after',
    decimalSeparator: ',',
    thousandSeparator: '.'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    position: 'before',
    decimalSeparator: '.',
    thousandSeparator: ','
  }
};

export const DEFAULT_CURRENCY = 'EUR';

export function formatPrice(price: number | Price): string {
  if (typeof price === 'number') {
    // Default to EUR for backward compatibility
    return formatPriceWithCurrency(price, DEFAULT_CURRENCY);
  }

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

// Helper functions for date formatting
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper functions for sharing
export async function handleShare(shareId: string): Promise<void> {
  const shareUrl = `${window.location.origin}/join/${shareId}`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join Event',
        text: `Join my event using the event ID: ${shareId}`,
        url: shareUrl
      });
    } catch (err) {
      await copyToClipboard(shareUrl);
    }
  } else {
    await copyToClipboard(shareUrl);
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    throw new Error('Failed to copy to clipboard');
  }
}