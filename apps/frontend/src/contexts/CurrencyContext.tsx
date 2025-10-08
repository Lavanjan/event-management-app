import { createContext, useContext, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { formatCurrency, getCurrencySymbol, getCurrencyName } from '../utils/currency';

interface CurrencyContextType {
  currency: string;
  formatAmount: (amount: number | string, options?: Intl.NumberFormatOptions) => string;
  getCurrencySymbol: () => string;
  getCurrencyName: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { user } = useSelector((state: RootState) => state.auth);

  // Get currency from user's organization, fallback to LKR
  // @ts-ignore
  const currency = user?.organization?.currency || 'LKR';

  const formatAmount = (amount: number | string, options?: Intl.NumberFormatOptions) => {
    return formatCurrency(amount, currency, options);
  };

  const getSymbol = () => {
    return getCurrencySymbol(currency);
  };

  const getName = () => {
    return getCurrencyName(currency);
  };

  const value: CurrencyContextType = {
    currency,
    formatAmount,
    getCurrencySymbol: getSymbol,
    getCurrencyName: getName,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Hook for components that need currency formatting but might not have access to context
export function useCurrencyFormat(fallbackCurrency: string = 'LKR') {
  const { user } = useSelector((state: RootState) => state.auth);
  // @ts-ignore
  const currency = user?.organization?.currency || fallbackCurrency;

  const formatAmount = (amount: number | string, options?: Intl.NumberFormatOptions) => {
    return formatCurrency(amount, currency, options);
  };

  return {
    currency,
    formatAmount,
    getCurrencySymbol: () => getCurrencySymbol(currency),
    getCurrencyName: () => getCurrencyName(currency),
  };
}
