import React from 'react';
import { X, Download, Printer as Print } from 'lucide-react';

interface InvoicePreviewModalProps {
  settings: any;
  onClose: () => void;
}

export default function InvoicePreviewModal({ settings, onClose }: InvoicePreviewModalProps) {
  const sampleInvoice = {
    number: 'INV-001',
    date: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    client: {
      name: 'John Smith',
      company: 'Sample Company Inc.',
      address: '123 Business Street\nNew York, NY 10001\nUSA',
      email: 'john@samplecompany.com'
    },
    items: [
      { description: 'Web Development Services', quantity: 40, rate: 150, amount: 6000 },
      { description: 'UI/UX Design', quantity: 20, rate: 100, amount: 2000 }
    ],
    subtotal: 8000,
    tax: 680,
    total: 8680
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    alert('PDF download functionality would be implemented here');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
            <p className="text-gray-600">Preview with your current settings</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button 
              onClick={handlePrint}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Print className="w-4 h-4" />
              <span>Print</span>
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
            className="bg-white p-8 shadow-lg rounded-lg max-w-3xl mx-auto"
            style={{ 
              '--primary-color': settings.primaryColor,
              '--secondary-color': settings.secondaryColor,
              '--accent-color': settings.accentColor
            } as React.CSSProperties}
          >
            {/* Invoice Header */}
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
                <h1 
                  className="text-3xl font-bold mb-2"
                  style={{ color: 'white' }}
                >
                  INVOICE
                </h1>
                <div className="text-sm text-white opacity-90">
                  <p><span className="font-medium">Invoice #:</span> {sampleInvoice.number}</p>
                  <p><span className="font-medium">Date:</span> {sampleInvoice.date}</p>
                  <p><span className="font-medium">Due Date:</span> {sampleInvoice.dueDate}</p>
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
                <p className="font-medium text-gray-900">{sampleInvoice.client.company}</p>
                <p>{sampleInvoice.client.name}</p>
                {sampleInvoice.client.address.split('\n').map((line: string, index: number) => (
                  <p key={index}>{line}</p>
                ))}
                <p className="mt-2">{sampleInvoice.client.email}</p>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr 
                    className="border-b-2 text-white"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <th className="text-left py-3 px-4 text-sm font-semibold">Description</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold w-20">Qty</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold w-24">Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleInvoice.items.map((item, index) => (
                    <tr key={index} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">${item.rate.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900 font-medium">${sampleInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Tax ({settings.taxRate}%):</span>
                  <span className="text-gray-900 font-medium">${sampleInvoice.tax.toFixed(2)}</span>
                </div>
                <div 
                  className="border-t pt-2"
                  style={{ borderColor: settings.primaryColor }}
                >
                  <div className="flex justify-between py-2">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span 
                      className="text-lg font-bold"
                      style={{ color: settings.primaryColor }}
                    >
                      ${sampleInvoice.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            {settings.bankDetails && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Payment Information:</h4>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {settings.bankDetails}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 text-center">
              <p 
                className="text-sm font-medium"
                style={{ color: settings.accentColor }}
              >
                {settings.invoiceFooter}
              </p>
              {settings.taxNumber && (
                <p className="text-xs text-gray-500 mt-2">
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