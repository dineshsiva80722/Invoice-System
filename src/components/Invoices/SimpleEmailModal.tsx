import React, { useState } from 'react';
import { X, Mail, Copy, Download, CheckCircle, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { Invoice } from '../../types';
import { simpleEmailService, EmailData } from '../../services/simpleEmailService';

interface SimpleEmailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSend: (emailData: { 
    to: string; 
    subject: string; 
    message: string; 
    copyMe: boolean;
    invoiceId?: string | number;
  }) => void;
}

export default function SimpleEmailModal({ invoice, onClose, onSend }: SimpleEmailModalProps) {
  const serviceStatus = simpleEmailService.getEmailServiceStatus();
  
  const [emailData, setEmailData] = useState({
    to: invoice.client.email, // CLIENT EMAIL
    subject: `Invoice ${invoice.number} from ${serviceStatus.companyEmail.split('@')[0]}`,
    message: simpleEmailService.generateInvoiceEmailTemplate(
      invoice.number,
      invoice.client.name,
      invoice.total,
      invoice.dueDate
    ),
    copyMe: true
  });

  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [emailLogs, setEmailLogs] = useState(simpleEmailService.getEmailLogsByInvoice(invoice.number));

  const handleOpenEmailClient = async () => {
    if (!simpleEmailService.isValidEmail(emailData.to)) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }

    try {
      // Ensure we have a valid invoice ID
      if (!invoice?.id && !invoice?.number) {
        throw new Error('No valid invoice ID or number found');
      }

      // Pass invoice for PDF generation
      const response = await simpleEmailService.sendInvoiceEmail(
        emailData, 
        invoice.number || `INV-${Date.now()}`,
        invoice
      );
      
      if (response.success) {
        setStatus({
          type: 'success',
          message: `✅ Email prepared successfully! The invoice PDF has been downloaded.`
        });
        
        setEmailLogs(simpleEmailService.getEmailLogsByInvoice(invoice.number || invoice.id));
        
        // Call onSend with the invoice data
        setTimeout(() => {
          onSend({
            ...emailData,
            invoiceId: invoice.id || invoice.number
          });
        }, 1000);
      } else {
        setStatus({
          type: 'error',
          message: `❌ Failed to prepare email: ${response.error}`
        });
      }
    } catch (error) {
      console.error('Error in handleOpenEmailClient:', error);
      setStatus({
        type: 'error',
        message: 'An error occurred while preparing the email. Please try again.'
      });
    }
  };

  const handleCopyToClipboard = async () => {
    const success = await simpleEmailService.copyEmailToClipboard(emailData);
    
    if (success) {
      setStatus({
        type: 'success',
        message: `✅ Email content copied! FROM: ${serviceStatus.companyEmail} TO: ${emailData.to}`
      });
      setEmailLogs(simpleEmailService.getEmailLogsByInvoice(invoice.number));
    } else {
      setStatus({
        type: 'error',
        message: '❌ Failed to copy to clipboard'
      });
    }
  };

  const handleDownloadEmail = () => {
    const success = simpleEmailService.downloadEmailAsFile(emailData);
    
    if (success) {
      setStatus({
        type: 'success',
        message: `✅ Email template downloaded! FROM: ${serviceStatus.companyEmail} TO: ${emailData.to}`
      });
      setEmailLogs(simpleEmailService.getEmailLogsByInvoice(invoice.number));
    } else {
      setStatus({
        type: 'error',
        message: '❌ Failed to download email file'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Send Invoice Email</h2>
            <p className="text-gray-600">Send invoice to client with automatic PDF attachment</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          {/* Email Flow */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Email Routing</h4>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-medium">
                FROM: {serviceStatus.companyEmail}
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
              <div className="bg-green-100 px-3 py-1 rounded-full text-green-800 font-medium">
                TO: {emailData.to} (Client)
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Invoice PDF will be automatically downloaded and ready for attachment.
            </p>
          </div>

          {/* Email Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To * (Client Email)
              </label>
              <input
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From (Your Company)
              </label>
              <input
                type="email"
                value={serviceStatus.companyEmail}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={emailData.message}
              onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="copyMe"
              checked={emailData.copyMe}
              onChange={(e) => setEmailData({ ...emailData, copyMe: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="copyMe" className="text-sm text-gray-700">
              CC myself ({serviceStatus.companyEmail})
            </label>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleOpenEmailClient}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>Send Email</span>
            </button>

            <button
              onClick={handleCopyToClipboard}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Copy className="w-5 h-5" />
              <span>Copy Email</span>
            </button>

            <button
              onClick={handleDownloadEmail}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
          </div>

          {/* Status Messages */}
          {status.type && (
            <div className={`p-4 rounded-lg flex items-center space-x-3 ${
              status.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`text-sm ${
                status.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {status.message}
              </p>
            </div>
          )}

          {/* Email History */}
          {emailLogs.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Email History for {invoice.number}</h4>
              <div className="space-y-2">
                {emailLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'sent' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-gray-600">FROM: {log.fromEmail}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">TO: {log.recipient}</span>
                    </div>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Invoice Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Invoice:</span>
                <span className="ml-2 font-medium">{invoice.number}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">${invoice.total.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Client:</span>
                <span className="ml-2 font-medium">{invoice.client.company || invoice.client.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Due Date:</span>
                <span className="ml-2 font-medium">{invoice.dueDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>PDF auto-download • FROM: {serviceStatus.companyEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
}