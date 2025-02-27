// Currency formats
export const CURRENCY_FORMATS = {
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
  
  export function formatPrice(price, currency = DEFAULT_CURRENCY) {
    if (typeof price === 'object') {
      return formatPriceWithCurrency(price.amount, price.currency);
    }
  
    const format = CURRENCY_FORMATS[currency];
    return formatPriceWithCurrency(price, currency);
  }
  
  function formatPriceWithCurrency(amount, currency) {
    const format = CURRENCY_FORMATS[currency];
    const formattedAmount = amount.toFixed(2)
      .replace('.', format.decimalSeparator)
      .replace(/\B(?=(\d{3})+(?!\d))/g, format.thousandSeparator);
    
    return format.position === 'before' 
      ? `${format.symbol}${formattedAmount}`
      : `${formattedAmount}${format.symbol}`;
  }
  
  export function parsePrice(text, currency = DEFAULT_CURRENCY) {
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