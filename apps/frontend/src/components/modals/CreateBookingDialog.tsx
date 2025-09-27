import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import CreateBookingForm from './CreateBookingForm';

interface CreateBookingDialogProps {
  onBookingCreated?: () => void;
}

const CreateBookingDialog = ({ onBookingCreated }: CreateBookingDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
    onBookingCreated?.();
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border-0">
        <CreateBookingForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateBookingDialog;
