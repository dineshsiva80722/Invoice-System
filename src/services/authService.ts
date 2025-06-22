import { AuthCredentials, AuthUser, AuthState } from '../types';

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Array<(authState: AuthState) => void> = [];

  constructor() {
    this.loadAuthState();
  }

  // Load authentication state from storage
  private loadAuthState(): void {
    try {
      const stored = localStorage.getItem('invoicepro_auth_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.currentUser = null;
    }
  }

  // Save authentication state to storage
  private saveAuthState(): void {
    try {
      if (this.currentUser) {
        localStorage.setItem('invoicepro_auth_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('invoicepro_auth_user');
      }
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }

  // Add authentication state listener
  addListener(callback: (authState: AuthState) => void): () => void {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.getAuthState());
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners(): void {
    const authState = this.getAuthState();
    this.listeners.forEach(listener => listener(authState));
  }

  // Get current authentication state
  getAuthState(): AuthState {
    return {
      isAuthenticated: this.currentUser !== null,
      user: this.currentUser ? { ...this.currentUser } : null,
      loading: false,
      error: null
    };
  }

  // Get stored credentials (for demo purposes)
  private getStoredCredentials(): AuthCredentials {
    try {
      const stored = localStorage.getItem('invoicepro_auth_credentials');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }

    // Default credentials
    return {
      username: 'admin',
      password: 'admin123'
    };
  }

  // Save credentials (for demo purposes)
  saveCredentials(credentials: AuthCredentials): void {
    try {
      localStorage.setItem('invoicepro_auth_credentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  }

  // Validate credentials
  private validateCredentials(credentials: AuthCredentials): boolean {
    const stored = this.getStoredCredentials();
    return credentials.username === stored.username && credentials.password === stored.password;
  }

  // Login with username and password
  async login(credentials: AuthCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate credentials
      if (!this.validateCredentials(credentials)) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Create user object
      const user: AuthUser = {
        id: 'user-1',
        username: credentials.username,
        fullName: 'John Doe',
        email: 'john.doe@company.com',
        role: 'admin',
        lastLogin: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      this.currentUser = user;
      this.saveAuthState();

      console.log('✅ User logged in successfully:', user.username);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      this.currentUser = null;
      this.saveAuthState();
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  // Update user profile
  updateUserProfile(updates: Partial<AuthUser>): void {
    if (this.currentUser) {
      this.currentUser = {
        ...this.currentUser,
        ...updates
      };
      this.saveAuthState();
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const stored = this.getStoredCredentials();
      
      if (currentPassword !== stored.password) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'New password must be at least 6 characters long'
        };
      }

      // Save new credentials
      this.saveCredentials({
        username: stored.username,
        password: newPassword
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to change password'
      };
    }
  }

  // Initialize default credentials if none exist
  initializeDefaultCredentials(): void {
    const stored = localStorage.getItem('invoicepro_auth_credentials');
    if (!stored) {
      this.saveCredentials({
        username: 'admin',
        password: 'admin123'
      });
      console.log('🔑 Default credentials initialized: admin/admin123');
    }
  }
}

export const authService = new AuthService();