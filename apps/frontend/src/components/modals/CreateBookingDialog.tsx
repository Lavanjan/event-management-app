import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import CreateBookingForm from './CreateBookingForm';

interface CreateBookingDialogProps {
  onBookingCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

const CreateBookingDialog = ({
  onBookingCreated,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  showTrigger = true
}: CreateBookingDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOnOpenChange || setInternalOpen;

  const onClose = () => {
    setIsOpen(false);
    onBookingCreated?.();
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Booking
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto border-0">
        <CreateBookingForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateBookingDialog;
