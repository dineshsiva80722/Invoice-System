export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  client: Client;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxNumber?: string;
  paymentTerms: number;
  creditLimit: number;
  totalOutstanding: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  rate: number;
  unit: string;
  category: string;
  stockQuantity?: number;
  isService: boolean;
  taxRate: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'paypal' | 'stripe';
  date: string;
  reference?: string;
  notes?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  recentInvoices: Invoice[];
  monthlyRevenue: Array<{ month: string; amount: number }>;
  clientDistribution: Array<{ name: string; value: number }>;
}

// Renamed notification types to avoid conflict with browser's Notification API
export interface AppNotification {
  id: string;
  type: 'email' | 'client' | 'product' | 'system' | 'user';
  status: 'success' | 'failed' | 'pending';
  subject: string;
  recipient?: string;
  content: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  read: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export interface EmailStatus {
  id: string;
  invoiceId: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: string;
}

// User profile types
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  phone?: string;
  department?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileChangeLog {
  id: string;
  userId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Authentication types
export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
  lastLogin?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}