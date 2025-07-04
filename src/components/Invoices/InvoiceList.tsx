import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Filter, Download, Eye, Edit, Send, Trash2, Loader, RefreshCw } from 'lucide-react';
import { Invoice } from '../../types';
import { databaseService } from '../../services/database';
import { pdfService } from '../../services/pdfService';
import InvoiceForm from './InvoiceForm';
import InvoicePreview from './InvoicePreview';
import SimpleEmailModal from './SimpleEmailModal';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load invoices from database
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const invoicesData = await databaseService.getInvoices();
      setInvoices(invoicesData);
      console.log(`📋 Loaded ${invoicesData.length} invoices`);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadInvoices();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredInvoices = filterStatus === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filterStatus);

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(undefined);
    setShowInvoiceForm(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
  };

  const handleSendInvoice = (invoice: Invoice) => {
    setSendingInvoice(invoice);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      await pdfService.downloadInvoicePDF(invoice);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleSaveInvoice = async (invoiceData: Partial<Invoice>) => {
    try {
      const savedInvoice = await databaseService.saveInvoice(invoiceData);
      
      if (editingInvoice) {
        // Update existing invoice
        setInvoices(invoices.map(inv => 
          inv.id === editingInvoice.id ? savedInvoice : inv
        ));
        console.log('✅ Invoice updated successfully');
      } else {
        // Add new invoice
        setInvoices([savedInvoice, ...invoices]);
        console.log('✅ Invoice created successfully');
      }
      
      setShowInvoiceForm(false);
      setEditingInvoice(undefined);
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert('Failed to save invoice. Please try again.');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        const success = await databaseService.deleteInvoice(invoiceId);
        if (success) {
          setInvoices(invoices.filter(inv => inv.id !== invoiceId));
          console.log('✅ Invoice deleted successfully');
        } else {
          throw new Error('Delete operation failed');
        }
      } catch (error) {
        console.error('Failed to delete invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  };

  const handleSendEmail = async (emailData: { to: string; subject: string; message: string; copyMe: boolean }) => {
    try {
      console.log('Email prepared:', emailData);
      alert(`Email prepared for ${emailData.to}! Check your email client.`);
      
      // Update invoice status to sent
      if (sendingInvoice) {
        const updatedInvoice = { ...sendingInvoice, status: 'sent' as const };
        const savedInvoice = await databaseService.saveInvoice(updatedInvoice);
        
        setInvoices(invoices.map(inv => 
          inv.id === sendingInvoice.id ? savedInvoice : inv
        ));
      }
      
      setSendingInvoice(null);
    } catch (error) {
      console.error('Failed to prepare invoice email:', error);
      alert('Failed to prepare invoice email. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading invoices from database...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600">Manage and track all your invoices</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleCreateInvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Database Status */}
      <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
        databaseService.isDbConnected() 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-amber-50 border border-amber-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          databaseService.isDbConnected() ? 'bg-green-500' : 'bg-amber-500'
        }`}></div>
        <p className={`text-sm ${
          databaseService.isDbConnected() ? 'text-green-800' : 'text-amber-800'
        }`}>
          {databaseService.isDbConnected() 
            ? `Connected to MongoDB - ${invoices.length} invoices loaded`
            : 'Using local storage - Connect to MongoDB in Settings for persistent storage'
          }
        </p>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.number}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.client.company || invoice.client.name}</p>
                      <p className="text-sm text-gray-600">{invoice.client.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {format(new Date(invoice.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-gray-900">${invoice.total.toLocaleString()}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handlePreviewInvoice(invoice)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditInvoice(invoice)}
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSendInvoice(invoice)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Send"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filterStatus !== 'all' ? `No ${filterStatus} invoices` : 'No invoices yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {filterStatus !== 'all'
              ? 'Try changing the filter or create a new invoice'
              : 'Get started by creating your first invoice'
            }
          </p>
          <button 
            onClick={handleCreateInvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Invoice</span>
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {invoices.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              ${invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-blue-600">
              ${invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + inv.total, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showInvoiceForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={() => {
            setShowInvoiceForm(false);
            setEditingInvoice(undefined);
          }}
          onSave={handleSaveInvoice}
        />
      )}

      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onSend={() => {
            setSendingInvoice(previewInvoice);
            setPreviewInvoice(null);
          }}
          onDownload={() => handleDownloadInvoice(previewInvoice)}
        />
      )}

      {sendingInvoice && (
        <SimpleEmailModal
          invoice={sendingInvoice}
          onClose={() => setSendingInvoice(null)}
          onSend={handleSendEmail}
        />
      )}
    </div>
  );
}