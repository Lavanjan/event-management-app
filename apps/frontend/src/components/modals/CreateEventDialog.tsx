import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import CreateEventForm from './CreateEventForm';

interface CreateEventDialogProps {
  onEventCreated?: () => void;
}

const CreateEventDialog = ({ onEventCreated }: CreateEventDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
    onEventCreated?.();
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0">
        <CreateEventForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
