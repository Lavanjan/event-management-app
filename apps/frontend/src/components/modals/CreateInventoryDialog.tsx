import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import CreateInventoryForm from './CreateInventoryForm';

interface CreateInventoryDialogProps {
  onInventoryCreated?: () => void;
}

const CreateInventoryDialog = ({ onInventoryCreated }: CreateInventoryDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
    onInventoryCreated?.();
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0">
        <CreateInventoryForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateInventoryDialog;
