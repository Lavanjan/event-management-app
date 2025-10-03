export interface InventoryAllocation {
  inventoryItemId: string;
  quantity: number;
  notes?: string;
}

export interface CustomField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
}

export interface ReminderSettings {
  enabled: boolean;
  daysBefore: number[];
}

export interface TemplateSettings {
  emailNotifications?: boolean;
  reminderSettings?: ReminderSettings;
  customFields?: CustomField[];
}

export interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  defaultDurationHours: number;
  defaultCapacity?: number;
  defaultLocation?: string;
  defaultHourlyPrice?: number;
  defaultHalfDayPrice?: number;
  defaultFullDayPrice?: number;
  requiredAdvancePercentage: number;
  balancePaymentWindowDays: number;
  allowInventoryAllocation: boolean;
  requireApproval: boolean;
  autoConfirm: boolean;
  requiredInventory?: string[];
  defaultInventoryAllocations?: InventoryAllocation[];
  templateSettings?: TemplateSettings;
  usageCount: number;
  lastUsedAt?: string;
  organizationId: string;
  isActive: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  events?: any[]; // Related events
  totalEvents?: number;
  averageRating?: number;
  estimatedRevenue?: number;
}

export interface CreateEventTemplateDto {
  name: string;
  description?: string;
  category?: string;
  defaultDurationHours: number;
  defaultCapacity?: number;
  defaultLocation?: string;
  defaultHourlyPrice?: number;
  defaultHalfDayPrice?: number;
  defaultFullDayPrice?: number;
  requiredAdvancePercentage: number;
  balancePaymentWindowDays: number;
  allowInventoryAllocation?: boolean;
  requireApproval?: boolean;
  autoConfirm?: boolean;
  requiredInventory?: string[];
  defaultInventoryAllocations?: InventoryAllocation[];
  templateSettings?: TemplateSettings;
  isPublic?: boolean;
}

export interface UpdateEventTemplateDto {
  name?: string;
  description?: string;
  category?: string;
  defaultDurationHours?: number;
  defaultCapacity?: number;
  defaultLocation?: string;
  defaultHourlyPrice?: number;
  defaultHalfDayPrice?: number;
  defaultFullDayPrice?: number;
  requiredAdvancePercentage?: number;
  balancePaymentWindowDays?: number;
  allowInventoryAllocation?: boolean;
  requireApproval?: boolean;
  autoConfirm?: boolean;
  requiredInventory?: string[];
  defaultInventoryAllocations?: InventoryAllocation[];
  templateSettings?: TemplateSettings;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface CreateEventFromTemplateDto {
  name: string;
  description?: string;
  location?: string;
  maxAttendees?: number;
  hourlyPrice?: number;
  halfDayPrice?: number;
  fullDayPrice?: number;
}

export interface EventTemplateFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  includePublic?: boolean;
}

export interface EventTemplateStats {
  totalTemplates: number;
  totalUsage: number;
  mostUsedTemplate: string;
  categoryStats: Record<string, number>;
  usageStats: Array<{
    templateId: string;
    name: string;
    usageCount: number;
    category?: string;
    lastUsed?: string;
  }>;
  recentlyCreated: number;
  averageCapacity: number;
}

export interface PaginatedEventTemplates {
  data: EventTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
