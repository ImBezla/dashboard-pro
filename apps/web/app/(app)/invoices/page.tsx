'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';

export default function InvoicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    dueDate: '',
    notes: '',
    items: [
      {
        productId: '',
        description: '',
        quantity: '1',
        unitPrice: '',
        taxRate: '19',
      },
    ],
  });

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/invoices${params}`);
      return response.data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers');
      return response.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products?status=active');
      return response.data;
    },
  });

  const addInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Validate items
        const validItems = data.items
          .filter((item: any) => item.description.trim() && item.quantity && item.unitPrice)
          .map((item: any) => ({
            productId: item.productId || undefined,
            description: item.description.trim(),
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            taxRate: parseFloat(item.taxRate) || 19,
          }));

        if (validItems.length === 0) {
          throw new Error('Bitte fügen Sie mindestens einen Rechnungsposten hinzu');
        }

        const response = await api.post('/invoices', {
          customerId: data.customerId,
          items: validItems,
          dueDate: data.dueDate,
          notes: data.notes?.trim() || undefined,
        });
        return response.data;
      } catch (error: any) {
        console.error('Failed to create invoice:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Fehler beim Erstellen der Rechnung';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowAddInvoice(false);
      setInvoiceForm({
        customerId: '',
        dueDate: '',
        notes: '',
        items: [
          {
            productId: '',
            description: '',
            quantity: '1',
            unitPrice: '',
            taxRate: '19',
          },
        ],
      });
    },
    onError: (error: any) => {
      alert(error.message || 'Fehler beim Erstellen der Rechnung');
    },
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
      await api.patch(`/invoices/${invoiceId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  // Filter invoices client-side if needed (backend already filters by status)
  const filteredInvoices = invoices;

  const totalInvoices = invoices?.length || 0;
  const draftInvoices = invoices?.filter((i: any) => i.status === 'draft').length || 0;
  const paidInvoices = invoices?.filter((i: any) => i.status === 'paid').length || 0;
  const totalRevenue = invoices?.filter((i: any) => i.status === 'paid').reduce((sum: number, inv: any) => sum + inv.total, 0) || 0;
  const overdueInvoices = invoices?.filter((i: any) => {
    if (i.status === 'sent' || i.status === 'overdue') {
      const dueDate = new Date(i.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    }
    return false;
  }).length || 0;

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!invoiceForm.customerId) {
      alert('Bitte wählen Sie einen Kunden aus');
      return;
    }
    
    const validItems = invoiceForm.items.filter(
      (item) => item.description.trim() && item.quantity && item.unitPrice
    );
    
    if (validItems.length === 0) {
      alert('Bitte fügen Sie mindestens einen Rechnungsposten hinzu');
      return;
    }
    
    if (!invoiceForm.dueDate) {
      alert('Bitte wählen Sie ein Fälligkeitsdatum aus');
      return;
    }
    
    addInvoiceMutation.mutate(invoiceForm);
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        {
          productId: '',
          description: '',
          quantity: '1',
          unitPrice: '',
          taxRate: '19',
        },
      ],
    });
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceForm.items.length > 1) {
      setInvoiceForm({
        ...invoiceForm,
        items: invoiceForm.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product is selected, auto-fill description and price
    if (field === 'productId' && value) {
      const product = products?.find((p: any) => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].unitPrice = product.price.toString();
        newItems[index].taxRate = product.taxRate.toString();
      }
    }
    
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const calculateItemTotal = (item: any) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const taxRate = parseFloat(item.taxRate) || 19;
    const subtotal = quantity * unitPrice;
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  const calculateInvoiceTotal = () => {
    return invoiceForm.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Entwurf';
      case 'sent':
        return 'Versendet';
      case 'paid':
        return 'Bezahlt';
      case 'overdue':
        return 'Überfällig';
      case 'cancelled':
        return 'Storniert';
      default:
        return status;
    }
  };

  return (
    <div data-tour="page-invoices">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-dark mb-1 sm:mb-2 truncate">
            Rechnungen
          </h1>
          <p className="text-sm sm:text-lg text-text-light">
            Rechnungsverwaltung und Zahlungsverfolgung
          </p>
        </div>
        <button
          onClick={() => setShowAddInvoice(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors min-h-[44px] self-start sm:self-auto"
        >
          + Neue Rechnung
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Gesamt Rechnungen"
          value={totalInvoices}
          subtitle="Alle Rechnungen"
          icon="📄"
        />
        <MetricCard
          title="Entwürfe"
          value={draftInvoices}
          subtitle="In Bearbeitung"
          icon="📝"
          gradient="bg-gradient-to-br from-gray-500 to-gray-600"
        />
        <MetricCard
          title="Umsatz"
          value={`€${(totalRevenue / 1000).toFixed(0)}k`}
          subtitle="Bezahlt"
          icon="💰"
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Überfällig"
          value={overdueInvoices}
          subtitle="Offen"
          icon="⚠️"
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white text-text hover:bg-light'
            }`}
          >
            {f === 'all' && 'Alle'}
            {f === 'draft' && 'Entwürfe'}
            {f === 'sent' && 'Versendet'}
            {f === 'paid' && 'Bezahlt'}
            {f === 'overdue' && 'Überfällig'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 shadow border border-border text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse">Lädt Rechnungen...</div>
        </div>
      ) : !filteredInvoices || filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow border border-border text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-dark mb-2">
            {filter !== 'all' ? `Keine ${filter === 'draft' ? 'Entwürfe' : filter === 'sent' ? 'versendeten' : filter === 'paid' ? 'bezahlten' : 'überfälligen'} Rechnungen` : 'Noch keine Rechnungen vorhanden'}
          </h2>
          <p className="text-text-light mb-6">
            {filter !== 'all' 
              ? `Es gibt keine ${filter === 'draft' ? 'Entwürfe' : filter === 'sent' ? 'versendeten' : filter === 'paid' ? 'bezahlten' : 'überfälligen'} Rechnungen.`
              : 'Erstellen Sie Ihre erste Rechnung, um zu beginnen.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowAddInvoice(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              + Erste Rechnung erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Rechnungsnummer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Kunde</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Betrag</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Gesamt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Fälligkeitsdatum</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-light transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-dark">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-text">
                      <div
                        onClick={() => router.push(`/customers/${invoice.customer.id}`)}
                        className="cursor-pointer hover:text-primary"
                      >
                        {invoice.customer.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text">
                      {invoice.items?.length || 0} {invoice.items?.length === 1 ? 'Posten' : 'Posten'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text">€{invoice.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-dark">€{invoice.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text">
                      {format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: de })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() =>
                            updateInvoiceStatusMutation.mutate({ invoiceId: invoice.id, status: 'sent' })
                          }
                          className="text-primary hover:text-primary-dark font-semibold"
                        >
                          Versenden
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <button
                          onClick={() =>
                            updateInvoiceStatusMutation.mutate({ 
                              invoiceId: invoice.id, 
                              status: 'paid',
                            })
                          }
                          className="text-green-600 hover:text-green-700 font-semibold"
                        >
                          Als bezahlt markieren
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Neue Rechnung</h3>
            <form onSubmit={handleAddInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Kunde *</label>
                <select
                  value={invoiceForm.customerId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Kunde auswählen...</option>
                  {customers?.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.company ? `(${customer.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text">Rechnungsposten *</span>
                  <button
                    type="button"
                    onClick={addInvoiceItem}
                    className="text-sm font-semibold text-primary hover:text-primary-dark"
                  >
                    + Position
                  </button>
                </div>
                {invoiceForm.items.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border p-3 space-y-2 bg-light/40"
                  >
                    <div className="flex justify-end">
                      {invoiceForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInvoiceItem(index)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-light mb-1">Produkt (optional)</label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateInvoiceItem(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">—</option>
                        {products?.map((p: { id: string; name: string }) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-light mb-1">Beschreibung *</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-text-light mb-1">Menge</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-light mb-1">Einzelpreis €</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateInvoiceItem(index, 'unitPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-light mb-1">MwSt %</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.taxRate}
                          onChange={(e) => updateInvoiceItem(index, 'taxRate', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-sm text-text">
                  Summe (brutto):{' '}
                  <span className="font-semibold">
                    €{calculateInvoiceTotal().toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Fälligkeitsdatum *</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Notizen</label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={addInvoiceMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {addInvoiceMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInvoice(false);
                    setInvoiceForm({
                      customerId: '',
                      dueDate: '',
                      notes: '',
                      items: [
                        {
                          productId: '',
                          description: '',
                          quantity: '1',
                          unitPrice: '',
                          taxRate: '19',
                        },
                      ],
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

