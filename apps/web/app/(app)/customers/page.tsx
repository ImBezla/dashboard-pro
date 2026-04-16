'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    notes: '',
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.get(`/customers${params}`);
      return response.data;
    },
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post('/customers', {
          name: data.name.trim(),
          email: data.email?.trim() || undefined,
          company: data.company?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
          address: data.address?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        });
        return response.data;
      } catch (error: any) {
        console.error('Failed to create customer:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Fehler beim Erstellen des Kunden';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowAddCustomer(false);
      setCustomerForm({
        name: '',
        email: '',
        company: '',
        phone: '',
        address: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      alert(error.message || 'Fehler beim Erstellen des Kunden');
    },
  });

  // Customers are already filtered by backend if search is provided
  const filteredCustomers = customers;

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!customerForm.name.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }
    
    if (customerForm.email && !customerForm.email.includes('@')) {
      alert('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }
    
    addCustomerMutation.mutate(customerForm);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Kunden</h1>
          <p className="text-lg text-text-light">
            Kundenverwaltung und CRM
          </p>
        </div>
        <button
          onClick={() => setShowAddCustomer(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          + Neuer Kunde
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Kunden durchsuchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 shadow border border-border text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse">Lädt Kunden...</div>
        </div>
      ) : !filteredCustomers || filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow border border-border text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-bold text-dark mb-2">
            {search ? 'Keine Kunden gefunden' : 'Noch keine Kunden vorhanden'}
          </h2>
          <p className="text-text-light mb-6">
            {search 
              ? `Keine Kunden gefunden für "${search}". Versuchen Sie eine andere Suche.`
              : 'Erstellen Sie Ihren ersten Kunden, um zu beginnen.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddCustomer(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              + Ersten Kunden erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer: any) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl p-6 shadow border border-border hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => router.push(`/customers/${customer.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {customer.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    customer.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-dark mb-1">{customer.name}</h3>
              {customer.company && (
                <p className="text-sm text-text-light mb-4">{customer.company}</p>
              )}
              <div className="space-y-2 text-sm mb-4">
                {customer.email && (
                  <div className="flex items-center gap-2 text-text-light">
                    <span>📧</span>
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-text-light">
                    <span>📞</span>
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>
              {customer.notes && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-text-light line-clamp-2">{customer.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Neuer Kunde</h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Name</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">E-Mail</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Firma</label>
                <input
                  type="text"
                  value={customerForm.company}
                  onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Telefon</label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Adresse</label>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={addCustomerMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {addCustomerMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomer(false);
                    setCustomerForm({
                      name: '',
                      email: '',
                      company: '',
                      phone: '',
                      address: '',
                      notes: '',
                    });
                  }}
                  className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
