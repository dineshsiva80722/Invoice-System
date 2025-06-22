import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, Settings, FileText, Users, Package, LogOut, UserCircle, Mail, ChevronDown, X, Check } from 'lucide-react';
import { AppNotification } from '../../types';
import { notificationService } from '../../services/notificationService';
import { userProfileService } from '../../services/userProfileService';
import { authService } from '../../services/authService';
import NotificationPanel from '../Notifications/NotificationPanel';
import UserProfileModal from '../Profile/UserProfileModal';

interface HeaderProps {
  title: string;
  onSectionChange?: (section: string) => void;
  onLogout?: () => void;
}

interface SearchSuggestion {
  id: string;
  title: string;
  section: string;
  icon: React.ComponentType<any>;
  description?: string;
}

const searchSuggestions: SearchSuggestion[] = [
  { id: 'dashboard', title: 'Dashboard', section: 'dashboard', icon: FileText, description: 'View business overview' },
  { id: 'invoices', title: 'Invoices', section: 'invoices', icon: FileText, description: 'Manage invoices' },
  { id: 'clients', title: 'Clients', section: 'clients', icon: Users, description: 'Manage client relationships' },
  { id: 'products', title: 'Products & Services', section: 'products', icon: Package, description: 'Manage catalog' },
  { id: 'settings', title: 'Settings', section: 'settings', icon: Settings, description: 'Application settings' },
];

export default function Header({ title, onSectionChange, onLogout }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [userProfile, setUserProfile] = useState(userProfileService.getProfile());
  const [profilePicture, setProfilePicture] = useState(userProfileService.getProfilePicture());
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = searchSuggestions.filter(suggestion =>
    suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Subscribe to notification updates
  useEffect(() => {
    const updateNotifications = () => {
      const result = notificationService.getNotifications({ limit: 5 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    };

    updateNotifications();
    const unsubscribe = notificationService.addListener(updateNotifications);
    return unsubscribe;
  }, []);

  // Update profile when modal closes
  useEffect(() => {
    if (!showProfileModal) {
      setUserProfile(userProfileService.getProfile());
      setProfilePicture(userProfileService.getProfilePicture());
    }
  }, [showProfileModal]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authService.addListener((authState) => {
      setCurrentUser(authState.user);
    });

    return unsubscribe;
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
        setSelectedSuggestionIndex(-1);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showSearchDropdown || filteredSuggestions.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex]);
          }
          break;
        case 'Escape':
          setShowSearchDropdown(false);
          setSelectedSuggestionIndex(-1);
          searchInputRef.current?.blur();
          break;
      }
    };

    if (showSearchDropdown) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSearchDropdown, filteredSuggestions, selectedSuggestionIndex]);

  const handleSearchFocus = () => {
    setShowSearchDropdown(true);
    setSelectedSuggestionIndex(-1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchDropdown(true);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (onSectionChange) {
      onSectionChange(suggestion.section);
    }
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSelectedSuggestionIndex(-1);
    searchInputRef.current?.blur();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSelectedSuggestionIndex(-1);
    searchInputRef.current?.focus();
  };

  const handleProfileAction = (action: string) => {
    switch (action) {
      case 'profile':
        setShowProfileModal(true);
        break;
      case 'settings':
        if (onSectionChange) onSectionChange('settings');
        break;
      case 'logout':
        handleLogout();
        break;
    }
    setShowProfileMenu(false);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await authService.logout();
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 relative z-40">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 lg:mb-0">{title}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Enhanced Search Bar */}
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  className="pl-10 pr-10 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-label="Search navigation"
                  aria-expanded={showSearchDropdown}
                  aria-haspopup="listbox"
                  role="combobox"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                  {filteredSuggestions.length > 0 ? (
                    <ul role="listbox" className="py-2">
                      {filteredSuggestions.map((suggestion, index) => {
                        const Icon = suggestion.icon;
                        return (
                          <li key={suggestion.id} role="option" aria-selected={index === selectedSuggestionIndex}>
                            <button
                              onClick={() => handleSuggestionClick(suggestion)}
                              className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
                                index === selectedSuggestionIndex
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <Icon className="w-5 h-5 text-gray-400" />
                              <div>
                                <div className="font-medium">{suggestion.title}</div>
                                {suggestion.description && (
                                  <div className="text-sm text-gray-500">{suggestion.description}</div>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : searchQuery ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No results found for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-500 mb-2">Quick navigation</p>
                      <ul className="space-y-1">
                        {searchSuggestions.slice(0, 4).map((suggestion) => {
                          const Icon = suggestion.icon;
                          return (
                            <li key={suggestion.id}>
                              <button
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="w-full text-left px-2 py-2 flex items-center space-x-3 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                              >
                                <Icon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{suggestion.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowNotificationPanel(true)}
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
                aria-label="User menu"
                aria-expanded={showProfileMenu}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium">{currentUser?.fullName || userProfile?.fullName || 'John Doe'}</div>
                  <div className="text-xs text-gray-500">{currentUser?.role === 'admin' ? 'Administrator' : 'User'}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{currentUser?.fullName || userProfile?.fullName || 'John Doe'}</div>
                        <div className="text-sm text-gray-500">{currentUser?.email || userProfile?.email || 'john.doe@company.com'}</div>
                        <div className="text-xs text-gray-400">{currentUser?.role === 'admin' ? 'Administrator' : 'User'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => handleProfileAction('profile')}
                      className="w-full text-left px-4 py-2 flex items-center space-x-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <UserCircle className="w-5 h-5 text-gray-400" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => handleProfileAction('settings')}
                      className="w-full text-left px-4 py-2 flex items-center space-x-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-5 h-5 text-gray-400" />
                      <span>Settings</span>
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 flex items-center space-x-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span>Support</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={() => handleProfileAction('logout')}
                      className="w-full text-left px-4 py-2 flex items-center space-x-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
      />

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}