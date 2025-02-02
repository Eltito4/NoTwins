import { CurrencyFormat } from './types';

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