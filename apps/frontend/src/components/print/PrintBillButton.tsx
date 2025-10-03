import React, { useState } from 'react';
import { Printer, MoreVertical, History, RotateCcw, Settings } from 'lucide-react';
import { Booking } from '../../types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { usePrintBill, useReprintBill, usePrintHistory } from '../../hooks/usePrint';
import { PrintConfigModal } from './PrintConfigModal';
import { PrintHistoryModal } from './PrintHistoryModal';

interface PrintBillButtonProps {
  booking: Booking;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showDropdown?: boolean;
  className?: string;
}

export function PrintBillButton({
  booking,
  variant = 'outline',
  size = 'sm',
  showDropdown = true,
  className = '',
}: PrintBillButtonProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const printBillMutation = usePrintBill();
  const reprintBillMutation = useReprintBill();
  const { data: printHistory } = usePrintHistory(booking.id);

  const isLoading = printBillMutation.isPending || reprintBillMutation.isPending;
  const hasBeenPrinted = printHistory?.data?.printHistory?.some(h => h.printStatus === 'success') || false;
  const lastPrintStatus = printHistory?.data?.printHistory?.[0]?.printStatus;

  const handlePrint = async () => {
    try {
      await printBillMutation.mutateAsync({
        bookingId: booking.id,
        request: {
          printSettings: {
            includeQrCode: true,
            autoCut: true,
            copies: 1,
          },
        },
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleReprint = async () => {
    try {
      await reprintBillMutation.mutateAsync({
        bookingId: booking.id,
        request: {
          isReprint: true,
          printSettings: {
            includeQrCode: true,
            autoCut: true,
            copies: 1,
          },
        },
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handlePrintWithConfig = () => {
    setShowConfigModal(true);
  };

  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  if (!showDropdown) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={handlePrint}
          disabled={isLoading}
          className={`${className} relative`}
        >
          <Printer className="h-4 w-4 mr-2" />
          {isLoading ? 'Printing...' : 'Print Bill'}
          {hasBeenPrinted && (
            <Badge
              variant={lastPrintStatus === 'success' ? 'default' : 'destructive'}
              className="absolute -top-1 -right-1 h-2 w-2 p-0"
            />
          )}
        </Button>

        <PrintConfigModal
          booking={booking}
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
        />

        <PrintHistoryModal
          booking={booking}
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isLoading}
            className={`${className} relative`}
          >
            <Printer className="h-4 w-4 mr-2" />
            {isLoading ? 'Printing...' : 'Print'}
            <MoreVertical className="h-3 w-3 ml-1" />
            {hasBeenPrinted && (
              <Badge
                variant={lastPrintStatus === 'success' ? 'default' : 'destructive'}
                className="absolute -top-1 -right-1 h-2 w-2 p-0"
              />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handlePrint} disabled={isLoading}>
            <Printer className="h-4 w-4 mr-2" />
            Print Bill
          </DropdownMenuItem>

          {hasBeenPrinted && (
            <DropdownMenuItem onClick={handleReprint} disabled={isLoading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reprint Bill
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handlePrintWithConfig}>
            <Settings className="h-4 w-4 mr-2" />
            Print with Settings
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleShowHistory}>
            <History className="h-4 w-4 mr-2" />
            Print History
            {printHistory?.data?.printHistory?.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {printHistory.data.printHistory.length}
              </Badge>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PrintConfigModal
        booking={booking}
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      <PrintHistoryModal
        booking={booking}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </>
  );
}

// Quick Print Button (simplified version)
export function QuickPrintButton({
  booking,
  variant = 'ghost',
  size = 'sm',
  className = '',
}: Omit<PrintBillButtonProps, 'showDropdown'>) {
  const printBillMutation = usePrintBill();
  const { data: printHistory } = usePrintHistory(booking.id);

  const isLoading = printBillMutation.isPending;
  const hasBeenPrinted = printHistory?.data?.printHistory?.some(h => h.printStatus === 'success') || false;
  const lastPrintStatus = printHistory?.data?.printHistory?.[0]?.printStatus;

  const handleQuickPrint = async () => {
    try {
      await printBillMutation.mutateAsync({
        bookingId: booking.id,
        request: {
          printSettings: {
            includeQrCode: true,
            autoCut: true,
            copies: 1,
          },
        },
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleQuickPrint}
      disabled={isLoading}
      className={`${className} relative`}
      title={hasBeenPrinted ? 'Reprint Bill' : 'Print Bill'}
    >
      <Printer className="h-4 w-4" />
      {hasBeenPrinted && (
        <Badge
          variant={lastPrintStatus === 'success' ? 'default' : 'destructive'}
          className="absolute -top-1 -right-1 h-2 w-2 p-0"
        />
      )}
    </Button>
  );
}

// Print Status Indicator
export function PrintStatusIndicator({ booking }: { booking: Booking }) {
  const { data: printHistory } = usePrintHistory(booking.id);

  if (!printHistory?.data?.printHistory?.length) {
    return (
      <Badge variant="outline" className="text-xs">
        Not Printed
      </Badge>
    );
  }

  const lastPrint = printHistory.data.printHistory[0];
  const printCount = printHistory.data.printHistory.filter(h => h.printStatus === 'success').length;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={lastPrint.printStatus === 'success' ? 'default' : 'destructive'}
        className="text-xs"
      >
        {lastPrint.printStatus === 'success' ? 'Printed' : 'Print Failed'}
      </Badge>
      {printCount > 1 && (
        <Badge variant="secondary" className="text-xs">
          {printCount}x
        </Badge>
      )}
    </div>
  );
}
