import { Edit3 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import EditEventForm from './EditEventForm';
import { Event } from '../../types';
import { useState } from 'react';

interface EditEventDialogProps {
  event: Event;
  onEventUpdated?: () => void;
}

const EditEventDialog = ({ event, onEventUpdated }: EditEventDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
    onEventUpdated?.();
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="mt-1.5" asChild>
        <Button variant="ghost" size="sm">
          <Edit3 className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0">
        <EditEventForm event={event} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default EditEventDialog;
