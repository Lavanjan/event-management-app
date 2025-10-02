import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { printService, PrintBillRequest, PrintBillResponse, PrintHistoryResponse } from '../services/printService';
import { useToast } from './use-toast';

// Query Keys
export const PRINT_QUERY_KEYS = {
  all: ['print'] as const,
  history: (bookingId: string) => [...PRINT_QUERY_KEYS.all, 'history', bookingId] as const,
  audits: () => [...PRINT_QUERY_KEYS.all, 'audits'] as const,
};

// Print Bill Hook
export function usePrintBill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ bookingId, request }: { bookingId: string; request?: PrintBillRequest }) =>
      printService.printBill(bookingId, request),
    onSuccess: (response: PrintBillResponse, { bookingId }) => {
      if (response.success) {
        toast({
          title: 'Bill Printed Successfully',
          description: `Receipt #${response.data?.receiptNumber} printed in ${response.data?.printDuration}ms`,
        });

        // Invalidate print history for this booking
        queryClient.invalidateQueries({
          queryKey: PRINT_QUERY_KEYS.history(bookingId),
        });
      } else {
        toast({
          title: 'Print Failed',
          description: response.error?.message || 'Failed to print bill',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Print Error',
        description: error.message || 'An unexpected error occurred while printing',
        variant: 'destructive',
      });
    },
  });
}

// Reprint Bill Hook
export function useReprintBill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ bookingId, request }: { bookingId: string; request?: PrintBillRequest }) =>
      printService.reprintBill(bookingId, request),
    onSuccess: (response: PrintBillResponse, { bookingId }) => {
      if (response.success) {
        toast({
          title: 'Bill Reprinted Successfully',
          description: `Receipt #${response.data?.receiptNumber} reprinted`,
        });

        // Invalidate print history for this booking
        queryClient.invalidateQueries({
          queryKey: PRINT_QUERY_KEYS.history(bookingId),
        });
      } else {
        toast({
          title: 'Reprint Failed',
          description: response.error?.message || 'Failed to reprint bill',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Reprint Error',
        description: error.message || 'An unexpected error occurred while reprinting',
        variant: 'destructive',
      });
    },
  });
}

// Retry Print Hook
export function useRetryPrint() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (auditId: string) => printService.retryPrint(auditId),
    onSuccess: (response: PrintBillResponse) => {
      if (response.success) {
        toast({
          title: 'Print Retry Successful',
          description: `Receipt #${response.data?.receiptNumber} printed successfully`,
        });

        // Invalidate all print history queries
        queryClient.invalidateQueries({
          queryKey: PRINT_QUERY_KEYS.all,
        });
      } else {
        toast({
          title: 'Print Retry Failed',
          description: response.error?.message || 'Failed to retry print',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Retry Error',
        description: error.message || 'An unexpected error occurred while retrying print',
        variant: 'destructive',
      });
    },
  });
}

// Print History Hook
export function usePrintHistory(bookingId: string) {
  return useQuery({
    queryKey: PRINT_QUERY_KEYS.history(bookingId),
    queryFn: () => printService.getPrintHistory(bookingId),
    enabled: !!bookingId,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
  });
}

// Print Configuration Hooks
export function usePrintConfiguration() {
  const getDefaultSettings = () => printService.getDefaultPrintSettings();
  const getDefaultConfig = () => printService.getDefaultPrinterConfig();
  
  const validateConfig = (config: any) => printService.validatePrinterConfig(config);
  const validateSettings = (settings: any) => printService.validatePrintSettings(settings);

  return {
    getDefaultSettings,
    getDefaultConfig,
    validateConfig,
    validateSettings,
  };
}

// Print Status Utilities Hook
export function usePrintUtils() {
  const getErrorMessage = (error: any) => printService.getErrorMessage(error);
  const getErrorCode = (error: any) => printService.getErrorCode(error);
  const isRetryableError = (error: any) => printService.isRetryableError(error);
  
  const getStatusColor = (status: string) => printService.getPrintStatusColor(status);
  const getStatusIcon = (status: string) => printService.getPrintStatusIcon(status);
  const formatDuration = (duration: string | number) => printService.formatPrintDuration(duration);

  return {
    getErrorMessage,
    getErrorCode,
    isRetryableError,
    getStatusColor,
    getStatusIcon,
    formatDuration,
  };
}

// Network Printer Discovery Hook
export function useNetworkPrinters() {
  return useQuery({
    queryKey: ['networkPrinters'],
    queryFn: () => printService.discoverNetworkPrinters(),
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

// Bulk Print Operations Hook
export function useBulkPrint() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const printMultipleBills = useMutation({
    mutationFn: async ({ 
      bookingIds, 
      request 
    }: { 
      bookingIds: string[]; 
      request?: PrintBillRequest 
    }) => {
      const results = [];
      
      for (const bookingId of bookingIds) {
        try {
          const result = await printService.printBill(bookingId, request);
          results.push({ bookingId, result });
          
          // Small delay between prints to avoid overwhelming the printer
          if (bookingIds.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          results.push({ 
            bookingId, 
            result: { 
              success: false, 
              error: { 
                code: 'PRINT_ERROR', 
                message: error instanceof Error ? error.message : 'Unknown error' 
              } 
            } 
          });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.result.success).length;
      const failed = results.filter(r => !r.result.success).length;
      
      if (successful > 0) {
        toast({
          title: 'Bulk Print Completed',
          description: `${successful} bills printed successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        });
      }
      
      if (failed > 0 && successful === 0) {
        toast({
          title: 'Bulk Print Failed',
          description: `All ${failed} print jobs failed`,
          variant: 'destructive',
        });
      }

      // Invalidate all print history queries
      queryClient.invalidateQueries({
        queryKey: PRINT_QUERY_KEYS.all,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk Print Error',
        description: error.message || 'Failed to execute bulk print operation',
        variant: 'destructive',
      });
    },
  });

  return {
    printMultipleBills,
    isLoading: printMultipleBills.isPending,
  };
}

// Print Queue Management Hook (for future implementation)
export function usePrintQueue() {
  // This would manage a print queue for handling multiple print jobs
  // For now, it's a placeholder for future implementation
  
  const addToPrintQueue = (bookingId: string, request?: PrintBillRequest) => {
    // Add to print queue
    console.log('Adding to print queue:', bookingId, request);
  };

  const processPrintQueue = () => {
    // Process print queue
    console.log('Processing print queue');
  };

  const clearPrintQueue = () => {
    // Clear print queue
    console.log('Clearing print queue');
  };

  return {
    addToPrintQueue,
    processPrintQueue,
    clearPrintQueue,
  };
}
