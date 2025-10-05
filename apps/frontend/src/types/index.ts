// User Types
export enum UserType {
  PRODUCT_ADMIN = 'product_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  ORGANIZATION_USER = 'organization_user',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  organizationId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions: Permission[];
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  brand?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
  quantityUnit: string;
  lowStockThreshold: number;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Event Types
export interface Event {
  id: string;
  name: string;
  description?: string;
  location?: string; // Venue/Hall name (e.g., "Wedding Hall", "Conference Room")
  maxAttendees?: number;
  hourlyPrice?: number; // Price per hour
  halfDayPrice?: number; // Price for half day (4-6 hours)
  fullDayPrice?: number; // Price for full day (8-12 hours)
  requiredAdvancePercentage: number;
  balancePaymentWindowDays: number;
  allowInventoryAllocation: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Deprecated fields (kept for backward compatibility)
  startDate?: Date;
  endDate?: Date;
}

// Booking Types
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  STARTED = 'started',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  ADVANCE_PAID = 'advance_paid',
  FULLY_PAID = 'fully_paid',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded',
}

export interface Booking {
  id: string;
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startDate: Date; // Booking start date and time
  endDate: Date; // Booking end date and time
  durationHours?: number; // Duration in hours (for hourly bookings)
  durationType: 'hourly' | 'half_day' | 'full_day'; // Duration type for pricing
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  advanceDueDate: Date;
  balanceDueDate: Date;
  totalExpenses: number;
  totalRevenues: number;
  profitLoss: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  event?: Event;
  inventoryAllocations?: BookingInventoryAllocation[];
  expenses?: BookingExpense[];
  revenues?: BookingRevenue[];
}

export interface BookingInventoryAllocation {
  id: string;
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  inventoryItem?: InventoryItem;
}

export interface BookingExpense {
  id: string;
  bookingId: string;
  name: string;
  amount: number;
  category?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingRevenue {
  id: string;
  bookingId: string;
  name: string;
  amount: number;
  category?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO Types
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  isActive: boolean;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface CreateInventoryItemDto {
  name: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  quantityUnit: string;
  lowStockThreshold?: number;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryItemDto {
  name?: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  sku?: string;
  unitPrice?: number;
  quantity?: number;
  quantityUnit?: string;
  lowStockThreshold?: number;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface CreateEventDto {
  name: string;
  description?: string;
  location?: string; // Venue/Hall name
  maxAttendees?: number;
  hourlyPrice?: number; // Price per hour
  halfDayPrice?: number; // Price for half day (4-6 hours)
  fullDayPrice?: number; // Price for full day (8-12 hours)
  requiredAdvancePercentage?: number;
  balancePaymentWindowDays?: number;
  allowInventoryAllocation?: boolean;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  location?: string;
  maxAttendees?: number;
  hourlyPrice?: number;
  halfDayPrice?: number;
  fullDayPrice?: number;
  requiredAdvancePercentage?: number;
  balancePaymentWindowDays?: number;
  allowInventoryAllocation?: boolean;
  isActive?: boolean;
}

export interface CreateBookingDto {
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startDate: Date | string; // Booking start date and time
  endDate: Date | string; // Booking end date and time
  durationType: 'hourly' | 'half_day' | 'full_day'; // Duration type for pricing
  durationHours?: number; // Duration in hours (required for hourly bookings)
  halfDaySlot?: 'morning' | 'evening'; // Half day slot (required for half_day bookings)
  notes?: string;
  inventoryAllocations?: {
    inventoryItemId: string;
    quantity: number;
  }[];
  expenses?: {
    name: string;
    amount: number;
    category?: string;
    description?: string;
  }[];
  revenues?: {
    name: string;
    amount: number;
    category?: string;
    description?: string;
  }[];
}

export interface UpdateBookingDto {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface AddExpenseDto {
  name: string;
  amount: number;
  category?: string;
  description?: string;
}

export interface AddRevenueDto {
  name: string;
  amount: number;
  category?: string;
  description?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  upcomingEvents: number;
  lowStockItems: number;
  revenueGrowth: number;
  bookingsGrowth: number;
  eventsGrowth: number;
  inventoryGrowth: number;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  createdAt: Date;
}

// Financial Types
export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByMonth: { month: string; revenue: number }[];
  expensesByCategory: { category: string; amount: number }[];
  topEvents: { eventName: string; revenue: number }[];
}

// Document Types
export * from './document';
