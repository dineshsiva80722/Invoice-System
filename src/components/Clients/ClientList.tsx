import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Search, Edit, Trash2, Mail, Phone, Loader, RefreshCw } from 'lucide-react';
import { Client } from '../../types';
import { databaseService } from '../../services/database';
import ClientForm from './ClientForm';

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load clients from database
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await databaseService.getClients();
      setClients(clientsData || []); // Ensure we always have an array
      console.log(`📋 Loaded ${clientsData?.length || 0} clients`);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadClients();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    try {
      await databaseService.saveClient(clientData);
      await loadClients();
      setShowClientForm(false);
      setEditingClient(undefined);
      
      // Dispatch a custom event to notify other components that clients have been updated
      window.dispatchEvent(new Event('clientUpdated'));
    } catch (error) {
      console.error('Failed to save client:', error);
    }
  };

  const filteredClients = clients && Array.isArray(clients) 
    ? clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
      )
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowClientForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Client</span>
        </button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients..."
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          disabled={refreshing}
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.role}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {client.company || '-'}
                  </td>
                  <td className="py-4 px-6">
                    {client.email}
                  </td>
                  <td className="py-4 px-6">
                    {client.phone || '-'}
                  </td>
                  <td className="py-4 px-6">
                    {format(new Date(client.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setShowClientForm(true);
                        }}
                        className="p-2 text-yellow-600 hover:text-yellow-800 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => databaseService.deleteClient(client.id).then(() => loadClients())}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = `mailto:${client.email}`;
                        }}
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Email"
                      >
                        <Mail className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = `tel:${client.phone}`;
                        }}
                        className="p-2 text-green-600 hover:text-green-800 transition-colors"
                        title="Call"
                      >
                        <Phone className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showClientForm && (
        <ClientForm
          client={editingClient}
          onClose={() => {
            setShowClientForm(false);
            setEditingClient(undefined);
          }}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
}