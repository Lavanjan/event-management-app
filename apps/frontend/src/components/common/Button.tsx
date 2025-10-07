import React from 'react';
import { Button as UIButton } from '../ui/button';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';
import { COLORS } from '../../constants/theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <UIButton
      variant={variant}
      size={size}
      disabled={isDisabled}
      className={cn(
        // Custom variants
        variant === 'success' && 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        variant === 'warning' && 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
        // Full width
        fullWidth && 'w-full',
        // Custom className
        className
      )}
      {...props}
    >
      {loading && (
        <Loader2 className={cn(
          'animate-spin',
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          (children || loadingText) && 'mr-2'
        )} />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className={cn(
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          children && 'mr-2'
        )}>
          {icon}
        </span>
      )}
      
      {loading ? (loadingText || children) : children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className={cn(
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          children && 'ml-2'
        )}>
          {icon}
        </span>
      )}
    </UIButton>
  );
}

// Specialized button variants for common use cases
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="default" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="outline" {...props} />;
}

export function DangerButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="destructive" {...props} />;
}

export function SuccessButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="success" {...props} />;
}

export function WarningButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="warning" {...props} />;
}

export function GhostButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="ghost" {...props} />;
}

export function LinkButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="link" {...props} />;
}

// Button group component for related actions
export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  className,
}: ButtonGroupProps) {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  };

  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
}

// Icon button component for actions with just icons
export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon'> {
  icon: React.ReactNode;
  'aria-label': string;
  tooltip?: string;
}

export function IconButton({
  icon,
  'aria-label': ariaLabel,
  tooltip,
  size = 'icon',
  ...props
}: IconButtonProps) {
  return (
    <Button
      size={size}
      aria-label={ariaLabel}
      title={tooltip || ariaLabel}
      {...props}
    >
      {icon}
    </Button>
  );
}

// Loading button that shows loading state
export interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean;
  loadingText?: string;
}

export function LoadingButton({
  isLoading,
  loadingText = 'Loading...',
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      loading={isLoading}
      loadingText={loadingText}
      {...props}
    >
      {children}
    </Button>
  );
}

// Submit button for forms
export interface SubmitButtonProps extends Omit<ButtonProps, 'type'> {
  isSubmitting?: boolean;
  submittingText?: string;
}

export function SubmitButton({
  isSubmitting = false,
  submittingText = 'Submitting...',
  children = 'Submit',
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      loading={isSubmitting}
      loadingText={submittingText}
      {...props}
    >
      {children}
    </Button>
  );
}

// Cancel button for forms and modals
export interface CancelButtonProps extends Omit<ButtonProps, 'variant' | 'type'> {
  onCancel?: () => void;
}

export function CancelButton({
  onCancel,
  children = 'Cancel',
  onClick,
  ...props
}: CancelButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}

export default Button;
