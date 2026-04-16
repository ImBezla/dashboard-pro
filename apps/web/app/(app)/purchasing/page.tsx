'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';

export default function PurchasingPage() {
  const queryClient = useQueryClient();
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [orderForm, setOrderForm] = useState({
    supplierId: '' as string,
    supplierManual: '',
    item: '',
    quantity: '',
    unitPrice: '',
    expectedDelivery: '',
    notes: '',
  });

  const { data: supplierRecords } = useQuery({
    queryKey: ['suppliers-dropdown'],
    queryFn: async () => {
      const r = await api.get('/suppliers');
      return r.data as { id: string; name: string }[];
    },
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/purchasing/orders${params}`);
      return response.data;
    },
  });

  const addOrderMutation = useMutation({
    mutationFn: async (data: typeof orderForm) => {
      try {
        const payload: Record<string, unknown> = {
          item: data.item.trim(),
          quantity: parseInt(data.quantity, 10),
          unitPrice: parseFloat(data.unitPrice),
          expectedDelivery: data.expectedDelivery || undefined,
          notes: data.notes?.trim() || undefined,
        };
        if (data.supplierId && data.supplierId !== '__manual__') {
          payload.supplierId = data.supplierId;
        } else {
          payload.supplier = data.supplierManual.trim();
        }
        const response = await api.post('/purchasing/orders', payload);
        return response.data;
      } catch (error: any) {
        console.error('Failed to create order:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Fehler beim Erstellen der Bestellung';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowAddOrder(false);
      setOrderForm({
        supplierId: '',
        supplierManual: '',
        item: '',
        quantity: '',
        unitPrice: '',
        expectedDelivery: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      alert(error.message || 'Fehler beim Erstellen der Bestellung');
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await api.patch(`/purchasing/orders/${orderId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Orders are already filtered by backend
  const filteredOrders = orders;

  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter((o: any) => o.status === 'pending').length || 0;
  const totalValue = orders?.reduce((sum: number, order: any) => sum + order.total, 0) || 0;
  const completedOrders = orders?.filter((o: any) => o.status === 'completed').length || 0;

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!orderForm.supplierId) {
      alert('Bitte einen Lieferanten aus der Liste wählen oder „Freitext“ nutzen');
      return;
    }
    if (orderForm.supplierId === '__manual__' && !orderForm.supplierManual.trim()) {
      alert('Bitte den Lieferanten als Freitext eintragen');
      return;
    }
    
    if (!orderForm.item.trim()) {
      alert('Bitte geben Sie einen Artikel ein');
      return;
    }
    
    if (!orderForm.quantity || parseInt(orderForm.quantity) <= 0) {
      alert('Bitte geben Sie eine gültige Menge ein');
      return;
    }
    
    if (!orderForm.unitPrice || parseFloat(orderForm.unitPrice) <= 0) {
      alert('Bitte geben Sie einen gültigen Preis ein');
      return;
    }
    
    addOrderMutation.mutate(orderForm);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ausstehend';
      case 'completed':
        return 'Abgeschlossen';
      case 'cancelled':
        return 'Storniert';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Einkauf</h1>
          <p className="text-lg text-text-light">
            Einkaufsverwaltung und Bestellungen
          </p>
        </div>
        <button
          onClick={() => setShowAddOrder(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          + Neue Bestellung
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Gesamt Bestellungen"
          value={totalOrders}
          subtitle="Alle Bestellungen"
          icon="📦"
        />
        <MetricCard
          title="Ausstehend"
          value={pendingOrders}
          subtitle="In Bearbeitung"
          icon="⏳"
          gradient="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <MetricCard
          title="Bestellwert"
          value={`€${(totalValue / 1000).toFixed(0)}k`}
          subtitle="Gesamt"
          icon="💰"
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Abgeschlossen"
          value={completedOrders}
          subtitle="Erledigt"
          icon="✅"
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'completed', 'cancelled'] as const).map((f) => (
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
            {f === 'pending' && 'Ausstehend'}
            {f === 'completed' && 'Abgeschlossen'}
            {f === 'cancelled' && 'Storniert'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 shadow border border-border text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse">Lädt Bestellungen...</div>
        </div>
      ) : !filteredOrders || filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow border border-border text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-dark mb-2">
            {filter !== 'all' ? `Keine ${filter === 'pending' ? 'ausstehenden' : filter === 'completed' ? 'abgeschlossenen' : 'stornierten'} Bestellungen` : 'Noch keine Bestellungen vorhanden'}
          </h2>
          <p className="text-text-light mb-6">
            {filter !== 'all' 
              ? `Es gibt keine ${filter === 'pending' ? 'ausstehenden' : filter === 'completed' ? 'abgeschlossenen' : 'stornierten'} Bestellungen.`
              : 'Erstellen Sie Ihre erste Bestellung, um zu beginnen.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowAddOrder(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              + Erste Bestellung erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Bestellnummer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Lieferant</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Artikel</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Menge</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Einzelpreis</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Gesamt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Erwartete Lieferung</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-dark">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-light transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-dark">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-text">
                      {order.supplierId ? (
                        <Link
                          href={`/suppliers/${order.supplierId}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {order.supplier}
                        </Link>
                      ) : (
                        order.supplier
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-text">
                      {order.product || order.item}
                    </td>
                    <td className="px-6 py-4 text-sm text-text">{order.quantity}</td>
                    <td className="px-6 py-4 text-sm text-text">€{order.unitPrice.toLocaleString('de-DE')}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-dark">€{order.total.toLocaleString('de-DE')}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text">
                      {order.expectedDelivery
                        ? format(new Date(order.expectedDelivery), 'dd.MM.yyyy', { locale: de })
                        : order.orderDate
                        ? format(new Date(order.orderDate), 'dd.MM.yyyy', { locale: de })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.status === 'pending' && (
                        <button
                          onClick={() =>
                            updateOrderStatusMutation.mutate({ orderId: order.id, status: 'completed' })
                          }
                          className="text-primary hover:text-primary-dark font-semibold"
                        >
                          Abschließen
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

      {showAddOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Neue Bestellung</h3>
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Lieferant (Stammdaten)
                </label>
                <select
                  value={orderForm.supplierId}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, supplierId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="">— Aus Liste wählen —</option>
                  <option value="__manual__">Freitext (ohne Stammdaten)</option>
                  {(supplierRecords || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {orderForm.supplierId === '__manual__' && (
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Lieferant (Freitext)
                  </label>
                  <input
                    type="text"
                    value={orderForm.supplierManual}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, supplierManual: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-text-light mt-1">
                    Oder unter{' '}
                    <Link href="/suppliers" className="text-primary hover:underline">
                      Lieferanten
                    </Link>{' '}
                    anlegen und hier auswählen.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text mb-2">Artikel</label>
                <input
                  type="text"
                  value={orderForm.item}
                  onChange={(e) => setOrderForm({ ...orderForm, item: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Menge</label>
                  <input
                    type="number"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Einzelpreis (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={orderForm.unitPrice}
                    onChange={(e) => setOrderForm({ ...orderForm, unitPrice: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Erwartete Lieferung</label>
                <input
                  type="date"
                  value={orderForm.expectedDelivery}
                  onChange={(e) => setOrderForm({ ...orderForm, expectedDelivery: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Notizen</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={addOrderMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {addOrderMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddOrder(false);
                    setOrderForm({
                      supplierId: '',
                      supplierManual: '',
                      item: '',
                      quantity: '',
                      unitPrice: '',
                      expectedDelivery: '',
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
