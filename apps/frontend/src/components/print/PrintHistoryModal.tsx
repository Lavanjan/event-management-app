import React from 'react';
import { format } from 'date-fns';
import { X, History, RotateCcw, CheckCircle, XCircle, Clock, User, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { usePrintHistory, useRetryPrint, usePrintUtils } from '../../hooks/usePrint';
import { Booking } from '../../types';

interface PrintHistoryModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintHistoryModal({ booking, isOpen, onClose }: PrintHistoryModalProps) {
  const { data: printHistory, isLoading, error } = usePrintHistory(booking.id);
  const retryPrintMutation = useRetryPrint();
  const { getStatusColor, formatDuration } = usePrintUtils();

  const handleRetry = async (auditId: string) => {
    try {
      await retryPrintMutation.mutateAsync(auditId);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIconComponent = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Print History
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading print history...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Print History
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto" />
              <p className="mt-2 text-sm text-red-600">Failed to load print history</p>
              <p className="text-xs text-gray-500">{error.message}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const history = printHistory?.data?.printHistory || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Print History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span> {booking.customerName}
                </div>
                <div>
                  <span className="font-medium">Event:</span> {booking.event?.name || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {new Date(booking.eventDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Total:</span> ${Number(booking.totalAmount || 0).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print Statistics */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Print Statistics</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {history.filter(h => h.printStatus === 'success').length}
                    </div>
                    <div className="text-xs text-gray-600">Successful</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">
                      {history.filter(h => h.printStatus === 'failed').length}
                    </div>
                    <div className="text-xs text-gray-600">Failed</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {history.filter(h => h.printStatus === 'pending').length}
                    </div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">
                      {history.filter(h => h.isReprint).length}
                    </div>
                    <div className="text-xs text-gray-600">Reprints</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Print History List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Print History</CardTitle>
              <CardDescription>
                {history.length === 0 
                  ? 'No print history available for this booking'
                  : `${history.length} print ${history.length === 1 ? 'attempt' : 'attempts'}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Printer className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">No bills have been printed yet</p>
                  <p className="text-xs text-gray-500">Print history will appear here after printing</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {history.map((item, index) => (
                      <div key={item.id}>
                        <div className="flex items-start justify-between p-3 rounded-lg border">
                          <div className="flex items-start gap-3">
                            {getStatusIconComponent(item.printStatus)}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusBadgeVariant(item.printStatus)}>
                                  {item.printStatus.toUpperCase()}
                                </Badge>
                                {item.isReprint && (
                                  <Badge variant="outline" className="text-xs">
                                    REPRINT
                                  </Badge>
                                )}
                                <span className="text-sm font-medium">
                                  Receipt #{item.receiptNumber}
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {item.printedBy?.name || 'Unknown User'}
                                </div>
                                <div>
                                  {format(new Date(item.printedAt), 'MMM dd, yyyy HH:mm:ss')}
                                </div>
                                {item.printDuration && (
                                  <div>
                                    Duration: {formatDuration(item.printDuration)}
                                  </div>
                                )}
                                {item.retryCount > 0 && (
                                  <div>
                                    Retry count: {item.retryCount}
                                  </div>
                                )}
                              </div>

                              {item.errorMessage && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                  <strong>Error:</strong> {item.errorMessage}
                                  {item.errorCode && (
                                    <span className="ml-2 text-gray-500">({item.errorCode})</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.canRetry && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetry(item.id)}
                                disabled={retryPrintMutation.isPending}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Retry
                              </Button>
                            )}
                          </div>
                        </div>
                        {index < history.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
