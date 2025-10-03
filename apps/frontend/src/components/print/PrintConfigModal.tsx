import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Printer, Settings, Wifi, Usb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { usePrintBill, useReprintBill, usePrintConfiguration, useNetworkPrinters } from '../../hooks/usePrint';
import { Booking } from '../../types';

const printerConfigSchema = z.object({
  name: z.string().min(1, 'Printer name is required'),
  type: z.enum(['usb', 'network', 'serial']),
  interface: z.string().min(1, 'Interface is required'),
  characterSet: z.string().optional(),
  width: z.number().min(20).max(80).optional(),
  timeout: z.number().min(1000).max(30000).optional(),
});

const printSettingsSchema = z.object({
  paperWidth: z.number().min(20).max(80).optional(),
  fontSize: z.enum(['small', 'normal', 'large']).optional(),
  includeLogo: z.boolean().optional(),
  includeQrCode: z.boolean().optional(),
  autoCut: z.boolean().optional(),
  copies: z.number().min(1).max(5).optional(),
  characterSet: z.string().optional(),
  timeout: z.number().min(1000).max(30000).optional(),
});

type PrinterConfigForm = z.infer<typeof printerConfigSchema>;
type PrintSettingsForm = z.infer<typeof printSettingsSchema>;

interface PrintConfigModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  isReprint?: boolean;
}

export function PrintConfigModal({ booking, isOpen, onClose, isReprint = false }: PrintConfigModalProps) {
  const [activeTab, setActiveTab] = useState('settings');
  const [testingConnection, setTestingConnection] = useState(false);

  const printBillMutation = usePrintBill();
  const reprintBillMutation = useReprintBill();
  const { getDefaultSettings, getDefaultConfig, validateConfig, validateSettings } = usePrintConfiguration();
  const { data: networkPrinters } = useNetworkPrinters();

  const printerForm = useForm<PrinterConfigForm>({
    resolver: zodResolver(printerConfigSchema),
    defaultValues: getDefaultConfig(),
  });

  const settingsForm = useForm<PrintSettingsForm>({
    resolver: zodResolver(printSettingsSchema),
    defaultValues: getDefaultSettings(),
  });

  const selectedPrinterType = printerForm.watch('type');

  useEffect(() => {
    if (isOpen) {
      printerForm.reset(getDefaultConfig());
      settingsForm.reset(getDefaultSettings());
    }
  }, [isOpen, printerForm, settingsForm, getDefaultConfig, getDefaultSettings]);

  const handlePrint = async () => {
    const printerConfig = printerForm.getValues();
    const printSettings = settingsForm.getValues();

    // Validate configurations
    const configErrors = validateConfig(printerConfig);
    const settingsErrors = validateSettings(printSettings);

    if (configErrors.length > 0 || settingsErrors.length > 0) {
      // Show validation errors
      configErrors.forEach(error => {
        printerForm.setError('root', { message: error });
      });
      settingsErrors.forEach(error => {
        settingsForm.setError('root', { message: error });
      });
      return;
    }

    try {
      const mutation = isReprint ? reprintBillMutation : printBillMutation;
      
      await mutation.mutateAsync({
        bookingId: booking.id,
        request: {
          printerConfig,
          printSettings,
          isReprint,
        },
      });

      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    
    // Simulate connection test
    setTimeout(() => {
      setTestingConnection(false);
      // In a real implementation, this would test the actual printer connection
    }, 2000);
  };

  const handleSelectNetworkPrinter = (printerInterface: string) => {
    printerForm.setValue('interface', printerInterface);
    printerForm.setValue('type', 'network');
  };

  const isLoading = printBillMutation.isPending || reprintBillMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {isReprint ? 'Reprint Bill Configuration' : 'Print Bill Configuration'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Booking Details</CardTitle>
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
                  <span className="font-medium">Amount:</span> ${Number(booking.totalAmount || 0).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Print Settings</TabsTrigger>
              <TabsTrigger value="printer">Printer Config</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Receipt Settings</CardTitle>
                  <CardDescription>Configure how the receipt will be printed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paperWidth">Paper Width (characters)</Label>
                      <Input
                        id="paperWidth"
                        type="number"
                        min="20"
                        max="80"
                        {...settingsForm.register('paperWidth', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Select
                        value={settingsForm.watch('fontSize')}
                        onValueChange={(value) => settingsForm.setValue('fontSize', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="copies">Number of Copies</Label>
                      <Input
                        id="copies"
                        type="number"
                        min="1"
                        max="5"
                        {...settingsForm.register('copies', { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (ms)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        min="1000"
                        max="30000"
                        {...settingsForm.register('timeout', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeLogo">Include Company Logo</Label>
                      <Switch
                        id="includeLogo"
                        checked={settingsForm.watch('includeLogo')}
                        onCheckedChange={(checked) => settingsForm.setValue('includeLogo', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeQrCode">Include QR Code</Label>
                      <Switch
                        id="includeQrCode"
                        checked={settingsForm.watch('includeQrCode')}
                        onCheckedChange={(checked) => settingsForm.setValue('includeQrCode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoCut">Auto Cut Paper</Label>
                      <Switch
                        id="autoCut"
                        checked={settingsForm.watch('autoCut')}
                        onCheckedChange={(checked) => settingsForm.setValue('autoCut', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="printer" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Printer Configuration</CardTitle>
                  <CardDescription>Configure printer connection settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="printerName">Printer Name</Label>
                    <Input
                      id="printerName"
                      {...printerForm.register('name')}
                      placeholder="XPrinter XP80T"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="printerType">Connection Type</Label>
                    <Select
                      value={printerForm.watch('type')}
                      onValueChange={(value) => printerForm.setValue('type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="network">
                          <div className="flex items-center gap-2">
                            <Wifi className="h-4 w-4" />
                            Network (TCP/IP)
                          </div>
                        </SelectItem>
                        <SelectItem value="usb">
                          <div className="flex items-center gap-2">
                            <Usb className="h-4 w-4" />
                            USB
                          </div>
                        </SelectItem>
                        <SelectItem value="serial">Serial Port</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interface">
                      {selectedPrinterType === 'network' && 'IP Address:Port'}
                      {selectedPrinterType === 'usb' && 'USB Device Path'}
                      {selectedPrinterType === 'serial' && 'Serial Port'}
                    </Label>
                    <Input
                      id="interface"
                      {...printerForm.register('interface')}
                      placeholder={
                        selectedPrinterType === 'network' ? '192.168.1.100:9100' :
                        selectedPrinterType === 'usb' ? 'USB\\VID_0483&PID_5743' :
                        'COM1'
                      }
                    />
                  </div>

                  {selectedPrinterType === 'network' && networkPrinters && (
                    <div className="space-y-2">
                      <Label>Discovered Network Printers</Label>
                      <div className="grid gap-2">
                        {networkPrinters.map((printer, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectNetworkPrinter(printer.interface!)}
                            className="justify-start"
                          >
                            <Wifi className="h-4 w-4 mr-2" />
                            {printer.interface}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="flex-1"
                    >
                      {testingConnection ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>

                  {printerForm.formState.errors.root && (
                    <div className="text-sm text-red-600">
                      {printerForm.formState.errors.root.message}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={isLoading}>
            {isLoading ? 'Printing...' : isReprint ? 'Reprint Bill' : 'Print Bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
