// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  roleIds: string[];
  sendEmail?: boolean;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryItemRequest {
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  description?: string;
  unitPrice?: number;
  quantity?: number;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

// Event Types
export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  maxAttendees?: number;
  requiredAdvancePercentage: number;
  balancePaymentWindowDays: number;
  allowInventoryAllocation: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  maxAttendees?: number;
  requiredAdvancePercentage: number;
  balancePaymentWindowDays: number;
  allowInventoryAllocation: boolean;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  maxAttendees?: number;
  requiredAdvancePercentage?: number;
  balancePaymentWindowDays?: number;
  allowInventoryAllocation?: boolean;
  isActive?: boolean;
}

// Booking Types
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
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
  event?: Event;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  advanceDueDate: Date;
  balanceDueDate: Date;
  inventoryAllocations: BookingInventoryAllocation[];
  expenses: BookingExpense[];
  revenues: BookingRevenue[];
  totalExpenses: number;
  totalRevenues: number;
  profitLoss: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingInventoryAllocation {
  id: string;
  bookingId: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
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

export interface CreateBookingRequest {
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  inventoryAllocations: {
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
  notes?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path: string;
}
