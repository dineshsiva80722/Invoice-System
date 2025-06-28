import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import InvoiceList from './components/Invoices234/InvoiceList';
import ClientList from './components/Clients/ClientList';
import ProductList from './components/Products/ProductList';
import InvoiceSettings from './components/Settings/InvoiceSettings';
import LoginPage from './components/Auth/LoginPage';
import { databaseService } from './services/database';
import { authService } from './services/authService';
import { AuthState } from './types';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    error: string | null;
  }>({ connected: false, error: null });

  // Subscribe to authentication state changes
  useEffect(() => {
    const unsubscribe = authService.addListener((newAuthState) => {
      setAuthState(newAuthState);
    });

    return unsubscribe;
  }, []);

  // Initialize database connection on app start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Initialize auth service
        authService.initializeDefaultCredentials();
        
        // Try to connect to database
        const connected = await databaseService.connect();
        
        setConnectionStatus({
          connected,
          error: connected ? null : 'Database connection failed, using local storage'
        });
        
        console.log(connected ? 'Database connected successfully' : 'Using local storage fallback');
      } catch (error) {
        console.error('App initialization failed:', error);
        setConnectionStatus({
          connected: false,
          error: 'Failed to initialize application'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      // No cleanup needed since we're using API instead of direct MongoDB
    };
  }, []);

  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'dashboard': return 'Dashboard';
      case 'invoices': return 'Invoices';
      case 'clients': return 'Clients';
      case 'products': return 'Products & Services';
      case 'payments': return 'Payments';
      case 'reports': return 'Reports';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'invoices':
        return <InvoiceList />;
      case 'clients':
        return <ClientList />;
      case 'products':
        return <ProductList />;
      case 'payments':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payments Coming Soon</h3>
              <p className="text-gray-600">Payment tracking and processing features will be available in the next update.</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports Coming Soon</h3>
              <p className="text-gray-600">Advanced reporting and analytics features will be available in the next update.</p>
            </div>
          </div>
        );
      case 'settings':
        return <InvoiceSettings />;
      default:
        return <Dashboard />;
    }
  };

  const handleLogin = () => {
    // Login is handled by the authService, state will update automatically
    console.log('Login successful');
  };

  const handleLogout = () => {
    // Logout is handled by the authService, state will update automatically
    console.log('Logout successful');
  };

  // Show loading screen during initial app load
  if (isLoading || authState.loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Initializing InvoicePro...</p>
          <p className="text-sm text-gray-500">Setting up authentication and database</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!authState.isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Show main application if authenticated
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getSectionTitle(activeSection)} 
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
        
        {/* Connection Status Banner */}
        {connectionStatus.error && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <p className="text-sm text-amber-800">
                {connectionStatus.error}
              </p>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;