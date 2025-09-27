import { Edit3 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import EditBookingForm from './EditBookingForm';
import { Booking } from '../../types';
import { useState } from 'react';

interface EditBookingDialogProps {
  booking: Booking;
  onBookingUpdated?: () => void;
}

const EditBookingDialog = ({ booking, onBookingUpdated }: EditBookingDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
    onBookingUpdated?.();
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="mt-1.5" asChild>
        <button className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded">
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border-0">
        <EditBookingForm booking={booking} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingDialog;
