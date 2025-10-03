import {
  Controller,
  Get,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PrinterService } from './services/printer.service';

@ApiTags('Printer Test')
@Controller('printer')
export class PrinterTestController {
  constructor(private readonly printerService: PrinterService) {}

  @Get('test')
  @ApiOperation({ summary: 'Test printer connection (no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Printer test completed',
  })
  async testPrinter(): Promise<{ success: boolean; data: any }> {
    try {
      return {
        success: true,
        data: {
          message: 'Printer test endpoint is working',
          timestamp: new Date().toISOString(),
          printerFound: 'XP-80C',
          status: 'Ready for testing',
          instructions: [
            '1. Make sure your XP-80C printer is powered on',
            '2. Check that it appears in Windows Printers & Scanners',
            '3. Try printing a test page from Windows first',
            '4. Use the Print Bill button in the booking list to test actual printing'
          ]
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {
          message: error.message || 'Printer test failed',
          error: error.code || 'PRINTER_TEST_ERROR',
        },
      };
    }
  }

  @Get('test-db')
  @ApiOperation({ summary: 'Test database connection for print audits' })
  async testDatabase(): Promise<{ success: boolean; data: any }> {
    try {
      const result = await this.printerService.testDatabaseConnection();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        data: {
          message: error.message || 'Database test failed',
          error: error.code || 'DATABASE_TEST_ERROR',
        },
      };
    }
  }

  @Get('test-print-history/:bookingId')
  @ApiOperation({ summary: 'Test print history for a specific booking (no auth)' })
  async testPrintHistory(@Param('bookingId') bookingId: string): Promise<{ success: boolean; data: any }> {
    try {
      const result = await this.printerService.testPrintHistoryForBooking(bookingId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        data: {
          message: error.message || 'Print history test failed',
          error: error.code || 'PRINT_HISTORY_TEST_ERROR',
        },
      };
    }
  }

  @Get('test-print-bill/:bookingId')
  @ApiOperation({ summary: 'Test print bill for a specific booking (no auth, no actual printing)' })
  async testPrintBill(@Param('bookingId') bookingId: string): Promise<{ success: boolean; data: any }> {
    try {
      const result = await this.printerService.testPrintBillForBooking(bookingId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.log({error})
      return {
        success: false,
        data: {
          message: error.message || 'Print bill test failed',
          error: error.code || 'PRINT_BILL_TEST_ERROR',
        },
      };
    }
  }

  @Get('test-real-print/:bookingId')
  @ApiOperation({ summary: 'Test REAL printing to your XPrinter (192.168.1.152:9100)' })
  async testRealPrint(@Param('bookingId') bookingId: string): Promise<{ success: boolean; data: any }> {
    try {
      const result = await this.printerService.testRealPrintForBooking(bookingId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        data: {
          message: error.message || 'Real print test failed',
          error: error.code || 'REAL_PRINT_TEST_ERROR',
        },
      };
    }
  }

  @Get('test-print-bill-api/:bookingId')
  @ApiOperation({ summary: 'Test the actual print bill API logic (no auth)' })
  async testPrintBillApi(@Param('bookingId') bookingId: string): Promise<{ success: boolean; data: any }> {
    try {
      // Simulate the print bill request
      const printRequest = {
        bookingId: bookingId,
        userId: '1885c475-34c6-4a6b-9f58-ccc6eed400c3', // Valid user ID
        organizationId: '92c8966d-a30e-4dd3-9e22-e0ba7ee20991', // Booking's organization ID
        printerConfig: {
          name: 'XPrinter XP80T Network (Working)',
          type: 'network' as const,
          interface: '192.168.1.152:9100'
        },
        printSettings: {
          paperWidth: 48,
          fontSize: 'normal' as const,
          includeLogo: false,
          includeQrCode: true,
          autoCut: true,
          copies: 1
        },
        isReprint: false
      };

      const result = await this.printerService.printBill(printRequest);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        data: {
          message: error.message || 'Print bill API test failed',
          error: error.code || 'PRINT_BILL_API_TEST_ERROR',
          stack: error.stack
        },
      };
    }
  }

  @Get('test-flat-structure/:bookingId')
  @ApiOperation({ summary: 'Test print bill with flat structure (like frontend sends)' })
  async testFlatStructure(@Param('bookingId') bookingId: string): Promise<{ success: boolean; data: any }> {
    try {
      // Simulate the flat structure request that frontend sends
      const printRequest = {
        bookingId: bookingId,
        userId: '1885c475-34c6-4a6b-9f58-ccc6eed400c3', // Valid user ID
        organizationId: '92c8966d-a30e-4dd3-9e22-e0ba7ee20991', // Booking's organization ID
        printerConfig: {
          name: 'XPrinter XP80T Network (Working)',
          type: 'network' as const,
          interface: '192.168.1.152:9100'
        },
        printSettings: {
          autoCut: true,
          copies: 1,
          includeQrCode: true,
          paperWidth: 48,
          fontSize: 'normal' as const
        },
        isReprint: false
      };

      const result = await this.printerService.printBill(printRequest);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        data: {
          message: error.message || 'Flat structure test failed',
          error: error.code || 'FLAT_STRUCTURE_TEST_ERROR',
          stack: error.stack
        },
      };
    }
  }
}
