import React from 'react';
import { X, Download, Send, Printer as Print } from 'lucide-react';
import { Invoice } from '../../types';
import { format } from 'date-fns';
import { pdfService } from '../../services/pdfService';

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
  onSend: () => void;
  onDownload: () => void;
}

export default function InvoicePreview({ invoice, onClose, onSend, onDownload }: InvoicePreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      await pdfService.downloadInvoicePDF(invoice);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Get company settings for styling
  const getCompanySettings = () => {
    try {
      const stored = localStorage.getItem('invoicepro_settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    
    return {
      companyName: 'Your Company Name',
      companyAddress: '123 Business Street\nCity, State 12345\nCountry',
      companyPhone: '+1 (555) 123-4567',
      companyEmail: 'info@yourcompany.com',
      companyWebsite: 'www.yourcompany.com',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      accentColor: '#06b6d4',
      invoiceFooter: 'Thank you for your business!',
      taxNumber: '',
      logo: null
    };
  };

  const settings = getCompanySettings();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
            <p className="text-gray-600">{invoice.number}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Print className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onSend}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-8 bg-gray-50">
          <div 
            id="invoice-preview"
            className="bg-white p-8 shadow-lg rounded-lg max-w-3xl mx-auto"
            style={{ 
              '--primary-color': settings.primaryColor,
              '--secondary-color': settings.secondaryColor,
              '--accent-color': settings.accentColor
            } as React.CSSProperties}
          >
            {/* Invoice Header with Blue Background */}
            <div 
              className="flex justify-between items-start mb-8 p-6 rounded-lg -mx-6 -mt-6"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <div className="flex items-start space-x-4">
                {/* Company Logo */}
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  {settings.logo ? (
                    <img
                      src={settings.logo}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-white font-bold text-xl">
                      {settings.companyName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-white">
                  <p className="font-bold text-lg">{settings.companyName}</p>
                  {settings.companyAddress.split('\n').map((line: string, index: number) => (
                    <p key={index} className="text-sm opacity-90">{line}</p>
                  ))}
                  <p className="text-sm opacity-90 mt-1">{settings.companyEmail}</p>
                  <p className="text-sm opacity-90">{settings.companyPhone}</p>
                  {settings.companyWebsite && <p className="text-sm opacity-90">{settings.companyWebsite}</p>}
                </div>
              </div>
              <div className="text-right text-white">
                <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Invoice #:</span> {invoice.number}</p>
                  <p><span className="font-medium">Date:</span> {format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
                  <p><span className="font-medium">Due Date:</span> {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <h3 
                className="text-lg font-semibold mb-3"
                style={{ color: settings.secondaryColor }}
              >
                Bill To:
              </h3>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 text-base">{invoice.client.company || invoice.client.name}</p>
                {invoice.client.company && <p className="text-gray-700">{invoice.client.name}</p>}
                <p>{invoice.client.address.street}</p>
                <p>{invoice.client.address.city}, {invoice.client.address.state} {invoice.client.address.zipCode}</p>
                <p>{invoice.client.address.country}</p>
                <p className="mt-2">{invoice.client.email}</p>
                {invoice.client.phone && <p>{invoice.client.phone}</p>}
              </div>
            </div>

            {/* Invoice Items Table */}
            <div className="mb-8">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr 
                      className="text-white"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      <th className="text-left py-4 px-4 font-semibold">Description</th>
                      <th className="text-right py-4 px-4 font-semibold w-20">Qty</th>
                      <th className="text-right py-4 px-4 font-semibold w-24">Rate</th>
                      <th className="text-right py-4 px-4 font-semibold w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-4 px-4 text-gray-900">{item.description}</td>
                        <td className="py-4 px-4 text-gray-600 text-right">{item.quantity}</td>
                        <td className="py-4 px-4 text-gray-600 text-right">${item.rate.toFixed(2)}</td>
                        <td className="py-4 px-4 text-gray-900 text-right font-medium">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900 font-medium">${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900 font-medium">${invoice.tax.toFixed(2)}</span>
                  </div>
                  <div 
                    className="border-t-2 pt-3"
                    style={{ borderColor: settings.primaryColor }}
                  >
                    <div className="flex justify-between py-2">
                      <span className="text-xl font-bold text-gray-900">Total:</span>
                      <span 
                        className="text-xl font-bold"
                        style={{ color: settings.primaryColor }}
                      >
                        ${invoice.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                {invoice.notes && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h4>
                    <p className="text-sm text-gray-600">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 text-center">
              <p 
                className="text-lg font-medium mb-2"
                style={{ color: settings.accentColor }}
              >
                {settings.invoiceFooter}
              </p>
              {settings.taxNumber && (
                <p className="text-xs text-gray-500">
                  Tax Number: {settings.taxNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}