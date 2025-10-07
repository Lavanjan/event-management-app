// Common Components Export
// This file provides a centralized export for all common components

// Modal Components
export {
  Modal,
  FormModal,
  ConfirmationModal,
  type ModalProps,
  type FormModalProps,
  type ConfirmationModalProps,
} from './Modal';

// Form Field Components
export {
  TextField,
  TextareaField,
  SelectField,
  MultiSelectField,
  CheckboxField,
  SwitchField,
  type TextFieldProps,
  type TextareaFieldProps,
  type SelectFieldProps,
  type MultiSelectFieldProps,
  type CheckboxFieldProps,
  type SwitchFieldProps,
  type BaseFieldProps,
  type SelectOption,
} from './FormField';

// Button Components
export {
  Button,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  SuccessButton,
  WarningButton,
  GhostButton,
  LinkButton,
  ButtonGroup,
  IconButton,
  LoadingButton,
  SubmitButton,
  CancelButton,
  type ButtonProps,
  type ButtonGroupProps,
  type IconButtonProps,
  type LoadingButtonProps,
  type SubmitButtonProps,
  type CancelButtonProps,
} from './Button';

// Re-export theme constants for convenience
export { THEME, COLORS, SPACING, TYPOGRAPHY, MODAL_SIZES } from '../../constants/theme';
