import { Edit3 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import EditInventoryForm from './EditInventoryForm';
import { InventoryItem } from '../../types';
import { useState } from 'react';

interface EditInventoryDialogProps {
  item: InventoryItem;
  onInventoryUpdated?: () => void;
}

const EditInventoryDialog = ({ item, onInventoryUpdated }: EditInventoryDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onClose = () => {
    setIsOpen(false);
    onInventoryUpdated?.();
  };

  return (
    <Dialog modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="mt-1.5" asChild>
        <button className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-accent rounded">
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-0">
        <EditInventoryForm item={item} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default EditInventoryDialog;
