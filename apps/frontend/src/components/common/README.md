# Common Components Library

This directory contains reusable, consistent UI components that follow our design system. All components use the centralized theme constants and provide a consistent user experience across the application.

## 🎨 Design System

### Primary Color
- **Primary Color**: `#14A76C` (Green)
- **Theme**: Defined in `src/constants/theme.ts`
- **Usage**: All components automatically use the primary color from the theme

### Component Philosophy
- **Consistent**: All components follow the same design patterns
- **Accessible**: Built with accessibility in mind
- **Responsive**: Mobile-first design approach
- **Composable**: Components can be combined to create complex UIs

## 📦 Available Components

### Modal Components

#### `Modal`
Basic modal component with proper scrolling and overlay handling.

```tsx
import { Modal } from '@/components/common';

<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Modal Title"
  description="Optional description"
  size="lg"
>
  <p>Modal content goes here</p>
</Modal>
```

#### `FormModal`
Modal specifically designed for forms with built-in submit/cancel buttons.

```tsx
import { FormModal } from '@/components/common';

<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Create Item"
  onSubmit={handleSubmit}
  isSubmitting={loading}
  submitLabel="Create"
>
  <TextField label="Name" value={name} onChange={setName} />
</FormModal>
```

#### `ConfirmationModal`
Modal for confirmation dialogs.

```tsx
import { ConfirmationModal } from '@/components/common';

<ConfirmationModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Delete Item"
  description="Are you sure you want to delete this item?"
  onConfirm={handleDelete}
  variant="destructive"
/>
```

### Form Field Components

#### `TextField`
Text input with label, validation, and error handling.

```tsx
import { TextField } from '@/components/common';

<TextField
  label="Email Address"
  type="email"
  value={email}
  onChange={setEmail}
  placeholder="john@example.com"
  required
  error={errors.email}
/>
```

#### `SelectField`
Dropdown select with options.

```tsx
import { SelectField } from '@/components/common';

<SelectField
  label="Country"
  value={country}
  onChange={setCountry}
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
  required
/>
```

#### `MultiSelectField`
Multi-select dropdown with search functionality.

```tsx
import { MultiSelectField } from '@/components/common';

<MultiSelectField
  label="Permissions"
  value={selectedPermissions}
  onChange={setSelectedPermissions}
  options={permissionOptions}
  placeholder="Select permissions"
  searchPlaceholder="Search permissions..."
/>
```

#### `CheckboxField`
Checkbox with label and description.

```tsx
import { CheckboxField } from '@/components/common';

<CheckboxField
  label="I agree to the terms"
  checked={agreed}
  onChange={setAgreed}
  description="By checking this, you agree to our terms of service"
/>
```


### Button Components

#### `Button` (Primary)
Main button component with loading states and icons.

```tsx
import { Button } from '@/components/common';

<Button
  variant="default"
  size="md"
  loading={isLoading}
  icon={<Plus />}
  onClick={handleClick}
>
  Create Item
</Button>
```

#### Specialized Button Variants

```tsx
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton,
  SuccessButton,
  SubmitButton,
  CancelButton 
} from '@/components/common';

<PrimaryButton onClick={handleSave}>Save</PrimaryButton>
<SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
<DangerButton onClick={handleDelete}>Delete</DangerButton>
<SuccessButton onClick={handleApprove}>Approve</SuccessButton>

{/* Form-specific buttons */}
<SubmitButton isSubmitting={loading}>Submit Form</SubmitButton>
<CancelButton onCancel={() => setIsOpen(false)}>Cancel</CancelButton>
```

#### `ButtonGroup`
Group related buttons together.

```tsx
import { ButtonGroup, Button } from '@/components/common';

<ButtonGroup orientation="horizontal" spacing="sm">
  <Button variant="outline">Cancel</Button>
  <Button variant="default">Save</Button>
  <Button variant="destructive">Delete</Button>
</ButtonGroup>
```

## 🎯 Usage Guidelines

### 1. Import from Common Index
Always import from the common index file:

```tsx
// ✅ Good
import { Modal, TextField, Button } from '@/components/common';

// ❌ Avoid
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/common/FormField';
```

### 2. Use Consistent Sizing
Stick to the predefined sizes:

```tsx
// Modal sizes: 'sm', 'md', 'lg', 'xl', '2xl'
<Modal size="lg" />

// Button sizes: 'sm', 'default', 'lg', 'icon'
<Button size="default" />
```

### 3. Form Validation Pattern
Use consistent error handling:

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

<TextField
  label="Email"
  value={email}
  onChange={setEmail}
  error={errors.email}
  required
/>
```

### 4. Loading States
Always provide loading feedback:

```tsx
<FormModal
  isSubmitting={loading}
  submitLabel="Creating..."
>
  {/* form content */}
</FormModal>

<Button loading={isLoading} loadingText="Saving...">
  Save Changes
</Button>
```

## 🔧 Customization

### Theme Integration
All components automatically use the centralized theme:

```tsx
import { THEME, COLORS } from '@/components/common';

// Access theme values
const primaryColor = COLORS.primary.main; // #14A76C
const spacing = THEME.spacing.md; // 1rem
```

### Custom Styling
Use the `className` prop for additional styling:

```tsx
<TextField
  label="Custom Field"
  className="mb-6"
  // ... other props
/>

<Modal
  title="Custom Modal"
  className="custom-modal-styles"
  // ... other props
/>
```

## 🚀 Best Practices

1. **Consistency**: Always use these common components instead of creating custom ones
2. **Accessibility**: Components include proper ARIA labels and keyboard navigation
3. **Responsive**: All components work on mobile and desktop
4. **Performance**: Components are optimized and use React best practices
5. **Type Safety**: Full TypeScript support with proper type definitions

## 📱 Mobile Considerations

All components are mobile-responsive:
- Modals adjust to screen size with proper scrolling
- Form fields stack appropriately on small screens
- Buttons have touch-friendly sizes
- Text scales appropriately

## 🔍 Testing

Components include proper test IDs and accessibility attributes for testing:

```tsx
<Button data-testid="submit-button">Submit</Button>
<TextField aria-label="Email input" />
```

## 🆕 Adding New Components

When adding new common components:

1. Follow the existing patterns and naming conventions
2. Include proper TypeScript types
3. Add to the index.ts export file
4. Update this README with usage examples
5. Ensure mobile responsiveness
6. Include accessibility features

## 📚 Related Files

- `src/constants/theme.ts` - Theme constants and design tokens
- `src/components/ui/` - Base UI components (shadcn/ui)
- `src/utils/cn.ts` - Class name utility function
