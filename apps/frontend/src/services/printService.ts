import { api } from './api';

export interface PrinterConfig {
  name?: string;
  type?: 'usb' | 'network' | 'serial';
  interface?: string;
  characterSet?: string;
  removeSpecialCharacters?: boolean;
  replaceSpecialCharacters?: boolean;
  width?: number;
  timeout?: number;
}

export interface PrintSettings {
  paperWidth?: number;
  fontSize?: 'small' | 'normal' | 'large';
  includeLogo?: boolean;
  includeQrCode?: boolean;
  autoCut?: boolean;
  copies?: number;
  characterSet?: string;
  timeout?: number;
}

export interface PrintBillRequest {
  printerConfig?: PrinterConfig;
  printSettings?: PrintSettings;
  isReprint?: boolean;
  originalPrintId?: string;
}

export interface PrintBillResponse {
  success: boolean;
  data?: {
    printAuditId: string;
    receiptNumber: string;
    message: string;
    printDuration?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PrintHistoryItem {
  id: string;
  printType: string;
  printStatus: string;
  receiptNumber: string;
  printedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  printedAt: string;
  printDuration: string;
  isReprint: boolean;
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  canRetry: boolean;
}

export interface PrintHistoryResponse {
  success: boolean;
  data: {
    bookingId: string;
    printHistory: PrintHistoryItem[];
    total: number;
    page: number;
    limit: number;
  };
}

class PrintService {
  private baseUrl = '/bookings';

  async printBill(bookingId: string, request: PrintBillRequest = {}): Promise<PrintBillResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/${bookingId}/print-bill`, request);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Failed to connect to printer service',
          details: error,
        },
      };
    }
  }

  async reprintBill(bookingId: string, request: PrintBillRequest = {}): Promise<PrintBillResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/${bookingId}/reprint-bill`, {
        ...request,
        isReprint: true,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Failed to connect to printer service',
          details: error,
        },
      };
    }
  }

  async getPrintHistory(bookingId: string): Promise<PrintHistoryResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/${bookingId}/print-history`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch print history');
    }
  }

  async retryPrint(auditId: string): Promise<PrintBillResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/print-audits/${auditId}/retry`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Failed to retry print',
          details: error,
        },
      };
    }
  }

  // Utility methods for print configuration
  getDefaultPrintSettings(): PrintSettings {
    return {
      paperWidth: 48,
      fontSize: 'normal',
      includeLogo: false,
      includeQrCode: true,
      autoCut: true,
      copies: 1,
      characterSet: 'PC437_USA',
      timeout: 5000,
    };
  }

  getDefaultPrinterConfig(): PrinterConfig {
    return {
      name: 'XPrinter XP80T',
      type: 'network',
      interface: '192.168.1.100:9100',
      characterSet: 'PC437_USA',
      removeSpecialCharacters: false,
      replaceSpecialCharacters: true,
      width: 48,
      timeout: 5000,
    };
  }

  // Validation methods
  validatePrinterConfig(config: PrinterConfig): string[] {
    const errors: string[] = [];

    if (config.type === 'network' && config.interface) {
      const networkPattern = /^(\d{1,3}\.){3}\d{1,3}:\d+$/;
      if (!networkPattern.test(config.interface)) {
        errors.push('Network interface must be in format IP:PORT (e.g., 192.168.1.100:9100)');
      }
    }

    if (config.width && (config.width < 20 || config.width > 80)) {
      errors.push('Paper width must be between 20 and 80 characters');
    }

    if (config.timeout && (config.timeout < 1000 || config.timeout > 30000)) {
      errors.push('Timeout must be between 1000ms and 30000ms');
    }

    return errors;
  }

  validatePrintSettings(settings: PrintSettings): string[] {
    const errors: string[] = [];

    if (settings.copies && (settings.copies < 1 || settings.copies > 5)) {
      errors.push('Number of copies must be between 1 and 5');
    }

    if (settings.paperWidth && (settings.paperWidth < 20 || settings.paperWidth > 80)) {
      errors.push('Paper width must be between 20 and 80 characters');
    }

    return errors;
  }

  // Error handling utilities
  getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return 'An unknown error occurred';
  }

  getErrorCode(error: any): string {
    return error?.error?.code || 'UNKNOWN_ERROR';
  }

  isRetryableError(error: any): boolean {
    const retryableCodes = [
      'CONNECTION_FAILED',
      'TIMEOUT',
      'PRINTER_BUSY',
      'NETWORK_ERROR',
    ];
    
    return retryableCodes.includes(this.getErrorCode(error));
  }

  // Print status utilities
  getPrintStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

  getPrintStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'success':
        return '✓';
      case 'failed':
        return '✗';
      case 'pending':
        return '⏳';
      default:
        return '?';
    }
  }

  formatPrintDuration(duration: string | number): string {
    if (typeof duration === 'string') {
      return duration;
    }
    
    if (duration < 1000) {
      return `${duration}ms`;
    }
    
    return `${(duration / 1000).toFixed(2)}s`;
  }

  // Network printer discovery (placeholder for future implementation)
  async discoverNetworkPrinters(): Promise<PrinterConfig[]> {
    // This would implement network printer discovery
    // For now, return common network addresses
    const commonAddresses = [
      '192.168.1.100:9100',
      '192.168.1.101:9100',
      '192.168.0.100:9100',
      '192.168.0.101:9100',
    ];

    return commonAddresses.map((address, index) => ({
      name: `Network Printer ${index + 1}`,
      type: 'network' as const,
      interface: address,
      characterSet: 'PC437_USA',
      width: 48,
      timeout: 5000,
    }));
  }
}

export const printService = new PrintService();
