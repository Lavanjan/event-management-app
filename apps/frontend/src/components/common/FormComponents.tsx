import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../utils/cn';

// Standard form field wrapper
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ 
  label, 
  required, 
  error, 
  description, 
  children, 
  className 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

// Standard input with consistent styling
interface StandardInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  description?: string;
}

export function StandardInput({ 
  label, 
  required, 
  error, 
  description, 
  className,
  ...props 
}: StandardInputProps) {
  if (label) {
    return (
      <FormField label={label} required={required} error={error} description={description}>
        <Input className={cn("h-10", className)} {...props} />
      </FormField>
    );
  }
  
  return <Input className={cn("h-10", className)} {...props} />;
}

// Standard textarea with consistent styling
interface StandardTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
  description?: string;
}

export function StandardTextarea({ 
  label, 
  required, 
  error, 
  description, 
  className,
  ...props 
}: StandardTextareaProps) {
  if (label) {
    return (
      <FormField label={label} required={required} error={error} description={description}>
        <Textarea className={cn("min-h-[80px]", className)} {...props} />
      </FormField>
    );
  }
  
  return <Textarea className={cn("min-h-[80px]", className)} {...props} />;
}

// Standard select with consistent styling
interface StandardSelectProps {
  label?: string;
  required?: boolean;
  error?: string;
  description?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function StandardSelect({ 
  label, 
  required, 
  error, 
  description, 
  placeholder,
  value,
  onValueChange,
  children,
  className 
}: StandardSelectProps) {
  const selectComponent = (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("h-10", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );

  if (label) {
    return (
      <FormField label={label} required={required} error={error} description={description}>
        {selectComponent}
      </FormField>
    );
  }
  
  return selectComponent;
}

// Standard checkbox with consistent styling
interface StandardCheckboxProps {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  description?: string;
  className?: string;
}

export function StandardCheckbox({ 
  label, 
  checked, 
  onCheckedChange, 
  description,
  className 
}: StandardCheckboxProps) {
  return (
    <div className={cn("flex items-top space-x-2", className)}>
      <Checkbox 
        checked={checked} 
        onCheckedChange={onCheckedChange}
        className="mt-1"
      />
      <div className="grid gap-1.5 leading-none">
        <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

// Standard form buttons
interface FormButtonsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  className?: string;
}

export function FormButtons({
  onCancel,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isSubmitting = false,
  submitDisabled = false,
  className
}: FormButtonsProps) {
  return (
    <div className={cn("flex justify-end space-x-2 pt-4", className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>
      )}
      {onSubmit && (
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={isSubmitting || submitDisabled}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? 'Saving...' : submitText}
        </Button>
      )}
    </div>
  );
}

// Standard form card wrapper
interface FormCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormCard({ title, description, children, className }: FormCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

// Standard status badge
interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
