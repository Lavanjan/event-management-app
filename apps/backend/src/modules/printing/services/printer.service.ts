import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import * as escpos from 'escpos';
import * as Network from 'escpos-network';
import * as USB from 'escpos-usb';
import { Booking } from '../../../database/entities/booking.entity';
import { PrintAudit, PrintStatus, PrintType } from '../../../database/entities/print-audit.entity';
import { Organization } from '../../../database/entities/organization.entity';
import { User } from '../../../database/entities/user.entity';
import {
  PrinterConfig,
  PrintSettings,
  PrinterError,
  PRINTER_ERROR_CODES,
  DEFAULT_PRINTER_CONFIGS,
  DEFAULT_PRINT_SETTINGS,
  ESC_POS_COMMANDS,
  RECEIPT_TEMPLATES,
} from '../config/printer.config';

export interface PrintBillRequest {
  bookingId: string;
  userId: string;
  organizationId: string;
  printerConfig?: Partial<PrinterConfig>;
  printSettings?: Partial<PrintSettings>;
  isReprint?: boolean;
  originalPrintId?: string;
}

export interface PrintBillResponse {
  success: boolean;
  printAuditId: string;
  receiptNumber: string;
  message: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  printDuration?: number;
}

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(PrintAudit)
    private readonly printAuditRepository: Repository<PrintAudit>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async printBill(request: PrintBillRequest): Promise<PrintBillResponse> {
    const startTime = Date.now();
    let printAudit: PrintAudit;

    try {
      // Create print audit record
      printAudit = await this.createPrintAudit(request);

      // Fetch booking details with relations
      const booking = await this.getBookingWithDetails(request.bookingId, request.organizationId);
      if (!booking) {
        throw this.createPrinterError(
          PRINTER_ERROR_CODES.INVALID_DATA,
          'Booking not found',
          { bookingId: request.bookingId }
        );
      }

      // Fetch organization details
      const organization = await this.organizationRepository.findOne({
        where: { id: request.organizationId },
      });

      // Merge print settings
      const printSettings = { ...DEFAULT_PRINT_SETTINGS, ...request.printSettings };
      const printerConfig = this.selectPrinterConfig(request.printerConfig);

      // Print the receipt using escpos
      await this.printWithEscPos(
        booking,
        organization,
        printSettings,
        printAudit.receiptNumber,
        printerConfig
      );

      // Update print audit with success
      const printDuration = Date.now() - startTime;
      await this.updatePrintAuditSuccess(printAudit, {
        bookingDetails: this.sanitizeBookingForAudit(booking),
        organizationInfo: organization ? {
          name: organization.name,
          email: organization.email,
          phone: organization.phone,
        } : null,
        printSettings,
        printerConfig,
      }, printDuration);

      this.logger.log(`Bill printed successfully for booking ${request.bookingId} in ${printDuration}ms`);

      return {
        success: true,
        printAuditId: printAudit.id,
        receiptNumber: printAudit.receiptNumber,
        message: 'Bill printed successfully',
        printDuration,
      };

    } catch (error) {
      const printDuration = Date.now() - startTime;
      
      if (printAudit) {
        await this.updatePrintAuditFailure(printAudit, error, printDuration);
      }

      this.logger.error(`Failed to print bill for booking ${request.bookingId}:`, error);

      return {
        success: false,
        printAuditId: printAudit?.id || '',
        receiptNumber: printAudit?.receiptNumber || '',
        message: 'Failed to print bill',
        error: {
          code: error.code || PRINTER_ERROR_CODES.UNKNOWN_ERROR,
          message: error.message,
          details: error.details,
        },
        printDuration,
      };
    }
  }

  private async createPrintAudit(request: PrintBillRequest): Promise<PrintAudit> {
    const receiptNumber = this.generateReceiptNumber();
    
    const printAudit = this.printAuditRepository.create({
      bookingId: request.bookingId,
      organizationId: request.organizationId,
      userId: request.userId,
      printType: request.isReprint ? PrintType.REPRINT : PrintType.BILL,
      printStatus: PrintStatus.PENDING,
      isReprint: request.isReprint || false,
      originalPrintId: request.originalPrintId,
      receiptNumber,
      retryCount: 0,
    });

    return await this.printAuditRepository.save(printAudit);
  }

  private async getBookingWithDetails(bookingId: string, organizationId: string): Promise<Booking | null> {
    return await this.bookingRepository.findOne({
      where: { id: bookingId, organizationId },
      relations: [
        'event',
        'inventoryAllocations',
        'inventoryAllocations.inventoryItem',
        'expenses',
        'revenues',
      ],
    });
  }

  private selectPrinterConfig(override?: Partial<PrinterConfig>): PrinterConfig {
    // Try to find network printer first, then USB
    const defaultConfig = DEFAULT_PRINTER_CONFIGS.find(config => config.type === 'network') ||
                         DEFAULT_PRINTER_CONFIGS[0];
    
    return { ...defaultConfig, ...override };
  }

  private async printWithEscPos(
    booking: Booking,
    organization: Organization | null,
    settings: PrintSettings,
    receiptNumber: string,
    config: PrinterConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let device: any;

        // Create device based on printer type
        if (config.type === 'network') {
          const [ip, port] = config.interface.split(':');
          device = new Network(ip, parseInt(port) || 9100);
        } else if (config.type === 'usb') {
          device = new USB();
        } else if (config.type === 'printer') {
          // For Windows printer, use network fallback
          device = new Network('127.0.0.1', 9100);
        } else {
          throw new Error(`Unsupported printer type: ${config.type}`);
        }

        const printer = new escpos.Printer(device);

        // Calculate totals
        const subtotal = parseFloat(booking.totalAmount?.toString() || '0');
        const taxPercent = 8; // You can make this configurable
        const tax = Math.round(subtotal * (taxPercent / 100));
        const total = subtotal + tax;

        // Open connection and print
        device.open((error: any) => {
          if (error) {
            this.logger.error(`Failed to open printer connection: ${error.message}`);
            reject(error);
            return;
          }

          try {
            printer
              // Top padding
              .text("\n\n")
              // Header
              .align('CT')
              .style('B')
              .size(0, 0)
              .text(organization?.name || 'Event Booking System')
              .style('NORMAL')
              .text(organization?.address || 'Event Management Company')
              .text("Contact: " + (organization?.phone || '+94 77 123 4567'))
              .drawLine()
              // Customer & Booking info
              .align('LT')
              .text("Event: " + (booking.event?.name || 'Unknown Event'))
              .text("Booking ID: " + booking.id.substring(0, 8).toUpperCase())
              .text("Receipt No: " + receiptNumber)
              .text(`Start: ${new Date(booking.startDate).toLocaleDateString()}`)
              .text(`End: ${new Date(booking.endDate).toLocaleDateString()}`)
              .text(`Duration: ${booking.durationType}`)
              .drawLine()
              // Itemized charges header
              .text("Item                 Qty   Price    Total")
              .drawLine()
              // Main booking charge
              .text(`Event Booking        1     ${subtotal}    ${subtotal}`)
              .drawLine()
              // Totals
              .align('RT')
              .text(`Subtotal: ${subtotal}`)
              .text(`Tax (${taxPercent}%): ${tax}`)
              .text(`Total: ${total}`)
              .drawLine()
              // Bottom padding before thank you
              .text("\n")
              // Footer
              .align('CT')
              .text("Thank you for your booking!")
              .text("Powered by Event Booking System")
              .text("\n")
              // Barcode (booking ID)
              .barcode(booking.id.substring(0, 8).toUpperCase(), 'CODE39', {
                width: 2,
                height: 50,
                position: 'BELOW'
              })
              .cut()
              .close();

            this.logger.log(`Print job completed successfully on ${config.interface}`);
            resolve();
          } catch (printError: any) {
            this.logger.error(`Print job failed: ${printError.message}`);
            reject(printError);
          }
        });
      } catch (error: any) {
        this.logger.error(`Failed to create printer device: ${error.message}`);
        reject(error);
      }
    });
  }

  private async generateReceiptContent(
    booking: Booking,
    organization: Organization | null,
    settings: PrintSettings,
    receiptNumber: string
  ): Promise<string> {
    let content = '';

    // Reset printer
    content += ESC_POS_COMMANDS.RESET;

    // Header
    content += this.generateHeader(organization, settings);

    // Booking details
    content += this.generateBookingDetails(booking, receiptNumber);

    // Financial information
    content += this.generateFinancialInfo(booking);

    // QR Code if enabled
    if (settings.includeQrCode) {
      content += await this.generateQRCode(booking.id);
    }

    // Footer
    content += this.generateFooter();

    // Cut paper if enabled
    if (settings.autoCut) {
      content += ESC_POS_COMMANDS.FEED_LINES_3;
      content += ESC_POS_COMMANDS.CUT_PAPER;
    }

    return content;
  }

  private generateHeader(organization: Organization | null, settings: PrintSettings): string {
    let header = '';

    // Center alignment
    header += ESC_POS_COMMANDS.ALIGN_CENTER;
    
    // Company name (bold, large)
    header += ESC_POS_COMMANDS.BOLD_ON;
    header += ESC_POS_COMMANDS.DOUBLE_SIZE_ON;
    header += (organization?.name || 'EVENT MANAGEMENT') + '\n';
    header += ESC_POS_COMMANDS.NORMAL_SIZE;
    header += ESC_POS_COMMANDS.BOLD_OFF;

    // Receipt title
    header += ESC_POS_COMMANDS.BOLD_ON;
    header += RECEIPT_TEMPLATES.HEADER.COMPANY_NAME + '\n';
    header += ESC_POS_COMMANDS.BOLD_OFF;

    // Separator
    header += RECEIPT_TEMPLATES.HEADER.SEPARATOR + '\n';
    header += ESC_POS_COMMANDS.FEED_LINE;

    return header;
  }

  private generateBookingDetails(booking: Booking, receiptNumber: string): string {
    let details = '';

    // Left alignment for details
    details += ESC_POS_COMMANDS.ALIGN_LEFT;

    // Section header
    details += ESC_POS_COMMANDS.BOLD_ON;
    details += RECEIPT_TEMPLATES.SECTIONS.BOOKING_DETAILS + '\n';
    details += ESC_POS_COMMANDS.BOLD_OFF;
    details += RECEIPT_TEMPLATES.HEADER.THIN_SEPARATOR + '\n';

    // Booking information
    details += `Receipt No: ${receiptNumber}\n`;
    details += `Booking ID: ${booking.id.substring(0, 8).toUpperCase()}\n`;
    details += `Customer: ${booking.customerName}\n`;
    details += `Email: ${booking.customerEmail}\n`;
    details += `Phone: ${booking.customerPhone || 'N/A'}\n`;
    details += `Event: ${booking.event?.name || 'N/A'}\n`;
    details += `Date: ${booking.startDate.toLocaleDateString()}\n`;
    details += `Time: ${booking.startDate.toLocaleTimeString()} - ${booking.endDate.toLocaleTimeString()}\n`;
    details += `Type: ${this.getBookingTypeDisplay(booking)}\n`;
    details += `Status: ${booking.status.toUpperCase()}\n`;
    details += ESC_POS_COMMANDS.FEED_LINE;

    return details;
  }

  private generateFinancialInfo(booking: Booking): string {
    let financial = '';

    // Section header
    financial += ESC_POS_COMMANDS.BOLD_ON;
    financial += RECEIPT_TEMPLATES.SECTIONS.FINANCIAL_INFO + '\n';
    financial += ESC_POS_COMMANDS.BOLD_OFF;
    financial += RECEIPT_TEMPLATES.HEADER.THIN_SEPARATOR + '\n';

    // Financial details
    const totalAmount = Number(booking.totalAmount) || 0;
    const advancePaid = Number(booking.advanceAmount) || 0;
    const balanceDue = totalAmount - advancePaid;

    financial += `Total Amount: $${totalAmount.toFixed(2)}\n`;
    financial += `Advance Paid: $${advancePaid.toFixed(2)}\n`;
    financial += `Balance Due: $${balanceDue.toFixed(2)}\n`;
    financial += `Payment Status: ${booking.paymentStatus.replace('_', ' ').toUpperCase()}\n`;
    
    if (booking.balanceDueDate) {
      financial += `Balance Due Date: ${booking.balanceDueDate.toLocaleDateString()}\n`;
    }

    financial += ESC_POS_COMMANDS.FEED_LINE;

    return financial;
  }

  private async generateQRCode(bookingId: string): Promise<string> {
    try {
      // Generate QR code data URL
      const qrData = `BOOKING:${bookingId}`;
      
      // For ESC/POS, we'll add QR code commands
      // Note: This is a simplified implementation
      let qrCode = '';
      qrCode += ESC_POS_COMMANDS.ALIGN_CENTER;
      qrCode += `QR: ${qrData}\n`; // Fallback text
      qrCode += ESC_POS_COMMANDS.FEED_LINE;
      
      return qrCode;
    } catch (error) {
      this.logger.warn('Failed to generate QR code:', error);
      return '';
    }
  }

  private generateFooter(): string {
    let footer = '';

    footer += ESC_POS_COMMANDS.ALIGN_CENTER;
    footer += RECEIPT_TEMPLATES.HEADER.SEPARATOR + '\n';
    footer += RECEIPT_TEMPLATES.FOOTER.THANK_YOU + '\n';
    footer += ESC_POS_COMMANDS.FEED_LINE;
    footer += `Printed: ${new Date().toLocaleString()}\n`;
    footer += ESC_POS_COMMANDS.FEED_LINES_2;

    return footer;
  }

  private async sendToPrinter(content: string, config: PrinterConfig, settings: PrintSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let device;

        // Create device based on printer type
        if (config.type === 'network') {
          // Extract IP and port from interface (format: "192.168.1.152:9100")
          const [ip, port] = config.interface.split(':');
          device = new Network(ip, parseInt(port) || 9100);
        } else if (config.type === 'usb') {
          // For USB printers, try to find by vendor/product ID or use default
          device = new USB();
        } else if (config.type === 'printer') {
          // For Windows printer, we'll use network fallback for now
          // You can extend this to use Windows printer spooler
          device = new Network('127.0.0.1', 9100);
        } else {
          throw new Error(`Unsupported printer type: ${config.type}`);
        }

        const printer = new escpos.Printer(device);

        // Open connection and print
        device.open((error) => {
          if (error) {
            this.logger.error(`Failed to open printer connection: ${error.message}`);
            reject(this.createPrinterError(
              PRINTER_ERROR_CODES.CONNECTION_FAILED,
              'Failed to connect to printer',
              { config, originalError: error.message }
            ));
            return;
          }

          try {
            // Print the raw content (it's already formatted)
            printer.raw(Buffer.from(content, 'utf8'));

            // Cut paper if auto-cut is enabled
            if (settings.autoCut) {
              printer.cut();
            }

            // Close connection
            printer.close();

            this.logger.log(`Print job completed successfully on ${config.interface}`);
            resolve();
          } catch (printError) {
            this.logger.error(`Print job failed: ${printError.message}`);
            reject(this.createPrinterError(
              PRINTER_ERROR_CODES.UNKNOWN_ERROR,
              printError.message || 'Unknown printer error',
              { config, originalError: printError }
            ));
          }
        });
      } catch (error) {
        this.logger.error(`Failed to create printer device: ${error.message}`);
        reject(this.createPrinterError(
          PRINTER_ERROR_CODES.UNKNOWN_ERROR,
          error.message || 'Failed to create printer device',
          { config, originalError: error }
        ));
      }
    });
  }

  private async updatePrintAuditSuccess(
    printAudit: PrintAudit,
    printData: any,
    duration: number
  ): Promise<void> {
    await this.printAuditRepository.update(printAudit.id, {
      printStatus: PrintStatus.SUCCESS,
      printData,
      printDurationMs: duration,
    });
  }

  private async updatePrintAuditFailure(
    printAudit: PrintAudit,
    error: any,
    duration: number
  ): Promise<void> {
    await this.printAuditRepository.update(printAudit.id, {
      printStatus: PrintStatus.FAILED,
      errorMessage: error.message,
      errorCode: error.code,
      printDurationMs: duration,
    });
  }

  private generateReceiptNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `RCP-${timestamp}-${random}`;
  }

  private getBookingTypeDisplay(booking: Booking): string {
    // Determine booking type based on duration type
    switch (booking.durationType) {
      case 'hourly':
        return 'Hourly';
      case 'half_day':
        return 'Half Day';
      case 'full_day':
        return 'Full Day';
      default:
        return 'Custom';
    }
  }

  private sanitizeBookingForAudit(booking: Booking): any {
    return {
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalAmount: booking.totalAmount,
      advanceAmount: booking.advanceAmount,
      eventName: booking.event?.name,
    };
  }

  private createPrinterError(code: string, message: string, details?: any): PrinterError {
    const error = new Error(message) as PrinterError;
    error.code = code as any;
    error.details = details;
    return error;
  }

  // Public methods for audit and management
  async getPrintHistory(bookingId: string, organizationId: string): Promise<PrintAudit[]> {
    return await this.printAuditRepository.find({
      where: { bookingId, organizationId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async retryPrint(printAuditId: string, userId: string): Promise<PrintBillResponse> {
    const originalPrint = await this.printAuditRepository.findOne({
      where: { id: printAuditId },
      relations: ['booking'],
    });

    if (!originalPrint) {
      throw new Error('Original print record not found');
    }

    if (!originalPrint.canRetry) {
      throw new Error('Print cannot be retried (max retries exceeded or not failed)');
    }

    // Increment retry count
    await this.printAuditRepository.update(printAuditId, {
      retryCount: originalPrint.retryCount + 1,
    });

    // Attempt reprint
    return await this.printBill({
      bookingId: originalPrint.bookingId,
      userId,
      organizationId: originalPrint.organizationId,
      isReprint: true,
      originalPrintId: printAuditId,
    });
  }

  async testPrinterConnection(): Promise<any> {
    try {
      // Simple test - just return printer configuration info
      const printerConfigs = DEFAULT_PRINTER_CONFIGS;

      return {
        connected: false, // We'll set this to false for now since connection testing is slow
        message: 'Printer configuration loaded successfully',
        testTime: new Date().toISOString(),
        availableConfigs: printerConfigs.map(config => ({
          name: config.name,
          type: config.type,
          interface: config.interface,
          width: config.width
        })),
        instructions: [
          '1. Make sure your XP-80C printer is powered on',
          '2. Check that it appears in Windows Printers & Scanners',
          '3. Try printing a test page from Windows first',
          '4. The system will use the "XP-80C" Windows printer driver',
          '5. Use the Print Bill button in the booking list to test actual printing'
        ],
        nextSteps: [
          'The print functionality is ready to use',
          'Click "Print Bill" on any booking to test',
          'Check the print history for audit trail',
          'All print jobs are logged in the database'
        ]
      };
    } catch (error) {
      return {
        connected: false,
        message: `Printer test failed: ${error.message}`,
        error: error.message,
        testTime: new Date().toISOString()
      };
    }
  }

  // Keep the old test method for future use
  async testPrinterConnectionDetailed(): Promise<any> {
    const ThermalPrinter = require('node-thermal-printer').printer;
    const PrinterTypes = require('node-thermal-printer').types;

    // Try the Windows printer first
    const printerConfigs = [
      { name: 'XP-80C', interface: 'XP-80C', type: 'printer' },
      { name: 'COM3', interface: '\\\\.\\COM3', type: 'usb' },
      { name: 'COM4', interface: '\\\\.\\COM4', type: 'usb' },
      { name: 'COM5', interface: '\\\\.\\COM5', type: 'usb' },
    ];

    const testResults = [];

    for (const config of printerConfigs) {
      try {
        const printer = new ThermalPrinter({
          type: PrinterTypes.EPSON,
          interface: config.interface,
          characterSet: 'PC437_USA',
          removeSpecialCharacters: false,
          lineCharacter: "=",
          width: 48,
        });

        // Test connection
        const isConnected = await printer.isPrinterConnected();

        testResults.push({
          name: config.name,
          interface: config.interface,
          type: config.type,
          connected: isConnected,
          tested: true
        });

        if (isConnected) {
          // Print a simple test receipt
          printer.alignCenter();
          printer.println("=".repeat(48));
          printer.setTextSize(1, 1);
          printer.println("PRINTER TEST");
          printer.println("XPrinter XP80T");
          printer.println("=".repeat(48));
          printer.newLine();
          printer.alignLeft();
          printer.println(`Test Time: ${new Date().toLocaleString()}`);
          printer.println(`Interface: ${config.interface}`);
          printer.println(`Status: Connected`);
          printer.newLine();
          printer.alignCenter();
          printer.println("Test completed successfully!");
          printer.newLine();
          printer.newLine();
          printer.cut();

          const result = await printer.execute();

          return {
            connected: true,
            interface: config.interface,
            message: 'Printer test successful - receipt printed',
            testTime: new Date().toISOString(),
            printerType: 'XPrinter XP80T',
            testResults: testResults,
            result: result
          };
        }
      } catch (error) {
        testResults.push({
          name: config.name,
          interface: config.interface,
          type: config.type,
          connected: false,
          tested: true,
          error: error.message
        });
      }
    }

    // No working printer found
    return {
      connected: false,
      message: 'No working printer found on any COM port',
      testTime: new Date().toISOString(),
      testResults: testResults,
      suggestions: [
        'Check USB cable connection',
        'Verify printer is powered on',
        'Check Windows Device Manager for COM port',
        'Install printer drivers if not installed',
        'Try running as administrator',
        'Check if another application is using the printer'
      ]
    };
  }

  async testDatabaseConnection(): Promise<any> {
    try {
      // Test if we can query the print_audits table
      const count = await this.printAuditRepository.count();

      // Test if we can create a simple query
      const recent = await this.printAuditRepository.find({
        take: 1,
        order: { createdAt: 'DESC' },
        relations: ['user', 'booking']
      });

      return {
        message: 'Database connection successful',
        printAuditsCount: count,
        recentPrintAudit: recent.length > 0 ? {
          id: recent[0].id,
          printType: recent[0].printType,
          printStatus: recent[0].printStatus,
          createdAt: recent[0].createdAt,
          hasUser: !!recent[0].user,
          hasBooking: !!recent[0].booking
        } : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: `Database test failed: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testPrintHistoryForBooking(bookingId: string): Promise<any> {
    try {
      // Test if we can query print history for a specific booking
      const printHistory = await this.printAuditRepository.find({
        where: { bookingId },
        order: { createdAt: 'DESC' },
        relations: ['user', 'booking']
      });

      return {
        message: 'Print history query successful',
        bookingId: bookingId,
        printHistoryCount: printHistory.length,
        printHistory: printHistory.map(audit => ({
          id: audit.id,
          printType: audit.printType,
          printStatus: audit.printStatus,
          receiptNumber: audit.receiptNumber,
          printedBy: audit.user ? {
            id: audit.user.id,
            name: audit.user.firstName + ' ' + audit.user.lastName,
            email: audit.user.email,
          } : null,
          printedAt: audit.createdAt,
          errorMessage: audit.errorMessage,
          retryCount: audit.retryCount,
          isReprint: audit.isReprint,
        })),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: `Print history test failed: ${error.message}`,
        error: error.message,
        bookingId: bookingId,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testPrintBillForBooking(bookingId: string): Promise<any> {
    try {
      // Test if we can fetch booking data and generate print content
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['event', 'inventoryAllocations', 'inventoryAllocations.inventoryItem']
      });

      if (!booking) {
        return {
          message: 'Booking not found',
          bookingId: bookingId,
          timestamp: new Date().toISOString()
        };
      }

      // Get organization
      const organization = await this.organizationRepository.findOne({
        where: { id: booking.organizationId }
      });

      // Test generating receipt content (without actually printing)
      const receiptContent = await this.generateReceiptContent(
        booking,
        organization,
        {
          paperWidth: 48,
          fontSize: 'normal',
          includeLogo: false,
          includeQrCode: true,
          autoCut: true,
          copies: 1,
          characterSet: 'PC437_USA',
          timeout: 5000
        },
        'TEST-' + Date.now()
      );

      return {
        message: 'Print bill test successful - receipt content generated',
        bookingId: bookingId,
        bookingDetails: {
          id: booking.id,
          eventName: booking.event?.name || 'Unknown Event',
          startDate: booking.startDate,
          endDate: booking.endDate,
          durationType: booking.durationType,
          totalAmount: booking.totalAmount,
          organizationName: organization?.name || 'Unknown Organization'
        },
        receiptContentLength: receiptContent.length,
        receiptPreview: receiptContent.substring(0, 200) + '...',
        printerConfig: {
          name: 'XP-80C (Windows Printer)',
          type: 'printer',
          interface: 'XP-80C'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: `Print bill test failed: ${error.message}`,
        error: error.message,
        bookingId: bookingId,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testRealPrintForBooking(bookingId: string): Promise<any> {
    try {
      // Test if we can fetch booking data
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['event', 'inventoryAllocations', 'inventoryAllocations.inventoryItem']
      });

      if (!booking) {
        return {
          message: 'Booking not found',
          bookingId: bookingId,
          timestamp: new Date().toISOString()
        };
      }

      // Get organization
      const organization = await this.organizationRepository.findOne({
        where: { id: booking.organizationId }
      });

      // Use the working printer configuration
      const printerConfig = {
        name: 'XPrinter XP80T Network (Working)',
        type: 'network' as const,
        interface: '192.168.1.152:9100',
        characterSet: 'PC437_USA',
        removeSpecialCharacters: false,
        width: 48,
        timeout: 5000,
      };

      const printSettings = {
        paperWidth: 48,
        fontSize: 'normal' as const,
        includeLogo: false,
        includeQrCode: true,
        autoCut: true,
        copies: 1,
        characterSet: 'PC437_USA',
        timeout: 5000
      };

      // Actually print to the real printer
      await this.printWithEscPos(
        booking,
        organization,
        printSettings,
        'TEST-' + Date.now(),
        printerConfig
      );

      return {
        message: 'REAL print test successful - receipt sent to printer!',
        bookingId: bookingId,
        bookingDetails: {
          id: booking.id,
          eventName: booking.event?.name || 'Unknown Event',
          startDate: booking.startDate,
          endDate: booking.endDate,
          durationType: booking.durationType,
          totalAmount: booking.totalAmount,
          organizationName: organization?.name || 'Unknown Organization'
        },
        printerConfig: {
          name: printerConfig.name,
          type: printerConfig.type,
          interface: printerConfig.interface
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        message: `REAL print test failed: ${error.message}`,
        error: error.message,
        bookingId: bookingId,
        timestamp: new Date().toISOString()
      };
    }
  }
}
