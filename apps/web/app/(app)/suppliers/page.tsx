'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function SuppliersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    notes: '',
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.get(`/suppliers${params}`);
      return response.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const response = await api.post('/suppliers', {
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        company: data.company?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        address: data.address?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowAdd(false);
      setForm({
        name: '',
        email: '',
        company: '',
        phone: '',
        address: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      alert(
        error.response?.data?.message ||
          error.message ||
          'Fehler beim Anlegen des Lieferanten',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Bitte Namen eingeben');
      return;
    }
    if (form.email && !form.email.includes('@')) {
      alert('Bitte gültige E-Mail eingeben');
      return;
    }
    addMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Lieferanten</h1>
          <p className="text-lg text-text-light">
            Stammdaten wie bei Kunden – verknüpfbar mit Einkaufsbestellungen
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          + Neuer Lieferant
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Lieferanten durchsuchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 shadow border border-border text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-text-light animate-pulse">Lädt Lieferanten…</div>
        </div>
      ) : !suppliers || suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow border border-border text-center">
          <div className="text-6xl mb-4">🏭</div>
          <h2 className="text-2xl font-bold text-dark mb-2">
            {search ? 'Keine Lieferanten gefunden' : 'Noch keine Lieferanten'}
          </h2>
          <p className="text-text-light mb-6">
            {search
              ? `Kein Treffer für „${search}“.`
              : 'Legen Sie Lieferanten an und wählen Sie sie beim Einkauf aus.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Ersten Lieferanten anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(suppliers as any[]).map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/suppliers/${s.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') router.push(`/suppliers/${s.id}`);
              }}
              className="bg-white rounded-2xl p-6 shadow border border-border hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {s.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    s.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {s.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-dark mb-1">{s.name}</h3>
              {s.company && (
                <p className="text-sm text-text-light mb-4">{s.company}</p>
              )}
              <div className="space-y-2 text-sm mb-4">
                {s.email && (
                  <div className="flex items-center gap-2 text-text-light">
                    <span>📧</span>
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-2 text-text-light">
                    <span>📞</span>
                    <span>{s.phone}</span>
                  </div>
                )}
              </div>
              {s.purchaseOrders?.length > 0 && (
                <div className="text-xs text-text-light pt-3 border-t border-border">
                  {s.purchaseOrders.length} Bestellung(en) in der Übersicht
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Neuer Lieferant</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Firma
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Adresse
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Notizen
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {addMutation.isPending ? 'Wird gespeichert…' : 'Speichern'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setForm({
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
