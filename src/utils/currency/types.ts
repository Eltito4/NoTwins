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