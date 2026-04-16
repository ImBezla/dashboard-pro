'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    notes: '',
  });

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: async () => {
      const r = await api.get(`/suppliers/${supplierId}`);
      return r.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/suppliers/${supplierId}`, {
        name: form.name.trim(),
        email: form.email?.trim() || undefined,
        company: form.company?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        address: form.address?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', supplierId] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsEditing(false);
    },
    onError: (e: any) => {
      alert(e.response?.data?.message || e.message || 'Speichern fehlgeschlagen');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      router.push('/suppliers');
    },
    onError: (e: any) => {
      alert(e.response?.data?.message || e.message || 'Löschen fehlgeschlagen');
    },
  });

  if (isLoading || !supplier) {
    return (
      <div className="p-8 text-text-light">
        {isLoading ? 'Lädt…' : 'Lieferant nicht gefunden'}
      </div>
    );
  }

  const startEdit = () => {
    setForm({
      name: supplier.name || '',
      email: supplier.email || '',
      company: supplier.company || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setIsEditing(true);
  };

  const initials = supplier.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-text-light hover:text-primary mb-2"
          >
            ← Zurück
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-black text-dark mb-1">{supplier.name}</h1>
              {supplier.company && (
                <p className="text-lg text-text-light">{supplier.company}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => (isEditing ? setIsEditing(false) : startEdit())}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            {isEditing ? 'Abbrechen' : 'Bearbeiten'}
          </button>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="bg-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Lieferant löschen?</h3>
            <p className="text-text-light mb-6">
              „{supplier.name}“ wirklich löschen? Bestellungen bleiben mit Freitext-Lieferant
              erhalten (Verknüpfung wird entfernt).
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="bg-danger text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {deleteMutation.isPending ? '…' : 'Löschen'}
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="border border-border px-4 py-2 rounded-lg font-semibold"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="bg-white rounded-2xl p-6 shadow border border-border max-w-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-Mail</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Firma</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notizen</label>
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !form.name.trim()}
              className="bg-primary text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              Speichern
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow border border-border">
              <h2 className="text-xl font-bold text-dark mb-4">Kontakt</h2>
              <div className="space-y-3 text-sm">
                {supplier.email && (
                  <div>
                    <div className="text-text-light">E-Mail</div>
                    <div className="font-medium">{supplier.email}</div>
                  </div>
                )}
                {supplier.phone && (
                  <div>
                    <div className="text-text-light">Telefon</div>
                    <div className="font-medium">{supplier.phone}</div>
                  </div>
                )}
                {supplier.address && (
                  <div>
                    <div className="text-text-light">Adresse</div>
                    <div className="font-medium">{supplier.address}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow border border-border">
              <h2 className="text-xl font-bold text-dark mb-4">Bestellungen</h2>
              {supplier.purchaseOrders?.length ? (
                <ul className="divide-y divide-border">
                  {supplier.purchaseOrders.map((o: any) => (
                    <li key={o.id} className="py-3 flex justify-between gap-2 text-sm">
                      <div>
                        <div className="font-semibold text-dark">{o.orderNumber}</div>
                        <div className="text-text-light">{o.product}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium">
                          €{Number(o.total).toLocaleString('de-DE')}
                        </div>
                        <div className="text-text-light text-xs">
                          {format(new Date(o.orderDate), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text-light text-sm">Noch keine Bestellungen verknüpft.</p>
              )}
              <button
                type="button"
                onClick={() => router.push('/purchasing')}
                className="mt-4 text-primary font-medium text-sm hover:underline"
              >
                Zum Einkauf →
              </button>
            </div>

            {supplier.notes && (
              <div className="bg-white rounded-2xl p-6 shadow border border-border">
                <h2 className="text-xl font-bold text-dark mb-2">Notizen</h2>
                <p className="text-text-light whitespace-pre-wrap text-sm">{supplier.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow border border-border h-fit">
            <h3 className="text-lg font-bold text-dark mb-4">Kennzahlen</h3>
            <div className="space-y-3 text-center">
              <div className="p-3 bg-light rounded-lg">
                <div className="text-2xl font-black text-primary">
                  {supplier.statistics?.totalOrders ?? 0}
                </div>
                <div className="text-xs text-text-light uppercase">Bestellungen</div>
              </div>
              <div className="p-3 bg-light rounded-lg">
                <div className="text-2xl font-black text-green-600">
                  €
                  {(supplier.statistics?.totalSpend ?? 0).toLocaleString('de-DE', {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-text-light uppercase">Volumen (abgeschlossen)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
