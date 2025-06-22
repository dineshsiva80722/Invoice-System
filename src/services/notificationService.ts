import { AppNotification, EmailStatus } from '../types';

interface NotificationFilter {
  type?: 'all' | 'unread' | 'success' | 'failed' | 'pending';
  entityType?: string;
  limit?: number;
  offset?: number;
}

class NotificationService {
  private notifications: AppNotification[] = [];
  private emailStatuses: EmailStatus[] = [];
  private listeners: Array<(notifications: AppNotification[]) => void> = [];
  private soundEnabled: boolean = true;
  private desktopNotificationsEnabled: boolean = false;

  constructor() {
    this.loadNotifications();
    this.loadEmailStatuses();
    this.initializeDesktopNotifications();
    this.generateSampleData();
  }

  // Initialize desktop notifications
  private async initializeDesktopNotifications(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.desktopNotificationsEnabled = permission === 'granted';
    }
  }

  // Load notifications from storage
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('invoicepro_notifications');
      this.notifications = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications = [];
    }
  }

  // Load email statuses from storage
  private loadEmailStatuses(): void {
    try {
      const stored = localStorage.getItem('invoicepro_email_statuses');
      this.emailStatuses = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load email statuses:', error);
      this.emailStatuses = [];
    }
  }

  // Save notifications to storage
  private saveNotifications(): void {
    try {
      localStorage.setItem('invoicepro_notifications', JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  // Save email statuses to storage
  private saveEmailStatuses(): void {
    try {
      localStorage.setItem('invoicepro_email_statuses', JSON.stringify(this.emailStatuses));
    } catch (error) {
      console.error('Failed to save email statuses:', error);
    }
  }

  // Generate sample data for demonstration
  private generateSampleData(): void {
    if (this.notifications.length === 0) {
      const sampleNotifications: AppNotification[] = [
        {
          id: 'notif-1',
          type: 'email',
          status: 'success',
          subject: 'Invoice INV-001 sent successfully',
          recipient: 'john@techcorp.com',
          content: 'Invoice INV-001 has been sent to john@techcorp.com',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          relatedEntityId: 'inv-1',
          relatedEntityType: 'invoice',
          read: false
        },
        {
          id: 'notif-2',
          type: 'email',
          status: 'failed',
          subject: 'Failed to send Invoice INV-002',
          recipient: 'invalid@email.com',
          content: 'Failed to send invoice due to invalid email address',
          errorMessage: 'Invalid email address format',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          relatedEntityId: 'inv-2',
          relatedEntityType: 'invoice',
          read: false,
          retryCount: 2,
          maxRetries: 3
        },
        {
          id: 'notif-3',
          type: 'client',
          status: 'success',
          subject: 'New client added',
          content: 'Sarah Johnson has been added to your client list',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          relatedEntityId: 'client-1',
          relatedEntityType: 'client',
          read: true
        },
        {
          id: 'notif-4',
          type: 'system',
          status: 'pending',
          subject: 'Database backup in progress',
          content: 'Automated database backup is currently running',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false
        }
      ];

      this.notifications = sampleNotifications;
      this.saveNotifications();
    }
  }

  // Add notification listener
  addListener(callback: (notifications: AppNotification[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Create new notification
  createNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'updatedAt' | 'read'>): AppNotification {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.playNotificationSound();
    this.showDesktopNotification(newNotification);

    return newNotification;
  }

  // Get notifications with filtering and pagination
  getNotifications(filter: NotificationFilter = {}): {
    notifications: AppNotification[];
    total: number;
    unreadCount: number;
  } {
    let filtered = [...this.notifications];

    // Apply type filter
    if (filter.type && filter.type !== 'all') {
      switch (filter.type) {
        case 'unread':
          filtered = filtered.filter(n => !n.read);
          break;
        case 'success':
          filtered = filtered.filter(n => n.status === 'success');
          break;
        case 'failed':
          filtered = filtered.filter(n => n.status === 'failed');
          break;
        case 'pending':
          filtered = filtered.filter(n => n.status === 'pending');
          break;
      }
    }

    // Apply entity type filter
    if (filter.entityType) {
      filtered = filtered.filter(n => n.type === filter.entityType);
    }

    const total = filtered.length;
    const unreadCount = this.notifications.filter(n => !n.read).length;

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 20;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      notifications: paginated,
      total,
      unreadCount
    };
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      notification.updatedAt = new Date().toISOString();
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    let hasChanges = false;
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        notification.updatedAt = new Date().toISOString();
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveNotifications();
    }
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  // Email status tracking
  trackEmailStatus(emailStatus: Omit<EmailStatus, 'id'>): EmailStatus {
    const newStatus: EmailStatus = {
      ...emailStatus,
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.emailStatuses.unshift(newStatus);
    
    // Keep only last 200 email statuses
    if (this.emailStatuses.length > 200) {
      this.emailStatuses = this.emailStatuses.slice(0, 200);
    }

    this.saveEmailStatuses();

    // Create corresponding notification
    this.createNotification({
      type: 'email',
      status: emailStatus.status,
      subject: `Email ${emailStatus.status}: ${emailStatus.subject}`,
      recipient: emailStatus.recipient,
      content: emailStatus.status === 'failed' 
        ? `Failed to send email: ${emailStatus.errorMessage}`
        : `Email sent successfully to ${emailStatus.recipient}`,
      errorMessage: emailStatus.errorMessage,
      relatedEntityId: emailStatus.invoiceId,
      relatedEntityType: 'invoice',
      retryCount: emailStatus.retryCount,
      maxRetries: emailStatus.maxRetries
    });

    return newStatus;
  }

  // Retry failed email
  async retryFailedEmail(emailStatusId: string): Promise<boolean> {
    const emailStatus = this.emailStatuses.find(e => e.id === emailStatusId);
    if (!emailStatus || emailStatus.status !== 'failed') {
      return false;
    }

    if (emailStatus.retryCount >= emailStatus.maxRetries) {
      return false;
    }

    // Update retry count
    emailStatus.retryCount++;
    emailStatus.lastRetryAt = new Date().toISOString();
    emailStatus.status = 'pending';

    this.saveEmailStatuses();

    // Simulate email retry (in real app, this would call actual email service)
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        emailStatus.status = 'sent';
        emailStatus.sentAt = new Date().toISOString();
        this.createNotification({
          type: 'email',
          status: 'success',
          subject: `Email retry successful: ${emailStatus.subject}`,
          recipient: emailStatus.recipient,
          content: `Email successfully sent to ${emailStatus.recipient} after ${emailStatus.retryCount} retries`,
          relatedEntityId: emailStatus.invoiceId,
          relatedEntityType: 'invoice'
        });
      } else {
        emailStatus.status = 'failed';
        emailStatus.errorMessage = 'Retry failed: Connection timeout';
        this.createNotification({
          type: 'email',
          status: 'failed',
          subject: `Email retry failed: ${emailStatus.subject}`,
          recipient: emailStatus.recipient,
          content: `Failed to send email after ${emailStatus.retryCount} retries`,
          errorMessage: emailStatus.errorMessage,
          relatedEntityId: emailStatus.invoiceId,
          relatedEntityType: 'invoice',
          retryCount: emailStatus.retryCount,
          maxRetries: emailStatus.maxRetries
        });
      }

      this.saveEmailStatuses();
    }, 2000);

    return true;
  }

  // Get email statuses
  getEmailStatuses(): EmailStatus[] {
    return [...this.emailStatuses];
  }

  // Play notification sound
  private playNotificationSound(): void {
    if (!this.soundEnabled) return;

    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Show desktop notification
  private showDesktopNotification(notification: AppNotification): void {
    if (!this.desktopNotificationsEnabled || !('Notification' in window)) return;

    try {
      new Notification(notification.subject, {
        body: notification.content,
        icon: '/favicon.ico',
        tag: notification.id
      });
    } catch (error) {
      console.warn('Could not show desktop notification:', error);
    }
  }

  // Settings
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('invoicepro_notification_sound', JSON.stringify(enabled));
  }

  getSoundEnabled(): boolean {
    try {
      const stored = localStorage.getItem('invoicepro_notification_sound');
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  }

  setDesktopNotificationsEnabled(enabled: boolean): void {
    this.desktopNotificationsEnabled = enabled;
    localStorage.setItem('invoicepro_desktop_notifications', JSON.stringify(enabled));
  }

  getDesktopNotificationsEnabled(): boolean {
    try {
      const stored = localStorage.getItem('invoicepro_desktop_notifications');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  }
}

export const notificationService = new NotificationService();