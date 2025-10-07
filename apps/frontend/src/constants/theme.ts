/**
 * Centralized Theme Constants
 * Contains all design system constants including colors, spacing, typography, etc.
 */

// Primary Brand Colors
export const COLORS = {
  primary: {
    main: '#14A76C',
    light: '#16C77B',
    dark: '#0F8A56',
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#14A76C',
    600: '#0F8A56',
    700: '#0D7548',
    800: '#0A5F3A',
    900: '#084A2C',
  },
  secondary: {
    main: '#6b7280',
    light: '#9ca3af',
    dark: '#374151',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

// Spacing Scale (in rem)
export const SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px
} as const;

// Typography Scale
export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// Border Radius
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

// Shadows
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// Z-Index Scale
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation Durations
export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// Component Sizes
export const COMPONENT_SIZES = {
  button: {
    sm: {
      height: '2rem',
      padding: '0 0.75rem',
      fontSize: TYPOGRAPHY.fontSize.sm,
    },
    md: {
      height: '2.5rem',
      padding: '0 1rem',
      fontSize: TYPOGRAPHY.fontSize.base,
    },
    lg: {
      height: '3rem',
      padding: '0 1.5rem',
      fontSize: TYPOGRAPHY.fontSize.lg,
    },
  },
  input: {
    sm: {
      height: '2rem',
      padding: '0 0.75rem',
      fontSize: TYPOGRAPHY.fontSize.sm,
    },
    md: {
      height: '2.5rem',
      padding: '0 0.75rem',
      fontSize: TYPOGRAPHY.fontSize.base,
    },
    lg: {
      height: '3rem',
      padding: '0 1rem',
      fontSize: TYPOGRAPHY.fontSize.lg,
    },
  },
} as const;

// Modal Sizes
export const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  '3xl': 'max-w-7xl',
  '4xl': 'max-w-[90vw]',
  full: 'max-w-full',
} as const;

// Common CSS Classes
export const CSS_CLASSES = {
  // Layout
  container: 'mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',
  
  // Flexbox
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexCol: 'flex flex-col',
  
  // Grid
  gridCols: {
    1: 'grid grid-cols-1',
    2: 'grid grid-cols-1 md:grid-cols-2',
    3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  },
  
  // Text
  textCenter: 'text-center',
  textLeft: 'text-left',
  textRight: 'text-right',
  
  // Transitions
  transition: 'transition-all duration-300 ease-in-out',
  transitionFast: 'transition-all duration-150 ease-in-out',
  
  // Focus
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  
  // Hover
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  
  // Disabled
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

// Export all constants as a single object for convenience
export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  zIndex: Z_INDEX,
  breakpoints: BREAKPOINTS,
  animation: ANIMATION,
  componentSizes: COMPONENT_SIZES,
  modalSizes: MODAL_SIZES,
  cssClasses: CSS_CLASSES,
} as const;

export default THEME;
