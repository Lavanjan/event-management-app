import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';
import { MODAL_SIZES } from '../../constants/theme';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: keyof typeof MODAL_SIZES;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'lg',
  children,
  footer,
  className,
  showCloseButton = true,
  closeOnOverlayClick = true,
}: ModalProps) {
  return (
    <Dialog 
      open={open} 
      onOpenChange={closeOnOverlayClick ? onOpenChange : undefined}
    >
      <DialogContent
        className={cn(
          // Base styles
          'flex flex-col max-h-[90vh] p-0 gap-0',
          // Size variants
          MODAL_SIZES[size],
          // Custom className
          className
        )}
        onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
        hideCloseButton={true}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b border-border shrink-0">
          <div className="flex-1">
            <DialogTitle className="text-xl font-semibold text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 shrink-0 ml-4"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border p-6 shrink-0">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Form Modal variant with common form footer
export interface FormModalProps extends Omit<ModalProps, 'footer'> {
  onSubmit?: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  showCancelButton?: boolean;
}

export function FormModal({
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  submitDisabled = false,
  showCancelButton = true,
  children,
  ...modalProps
}: FormModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      modalProps.onOpenChange(false);
    }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      {showCancelButton && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        disabled={submitDisabled || isSubmitting}
        className="min-w-[100px]"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );

  return (
    <Modal {...modalProps} footer={footer}>
      <form onSubmit={onSubmit} className="space-y-6">
        {children}
      </form>
    </Modal>
  );
}

// Confirmation Modal variant
export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
}: ConfirmationModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        variant={variant === 'destructive' ? 'destructive' : 'default'}
        onClick={onConfirm}
        disabled={isLoading}
        className="min-w-[100px]"
      >
        {isLoading ? 'Processing...' : confirmLabel}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={footer}
      closeOnOverlayClick={!isLoading}
    >
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </Modal>
  );
}
