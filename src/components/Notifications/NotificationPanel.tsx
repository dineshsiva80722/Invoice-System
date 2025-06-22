import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, RefreshCw, Filter, Mail, User, Package, Settings, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AppNotification } from '../../types';
import { notificationService } from '../../services/notificationService';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'success' | 'failed' | 'pending'>('all');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const limit = 20;

  // Load initial notifications
  useEffect(() => {
    if (isOpen) {
      loadNotifications(true);
      setSoundEnabled(notificationService.getSoundEnabled());
      setDesktopNotificationsEnabled(notificationService.getDesktopNotificationsEnabled());
    }
  }, [isOpen, filter]);

  // Subscribe to notification updates
  useEffect(() => {
    const unsubscribe = notificationService.addListener((updatedNotifications) => {
      if (isOpen) {
        loadNotifications(true);
      }
    });

    return unsubscribe;
  }, [isOpen]);

  // Load notifications with pagination
  const loadNotifications = async (reset: boolean = false) => {
    setLoading(true);
    
    try {
      const currentOffset = reset ? 0 : offset;
      const result = notificationService.getNotifications({
        type: filter,
        limit,
        offset: currentOffset
      });

      if (reset) {
        setNotifications(result.notifications);
        setOffset(limit);
      } else {
        setNotifications(prev => [...prev, ...result.notifications]);
        setOffset(prev => prev + limit);
      }

      setHasMore(result.notifications.length === limit);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle infinite scroll
  const handleScroll = () => {
    if (!scrollRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadNotifications(false);
    }
  };

  // Get notification icon
  const getNotificationIcon = (notification: AppNotification) => {
    switch (notification.type) {
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'client':
        return <User className="w-5 h-5" />;
      case 'product':
        return <Package className="w-5 h-5" />;
      case 'system':
        return <Settings className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Get status icon and color
  const getStatusInfo = (status: AppNotification['status']) => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
  };

  // Mark all as read
  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
  };

  // Retry failed notification
  const retryNotification = async (notification: AppNotification) => {
    if (notification.type === 'email' && notification.relatedEntityId) {
      // Find corresponding email status and retry
      const emailStatuses = notificationService.getEmailStatuses();
      const emailStatus = emailStatuses.find(e => e.invoiceId === notification.relatedEntityId);
      
      if (emailStatus) {
        const success = await notificationService.retryFailedEmail(emailStatus.id);
        if (success) {
          // Refresh notifications
          loadNotifications(true);
        }
      }
    }
  };

  // Toggle sound
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    notificationService.setSoundEnabled(newValue);
  };

  // Toggle desktop notifications
  const toggleDesktopNotifications = () => {
    const newValue = !desktopNotificationsEnabled;
    setDesktopNotificationsEnabled(newValue);
    notificationService.setDesktopNotificationsEnabled(newValue);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">{unreadCount} unread</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'success', label: 'Success' },
              { key: 'failed', label: 'Failed' },
              { key: 'pending', label: 'Pending' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  filter === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
            
            <button
              onClick={() => loadNotifications(true)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Settings */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={toggleSound}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Sound alerts</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={desktopNotificationsEnabled}
                onChange={toggleDesktopNotifications}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Desktop alerts</span>
            </label>
          </div>
        </div>

        {/* Notifications List */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const statusInfo = getStatusInfo(notification.status);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-2 rounded-lg ${statusInfo.bgColor} ${statusInfo.color}`}>
                        {getNotificationIcon(notification)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className={`text-sm font-medium ${
                                notification.read ? 'text-gray-600' : 'text-gray-900'
                              }`}>
                                {notification.subject}
                              </p>
                              <div className={`flex items-center space-x-1 ${statusInfo.color}`}>
                                {statusInfo.icon}
                              </div>
                            </div>
                            
                            <p className={`text-sm mt-1 ${
                              notification.read ? 'text-gray-500' : 'text-gray-700'
                            }`}>
                              {notification.content}
                            </p>

                            {notification.recipient && (
                              <p className="text-xs text-gray-500 mt-1">
                                To: {notification.recipient}
                              </p>
                            )}

                            {notification.errorMessage && (
                              <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                                Error: {notification.errorMessage}
                              </p>
                            )}

                            {notification.retryCount !== undefined && notification.maxRetries !== undefined && (
                              <p className="text-xs text-gray-500 mt-1">
                                Retry {notification.retryCount}/{notification.maxRetries}
                              </p>
                            )}

                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimestamp(notification.createdAt)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            
                            {notification.status === 'failed' && 
                             notification.retryCount !== undefined && 
                             notification.maxRetries !== undefined &&
                             notification.retryCount < notification.maxRetries && (
                              <button
                                onClick={() => retryNotification(notification)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Retry"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center p-4">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
          )}

          {/* Load more indicator */}
          {!loading && hasMore && notifications.length > 0 && (
            <div className="p-4 text-center">
              <button
                onClick={() => loadNotifications(false)}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Load more notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}