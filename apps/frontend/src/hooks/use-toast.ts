import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/uiSlice';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
  const dispatch = useDispatch();

  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    const type = variant === 'destructive' ? 'error' : variant === 'success' ? 'success' : 'info';

    dispatch(addNotification({
      type,
      title,
      message: description || '',
    }));
  };

  return { toast };
}
