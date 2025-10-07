// Currency utility functions for formatting amounts based on organization currency

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'en-EU',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    locale: 'en-CA',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    locale: 'en-AU',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    locale: 'zh-CN',
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    locale: 'pt-BR',
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    locale: 'es-MX',
  },
  LKR: {
    code: 'LKR',
    symbol: 'Rs.',
    name: 'Sri Lankan Rupee',
    locale: 'en-LK',
  },
};

/**
 * Get all supported currencies as an array
 */
export function getSupportedCurrencies(): CurrencyConfig[] {
  return Object.values(SUPPORTED_CURRENCIES);
}

/**
 * Format an amount using the organization's currency
 */
export function formatCurrency(
  amount: number | string,
  currencyCode: string = 'LKR',
  options: Intl.NumberFormatOptions = {}
): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return `${SUPPORTED_CURRENCIES[currencyCode]?.symbol || 'Rs.'}0.00`;
  }

  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.LKR;
  
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(numericAmount);
  } catch (error) {
    // Fallback to LKR formatting if currency is not supported
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(numericAmount);
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || 'Rs.';
}

/**
 * Get currency name for a given currency code
 */
export function getCurrencyName(currencyCode: string): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.name || 'Sri Lankan Rupee';
}

/**
 * Parse a currency string to a number
 */
export function parseCurrency(currencyString: string): number {
  if (typeof currencyString === 'number') {
    return currencyString;
  }
  
  // Remove currency symbols and formatting
  const cleanString = currencyString
    .replace(/[^\d.-]/g, '') // Remove all non-digit, non-decimal, non-minus characters
    .replace(/,/g, ''); // Remove commas
  
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format amount with compact notation (e.g., 1.2K, 1.5M)
 */
export function formatCurrencyCompact(
  amount: number | string,
  currencyCode: string = 'LKR'
): string {
  return formatCurrency(amount, currencyCode, {
    notation: 'compact',
    compactDisplay: 'short',
  });
}

/**
 * Check if a currency code is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return currencyCode in SUPPORTED_CURRENCIES;
}


