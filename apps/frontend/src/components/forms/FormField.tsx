// @ts-ignore
import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface BaseFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local' | 'time';
  placeholder?: string;
  registration: UseFormRegisterReturn;
  disabled?: boolean;
}

interface TextareaFieldProps extends BaseFieldProps {
  placeholder?: string;
  registration: UseFormRegisterReturn;
  rows?: number;
  disabled?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function InputField({
  label,
  type = 'text',
  placeholder,
  registration,
  error,
  required,
  description,
  disabled,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={registration.name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={registration.name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
        {...registration}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export function TextareaField({
  label,
  placeholder,
  registration,
  error,
  required,
  description,
  rows = 3,
  disabled,
}: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={registration.name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={registration.name}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
        {...registration}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  placeholder,
  options,
  value,
  onValueChange,
  error,
  required,
  description,
  disabled,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled as any} {...({} as any)}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
