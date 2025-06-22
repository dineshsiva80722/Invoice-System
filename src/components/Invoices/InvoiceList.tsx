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
      setInvoices(invoicesData || []); // Ensure we always have an array
      console.log(`📋 Loaded ${invoicesData?.length || 0} invoices`);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      setInvoices([]); // Set to empty array on error
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

  const filteredInvoices = invoices && Array.isArray(invoices) 
    ? (filterStatus === 'all' 
        ? invoices 
        : invoices.filter(invoice => invoice.status === filterStatus))
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            onClick={() => setShowInvoiceForm(true)}
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
                        onClick={() => setPreviewInvoice(invoice)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingInvoice(invoice);
                          setShowInvoiceForm(true);
                        }}
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSendingInvoice(invoice)}
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
            onClick={() => setShowInvoiceForm(true)}
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
          onSave={loadInvoices}
        />
      )}

      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
          onSend={() => setSendingInvoice(previewInvoice)}
          onDownload={() => handleDownloadInvoice(previewInvoice)}
        />
      )}

      {sendingInvoice && (
        <SimpleEmailModal
          invoice={sendingInvoice}
          onClose={() => setSendingInvoice(null)}
          onSend={async (emailData) => {
            try {
              console.log('Email sent data:', emailData);
              
              // Use the invoiceId from emailData if available, otherwise fall back to sendingInvoice.id
              const invoiceId = emailData.invoiceId || (sendingInvoice?.id);
              
              if (!invoiceId) {
                console.warn('Cannot update invoice status: No invoice ID found');
                alert('Email prepared, but could not update invoice status: Missing invoice ID');
                return;
              }
              
              try {
                // Update the invoice status to 'sent' in the database
                await databaseService.updateInvoice(String(invoiceId), { status: 'sent' });
                console.log(`Invoice ${invoiceId} status updated to sent`);
                
                // Refresh the invoice list
                await loadInvoices();
                
                // Show success message
                alert('Invoice status updated to sent successfully!');
              } catch (updateError) {
                console.error('Error updating invoice status:', updateError);
                // Show error to user
                alert('Email prepared, but failed to update invoice status. Please refresh the page to see the latest status.');
              }
            } catch (error) {
              console.error('Error in onSend handler:', error);
              alert('An error occurred while processing your request. Please try again.');
            }
          }}
        />
      )}
    </div>
  );

  const handleDeleteInvoice = async (id: string) => {
    try {
      await databaseService.deleteInvoice(id);
      loadInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };
}

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

const handleDownloadInvoice = async (invoice: Invoice) => {
  try {
    await pdfService.downloadInvoicePDF(invoice);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    alert('Failed to download PDF. Please try again.');
  }
};
