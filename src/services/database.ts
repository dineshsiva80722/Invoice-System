import { Client, Product, Invoice, Payment } from '../types';

interface DatabaseConfig {
  apiUrl: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class DatabaseService {
  private config: DatabaseConfig;
  private isConnected: boolean = false;
  private static instance: DatabaseService;

  private constructor() {
    // Use Vite's environment variables
    this.config = {
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    };
  }

  // Singleton pattern to ensure single instance
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Check if database is connected
  isDbConnected(): boolean {
    return this.isConnected;
  }

  // Initialize database connection
  async connect(): Promise<boolean> {
    try {
      console.log('Connecting to MongoDB Atlas...');
      
      // Test the backend API connection
      const response = await fetch(`${this.config.apiUrl}/test`);
      if (!response.ok) throw new Error('API connection failed');
      
      const result = await response.json();
      
      if (result.success) {
        this.isConnected = true;
        console.log('Successfully connected to MongoDB Atlas!');
        console.log('Database:', result.database);
        console.log('Collections:', result.collections);
        return true;
      }
      
      throw new Error(result.error || 'Connection failed');
    } catch (error) {
      console.error('MongoDB Atlas connection failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Helper function for API requests with better error handling
  private async fetchWithRetry<T>(url: string, options: RequestInit = {}): Promise<T> {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'API request failed');
        }
        
        return data.data;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          console.error(`Failed to fetch ${url} after ${maxRetries} retries:`, error);
          throw new Error(`Failed to complete request after ${maxRetries} retries: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // CLIENT CRUD OPERATIONS
  async saveClient(client: Partial<Client>): Promise<Client> {
    try {
      const response = await this.fetchWithRetry<Client>(`${this.config.apiUrl}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client)
      });
      return response;
    } catch (error) {
      console.error('Failed to save client:', error);
      throw error;
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      const response = await this.fetchWithRetry<Client[]>(`${this.config.apiUrl}/clients`);
      return response || [];
    } catch (error) {
      console.error('Failed to get clients:', error);
      return [];
    }
  }

  async deleteClient(clientId: string): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/clients/${clientId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Failed to delete client:', error);
      return false;
    }
  }

  // PRODUCT CRUD OPERATIONS
  async saveProduct(product: Partial<Product>): Promise<Product> {
    try {
      const response = await this.fetchWithRetry<Product>(`${this.config.apiUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product)
      });
      return response;
    } catch (error) {
      console.error('Failed to save product:', error);
      throw error;
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      const response = await this.fetchWithRetry<Product[]>(`${this.config.apiUrl}/products`);
      return response || [];
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/products/${productId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Failed to delete product:', error);
      return false;
    }
  }

  // INVOICE CRUD OPERATIONS
  async saveInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await this.fetchWithRetry<Invoice>(`${this.config.apiUrl}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice)
      });
      return response;
    } catch (error) {
      console.error('Failed to save invoice:', error);
      throw error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      const response = await this.fetchWithRetry<Invoice[]>(`${this.config.apiUrl}/invoices`);
      return response || [];
    } catch (error) {
      console.error('Failed to get invoices:', error);
      return [];
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await this.fetchWithRetry<Invoice>(`${this.config.apiUrl}/invoices/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
      return response;
    } catch (error) {
      console.error('Failed to update invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/invoices/${invoiceId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      return false;
    }
  }

  // PAYMENT CRUD OPERATIONS
  async savePayment(payment: Partial<Payment>): Promise<Payment> {
    try {
      const response = await this.fetchWithRetry<Payment>(`${this.config.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment)
      });
      return response;
    } catch (error) {
      console.error('Failed to save payment:', error);
      throw error;
    }
  }

  async getPayments(): Promise<Payment[]> {
    try {
      const response = await this.fetchWithRetry<Payment[]>(`${this.config.apiUrl}/payments`);
      return response || [];
    } catch (error) {
      console.error('Failed to get payments:', error);
      return [];
    }
  }

  async deletePayment(paymentId: string): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/payments/${paymentId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Failed to delete payment:', error);
      return false;
    }
  }

  // CONNECTION INFO
  async getConnectionInfo(): Promise<any> {
    try {
      const response = await this.fetchWithRetry<any>(`${this.config.apiUrl}/connection`);
      return response;
    } catch (error) {
      console.error('Failed to get connection info:', error);
      return null;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
export type { DatabaseConfig };