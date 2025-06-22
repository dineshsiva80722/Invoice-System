interface EmailData {
  to: string;
  subject: string;
  message: string;
  copyMe: boolean;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface EmailLog {
  id: string;
  invoiceNumber: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  timestamp: string;
  method: 'mailto' | 'copy' | 'download';
  fromEmail: string;
}

class SimpleEmailService {
  private emailLogs: EmailLog[] = [];
  private companySettings: any = null;

  constructor() {
    this.loadEmailLogs();
    this.loadCompanySettings();
  }

  private loadCompanySettings(): void {
    try {
      const stored = localStorage.getItem('invoicepro_settings');
      if (stored) {
        this.companySettings = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }
  }

  private getCompanyEmail(): string {
    return this.companySettings?.companyEmail || 'your-email@company.com';
  }

  private getCompanyName(): string {
    return this.companySettings?.companyName || 'Your Company';
  }

  // Send email to CLIENT with automatic PDF download
  async sendInvoiceEmail(emailData: EmailData, invoiceNumber?: string, invoice?: any): Promise<EmailResponse> {
    const timestamp = new Date().toISOString();
    const logId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fromEmail = this.getCompanyEmail();
    const toEmail = emailData.to; // CLIENT EMAIL
    
    try {
      // Generate and download PDF automatically
      if (invoice) {
        const { pdfService } = await import('./pdfService');
        await pdfService.downloadInvoicePDF(invoice);
      }

      // Open email client with CORRECT routing in NEW TAB
      const success = this.openEmailClient(emailData, invoice);
      
      // Log the attempt
      const emailLog: EmailLog = {
        id: logId,
        invoiceNumber: invoiceNumber || 'Unknown',
        recipient: toEmail, // CLIENT email
        subject: emailData.subject,
        status: success ? 'sent' : 'failed',
        timestamp,
        method: 'mailto',
        fromEmail: fromEmail // COMPANY email
      };

      this.addEmailLog(emailLog);

      if (success) {
        return {
          success: true,
          messageId: logId
        };
      } else {
        throw new Error('Failed to open email client');
      }
    } catch (error) {
      const failedLog: EmailLog = {
        id: logId,
        invoiceNumber: invoiceNumber || 'Unknown',
        recipient: toEmail,
        subject: emailData.subject,
        status: 'failed',
        timestamp,
        method: 'mailto',
        fromEmail: fromEmail
      };

      this.addEmailLog(failedLog);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Open default email client with mailto: link
  private openEmailClient(emailData: EmailData, invoice?: any): boolean {
    try {
      const fromEmail = this.getCompanyEmail();
      const toEmail = emailData.to; // CLIENT EMAIL
      
      // Encode the email components
      const subject = encodeURIComponent(emailData.subject);
      const body = encodeURIComponent(emailData.message);
      
      // Create mailto link with subject and body
      const mailtoLink = `mailto:${toEmail}?subject=${subject}&body=${body}`;
      
      // Open the default email client
      window.location.href = mailtoLink;
      
      return true;
    } catch (error) {
      console.error('Failed to open email client:', error);
      // Fallback to showing the alert if mailto: fails
      const fromEmail = this.getCompanyEmail();
      const fromName = this.getCompanyName();
      const message = `✅ Email prepared for sending!\n\n` +
        `To: ${emailData.to} (Client)\n` +
        `From: ${fromEmail} (${fromName})\n` +
        `Subject: ${emailData.subject}\n\n` +
        (invoice ? `Invoice PDF: Invoice-${invoice.number}.pdf\n` : '') +
        '\nPlease use your email client to send this message.';
      
      alert(message);
      return false;
    }
  }

  private formatEmailMessage(message: string, fromName: string, fromEmail: string): string {
    const companyPhone = this.companySettings?.companyPhone || '';
    const companyWebsite = this.companySettings?.companyWebsite || '';
    
    return `${message}

---
Best regards,
${fromName}
Email: ${fromEmail}${companyPhone ? `\nPhone: ${companyPhone}` : ''}${companyWebsite ? `\nWebsite: ${companyWebsite}` : ''}`;
  }

  // Copy email content to clipboard
  async copyEmailToClipboard(emailData: EmailData): Promise<boolean> {
    try {
      const fromEmail = this.getCompanyEmail();
      const fromName = this.getCompanyName();
      
      const emailContent = `FROM: ${fromName} <${fromEmail}>
TO: ${emailData.to}
SUBJECT: ${emailData.subject}
${emailData.copyMe ? `CC: ${fromEmail}` : ''}

MESSAGE:
${this.formatEmailMessage(emailData.message, fromName, fromEmail)}

---
INSTRUCTIONS: Send this email FROM ${fromEmail} TO ${emailData.to}`;

      await navigator.clipboard.writeText(emailContent);
      
      const logId = `copy_${Date.now()}`;
      const emailLog: EmailLog = {
        id: logId,
        invoiceNumber: 'Manual Copy',
        recipient: emailData.to,
        subject: emailData.subject,
        status: 'sent',
        timestamp: new Date().toISOString(),
        method: 'copy',
        fromEmail: fromEmail
      };

      this.addEmailLog(emailLog);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Download email as text file
  downloadEmailAsFile(emailData: EmailData): boolean {
    try {
      const fromEmail = this.getCompanyEmail();
      const fromName = this.getCompanyName();
      
      const emailContent = `EMAIL TEMPLATE
================

FROM: ${fromName} <${fromEmail}>
TO: ${emailData.to}
SUBJECT: ${emailData.subject}
${emailData.copyMe ? `CC: ${fromEmail}` : ''}

MESSAGE:
${this.formatEmailMessage(emailData.message, fromName, fromEmail)}

================
INSTRUCTIONS: Send this email FROM ${fromEmail} TO ${emailData.to}`;

      const blob = new Blob([emailContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-${emailData.to.replace('@', '-at-')}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const logId = `download_${Date.now()}`;
      const emailLog: EmailLog = {
        id: logId,
        invoiceNumber: 'Manual Download',
        recipient: emailData.to,
        subject: emailData.subject,
        status: 'sent',
        timestamp: new Date().toISOString(),
        method: 'download',
        fromEmail: fromEmail
      };

      this.addEmailLog(emailLog);
      return true;
    } catch (error) {
      console.error('Failed to download email:', error);
      return false;
    }
  }

  // Email logging
  private loadEmailLogs(): void {
    try {
      const stored = localStorage.getItem('invoicepro_simple_email_logs');
      this.emailLogs = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load email logs:', error);
      this.emailLogs = [];
    }
  }

  private addEmailLog(log: EmailLog): void {
    this.emailLogs.unshift(log);
    
    if (this.emailLogs.length > 50) {
      this.emailLogs = this.emailLogs.slice(0, 50);
    }
    
    try {
      localStorage.setItem('invoicepro_simple_email_logs', JSON.stringify(this.emailLogs));
    } catch (error) {
      console.error('Failed to save email logs:', error);
    }
  }

  // Public methods
  getEmailLogs(): EmailLog[] {
    return [...this.emailLogs];
  }

  getEmailLogsByInvoice(invoiceNumber: string): EmailLog[] {
    return this.emailLogs.filter(log => log.invoiceNumber === invoiceNumber);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateInvoiceEmailTemplate(invoiceNumber: string, clientName: string, amount: number, dueDate: string): string {
    const companyName = this.getCompanyName();
    
    return `Dear ${clientName},

I hope this email finds you well.

Please find attached invoice ${invoiceNumber} for the amount of $${amount.toLocaleString()}.

Invoice Details:
• Invoice Number: ${invoiceNumber}
• Amount Due: $${amount.toLocaleString()}
• Due Date: ${dueDate}

Payment Instructions:
Please remit payment by the due date to avoid any late fees. You can pay online through our client portal or send payment to the address listed on the invoice.

If you have any questions about this invoice or need to discuss payment arrangements, please don't hesitate to contact us.

Thank you for your business!`;
  }

  refreshCompanySettings(): void {
    this.loadCompanySettings();
  }

  getEmailServiceStatus(): {
    configured: boolean;
    service: string;
    status: string;
    companyEmail: string;
  } {
    return {
      configured: true,
      service: 'Simple Email (No Third-Party)',
      status: 'Ready - Uses Default Email Client',
      companyEmail: this.getCompanyEmail()
    };
  }
}

export const simpleEmailService = new SimpleEmailService();
export type { EmailData, EmailResponse, EmailLog };