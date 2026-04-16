'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';

type CustomerEditPayload = {
  name: string;
  email: string;
  company: string;
  phone: string;
  address: string;
  notes: string;
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const response = await api.get(`/customers/${customerId}`);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerEditPayload) => {
      try {
        const response = await api.patch(`/customers/${customerId}`, {
          name: data.name.trim(),
          email: data.email?.trim() || undefined,
          company: data.company?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
          address: data.address?.trim() || undefined,
        });
        return response.data;
      } catch (error: any) {
        console.error('Failed to update customer:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Fehler beim Aktualisieren des Kunden';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      alert(error.message || 'Fehler beim Aktualisieren des Kunden');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.push('/customers');
    },
  });

  if (isLoading) {
    return <div className="p-8">Lädt...</div>;
  }

  if (!customer) {
    return <div className="p-8">Kunde nicht gefunden</div>;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {getInitials(customer.name)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-dark mb-2">{customer.name}</h1>
              {customer.company && (
                <p className="text-lg text-text-light">{customer.company}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            {isEditing ? 'Abbrechen' : 'Bearbeiten'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-danger text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>

      {isEditing && (
        <CustomerEditForm
          customer={customer}
          onSave={(data: CustomerEditPayload) => updateMutation.mutate(data)}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4">Kunde löschen?</h3>
            <p className="text-text-light mb-6">
              Möchten Sie den Kunden "{customer.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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

      {!isEditing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
              <h2 className="text-xl font-bold text-dark mb-4">Kontaktinformationen</h2>
              <div className="space-y-4">
                {customer.email && (
                  <div>
                    <div className="text-sm text-text-light">E-Mail</div>
                    <div className="font-semibold">{customer.email}</div>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <div className="text-sm text-text-light">Telefon</div>
                    <div className="font-semibold">{customer.phone}</div>
                  </div>
                )}
                {customer.address && (
                  <div>
                    <div className="text-sm text-text-light">Adresse</div>
                    <div className="font-semibold">{customer.address}</div>
                  </div>
                )}
                {customer.createdAt && (
                  <div>
                    <div className="text-sm text-text-light">Kunde seit</div>
                    <div className="font-semibold">
                      {new Date(customer.createdAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
              <h2 className="text-xl font-bold text-dark mb-4">Projekte</h2>
              {customer.projects && customer.projects.length > 0 ? (
                <div className="space-y-2">
                  {customer.projects.map((project: any) => (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="p-3 border border-border rounded-lg hover:bg-light transition-colors cursor-pointer"
                    >
                      <div className="font-semibold text-dark">{project.name}</div>
                      <div className="text-sm text-text-light">
                        Status: {project.status === 'ACTIVE' ? 'Aktiv' : 
                                project.status === 'IN_PROGRESS' ? 'In Bearbeitung' :
                                project.status === 'COMPLETED' ? 'Abgeschlossen' : project.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-light">Keine Projekte zugeordnet</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow border border-border">
              <h2 className="text-xl font-bold text-dark mb-4">Rechnungen</h2>
              {customer.invoices && customer.invoices.length > 0 ? (
                <div className="space-y-2">
                  {customer.invoices.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                      className="p-3 border border-border rounded-lg hover:bg-light transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-dark">{invoice.invoiceNumber}</h3>
                          <p className="text-sm text-text-light">
                            {new Date(invoice.issueDate).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-dark">
                            €{invoice.total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : invoice.status === 'sent'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {invoice.status === 'paid'
                              ? 'Bezahlt'
                              : invoice.status === 'sent'
                              ? 'Versendet'
                              : 'Entwurf'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-light mb-4">Keine Rechnungen für diesen Kunden</p>
              )}
              <button
                onClick={() => router.push(`/invoices?customerId=${customer.id}`)}
                className="text-primary hover:underline"
              >
                + Neue Rechnung erstellen
              </button>
            </div>

            {customer.notes && (
              <div className="bg-white rounded-2xl p-6 shadow border border-border">
                <h2 className="text-xl font-bold text-dark mb-4">Notizen</h2>
                <p className="text-text-light whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
              <h3 className="text-lg font-bold text-dark mb-4">Statistiken</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-text-light mb-2">Status</div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      customer.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                {customer.statistics && (
                  <>
                    <div className="text-center p-3 bg-light rounded-lg">
                      <div className="text-2xl font-black text-primary mb-1">
                        {customer.statistics.totalProjects || 0}
                      </div>
                      <div className="text-xs text-text-light uppercase tracking-wider">
                        Projekte
                      </div>
                    </div>
                    <div className="text-center p-3 bg-light rounded-lg">
                      <div className="text-2xl font-black text-green-600 mb-1">
                        €{(customer.statistics.totalRevenue || 0).toLocaleString('de-DE')}
                      </div>
                      <div className="text-xs text-text-light uppercase tracking-wider">
                        Umsatz
                      </div>
                    </div>
                    <div className="text-center p-3 bg-light rounded-lg">
                      <div className="text-2xl font-black text-primary mb-1">
                        {customer.statistics.totalInvoices || 0}
                      </div>
                      <div className="text-xs text-text-light uppercase tracking-wider">
                        Rechnungen
                      </div>
                    </div>
                    {customer.statistics.pendingInvoices > 0 && (
                      <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-2xl font-black text-yellow-600 mb-1">
                          {customer.statistics.pendingInvoices}
                        </div>
                        <div className="text-xs text-yellow-700 uppercase tracking-wider">
                          Offene Rechnungen
                        </div>
                      </div>
                    )}
                    {customer.statistics.overdueAmount > 0 && (
                      <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-2xl font-black text-red-600 mb-1">
                          €{customer.statistics.overdueAmount.toLocaleString('de-DE')}
                        </div>
                        <div className="text-xs text-red-700 uppercase tracking-wider">
                          Überfällig
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomerEditForm({
  customer,
  onSave,
  onCancel,
}: {
  customer: { name: string; email: string; company: string; phone: string; address: string; notes?: string };
  onSave: (data: CustomerEditPayload) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: customer.name,
    email: customer.email,
    company: customer.company,
    phone: customer.phone,
    address: customer.address,
    notes: customer.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }
    
    if (formData.email && !formData.email.includes('@')) {
      alert('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow border border-border mb-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">E-Mail</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Firma</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Telefon</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Adresse</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">Notizen</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Interne Notizen zu diesem Kunden..."
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-white border border-border text-text px-4 py-2 rounded-lg font-semibold hover:bg-light transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </form>
  );
}

