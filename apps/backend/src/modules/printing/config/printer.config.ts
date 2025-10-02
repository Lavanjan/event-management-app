export interface PrinterConfig {
  name: string;
  type: 'usb' | 'network' | 'serial' | 'printer';
  interface: string; // USB device path, IP:PORT, or serial port
  characterSet?: string;
  removeSpecialCharacters?: boolean;
  replaceSpecialCharacters?: boolean;
  width?: number;
  timeout?: number;
}

export interface PrintSettings {
  paperWidth: number;
  fontSize: 'small' | 'normal' | 'large';
  includeLogo: boolean;
  includeQrCode: boolean;
  autoCut: boolean;
  copies: number;
  characterSet: string;
  timeout: number;
}

export const DEFAULT_PRINTER_CONFIGS: PrinterConfig[] = [
  {
    name: 'XPrinter XP80T Network (Working)',
    type: 'network',
    interface: '192.168.1.152:9100', // Your working IP address
    characterSet: 'PC437_USA',
    removeSpecialCharacters: false,
    width: 48, // 80mm paper width in characters
    timeout: 5000,
  },
  {
    name: 'XP-80C (Windows Printer)',
    type: 'printer',
    interface: 'XP-80C', // Windows printer name
    characterSet: 'PC437_USA',
    removeSpecialCharacters: false,
    width: 48,
    timeout: 5000,
  },
  {
    name: 'XPrinter XP80T USB (COM Port)',
    type: 'usb',
    interface: '\\\\.\\COM4', // Fallback COM port
    characterSet: 'PC437_USA',
    removeSpecialCharacters: false,
    width: 48,
    timeout: 5000,
  },
];

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperWidth: 48, // 80mm paper
  fontSize: 'normal',
  includeLogo: false, // Set to true when logo is available
  includeQrCode: true,
  autoCut: true,
  copies: 1,
  characterSet: 'PC437_USA',
  timeout: 5000,
};

export const PRINTER_ERROR_CODES = {
  PRINTER_NOT_FOUND: 'PRINTER_NOT_FOUND',
  PRINTER_OFFLINE: 'PRINTER_OFFLINE',
  PRINTER_BUSY: 'PRINTER_BUSY',
  PAPER_OUT: 'PAPER_OUT',
  COVER_OPEN: 'COVER_OPEN',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  INVALID_DATA: 'INVALID_DATA',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type PrinterErrorCode = typeof PRINTER_ERROR_CODES[keyof typeof PRINTER_ERROR_CODES];

export interface PrinterError extends Error {
  code: PrinterErrorCode;
  printerName?: string;
  details?: any;
}

export const RECEIPT_TEMPLATES = {
  HEADER: {
    COMPANY_NAME: 'EVENT BOOKING RECEIPT',
    SEPARATOR: '================================================',
    THIN_SEPARATOR: '------------------------------------------------',
  },
  SECTIONS: {
    BOOKING_DETAILS: 'BOOKING DETAILS',
    CUSTOMER_INFO: 'CUSTOMER INFORMATION',
    FINANCIAL_INFO: 'FINANCIAL SUMMARY',
    FOOTER: 'FOOTER',
  },
  FOOTER: {
    THANK_YOU: 'Thank you for choosing our services!',
    CONTACT: 'For support, contact us at support@invictainnovations.com',
  },
} as const;

export const ESC_POS_COMMANDS = {
  // Text formatting
  RESET: '\x1b@',
  BOLD_ON: '\x1b\x45\x01',
  BOLD_OFF: '\x1b\x45\x00',
  UNDERLINE_ON: '\x1b\x2d\x01',
  UNDERLINE_OFF: '\x1b\x2d\x00',
  DOUBLE_HEIGHT_ON: '\x1b!\x10',
  DOUBLE_WIDTH_ON: '\x1b!\x20',
  DOUBLE_SIZE_ON: '\x1b!\x30',
  NORMAL_SIZE: '\x1b!\x00',
  
  // Alignment
  ALIGN_LEFT: '\x1b\x61\x00',
  ALIGN_CENTER: '\x1b\x61\x01',
  ALIGN_RIGHT: '\x1b\x61\x02',
  
  // Line spacing
  LINE_SPACING_DEFAULT: '\x1b\x32',
  LINE_SPACING_NARROW: '\x1b\x33\x00',
  
  // Paper control
  FEED_LINE: '\x0a',
  FEED_LINES_2: '\x0a\x0a',
  FEED_LINES_3: '\x0a\x0a\x0a',
  CUT_PAPER: '\x1d\x56\x00',
  CUT_PAPER_PARTIAL: '\x1d\x56\x01',
  
  // Character sets
  CHARSET_USA: '\x1b\x52\x00',
  CHARSET_FRANCE: '\x1b\x52\x01',
  CHARSET_GERMANY: '\x1b\x52\x02',
  
  // Barcode and QR
  QR_CODE_MODEL: '\x1d\x28\x6b\x04\x00\x31\x41\x32\x00',
  QR_CODE_SIZE: '\x1d\x28\x6b\x03\x00\x31\x43',
  QR_CODE_ERROR_CORRECTION: '\x1d\x28\x6b\x03\x00\x31\x45\x30',
  
  // Status commands
  STATUS_PRINTER: '\x10\x04\x01',
  STATUS_OFFLINE: '\x10\x04\x02',
  STATUS_ERROR: '\x10\x04\x03',
  STATUS_PAPER: '\x10\x04\x04',
} as const;

export const FONT_SIZES = {
  small: {
    command: '\x1b!\x00',
    width: 42,
    description: 'Small font (12x24)',
  },
  normal: {
    command: '\x1b!\x00',
    width: 48,
    description: 'Normal font (12x24)',
  },
  large: {
    command: '\x1b!\x10',
    width: 24,
    description: 'Large font (12x48)',
  },
} as const;

export const PAPER_WIDTHS = {
  58: { characters: 32, description: '58mm paper' },
  80: { characters: 48, description: '80mm paper' },
  112: { characters: 64, description: '112mm paper' },
} as const;
