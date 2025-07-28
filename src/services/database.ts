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
  private static instance: DatabaseService;

  private constructor() {
    // Use Vite's environment variables
    this.config = {
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    };
    
    // For deployment, handle relative URLs
    if (typeof window !== 'undefined' && this.config.apiUrl.startsWith('/')) {
      this.config.apiUrl = window.location.origin + this.config.apiUrl;
    }
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
      
      const response = await fetch(`${this.config.apiUrl}/test`);
      if (!response.ok) throw new Error('API connection failed');
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        this.isConnected = true;
        console.log('Successfully connected to MongoDB Atlas!');
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
        console.log(`[${new Date().toISOString()}] Attempting request to ${url} (attempt ${retries + 1}/${maxRetries})`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
          
          try {
            const errorData: ApiResponse = await response.json();
            if (errorData?.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          
          throw new Error(errorMessage);
        }
        
        const data: ApiResponse<T> = await response.json();
        
        if (data && typeof data === 'object' && 'success' in data) {
          if (!data.success) {
            throw new Error(data.error || 'API request failed');
          }
          return data.data as T;
        }
        
        // For direct data responses
        return data as T;
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          console.error(`Failed to fetch ${url} after ${maxRetries} retries:`, error);
          throw error instanceof Error ? error : new Error(String(error));
        }
        
        // Exponential backoff
        const delay = 1000 * Math.pow(2, retries);
        console.log(`Request failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  // SETTINGS
  async getSettings() {
    try {
      const stored = localStorage.getItem('invoicepro_settings');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
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
    try {
      return await this.fetchWithRetry(`${this.config.apiUrl}/dashboard/stats`);
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      // Return default values in case of error
      return {
        totalRevenue: 0,
        outstandingAmount: 0,
        overdueAmount: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        totalClients: 0
      };
    }
  }

  // CLIENT CRUD OPERATIONS
  async saveClient(client: Partial<Client>): Promise<Client> {
    try {
      return await this.fetchWithRetry<Client>(`${this.config.apiUrl}/clients`, {
        method: 'POST',
        body: JSON.stringify(client)
      });
    } catch (error) {
      console.error('Failed to save client:', error);
      throw error;
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      return await this.fetchWithRetry<Client[]>(`${this.config.apiUrl}/clients`);
    } catch (error) {
      console.error('Failed to get clients:', error);
      return [];
    }
  }

  async deleteClient(clientId: string): Promise<boolean> {
    try {
      console.log(`Attempting to delete client with ID: ${clientId}`);
      
      const result = await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/clients/${clientId}`, {
        method: 'DELETE'
      });
      
      console.log('Client deleted successfully');
      return result;
    } catch (error) {
      console.error('Failed to delete client:', error);
      return false;
    }
  }

  // PRODUCT CRUD OPERATIONS
  async saveProduct(product: Partial<Product>): Promise<Product> {
    try {
      return await this.fetchWithRetry<Product>(`${this.config.apiUrl}/products`, {
        method: 'POST',
        body: JSON.stringify(product)
      });
    } catch (error) {
      console.error('Failed to save product:', error);
      throw error;
    }
  }

  async getProducts(): Promise<Product[]> {
    try {
      return await this.fetchWithRetry<Product[]>(`${this.config.apiUrl}/products`);
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      return await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/products/${productId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete product:', error);
      return false;
    }
  }

  // INVOICE CRUD OPERATIONS
  async saveInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    try {
      return await this.fetchWithRetry<Invoice>(`${this.config.apiUrl}/invoices`, {
        method: 'POST',
        body: JSON.stringify(invoice)
      });
    } catch (error) {
      console.error('Failed to save invoice:', error);
      throw error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    try {
      return await this.fetchWithRetry<Invoice[]>(`${this.config.apiUrl}/invoices`);
    } catch (error) {
      console.error('Failed to get invoices:', error);
      return [];
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    if (!id) {
      throw new Error('Invoice ID is required for update');
    }
    
    console.log(`Attempting to update invoice ${id} with:`, updates);
    
    try {
      const response = await this.fetchWithRetry<Invoice>(`${this.config.apiUrl}/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      console.log(`Successfully updated invoice ${id}`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        console.error(`Invoice with ID ${id} not found`);
        throw new Error(`Cannot update: Invoice with ID ${id} does not exist`);
      }
      console.error('Failed to update invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(invoiceId: string): Promise<boolean> {
    if (!invoiceId) {
      console.error('Cannot delete invoice: No ID provided');
      return false;
    }

    try {
      return await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/invoices/${invoiceId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error in deleteInvoice:', error);
      return false;
    }
  }

  // PAYMENT CRUD OPERATIONS
  async savePayment(payment: Partial<Payment>): Promise<Payment> {
    try {
      return await this.fetchWithRetry<Payment>(`${this.config.apiUrl}/payments`, {
        method: 'POST',
        body: JSON.stringify(payment)
      });
    } catch (error) {
      console.error('Failed to save payment:', error);
      throw error;
    }
  }

  async getPayments(): Promise<Payment[]> {
    try {
      return await this.fetchWithRetry<Payment[]>(`${this.config.apiUrl}/payments`);
    } catch (error) {
      console.error('Failed to get payments:', error);
      return [];
    }
  }

  async deletePayment(paymentId: string): Promise<boolean> {
    try {
      return await this.fetchWithRetry<boolean>(`${this.config.apiUrl}/payments/${paymentId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete payment:', error);
      return false;
    }
  }

  // CONNECTION INFO
  async getConnectionInfo(): Promise<any> {
    try {
      return await this.fetchWithRetry<any>(`${this.config.apiUrl}/connection`);
    } catch (error) {
      console.error('Failed to get connection info:', error);
      return null;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
export type { DatabaseConfig };