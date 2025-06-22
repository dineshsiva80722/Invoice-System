import { UserProfile, ProfileChangeLog } from '../types';

interface ProfileUpdateData {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

class UserProfileService {
  private currentProfile: UserProfile | null = null;
  private changeLogs: ProfileChangeLog[] = [];
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadProfile();
    this.loadChangeLogs();
    this.initializeDefaultProfile();
  }

  // Load profile from storage
  private loadProfile(): void {
    try {
      const stored = localStorage.getItem('invoicepro_user_profile');
      this.currentProfile = stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.currentProfile = null;
    }
  }

  // Load change logs from storage
  private loadChangeLogs(): void {
    try {
      const stored = localStorage.getItem('invoicepro_profile_changes');
      this.changeLogs = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load profile change logs:', error);
      this.changeLogs = [];
    }
  }

  // Initialize default profile if none exists
  private initializeDefaultProfile(): void {
    if (!this.currentProfile) {
      this.currentProfile = {
        id: 'user-1',
        fullName: 'John Doe',
        email: 'john.doe@company.com',
        phone: '+1 (555) 123-4567',
        department: 'Administration',
        bio: 'Experienced business professional with expertise in financial management and client relations.',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/johndoe',
          website: 'https://johndoe.com'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.saveProfile();
    }
  }

  // Save profile to storage
  private saveProfile(): void {
    try {
      if (this.currentProfile) {
        localStorage.setItem('invoicepro_user_profile', JSON.stringify(this.currentProfile));
      }
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  // Save change logs to storage
  private saveChangeLogs(): void {
    try {
      localStorage.setItem('invoicepro_profile_changes', JSON.stringify(this.changeLogs));
    } catch (error) {
      console.error('Failed to save profile change logs:', error);
    }
  }

  // Log profile change
  private logChange(field: string, oldValue: string, newValue: string): void {
    const changeLog: ProfileChangeLog = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.currentProfile?.id || 'unknown',
      field,
      oldValue,
      newValue,
      changedAt: new Date().toISOString(),
      ipAddress: 'localhost', // In real app, get actual IP
      userAgent: navigator.userAgent
    };

    this.changeLogs.unshift(changeLog);
    
    // Keep only last 50 change logs
    if (this.changeLogs.length > 50) {
      this.changeLogs = this.changeLogs.slice(0, 50);
    }

    this.saveChangeLogs();
  }

  // Get current profile
  getProfile(): UserProfile | null {
    return this.currentProfile ? { ...this.currentProfile } : null;
  }

  // Update profile
  async updateProfile(updates: ProfileUpdateData): Promise<UserProfile> {
    if (!this.currentProfile) {
      throw new Error('No profile found');
    }

    const oldProfile = { ...this.currentProfile };
    const updatedProfile = {
      ...this.currentProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Log changes
    Object.keys(updates).forEach(key => {
      const oldValue = (oldProfile as any)[key];
      const newValue = (updates as any)[key];
      
      if (oldValue !== newValue) {
        this.logChange(
          key,
          typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue || ''),
          typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue || '')
        );
      }
    });

    this.currentProfile = updatedProfile;
    this.saveProfile();

    return { ...updatedProfile };
  }

  // Validate profile data
  validateProfile(data: ProfileUpdateData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Validate full name
    if (data.fullName !== undefined) {
      if (!data.fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (data.fullName.length < 2) {
        errors.fullName = 'Full name must be at least 2 characters';
      } else if (data.fullName.length > 100) {
        errors.fullName = 'Full name must be less than 100 characters';
      }
    }

    // Validate email
    if (data.email !== undefined) {
      if (!data.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Validate phone
    if (data.phone !== undefined && data.phone.trim()) {
      if (!/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    // Validate bio
    if (data.bio !== undefined && data.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }

    // Validate social links
    if (data.socialLinks) {
      const urlPattern = /^https?:\/\/.+/;
      
      if (data.socialLinks.linkedin && !urlPattern.test(data.socialLinks.linkedin)) {
        errors.linkedin = 'Please enter a valid LinkedIn URL';
      }
      
      if (data.socialLinks.twitter && !urlPattern.test(data.socialLinks.twitter)) {
        errors.twitter = 'Please enter a valid Twitter URL';
      }
      
      if (data.socialLinks.website && !urlPattern.test(data.socialLinks.website)) {
        errors.website = 'Please enter a valid website URL';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Auto-save profile (debounced)
  autoSaveProfile(updates: ProfileUpdateData): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.updateProfile(updates).catch(error => {
        console.error('Auto-save failed:', error);
      });
    }, 2000); // Save after 2 seconds of inactivity
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<string> {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Image file must be less than 5MB');
    }

    // In a real app, this would upload to a server
    // For demo, we'll create a local blob URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          // Store in localStorage (in real app, would be server URL)
          localStorage.setItem('invoicepro_profile_picture', result);
          resolve(result);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Get profile picture
  getProfilePicture(): string | null {
    try {
      return localStorage.getItem('invoicepro_profile_picture');
    } catch {
      return null;
    }
  }

  // Compress image
  async compressImage(file: File, maxWidth: number = 400, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Get change logs
  getChangeLogs(): ProfileChangeLog[] {
    return [...this.changeLogs];
  }

  // Clear auto-save timeout
  clearAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }
}

export const userProfileService = new UserProfileService();