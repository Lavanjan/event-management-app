import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/uiSlice';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function toast({ title, description, variant = 'default' }: ToastProps) {
  // This is a simple implementation that uses the notification system
  // In a real app, you might want to use a dedicated toast library
  const dispatch = useDispatch();
  
  const type = variant === 'destructive' ? 'error' : variant === 'success' ? 'success' : 'info';
  
  dispatch(addNotification({
    type,
    title,
    message: description || '',
  }));
}

export function useToast() {
  return { toast };
}
