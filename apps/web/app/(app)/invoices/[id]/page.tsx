'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      router.push('/invoices');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const updateData: any = { status };
      if (status === 'paid' && !invoice.paidDate) {
        updateData.paidDate = new Date().toISOString();
      }
      await api.patch(`/invoices/${invoiceId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  if (isLoading) {
    return <div className="p-8">Lädt...</div>;
  }

  if (!invoice) {
    return <div className="p-8">Rechnung nicht gefunden</div>;
  }

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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="text-text-light hover:text-primary mb-2"
          >
            ← Zurück
          </button>
          <h1 className="text-3xl font-black text-dark mb-2">Rechnung {invoice.invoiceNumber}</h1>
          <p className="text-lg text-text-light">
            Kunde: {invoice.customer.name} {invoice.customer.company ? `(${invoice.customer.company})` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <button
              onClick={() => updateStatusMutation.mutate('sent')}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Versenden
            </button>
          )}
          {invoice.status === 'sent' && (
            <button
              onClick={() => updateStatusMutation.mutate('paid')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Als bezahlt markieren
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">Rechnung löschen?</h3>
            <p className="text-text-light mb-6">
              Möchten Sie die Rechnung "{invoice.invoiceNumber}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="bg-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Wird gelöscht...' : 'Löschen'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
            <h2 className="text-xl font-bold text-dark mb-4">Rechnungsposten</h2>
            <div className="space-y-3">
              {invoice.items && invoice.items.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-light border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-dark">Beschreibung</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-dark">Menge</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-dark">Einzelpreis</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-dark">MwSt.</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-dark">Gesamt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.items.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-text">
                              {item.product?.name ? (
                                <div>
                                  <div className="font-semibold">{item.description}</div>
                                  <div className="text-xs text-text-light">Produkt: {item.product.name}</div>
                                </div>
                              ) : (
                                item.description
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-text text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-text text-right">€{item.unitPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-sm text-text text-right">{item.taxRate}%</td>
                            <td className="px-4 py-3 text-sm font-semibold text-dark text-right">€{item.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-light">Netto:</span>
                      <span className="font-semibold text-dark">€{invoice.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-text-light">MwSt.:</span>
                      <span className="font-semibold text-dark">€{invoice.tax.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-lg font-bold text-dark">Gesamtsumme:</span>
                      <span className="text-2xl font-black text-primary">€{invoice.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-text-light">Keine Posten vorhanden</p>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-white rounded-2xl p-6 shadow border border-border">
              <h2 className="text-xl font-bold text-dark mb-4">Notizen</h2>
              <p className="text-text-light whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
            <h3 className="text-lg font-bold text-dark mb-4">Rechnungsdetails</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-text-light mb-2">Status</div>
                <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${getStatusColor(invoice.status)}`}>
                  {getStatusLabel(invoice.status)}
                </span>
              </div>
              <div>
                <div className="text-sm text-text-light mb-2">Rechnungsdatum</div>
                <div className="font-semibold">
                  {format(new Date(invoice.issueDate), 'dd.MM.yyyy', { locale: de })}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-light mb-2">Fälligkeitsdatum</div>
                <div className="font-semibold">
                  {format(new Date(invoice.dueDate), 'dd.MM.yyyy', { locale: de })}
                </div>
              </div>
              {invoice.paidDate && (
                <div>
                  <div className="text-sm text-text-light mb-2">Zahlungsdatum</div>
                  <div className="font-semibold">
                    {format(new Date(invoice.paidDate), 'dd.MM.yyyy', { locale: de })}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-text-light mb-2">Kunde</div>
                <div
                  onClick={() => router.push(`/customers/${invoice.customer.id}`)}
                  className="font-semibold text-primary cursor-pointer hover:underline"
                >
                  {invoice.customer.name}
                </div>
                {invoice.customer.email && (
                  <div className="text-sm text-text-light">{invoice.customer.email}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


