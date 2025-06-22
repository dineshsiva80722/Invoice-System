import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';

interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  taxNumber?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  invoiceFooter: string;
  bankDetails?: string;
  logo?: string | null;
}

class PDFService {
  private getCompanySettings(): CompanySettings {
    try {
      const stored = localStorage.getItem('invoicepro_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        return {
          companyName: settings.companyName || 'Your Company Name',
          companyAddress: settings.companyAddress || '123 Business Street\nCity, State 12345\nCountry',
          companyPhone: settings.companyPhone || '+1 (555) 123-4567',
          companyEmail: settings.companyEmail || 'info@yourcompany.com',
          companyWebsite: settings.companyWebsite,
          taxNumber: settings.taxNumber,
          primaryColor: settings.primaryColor || '#3b82f6',
          secondaryColor: settings.secondaryColor || '#1e40af',
          accentColor: settings.accentColor || '#06b6d4',
          invoiceFooter: settings.invoiceFooter || 'Thank you for your business!',
          bankDetails: settings.bankDetails,
          logo: settings.logo || null
        };
      }
    } catch (error) {
      console.error('Failed to load company settings:', error);
    }

    return {
      companyName: 'Your Company Name',
      companyAddress: '123 Business Street\nCity, State 12345\nCountry',
      companyPhone: '+1 (555) 123-4567',
      companyEmail: 'info@yourcompany.com',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      accentColor: '#06b6d4',
      invoiceFooter: 'Thank you for your business!',
      logo: null
    };
  }

  // Helper function to ensure numeric values are valid
  private ensureFiniteNumber(value: any, fallback: number = 0): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  // Helper function to format currency safely
  private formatCurrency(value: any): string {
    const num = this.ensureFiniteNumber(value, 0);
    return num.toFixed(2);
  }

  // Helper function to ensure valid coordinates for jsPDF
  private ensureValidCoordinate(value: any, fallback: number = 0): number {
    const num = this.ensureFiniteNumber(value, fallback);
    // Ensure the coordinate is within reasonable bounds for A4 page
    return Math.max(0, Math.min(num, 300));
  }

  // Helper function to ensure valid dimensions for jsPDF
  private ensureValidDimension(value: any, fallback: number = 1): number {
    const num = this.ensureFiniteNumber(value, fallback);
    // Ensure positive dimension
    return Math.max(0.1, num);
  }

  // Generate PDF from HTML element (for preview-based PDF)
  async generatePDFFromElement(element: HTMLElement, filename: string): Promise<Blob> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = this.ensureValidDimension(210, 210);
      const pageHeight = this.ensureValidDimension(295, 295);
      const imgHeight = this.ensureValidDimension((canvas.height * imgWidth) / canvas.width, 100);
      let heightLeft = this.ensureFiniteNumber(imgHeight, 100);
      let position = this.ensureValidCoordinate(0, 0);

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = this.ensureValidCoordinate(heightLeft - imgHeight, 0);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Failed to generate PDF from element:', error);
      throw error;
    }
  }

  // Generate professional PDF directly
  async generateInvoicePDF(invoice: Invoice): Promise<Blob> {
    try {
      console.log('Starting PDF generation for invoice:', invoice?.number);
      
      // Validate invoice data
      if (!invoice) {
        throw new Error('Invoice data is required');
      }

      const settings = this.getCompanySettings();
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set up fonts and colors
      pdf.setFont('helvetica');
      
      // Header section with safe coordinates
      const headerColor = this.hexToRgb(settings.primaryColor);
      pdf.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      pdf.rect(
        this.ensureValidCoordinate(0), 
        this.ensureValidCoordinate(0), 
        this.ensureValidDimension(210), 
        this.ensureValidDimension(40), 
        'F'
      );
      
      // Company logo area
      const logoX = this.ensureValidCoordinate(20);
      const logoY = this.ensureValidCoordinate(10);
      const logoSize = this.ensureValidDimension(20);
      
      if (settings.logo) {
        try {
          // Add logo image
          pdf.addImage(settings.logo, 'JPEG', logoX, logoY, logoSize, logoSize);
        } catch (logoError) {
          console.warn('Failed to add logo to PDF, using fallback:', logoError);
          // Fallback to colored square with initial
          const secondaryColor = this.hexToRgb(settings.secondaryColor);
          pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          pdf.rect(logoX, logoY, logoSize, logoSize, 'F');
          
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(this.ensureFiniteNumber(16, 16));
          pdf.setFont('helvetica', 'bold');
          const companyInitial = (settings.companyName || 'C').charAt(0).toUpperCase();
          pdf.text(companyInitial, logoX + logoSize/2, logoY + logoSize/2 + 3, { align: 'center' });
        }
      } else {
        // Fallback to colored square with initial
        const secondaryColor = this.hexToRgb(settings.secondaryColor);
        pdf.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        pdf.rect(logoX, logoY, logoSize, logoSize, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(this.ensureFiniteNumber(16, 16));
        pdf.setFont('helvetica', 'bold');
        const companyInitial = (settings.companyName || 'C').charAt(0).toUpperCase();
        pdf.text(companyInitial, logoX + logoSize/2, logoY + logoSize/2 + 3, { align: 'center' });
      }
      
      // Company info
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(this.ensureFiniteNumber(14, 14));
      pdf.setFont('helvetica', 'bold');
      pdf.text(
        settings.companyName || 'Company Name', 
        this.ensureValidCoordinate(50), 
        this.ensureValidCoordinate(15)
      );
      
      pdf.setFontSize(this.ensureFiniteNumber(9, 9));
      pdf.setFont('helvetica', 'normal');
      const addressLines = (settings.companyAddress || '').split('\n');
      addressLines.forEach((line, index) => {
        pdf.text(
          line || '', 
          this.ensureValidCoordinate(50), 
          this.ensureValidCoordinate(20 + (index * 4))
        );
      });
      
      pdf.text(
        settings.companyEmail || '', 
        this.ensureValidCoordinate(50), 
        this.ensureValidCoordinate(20 + (addressLines.length * 4))
      );
      pdf.text(
        settings.companyPhone || '', 
        this.ensureValidCoordinate(50), 
        this.ensureValidCoordinate(24 + (addressLines.length * 4))
      );
      
      // Invoice title and details
      const primaryColor = this.hexToRgb(settings.primaryColor);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.setFontSize(this.ensureFiniteNumber(24, 24));
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', this.ensureValidCoordinate(150), this.ensureValidCoordinate(20));
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(this.ensureFiniteNumber(10, 10));
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Invoice #: ${invoice.number || 'N/A'}`, 
        this.ensureValidCoordinate(150), 
        this.ensureValidCoordinate(28)
      );
      pdf.text(
        `Date: ${invoice.date || 'N/A'}`, 
        this.ensureValidCoordinate(150), 
        this.ensureValidCoordinate(33)
      );
      pdf.text(
        `Due Date: ${invoice.dueDate || 'N/A'}`, 
        this.ensureValidCoordinate(150), 
        this.ensureValidCoordinate(38)
      );
      
      // Bill To section
      const secondaryColor = this.hexToRgb(settings.secondaryColor);
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.setFontSize(this.ensureFiniteNumber(12, 12));
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', this.ensureValidCoordinate(20), this.ensureValidCoordinate(55));
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(this.ensureFiniteNumber(10, 10));
      pdf.setFont('helvetica', 'normal');
      let yPos = this.ensureValidCoordinate(62);
      
      if (invoice.client?.company) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(invoice.client.company, this.ensureValidCoordinate(20), yPos);
        yPos = this.ensureValidCoordinate(yPos + 5);
        pdf.setFont('helvetica', 'normal');
      }
      
      pdf.text(invoice.client?.name || 'N/A', this.ensureValidCoordinate(20), yPos);
      yPos = this.ensureValidCoordinate(yPos + 5);
      pdf.text(invoice.client?.address?.street || 'N/A', this.ensureValidCoordinate(20), yPos);
      yPos = this.ensureValidCoordinate(yPos + 5);
      pdf.text(
        `${invoice.client?.address?.city || 'N/A'}, ${invoice.client?.address?.state || 'N/A'} ${invoice.client?.address?.zipCode || 'N/A'}`, 
        this.ensureValidCoordinate(20), 
        yPos
      );
      yPos = this.ensureValidCoordinate(yPos + 5);
      pdf.text(invoice.client?.address?.country || 'N/A', this.ensureValidCoordinate(20), yPos);
      yPos = this.ensureValidCoordinate(yPos + 5);
      pdf.text(invoice.client?.email || 'N/A', this.ensureValidCoordinate(20), yPos);
      if (invoice.client?.phone) {
        yPos = this.ensureValidCoordinate(yPos + 5);
        pdf.text(invoice.client.phone, this.ensureValidCoordinate(20), yPos);
      }
      
      // Items table
      const tableStartY = this.ensureValidCoordinate(yPos + 15);
      
      // Table header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(
        this.ensureValidCoordinate(20), 
        tableStartY, 
        this.ensureValidDimension(170), 
        this.ensureValidDimension(8), 
        'F'
      );
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(this.ensureFiniteNumber(10, 10));
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description', this.ensureValidCoordinate(22), this.ensureValidCoordinate(tableStartY + 5));
      pdf.text('Qty', this.ensureValidCoordinate(130), this.ensureValidCoordinate(tableStartY + 5));
      pdf.text('Rate', this.ensureValidCoordinate(150), this.ensureValidCoordinate(tableStartY + 5));
      pdf.text('Amount', this.ensureValidCoordinate(170), this.ensureValidCoordinate(tableStartY + 5));
      
      // Table items
      pdf.setFont('helvetica', 'normal');
      let currentY = this.ensureValidCoordinate(tableStartY + 12);
      
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach((item) => {
          const quantity = this.ensureFiniteNumber(item.quantity, 0);
          const rate = this.ensureFiniteNumber(item.rate, 0);
          const amount = this.ensureFiniteNumber(item.amount, 0);
          
          pdf.text(item.description || 'N/A', this.ensureValidCoordinate(22), currentY);
          pdf.text(quantity.toString(), this.ensureValidCoordinate(130), currentY);
          pdf.text(`$${this.formatCurrency(rate)}`, this.ensureValidCoordinate(150), currentY);
          pdf.text(`$${this.formatCurrency(amount)}`, this.ensureValidCoordinate(170), currentY);
          currentY = this.ensureValidCoordinate(currentY + 6);
          
          // Add line separator
          pdf.setDrawColor(230, 230, 230);
          pdf.line(
            this.ensureValidCoordinate(20), 
            this.ensureValidCoordinate(currentY - 2), 
            this.ensureValidCoordinate(190), 
            this.ensureValidCoordinate(currentY - 2)
          );
        });
      }
      
      // Totals section
      const totalsY = this.ensureValidCoordinate(currentY + 10);
      const totalsX = this.ensureValidCoordinate(130);
      
      const subtotal = this.ensureFiniteNumber(invoice.subtotal, 0);
      const tax = this.ensureFiniteNumber(invoice.tax, 0);
      const total = this.ensureFiniteNumber(invoice.total, 0);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', totalsX, totalsY);
      pdf.text(`$${this.formatCurrency(subtotal)}`, this.ensureValidCoordinate(170), totalsY);
      
      pdf.text('Tax:', totalsX, this.ensureValidCoordinate(totalsY + 6));
      pdf.text(`$${this.formatCurrency(tax)}`, this.ensureValidCoordinate(170), this.ensureValidCoordinate(totalsY + 6));
      
      // Total line
      const totalLineColor = this.hexToRgb(settings.primaryColor);
      pdf.setDrawColor(totalLineColor[0], totalLineColor[1], totalLineColor[2]);
      pdf.setLineWidth(this.ensureValidDimension(0.5, 0.5));
      pdf.line(
        totalsX, 
        this.ensureValidCoordinate(totalsY + 10), 
        this.ensureValidCoordinate(190), 
        this.ensureValidCoordinate(totalsY + 10)
      );
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(this.ensureFiniteNumber(12, 12));
      pdf.setTextColor(totalLineColor[0], totalLineColor[1], totalLineColor[2]);
      pdf.text('Total:', totalsX, this.ensureValidCoordinate(totalsY + 16));
      pdf.text(`$${this.formatCurrency(total)}`, this.ensureValidCoordinate(170), this.ensureValidCoordinate(totalsY + 16));
      
      // Notes and Terms
      let footerY = this.ensureValidCoordinate(totalsY + 30);
      
      if (invoice.notes) {
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(this.ensureFiniteNumber(10, 10));
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes:', this.ensureValidCoordinate(20), footerY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(invoice.notes, this.ensureValidCoordinate(20), this.ensureValidCoordinate(footerY + 5));
        footerY = this.ensureValidCoordinate(footerY + 15);
      }
      
      if (invoice.terms) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Terms & Conditions:', this.ensureValidCoordinate(20), footerY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(invoice.terms, this.ensureValidCoordinate(20), this.ensureValidCoordinate(footerY + 5));
        footerY = this.ensureValidCoordinate(footerY + 15);
      }
      
      if (settings.bankDetails) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Payment Information:', this.ensureValidCoordinate(20), footerY);
        pdf.setFont('helvetica', 'normal');
        const bankLines = settings.bankDetails.split('\n');
        bankLines.forEach((line, index) => {
          pdf.text(line, this.ensureValidCoordinate(20), this.ensureValidCoordinate(footerY + 5 + (index * 4)));
        });
        footerY = this.ensureValidCoordinate(footerY + 5 + (bankLines.length * 4) + 10);
      }
      
      // Footer
      pdf.setDrawColor(230, 230, 230);
      pdf.line(
        this.ensureValidCoordinate(20), 
        footerY, 
        this.ensureValidCoordinate(190), 
        footerY
      );
      
      const accentColor = this.hexToRgb(settings.accentColor);
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      pdf.setFontSize(this.ensureFiniteNumber(10, 10));
      pdf.setFont('helvetica', 'bold');
      pdf.text(settings.invoiceFooter, this.ensureValidCoordinate(105), this.ensureValidCoordinate(footerY + 8), { align: 'center' });
      
      if (settings.taxNumber) {
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(this.ensureFiniteNumber(8, 8));
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Tax Number: ${settings.taxNumber}`, this.ensureValidCoordinate(105), this.ensureValidCoordinate(footerY + 15), { align: 'center' });
      }
      
      console.log('PDF generation completed successfully');
      return pdf.output('blob');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      console.error('Invoice data:', invoice);
      throw error;
    }
  }

  // Download PDF file
  async downloadInvoicePDF(invoice: Invoice): Promise<void> {
    try {
      console.log('Starting PDF download for invoice:', invoice?.number);
      const pdfBlob = await this.generateInvoicePDF(invoice);
      const url = URL.createObjectURL(pdfBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.number || 'unknown'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`✅ PDF downloaded: Invoice-${invoice.number || 'unknown'}.pdf`);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  }

  // Create blob URL for email attachment
  async createPDFBlobUrl(invoice: Invoice): Promise<string> {
    try {
      console.log('Creating PDF blob URL for invoice:', invoice?.number);
      const pdfBlob = await this.generateInvoicePDF(invoice);
      return URL.createObjectURL(pdfBlob);
    } catch (error) {
      console.error('Failed to create PDF blob URL:', error);
      throw error;
    }
  }

  // Helper function to convert hex to RGB
  private hexToRgb(hex: string): [number, number, number] {
    if (!hex || typeof hex !== 'string') {
      return [0, 0, 0];
    }
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }
}

export const pdfService = new PDFService();