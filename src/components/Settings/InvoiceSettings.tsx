import React, { useState, useEffect } from 'react';
import { Upload, Save, Eye, Palette, FileText, Building, Database, CheckCircle, AlertCircle, Loader, Lock, User, Key, RefreshCw, ExternalLink } from 'lucide-react';
import { databaseService } from '../../services/database';
import { authService } from '../../services/authService';
import InvoicePreviewModal from './InvoicePreviewModal';

export default function InvoiceSettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState({
    companyName: 'Your Company Name',
    companyAddress: '123 Business Street\nCity, State 12345\nCountry',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@yourcompany.com',
    companyWebsite: 'www.yourcompany.com',
    taxNumber: 'TAX-123456789',
    logo: null as string | null,
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#06b6d4',
    invoiceTemplate: 'modern',
    currency: 'USD',
    taxRate: 8.5,
    paymentTerms: 30,
    invoiceFooter: 'Thank you for your business!',
    bankDetails: 'Bank Name: Your Bank\nAccount Number: 123456789\nRouting Number: 987654321'
  });

  // Authentication settings
  const [authSettings, setAuthSettings] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Database connection settings
  const [mongoUrl, setMongoUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    loading: boolean;
    error: string | null;
  }>({ connected: false, loading: false, error: null });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const tabs = [
    { id: 'company', label: 'Company Info', icon: Building },
    { id: 'design', label: 'Design & Branding', icon: Palette },
    { id: 'defaults', label: 'Default Settings', icon: FileText },
    { id: 'auth', label: 'Authentication', icon: Lock },
    { id: 'database', label: 'Database', icon: Database }
  ];

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Load saved settings
        const savedSettings = await databaseService.getSettings();
        if (savedSettings) {
          setSettings({ ...settings, ...savedSettings });
          // Set logo preview if logo exists
          if (savedSettings.logo) {
            setLogoPreview(savedSettings.logo);
          }
        }

        // Get database connection info
        const connectionInfo = databaseService.getConnectionInfo();
        setMongoUrl(connectionInfo.url);
        setConnectionStatus({
          connected: connectionInfo.connected,
          loading: false,
          error: null
        });

        // Load current auth settings
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setAuthSettings(prev => ({
            ...prev,
            username: currentUser.username
          }));
        }

        // Initialize default credentials
        authService.initializeDefaultCredentials();
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSaveStatus({
          type: 'error',
          message: 'Failed to load settings'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setSaveStatus({
          type: 'error',
          message: 'Logo file size must be less than 2MB'
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveStatus({
          type: 'error',
          message: 'Please select a valid image file'
        });
        return;
      }

      // Convert to base64 and store
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setSettings({ ...settings, logo: base64String });
        setLogoPreview(base64String);
        
        setSaveStatus({
          type: 'success',
          message: 'Logo uploaded successfully! Don\'t forget to save your settings.'
        });
      };
      reader.onerror = () => {
        setSaveStatus({
          type: 'error',
          message: 'Failed to read logo file'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveStatus({ type: null, message: '' });
      
      // Validate required fields
      if (!settings.companyName.trim()) {
        throw new Error('Company name is required');
      }
      
      if (!settings.companyEmail.trim()) {
        throw new Error('Company email is required');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.companyEmail)) {
        throw new Error('Please enter a valid email address');
      }
      
      const success = await databaseService.saveSettings(settings);
      
      if (success) {
        setSaveStatus({
          type: 'success',
          message: 'Settings saved successfully!'
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save settings. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }

    // Clear status after 5 seconds
    setTimeout(() => {
      setSaveStatus({ type: null, message: '' });
    }, 5000);
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setSaveStatus({ type: null, message: '' });

      // Validate inputs
      if (!authSettings.currentPassword) {
        throw new Error('Current password is required');
      }

      if (!authSettings.newPassword) {
        throw new Error('New password is required');
      }

      if (authSettings.newPassword !== authSettings.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (authSettings.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      const result = await authService.changePassword(
        authSettings.currentPassword,
        authSettings.newPassword
      );

      if (result.success) {
        setSaveStatus({
          type: 'success',
          message: 'Password changed successfully!'
        });

        // Clear password fields
        setAuthSettings(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        throw new Error(result.error || 'Failed to change password');
      }
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to change password'
      });
    } finally {
      setChangingPassword(false);
    }

    // Clear status after 5 seconds
    setTimeout(() => {
      setSaveStatus({ type: null, message: '' });
    }, 5000);
  };

  const handleConnectDatabase = async () => {
    if (!mongoUrl.trim()) {
      setConnectionStatus({
        connected: false,
        loading: false,
        error: 'Please enter a MongoDB Atlas connection string'
      });
      return;
    }

    // Basic URL validation for MongoDB Atlas
    if (!mongoUrl.includes('mongodb+srv://') && !mongoUrl.includes('mongodb://')) {
      setConnectionStatus({
        connected: false,
        loading: false,
        error: 'Please enter a valid MongoDB connection string (mongodb+srv:// for Atlas or mongodb:// for local)'
      });
      return;
    }

    setConnectionStatus({ connected: false, loading: true, error: null });

    try {
      // Update the MongoDB URL in the service
      databaseService.updateMongoUrl(mongoUrl);
      
      // Attempt to connect
      const connected = await databaseService.connect();
      
      if (connected) {
        setConnectionStatus({
          connected: true,
          loading: false,
          error: null
        });

        setSaveStatus({
          type: 'success',
          message: 'Successfully connected to MongoDB Atlas! Your data will now be stored permanently in the database.'
        });
      } else {
        throw new Error('Connection failed - check your MongoDB URL and network connection');
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        loading: false,
        error: 'Failed to connect to MongoDB Atlas. Please check your connection string and network.'
      });

      setSaveStatus({
        type: 'error',
        message: 'Database connection failed. Please verify your MongoDB Atlas connection string and network.'
      });
    }
  };

  const handleSyncData = async () => {
    if (!connectionStatus.connected) {
      setSaveStatus({
        type: 'error',
        message: 'Please connect to MongoDB Atlas first before syncing data'
      });
      return;
    }

    try {
      setSyncing(true);
      setSaveStatus({ type: null, message: '' });

      const success = await databaseService.forceSyncWithMongoDB();
      
      if (success) {
        setSaveStatus({
          type: 'success',
          message: 'Data successfully synced to MongoDB Atlas! All your local data has been uploaded to the database.'
        });
      } else {
        throw new Error('Sync operation failed');
      }
    } catch (error) {
      setSaveStatus({
        type: 'error',
        message: 'Failed to sync data to MongoDB Atlas. Please try again.'
      });
    } finally {
      setSyncing(false);
    }

    // Clear status after 5 seconds
    setTimeout(() => {
      setSaveStatus({ type: null, message: '' });
    }, 5000);
  };

  const handlePreview = () => {
    // Validate that we have minimum required data for preview
    if (!settings.companyName.trim()) {
      setSaveStatus({
        type: 'error',
        message: 'Please enter a company name before previewing'
      });
      return;
    }
    
    setShowPreview(true);
  };

  const templates = [
    { id: 'modern', name: 'Modern', description: 'Clean and professional design' },
    { id: 'classic', name: 'Classic', description: 'Traditional business layout' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
    { id: 'creative', name: 'Creative', description: 'Colorful and dynamic' }
  ];

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <div className="space-y-8">
            {/* Company Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Building className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
              </div>

              {/* Simple Email Notice */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Simple Email System</span>
                </div>
                <p className="text-sm text-green-800">
                  Your company email will be used for invoice emails. No third-party services required - 
                  emails open in your default email client.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email * (For invoice emails)
                  </label>
                  <input
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="info@yourcompany.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This email will appear as the sender for all invoice emails
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.companyPhone}
                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={settings.companyWebsite}
                    onChange={(e) => setSettings({ ...settings, companyWebsite: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={settings.companyAddress}
                    onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Number
                  </label>
                  <input
                    type="text"
                    value={settings.taxNumber}
                    onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-8">
            {/* Logo Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Upload className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
              </div>

              <div className="flex items-start space-x-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Logo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG, SVG up to 2MB</p>
                    </label>
                  </div>
                </div>

                {logoPreview && (
                  <div className="w-32 h-32 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Color Scheme */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Palette className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Color Scheme</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Template */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Invoice Template</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSettings({ ...settings, invoiceTemplate: template.id })}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      settings.invoiceTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded mb-3 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'defaults':
        return (
          <div className="space-y-8">
            {/* Default Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Default Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.paymentTerms}
                    onChange={(e) => setSettings({ ...settings, paymentTerms: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Footer
                  </label>
                  <input
                    type="text"
                    value={settings.invoiceFooter}
                    onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Details
                  </label>
                  <textarea
                    value={settings.bankDetails}
                    onChange={(e) => setSettings({ ...settings, bankDetails: e.target.value })}
                    rows={3}
                    placeholder="Enter your bank details for payment instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'auth':
        return (
          <div className="space-y-8">
            {/* Authentication Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Authentication Settings</h3>
              </div>

              <div className="space-y-6">
                {/* Current Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={authSettings.username}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Username cannot be changed. Contact administrator if needed.
                  </p>
                </div>

                {/* Change Password Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          value={authSettings.currentPassword}
                          onChange={(e) => setAuthSettings({ ...authSettings, currentPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter current password"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          value={authSettings.newPassword}
                          onChange={(e) => setAuthSettings({ ...authSettings, newPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          value={authSettings.confirmPassword}
                          onChange={(e) => setAuthSettings({ ...authSettings, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleChangePassword}
                      disabled={changingPassword || !authSettings.currentPassword || !authSettings.newPassword || !authSettings.confirmPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                    >
                      {changingPassword ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Changing Password...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Change Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Password Requirements</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Minimum 6 characters long</li>
                    <li>• Use a combination of letters and numbers</li>
                    <li>• Avoid using personal information</li>
                    <li>• Change password regularly for security</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="space-y-8">
            {/* Database Connection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Database className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">MongoDB Atlas Connection</h3>
              </div>

              {/* MongoDB Atlas Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Connect to MongoDB Atlas</span>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  Connect your application to MongoDB Atlas for permanent, cloud-based data storage. 
                  Your data will be accessible from any device and survive browser data clearing.
                </p>
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <a 
                    href="https://cloud.mongodb.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Get your MongoDB Atlas connection string
                  </a>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MongoDB Atlas Connection String
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={mongoUrl}
                      onChange={(e) => setMongoUrl(e.target.value)}
                      placeholder="mongodb+srv://username:password@cluster.mongodb.net/invoicepro"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleConnectDatabase}
                      disabled={connectionStatus.loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                    >
                      {connectionStatus.loading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: mongodb+srv://username:password@cluster.mongodb.net/invoicepro
                  </p>
                </div>

                {/* Connection Status */}
                <div className={`p-4 rounded-lg flex items-center space-x-3 ${
                  connectionStatus.connected 
                    ? 'bg-green-50 border border-green-200' 
                    : connectionStatus.error
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}>
                  {connectionStatus.connected ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Connected to MongoDB Atlas</p>
                        <p className="text-xs text-green-600">All data will be stored permanently in the cloud database</p>
                      </div>
                    </>
                  ) : connectionStatus.error ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Connection Failed</p>
                        <p className="text-xs text-red-600">{connectionStatus.error}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">Not Connected</p>
                        <p className="text-xs text-gray-600">Data will be stored locally in browser (temporary)</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Data Sync Section */}
                {connectionStatus.connected && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Data Synchronization</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        Sync your local data to MongoDB Atlas to ensure it's stored permanently in the database.
                        This will upload all your clients, products, invoices, and settings to MongoDB Atlas.
                      </p>
                    </div>
                    <button
                      onClick={handleSyncData}
                      disabled={syncing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                    >
                      {syncing ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Syncing Data...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Sync Data to MongoDB Atlas</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Database Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">Database Information</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Current Storage:</strong> {connectionStatus.connected ? 'MongoDB Atlas Database' : 'Local Browser Storage'}</p>
                    <p>
                      <strong>Data Persistence:</strong>{' '}
                      {connectionStatus.connected 
                        ? 'Permanent (survives browser/device changes)' 
                        : 'Temporary (lost when clearing browser data)'}
                    </p>
                    <p><strong>Multi-Device Access:</strong> {connectionStatus.connected ? 'Yes (same data across devices)' : 'No (device-specific)'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your application settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Status Messages */}
      {saveStatus.type && (
        <div className={`mt-6 p-4 rounded-lg flex items-center space-x-3 ${
          saveStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className={`text-sm ${
            saveStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {saveStatus.message}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-8">
        <button 
          onClick={handlePreview}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Eye className="w-5 h-5" />
          <span>Preview Invoice</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <InvoicePreviewModal
          settings={settings}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}