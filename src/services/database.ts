// import { Client, Product, Invoice, Payment } from '../types';

// interface DatabaseConfig {
//   apiUrl: string;
// }

// class DatabaseService {
//   private config: DatabaseConfig;
//   private isConnected: boolean = false;
//   private static instance: DatabaseService;

//   private constructor() {
//     // Use Vite's environment variables
//     this.config = {
//       apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
//     };
    
//     // For Vercel deployment, we need to use relative URLs
//     if (typeof window !== 'undefined' && this.config.apiUrl.startsWith('/')) {
//       this.config.apiUrl = window.location.origin + this.config.apiUrl;
//     }
//   }

//   // Singleton pattern to ensure single instance
//   public static getInstance(): DatabaseService {
//     if (!DatabaseService.instance) {
//       DatabaseService.instance = new DatabaseService();
//     }
//     return DatabaseService.instance;
//   }

//   // Check if database is connected
//   isDbConnected(): boolean {
//     return this.isConnected;
//   }

//   // Initialize database connection
//   async connect(): Promise<boolean> {
//     try {
//       console.log('Connecting to MongoDB Atlas...');
      
//       // Test the backend API connection
//       const response = await fetch(`${this.config.apiUrl}/test`);
//       if (!response.ok) throw new Error('API connection failed');
      
//       const result = await response.json();
      
//       if (result.success) {
//         this.isConnected = true;
//         console.log('Successfully connected to MongoDB Atlas!');
//         console.log('Database:', result.database);
//         console.log('Collections:', result.collections);
//         return true;
//       }
      
//       throw new Error(result.error || 'Connection failed');
//     } catch (error) {
//       console.error('MongoDB Atlas connection failed:', error);
//       this.isConnected = false;
//       return false;
//     }
//   }

//   // Helper function for API requests with better error handling
//   private async fetchWithRetry<T>(url: string, options: RequestInit = {}): Promise<T> {
//     const maxRetries = 3;
//     let retries = 0;
//     let lastError: Error | null = null;

//     while (retries < maxRetries) {
//       try {
//         console.log(`[${new Date().toISOString()}] Attempting request to ${url} (attempt ${retries + 1}/${maxRetries})`);
//         const response = await fetch(url, {
//           ...options,
//           headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json',
//             ...(options.headers || {})
//           }
//         });

//         // Check if response is JSON
//         const contentType = response.headers.get('content-type');
//         const isJson = contentType?.includes('application/json');
        
//         if (!response.ok) {
//           let errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
          
//           try {
//             // Try to get error message from response
//             const errorData = isJson ? await response.json() : await response.text();
//             if (isJson && errorData?.error) {
//               errorMessage = errorData.error;
//             } else if (!isJson) {
//               // If not JSON, include the first 200 chars of the response
//               const responseText = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
//               errorMessage = `Expected JSON but got: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`;
//             }
//           } catch (e) {
//             console.error('Error parsing error response:', e);
//           }
          
//           throw new Error(errorMessage);
//         }
        
//         // If successful, parse response
//         try {
//           const data = isJson ? await response.json() : await response.text();
          
//           if (isJson && data && typeof data === 'object' && 'success' in data) {
//             if (!data.success) {
//               throw new Error(data.error || 'API request failed');
//             }
//             return data.data;
//           }
          
//           // If we get here, the response doesn't match our expected format
//           return data as T;
//         } catch (e) {
//           console.error('Error parsing response:', e);
//           throw new Error('Failed to parse server response');
//         }
//       } catch (error) {
//         retries++;
//         lastError = error instanceof Error ? error : new Error(String(error));
        
//         if (retries >= maxRetries) {
//           console.error(`Failed to fetch ${url} after ${maxRetries} retries:`, lastError);
//           throw new Error(`Failed to complete request after ${maxRetries} retries: ${lastError.message}`);
//         }
        
//         // Exponential backoff
//         const delay = 1000 * Math.pow(2, retries);
//         console.log(`Request failed, retrying in ${delay}ms...`, error);
//         await new Promise(resolve => setTimeout(resolve, delay));
//       }
//     }
    
//     throw lastError || new Error('Max retries exceeded');
//   }

//   // SETTINGS
//   async getSettings() {
//     try {
//       const stored = localStorage.getItem('invoicepro_settings');
//       if (stored) {
//         return JSON.parse(stored);
//       }
//       return null;
//     } catch (error) {
//       console.error('Failed to load settings:', error);
//       return null;
//     }
//   }

//   async saveSettings(settings: any) {
//     try {
//       localStorage.setItem('invoicepro_settings', JSON.stringify(settings));
//       return true;
//     } catch (error) {
//       console.error('Failed to save settings:', error);
//       return false;
//     }
//   }

//   // DASHBOARD STATS
//   async getDashboardStats() {
//     try {
//       // Fetch all necessary data
//       const [invoices, clients] = await Promise.all([
//         this.getInvoices(),
//         this.getClients()
//       ]);

//       // Calculate statistics
//       const totalInvoices = invoices.length;
//       const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
//       const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length;
//       const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
      
//       const totalRevenue = invoices
//         .filter(inv => inv.status === 'paid')
//         .reduce((sum, inv) => sum + (inv.total || 0), 0);
        
//       const outstandingAmount = invoices
//         .filter(inv => ['sent', 'overdue'].includes(inv.status))
//         .reduce((sum, inv) => sum + (inv.total || 0), 0);
        
//       const overdueAmount = invoices
//         .filter(inv => inv.status === 'overdue')
//         .reduce((sum, inv) => sum + (inv.total || 0), 0);

//       return {
//         totalRevenue,
//         outstandingAmount,
//         overdueAmount,
//         totalInvoices,
//         paidInvoices,
//         pendingInvoices,
//         overdueInvoices,
//         totalClients: clients.length
//       };
//     } catch (error) {
//       console.error('Failed to get dashboard stats:', error);
//       // Return default values in case of error
//       return {
//         totalRevenue: 0,
//         outstandingAmount: 0,
//         overdueAmount: 0,
//         totalInvoices: 0,
//         paidInvoices: 0,
//         pendingInvoices: 0,
//         overdueInvoices: 0,
//         totalClients: 0
//       };
//     }
//   }

//   // CLIENT CRUD OPERATIONS
//   async saveClient(client: Partial<Client>): Promise<Client> {
//     try {
//       const response = await this.fetchWithRetry<Client>(`${this.config.apiUrl}/clients`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(client)
//       });
//       return response;
//     } catch (error) {
//       console.error('Failed to save client:', error);
//       throw error;
//     }
//   }

//   async getClients(): Promise<Client[]> {
//     try {
//       console.log('Fetching clients from:', `${this.config.apiUrl}/clients`);
//       const response = await fetch(`${this.config.apiUrl}/clients`);
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const result = await response.json();
//       console.log('Raw clients response:', result);
      
//       // Handle different response formats
//       if (Array.isArray(result)) {
//         return result;
//       } else if (result && Array.isArray(result.data)) {
//         return result.data;
//       } else if (result && result.success && Array.isArray(result.data)) {
//         return result.data;
//       }
      
//       console.error('Unexpected clients response format:', result);
//       return [];
//     } catch (error) {
//       console.error('Failed to get clients:', error);
//       return [];
//     }
//   }

//   async deleteClient(clientId: string): Promise<boolean> {
//     try {
//       console.log(`Attempting to delete client with ID: ${clientId}`);
      
//       const response = await fetch(
//         `${this.config.apiUrl}/clients/${clientId}`, 
//         {
//           method: 'DELETE',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         }
//       );
      
//       const result = await response.json();
//       console.log('Delete client response:', result);
      
//       // Handle different response formats
//       if (result && result.success === true) {
//         console.log('Client deleted successfully');
//         return true;
//       } else if (result && result.success === false) {
//         console.error('Server reported failure:', result.error || 'No error message provided');
//         return false;
//       }
      
//       // Fallback for different response formats
//       if (response.ok) {
//         console.log('Client deleted successfully (fallback check)');
//         return true;
//       }
      
//       console.error('Unexpected response format:', result);
//       return false;
      
//     } catch (error) {
//       console.error('Failed to delete client:', error);
//       if (error instanceof Error) {
//         console.error('Error details:', error.message);
//       }
//       return false;
//     }
//   }

//   // PRODUCT CRUD OPERATIONS
//   async saveProduct(product: Partial<Product>): Promise<Product> {
//     try {
//       const response = await this.fetchWithRetry<Product>(`${this.config.apiUrl}/products`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(product)
//       });
//       return response;
//     } catch (error) {
//       console.error('Failed to save product:', error);
//       throw error;
//     }
//   }

//   async getProducts(): Promise<Product[]> {
//     try {
//       const response = await this.fetchWithRetry<Product[]>(`${this.config.apiUrl}/products`);
//       return response || [];
//     } catch (error) {
//       console.error('Failed to get products:', error);
//       return [];
//     }
//   }

//   async deleteProduct(productId: string): Promise<boolean> {
//     try {
//       const response = await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/products/${productId}`, {
//         method: 'DELETE'
//       });
//       return response;
//     } catch (error) {
//       console.error('Failed to delete product:', error);
//       return false;
//     }
//   }

//   // INVOICE CRUD OPERATIONS
//   async saveInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
//     try {
//       const response = await this.fetchWithRetry<Invoice>(`${this.config.apiUrl}/invoices`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(invoice)
//       });
//       return response;
//     } catch (error) {
//       console.error('Failed to save invoice:', error);
//       throw error;
//     }
//   }

//   async getInvoices(): Promise<Invoice[]> {
//     try {
//       const response = await this.fetchWithRetry<Invoice[]>(`${this.config.apiUrl}/invoices`);
//       return response || [];
//     } catch (error) {
//       console.error('Failed to get invoices:', error);
//       return [];
//     }
//   }

//   async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
//     if (!id) {
//       throw new Error('Invoice ID is required for update');
//     }
    
//     console.log(`Attempting to update invoice ${id} with:`, updates);
    
//     try {
//       // Try to update the invoice directly
//       const response = await this.fetchWithRetry<Invoice>(`${this.config.apiUrl}/invoices/${id}`, {
//         method: 'PATCH',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(updates)
//       });
//       console.log(`Successfully updated invoice ${id}`);
//       return response;
//     } catch (error: unknown) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       if (errorMessage.includes('404') || errorMessage.includes('not found')) {
//         console.error(`Invoice with ID ${id} not found`);
//         throw new Error(`Cannot update: Invoice with ID ${id} does not exist`);
//       }
//       console.error('Failed to update invoice:', error);
//       throw error;
//     }
//   }

//   async deleteInvoice(invoiceId: string): Promise<boolean> {
//     if (!invoiceId) {
//       console.error('Cannot delete invoice: No ID provided');
//       return false;
//     }

//     try {
//       const response = await fetch(`${this.config.apiUrl}/invoices/${invoiceId}`, {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       // Handle non-2xx responses
//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         console.error('Failed to delete invoice:', response.status, response.statusText, errorData);
//         return false;
//       }

//       // Try to parse the response as JSON
//       try {
//         const data = await response.json();
//         // Handle case where the API returns a success boolean directly
//         if (typeof data === 'boolean') {
//           return data;
//         }
//         // Handle case where the API returns an ApiResponse object
//         if (data && typeof data === 'object' && 'success' in data) {
//           return data.success === true;
//         }
//         // If we get here, the response format is unexpected
//         console.warn('Unexpected response format from delete endpoint:', data);
//         return true; // Assume success if we got a 2xx response but can't parse it
//       } catch (e) {
//         // If we can't parse JSON, but got a 2xx response, assume success
//         console.log('No JSON response, assuming successful deletion');
//         return true;
//       }
//     } catch (error) {
//       console.error('Error in deleteInvoice:', error);
//       if (error instanceof Error) {
//         console.error('Error details:', error.message);
//       }
//       return false;
//     }
//   }

//   // PAYMENT CRUD OPERATIONS
//   async savePayment(payment: Partial<Payment>): Promise<Payment> {
//     try {
//       const response = await this.fetchWithRetry<Payment>(`${this.config.apiUrl}/payments`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payment)
//       });
//       return response;
//     } catch (error) {
//       console.error('Failed to save payment:', error);
//       throw error;
//     }
//   }

//   async getPayments(): Promise<Payment[]> {
//     try {
//       const response = await this.fetchWithRetry<Payment[]>(`${this.config.apiUrl}/payments`);
//       return response || [];
//     } catch (error) {
//       console.error('Failed to get payments:', error);
//       return [];
//     }
//   }

//   async deletePayment(paymentId: string): Promise<boolean> {
//     try {
//       const response = await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/payments/${paymentId}`, {
//         method: 'DELETE'
//       });
//       return response;
//     } catch (error) {
//       console.error('Failed to delete payment:', error);
//       return false;
//     }
//   }

//   // CONNECTION INFO
//   async getConnectionInfo(): Promise<any> {
//     try {
//       const response = await this.fetchWithRetry<any>(`${this.config.apiUrl}/connection`);
//       return response;
//     } catch (error) {
//       console.error('Failed to get connection info:', error);
//       return null;
//     }
//   }
// }

// export const databaseService = DatabaseService.getInstance();
// export type { DatabaseConfig };


import { Client, Product, Invoice, Payment } from '../types';

interface DatabaseConfig {
  apiUrl: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class DatabaseService {
  private config: DatabaseConfig;
  private isConnected: boolean = false;
  private useLocalStorage: boolean = false;
  private static instance: DatabaseService;

  private constructor() {
    this.config = {
      apiUrl: import.meta.env.VITE_API_URL || '/api'
    };
    
    // Initialize localStorage fallback
    this.initializeLocalStorage();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Initialize localStorage with sample data if empty
  private initializeLocalStorage(): void {
    try {
      // Initialize clients if not exists
      if (!localStorage.getItem('invoicepro_clients')) {
        const sampleClients: Client[] = [
          {
            id: `cl-${Date.now()}-1`,
            name: 'John Smith',
            email: 'john@techcorp.com',
            phone: '+1 (555) 123-4567',
            company: 'TechCorp Solutions',
            address: {
              street: '123 Business Ave',
              city: 'San Francisco',
              state: 'CA',
              zipCode: '94107',
              country: 'USA'
            },
            taxNumber: 'TAX-123456',
            paymentTerms: 30,
            creditLimit: 50000,
            totalOutstanding: 15750,
            createdAt: new Date().toISOString().split('T')[0]
          },
          {
            id: `cl-${Date.now()}-2`,
            name: 'Sarah Johnson',
            email: 'sarah@designstudio.com',
            phone: '+1 (555) 234-5678',
            company: 'Creative Design Studio',
            address: {
              street: '456 Creative St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            },
            paymentTerms: 15,
            creditLimit: 25000,
            totalOutstanding: 8400,
            createdAt: new Date().toISOString().split('T')[0]
          }
        ];
        localStorage.setItem('invoicepro_clients', JSON.stringify(sampleClients));
      }

      // Initialize products if not exists
      if (!localStorage.getItem('invoicepro_products')) {
        const sampleProducts: Product[] = [
          {
            id: `pr-${Date.now()}-1`,
            name: 'Web Development',
            description: 'Custom website development and design services',
            rate: 150,
            unit: 'hour',
            category: 'Development',
            isService: true,
            taxRate: 8.5
          },
          {
            id: `pr-${Date.now()}-2`,
            name: 'Business Consulting',
            description: 'Strategic business and technical consulting',
            rate: 200,
            unit: 'hour',
            category: 'Consulting',
            isService: true,
            taxRate: 8.5
          }
        ];
        localStorage.setItem('invoicepro_products', JSON.stringify(sampleProducts));
      }

      // Initialize invoices if not exists
      if (!localStorage.getItem('invoicepro_invoices')) {
        const sampleInvoices: Invoice[] = [
          {
            id: `inv-${Date.now()}-1`,
            number: 'INV-001',
            clientId: `cl-${Date.now()}-1`,
            client: {
              id: `cl-${Date.now()}-1`,
              name: 'John Smith',
              email: 'john@techcorp.com',
              company: 'TechCorp Solutions'
            },
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'sent',
            subtotal: 15000,
            tax: 1275,
            total: 16275,
            items: [
              {
                id: 'item1',
                description: 'E-commerce website development',
                quantity: 100,
                rate: 150,
                amount: 15000
              }
            ],
            notes: 'Payment due within 30 days',
            terms: 'Net 30 days payment terms apply',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          },
          {
            id: `inv-${Date.now()}-2`,
            number: 'INV-002',
            clientId: `cl-${Date.now()}-2`,
            client: {
              id: `cl-${Date.now()}-2`,
              name: 'Sarah Johnson',
              email: 'sarah@designstudio.com',
              company: 'Creative Design Studio'
            },
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            status: 'overdue',
            subtotal: 8000,
            tax: 680,
            total: 8680,
            items: [
              {
                id: 'item2',
                description: 'Business strategy consulting',
                quantity: 40,
                rate: 200,
                amount: 8000
              }
            ],
            notes: 'Thank you for your business',
            terms: 'Net 30 days payment terms apply',
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          }
        ];
        localStorage.setItem('invoicepro_invoices', JSON.stringify(sampleInvoices));
      }

      // Initialize payments if not exists
      if (!localStorage.getItem('invoicepro_payments')) {
        localStorage.setItem('invoicepro_payments', JSON.stringify([]));
      }

      console.log('✅ localStorage initialized with sample data');
    } catch (error) {
      console.error('Failed to initialize localStorage:', error);
    }
  }

  // Check if database is connected
  isDbConnected(): boolean {
    return this.isConnected;
  }

  // Initialize database connection with fallback to localStorage
  async connect(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to connect to MongoDB Atlas...');
      
      const response = await fetch(`${this.config.apiUrl}/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('API connection failed');
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        this.isConnected = true;
        this.useLocalStorage = false;
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log('Database:', result.data?.database);
        console.log('Collections:', result.data?.collections);
        return true;
      }
      
      throw new Error(result.error || 'Connection failed');
    } catch (error) {
      console.warn('⚠️ MongoDB Atlas connection failed, falling back to localStorage:', error);
      this.isConnected = false;
      this.useLocalStorage = true;
      console.log('📦 Using localStorage for data persistence');
      return false;
    }
  }

  // Helper function for localStorage operations
  private getFromLocalStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return [];
    }
  }

  private saveToLocalStorage<T>(key: string, data: T[]): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
      return false;
    }
  }

  // Helper function for API requests with localStorage fallback
  private async fetchWithFallback<T>(
    url: string, 
    options: RequestInit = {},
    fallbackFn: () => Promise<T>
  ): Promise<T> {
    if (this.useLocalStorage) {
      return await fallbackFn();
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<T> = await response.json();
      
      if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
          throw new Error(data.error || 'API request failed');
        }
        return data.data as T;
      }
      
      return data as T;
    } catch (error) {
      console.warn('API request failed, using localStorage fallback:', error);
      this.useLocalStorage = true;
      return await fallbackFn();
    }
  }

  // SETTINGS
  async getSettings() {
    try {
      const stored = localStorage.getItem('invoicepro_settings');
      if (stored) {
        return JSON.parse(stored);
      }
      return {
        companyName: 'Your Company Name',
        companyAddress: '123 Business Street\nCity, State 12345\nCountry',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: 'info@yourcompany.com',
        currency: 'USD',
        taxRate: 8.5,
        paymentTerms: 30
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }

  async saveSettings(settings: any) {
    try {
      localStorage.setItem('invoicepro_settings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  // DASHBOARD STATS
  async getDashboardStats() {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/dashboard/stats`,
      {},
      async () => {
        // localStorage fallback
        const invoices = this.getFromLocalStorage<Invoice>('invoicepro_invoices');
        const clients = this.getFromLocalStorage<Client>('invoicepro_clients');

        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
        const pendingInvoices = invoices.filter(inv => inv.status === 'sent').length;
        const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
        
        const totalRevenue = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.total || 0), 0);
          
        const outstandingAmount = invoices
          .filter(inv => ['sent', 'overdue'].includes(inv.status))
          .reduce((sum, inv) => sum + (inv.total || 0), 0);
          
        const overdueAmount = invoices
          .filter(inv => inv.status === 'overdue')
          .reduce((sum, inv) => sum + (inv.total || 0), 0);

        return {
          totalRevenue,
          outstandingAmount,
          overdueAmount,
          totalInvoices,
          paidInvoices,
          pendingInvoices,
          overdueInvoices,
          totalClients: clients.length
        };
      }
    );
  }

  // CLIENT CRUD OPERATIONS
  async saveClient(client: Partial<Client>): Promise<Client> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/clients`,
      {
        method: 'POST',
        body: JSON.stringify(client)
      },
      async () => {
        // localStorage fallback
        const clients = this.getFromLocalStorage<Client>('invoicepro_clients');
        const newClient: Client = {
          ...client,
          id: client.id || `cl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: client.createdAt || new Date().toISOString().split('T')[0]
        } as Client;
        
        clients.push(newClient);
        this.saveToLocalStorage('invoicepro_clients', clients);
        return newClient;
      }
    );
  }

  async getClients(): Promise<Client[]> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/clients`,
      {},
      async () => {
        // localStorage fallback
        return this.getFromLocalStorage<Client>('invoicepro_clients');
      }
    );
  }

  async deleteClient(clientId: string): Promise<boolean> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/clients/${clientId}`,
      { method: 'DELETE' },
      async () => {
        // localStorage fallback
        const clients = this.getFromLocalStorage<Client>('invoicepro_clients');
        const filteredClients = clients.filter(client => client.id !== clientId);
        const success = filteredClients.length < clients.length;
        if (success) {
          this.saveToLocalStorage('invoicepro_clients', filteredClients);
        }
        return success;
      }
    );
  }

  // PRODUCT CRUD OPERATIONS
  async saveProduct(product: Partial<Product>): Promise<Product> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/products`,
      {
        method: 'POST',
        body: JSON.stringify(product)
      },
      async () => {
        // localStorage fallback
        const products = this.getFromLocalStorage<Product>('invoicepro_products');
        const newProduct: Product = {
          ...product,
          id: product.id || `pr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        } as Product;
        
        products.push(newProduct);
        this.saveToLocalStorage('invoicepro_products', products);
        return newProduct;
      }
    );
  }

  async getProducts(): Promise<Product[]> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/products`,
      {},
      async () => {
        // localStorage fallback
        return this.getFromLocalStorage<Product>('invoicepro_products');
      }
    );
  }

  async deleteProduct(productId: string): Promise<boolean> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/products/${productId}`,
      { method: 'DELETE' },
      async () => {
        // localStorage fallback
        const products = this.getFromLocalStorage<Product>('invoicepro_products');
        const filteredProducts = products.filter(product => product.id !== productId);
        const success = filteredProducts.length < products.length;
        if (success) {
          this.saveToLocalStorage('invoicepro_products', filteredProducts);
        }
        return success;
      }
    );
  }

  // INVOICE CRUD OPERATIONS
  async saveInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/invoices`,
      {
        method: 'POST',
        body: JSON.stringify(invoice)
      },
      async () => {
        // localStorage fallback
        const invoices = this.getFromLocalStorage<Invoice>('invoicepro_invoices');
        const newInvoice: Invoice = {
          ...invoice,
          id: invoice.id || `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: invoice.createdAt || new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        } as Invoice;
        
        invoices.push(newInvoice);
        this.saveToLocalStorage('invoicepro_invoices', invoices);
        return newInvoice;
      }
    );
  }

  async getInvoices(): Promise<Invoice[]> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/invoices`,
      {},
      async () => {
        // localStorage fallback
        return this.getFromLocalStorage<Invoice>('invoicepro_invoices');
      }
    );
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    if (!id) {
      throw new Error('Invoice ID is required for update');
    }

    return await this.fetchWithFallback(
      `${this.config.apiUrl}/invoices/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      },
      async () => {
        // localStorage fallback
        const invoices = this.getFromLocalStorage<Invoice>('invoicepro_invoices');
        const invoiceIndex = invoices.findIndex(inv => inv.id === id);
        
        if (invoiceIndex === -1) {
          throw new Error(`Cannot update: Invoice with ID ${id} does not exist`);
        }
        
        const updatedInvoice = {
          ...invoices[invoiceIndex],
          ...updates,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        
        invoices[invoiceIndex] = updatedInvoice;
        this.saveToLocalStorage('invoicepro_invoices', invoices);
        return updatedInvoice;
      }
    );
  }

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    if (!invoiceId) {
      console.error('Cannot delete invoice: No ID provided');
      return false;
    }

    return await this.fetchWithFallback(
      `${this.config.apiUrl}/invoices/${invoiceId}`,
      { method: 'DELETE' },
      async () => {
        // localStorage fallback
        const invoices = this.getFromLocalStorage<Invoice>('invoicepro_invoices');
        const filteredInvoices = invoices.filter(invoice => invoice.id !== invoiceId);
        const success = filteredInvoices.length < invoices.length;
        if (success) {
          this.saveToLocalStorage('invoicepro_invoices', filteredInvoices);
        }
        return success;
      }
    );
  }

  // PAYMENT CRUD OPERATIONS
  async savePayment(payment: Partial<Payment>): Promise<Payment> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(payment)
      },
      async () => {
        // localStorage fallback
        const payments = this.getFromLocalStorage<Payment>('invoicepro_payments');
        const newPayment: Payment = {
          ...payment,
          id: payment.id || `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        } as Payment;
        
        payments.push(newPayment);
        this.saveToLocalStorage('invoicepro_payments', payments);
        return newPayment;
      }
    );
  }

  async getPayments(): Promise<Payment[]> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/payments`,
      {},
      async () => {
        // localStorage fallback
        return this.getFromLocalStorage<Payment>('invoicepro_payments');
      }
    );
  }

  async deletePayment(paymentId: string): Promise<boolean> {
    return await this.fetchWithFallback(
      `${this.config.apiUrl}/payments/${paymentId}`,
      { method: 'DELETE' },
      async () => {
        // localStorage fallback
        const payments = this.getFromLocalStorage<Payment>('invoicepro_payments');
        const filteredPayments = payments.filter(payment => payment.id !== paymentId);
        const success = filteredPayments.length < payments.length;
        if (success) {
          this.saveToLocalStorage('invoicepro_payments', filteredPayments);
        }
        return success;
      }
    );
  }

  // CONNECTION INFO
  async getConnectionInfo(): Promise<any> {
    if (this.useLocalStorage) {
      return {
        isConnected: false,
        database: 'localStorage',
        collections: ['clients', 'products', 'invoices', 'payments', 'settings'],
        mode: 'localStorage'
      };
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/connection`);
      if (!response.ok) throw new Error('Connection check failed');
      
      const data = await response.json();
      return {
        ...data,
        mode: 'mongodb'
      };
    } catch (error) {
      console.error('Failed to get connection info:', error);
      return {
        isConnected: false,
        database: 'localStorage',
        collections: ['clients', 'products', 'invoices', 'payments', 'settings'],
        mode: 'localStorage'
      };
    }
  }

  // Get current storage mode
  getStorageMode(): 'mongodb' | 'localStorage' {
    return this.useLocalStorage ? 'localStorage' : 'mongodb';
  }

  // Force switch to localStorage mode
  switchToLocalStorage(): void {
    this.useLocalStorage = true;
    this.isConnected = false;
    console.log('📦 Switched to localStorage mode');
  }

  // Try to reconnect to MongoDB
  async reconnect(): Promise<boolean> {
    this.useLocalStorage = false;
    return await this.connect();
  }
}

export const databaseService = DatabaseService.getInstance();
export type { DatabaseConfig };