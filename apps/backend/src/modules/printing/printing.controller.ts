import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpException,

} from '@nestjs/common';
import { IsOptional, IsString, IsBoolean, IsObject, IsNumber } from 'class-validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,

} from '@nestjs/swagger';
import { SecureAuthGuard } from '../auth/guards/secure-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequireUserType } from '../auth/decorators/user-type.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrganization } from '../../common/decorators/current-organization.decorator';
import { PrinterService, PrintBillRequest, PrintBillResponse } from './services/printer.service';
import { UserType } from '../../database/entities/user.entity';
import { PrinterConfig, PrintSettings } from './config/printer.config';

class PrintBillDto {
  @IsOptional()
  @IsObject()
  printerConfig?: Partial<PrinterConfig>;

  @IsOptional()
  @IsObject()
  printSettings?: Partial<PrintSettings>;

  @IsOptional()
  @IsBoolean()
  isReprint?: boolean;

  @IsOptional()
  @IsString()
  originalPrintId?: string;

  // Support for legacy flat structure (for backward compatibility)
  @IsOptional()
  @IsBoolean()
  autoCut?: boolean;

  @IsOptional()
  @IsNumber()
  copies?: number;

  @IsOptional()
  @IsBoolean()
  includeQrCode?: boolean;

  @IsOptional()
  @IsString()
  fontSize?: 'small' | 'normal' | 'large';

  @IsOptional()
  @IsNumber()
  paperWidth?: number;
}



@ApiTags('Printing')
@Controller('bookings')
@UseGuards(SecureAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PrintingController {
  constructor(private readonly printerService: PrinterService) {}

  @Post(':id/print-bill')
  @RequireUserType(UserType.ORGANIZATION_ADMIN, UserType.PRODUCT_ADMIN)
  @ApiOperation({
    summary: 'Print booking bill',
    description: 'Print a bill/receipt for a specific booking using ESC/POS printer',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: PrintBillDto,
    description: 'Print configuration and settings',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Bill printed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            printAuditId: { type: 'string' },
            receiptNumber: { type: 'string' },
            message: { type: 'string' },
            printDuration: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking ID or print configuration',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Printer error or internal server error',
  })
  async printBill(
    @Param('id') bookingId: string,
    @Body() printBillDto: PrintBillDto,
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      // Handle both structured and flat request formats
      let printSettings = printBillDto.printSettings || {};

      // If flat properties are provided, merge them into printSettings
      if (printBillDto.autoCut !== undefined ||
          printBillDto.copies !== undefined ||
          printBillDto.includeQrCode !== undefined ||
          printBillDto.fontSize !== undefined ||
          printBillDto.paperWidth !== undefined) {
        printSettings = {
          ...printSettings,
          ...(printBillDto.autoCut !== undefined && { autoCut: printBillDto.autoCut }),
          ...(printBillDto.copies !== undefined && { copies: printBillDto.copies }),
          ...(printBillDto.includeQrCode !== undefined && { includeQrCode: printBillDto.includeQrCode }),
          ...(printBillDto.fontSize !== undefined && { fontSize: printBillDto.fontSize }),
          ...(printBillDto.paperWidth !== undefined && { paperWidth: printBillDto.paperWidth }),
        };
      }

      const request: PrintBillRequest = {
        bookingId,
        userId: user.id,
        organizationId: organization.id,
        printerConfig: printBillDto.printerConfig,
        printSettings,
        isReprint: printBillDto.isReprint || false,
        originalPrintId: printBillDto.originalPrintId,
      };

      const result: PrintBillResponse = await this.printerService.printBill(request);

      if (result.success) {
        return {
          success: true,
          data: {
            printAuditId: result.printAuditId,
            receiptNumber: result.receiptNumber,
            message: result.message,
            printDuration: result.printDuration,
          },
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: result.message,
            error: result.error,
            printAuditId: result.printAuditId,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to print bill',
          error: {
            code: 'PRINT_ERROR',
            message: error.message,
            details: error.details || null,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/reprint-bill')
  @RequireUserType(UserType.ORGANIZATION_ADMIN, UserType.PRODUCT_ADMIN)
  @ApiOperation({
    summary: 'Reprint booking bill',
    description: 'Reprint a bill/receipt for a specific booking',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: PrintBillDto,
    description: 'Print configuration and settings',
    required: false,
  })
  async reprintBill(
    @Param('id') bookingId: string,
    @Body() printBillDto: PrintBillDto,
    @CurrentUser() user: any,
    @CurrentOrganization() organization: any,
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const request: PrintBillRequest = {
        bookingId,
        userId: user.id,
        organizationId: organization.id,
        printerConfig: printBillDto.printerConfig,
        printSettings: printBillDto.printSettings,
        isReprint: true,
        originalPrintId: printBillDto.originalPrintId,
      };

      const result: PrintBillResponse = await this.printerService.printBill(request);

      if (result.success) {
        return {
          success: true,
          data: {
            printAuditId: result.printAuditId,
            receiptNumber: result.receiptNumber,
            message: result.message,
            printDuration: result.printDuration,
          },
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: result.message,
            error: result.error,
            printAuditId: result.printAuditId,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to reprint bill',
          error: {
            code: 'REPRINT_ERROR',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/print-history')
  @RequireUserType(UserType.ORGANIZATION_ADMIN, UserType.PRODUCT_ADMIN)
  @ApiOperation({
    summary: 'Get print history for booking',
    description: 'Retrieve the print history and audit trail for a specific booking',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID',
    type: 'string',
    format: 'uuid',
  })

  async getPrintHistory(
    @Param('id') bookingId: string,
    @CurrentOrganization() organization: any,
  ): Promise<{ success: boolean; data: any }> {
    try {
      const printHistory = await this.printerService.getPrintHistory(
        bookingId,
        organization.id,
      );

      return {
        success: true,
        data: {
          bookingId,
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
            printDuration: audit.formattedDuration,
            isReprint: audit.isReprint,
            errorMessage: audit.errorMessage,
            errorCode: audit.errorCode,
            retryCount: audit.retryCount,
            canRetry: audit.canRetry,
          })),
          total: printHistory.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve print history',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('print-audits/:auditId/retry')
  @RequireUserType(UserType.ORGANIZATION_ADMIN, UserType.PRODUCT_ADMIN)
  @ApiOperation({
    summary: 'Retry failed print',
    description: 'Retry a failed print job using the original print audit record',
  })
  @ApiParam({
    name: 'auditId',
    description: 'Print Audit ID',
    type: 'string',
    format: 'uuid',
  })
  async retryPrint(
    @Param('auditId') auditId: string,
    @CurrentUser() user: any,
  ): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const result = await this.printerService.retryPrint(auditId, user.id);

      if (result.success) {
        return {
          success: true,
          data: {
            printAuditId: result.printAuditId,
            receiptNumber: result.receiptNumber,
            message: result.message,
            printDuration: result.printDuration,
          },
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: result.message,
            error: result.error,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retry print',
          error: {
            code: 'RETRY_ERROR',
            message: error.message,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


}
