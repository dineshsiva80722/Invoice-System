import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Send, Eye } from 'lucide-react';
import { Client, Product, Invoice, InvoiceItem } from '../../types';
import { databaseService } from '../../services/database';
import { format, addDays } from 'date-fns';

interface InvoiceFormProps {
  onClose: () => void;
  onSave: (invoice: Partial<Invoice>) => void;
  invoice?: Invoice;
}

export default function InvoiceForm({ onClose, onSave, invoice }: InvoiceFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    number: invoice?.number || `INV-${String(Date.now()).slice(-6)}`,
    clientId: invoice?.clientId || '',
    date: invoice?.date || format(new Date(), 'yyyy-MM-dd'),
    dueDate: invoice?.dueDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: invoice?.status || 'draft' as const,
    notes: invoice?.notes || '',
    terms: invoice?.terms || 'Payment due within 30 days of invoice date.',
  });

  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }
    ]
  );

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load clients and products from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsData, productsData] = await Promise.all([
          databaseService.getClients(),
          databaseService.getProducts()
        ]);
        
        setClients(clientsData);
        setProducts(productsData);

        // Set selected client if editing
        if (invoice && clientsData.length > 0) {
          const client = clientsData.find(c => c.id === invoice.clientId);
          setSelectedClient(client || null);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setErrors({ general: 'Failed to load clients and products. Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [invoice]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const selectProduct = (itemId: string, product: Product) => {
    updateItem(itemId, 'description', product.name);
    updateItem(itemId, 'rate', product.rate);
    updateItem(itemId, 'productId', product.id);
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 8.5; // Default tax rate
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedClient) {
      newErrors.client = 'Please select a client';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Invoice number is required';
    }

    if (items.some(item => !item.description.trim())) {
      newErrors.items = 'All items must have a description';
    }

    if (items.some(item => item.quantity <= 0)) {
      newErrors.items = 'All items must have a quantity greater than 0';
    }

    if (items.some(item => item.rate <= 0)) {
      newErrors.items = 'All items must have a rate greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: 'draft' | 'sent') => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      const invoiceData: Partial<Invoice> = {
        ...formData,
        status,
        client: selectedClient!,
        clientId: selectedClient!.id,
        items,
        subtotal,
        tax,
        total,
        updatedAt: format(new Date(), 'yyyy-MM-dd')
      };

      // Save to database
      const savedInvoice = await databaseService.saveInvoice(invoiceData);
      onSave(savedInvoice);
    } catch (error) {
      console.error('Failed to save invoice:', error);
      setErrors({ general: 'Failed to save invoice. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">Loading clients and products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {invoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <p className="text-gray-600">Fill in the details below to create your invoice</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Error Messages */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Invoice Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.number ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => {
                      const client = clients.find(c => c.id === e.target.value);
                      setFormData({ ...formData, clientId: e.target.value });
                      setSelectedClient(client || null);
                      if (errors.client) {
                        setErrors({ ...errors, client: '' });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.client ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.company || client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                  {errors.client && <p className="text-red-500 text-sm mt-1">{errors.client}</p>}
                  {clients.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1 bg-amber-50 p-2 rounded">
                      No clients found. Please add clients first in the Clients section.
                    </p>
                  )}
                </div>

                {selectedClient && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Client Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Name:</strong> {selectedClient.name}</p>
                      <p><strong>Email:</strong> {selectedClient.email}</p>
                      {selectedClient.phone && <p><strong>Phone:</strong> {selectedClient.phone}</p>}
                      <p><strong>Address:</strong> {selectedClient.address.street}, {selectedClient.address.city}, {selectedClient.address.state} {selectedClient.address.zipCode}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                <button
                  onClick={addItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {errors.items && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">{errors.items}</p>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-24">Qty</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-32">Rate</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-32">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="py-3 px-4">
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                placeholder="Item description"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              {products.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    const product = products.find(p => p.id === e.target.value);
                                    if (product) selectProduct(item.id, product);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                  <option value="">Select from catalog</option>
                                  {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                      {product.name} - ${product.rate}/{product.unit}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {products.length === 0 && (
                                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                  No products found. Add products in the Products section to use them here.
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">
                              ${item.amount.toFixed(2)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={items.length === 1}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="mt-6 flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tax ({taxRate}%):</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Additional notes for the client..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  rows={4}
                  placeholder="Payment terms and conditions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={saving}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Draft</span>
            </button>
            
            <button
              onClick={() => handleSubmit('sent')}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Save & Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}