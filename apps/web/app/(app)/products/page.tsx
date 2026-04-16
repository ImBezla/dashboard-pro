'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [filter, setFilter] = useState<'all' | 'service' | 'product' | 'subscription'>('all');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    type: 'service',
    price: '',
    unit: 'Stück',
    taxRate: '19',
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', filter],
    queryFn: async () => {
      const params = filter !== 'all' ? `?type=${filter}` : '';
      const response = await api.get(`/products${params}`);
      return response.data;
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post('/products', {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          type: data.type,
          price: parseFloat(data.price),
          unit: data.unit.trim(),
          taxRate: parseFloat(data.taxRate) || 19,
        });
        return response.data;
      } catch (error: any) {
        console.error('Failed to create product:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Fehler beim Erstellen des Produkts';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowAddProduct(false);
      setProductForm({
        name: '',
        description: '',
        type: 'service',
        price: '',
        unit: 'Stück',
        taxRate: '19',
      });
    },
    onError: (error: any) => {
      alert(error.message || 'Fehler beim Erstellen des Produkts');
    },
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!productForm.name.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }
    
    if (!productForm.price || parseFloat(productForm.price) <= 0) {
      alert('Bitte geben Sie einen gültigen Preis ein');
      return;
    }
    
    addProductMutation.mutate(productForm);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'service':
        return 'Service';
      case 'product':
        return 'Produkt';
      case 'subscription':
        return 'Abonnement';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service':
        return 'bg-blue-100 text-blue-700';
      case 'product':
        return 'bg-green-100 text-green-700';
      case 'subscription':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Produkte & Services</h1>
          <p className="text-lg text-text-light">
            Verwalten Sie Ihre Produkte, Services und Abonnements
          </p>
        </div>
        <button
          onClick={() => setShowAddProduct(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          + Neues Produkt
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'service', 'product', 'subscription'] as const).map((f) => (
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
            {f === 'service' && 'Services'}
            {f === 'product' && 'Produkte'}
            {f === 'subscription' && 'Abonnements'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 shadow border border-border text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse">Lädt Produkte...</div>
        </div>
      ) : !products || products.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow border border-border text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-dark mb-2">
            {filter !== 'all' ? `Keine ${filter === 'service' ? 'Services' : filter === 'product' ? 'Produkte' : 'Abonnements'}` : 'Noch keine Produkte vorhanden'}
          </h2>
          <p className="text-text-light mb-6">
            {filter !== 'all' 
              ? `Es gibt keine ${filter === 'service' ? 'Services' : filter === 'product' ? 'Produkte' : 'Abonnements'}.`
              : 'Erstellen Sie Ihr erstes Produkt oder Service, um zu beginnen.'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              + Erstes Produkt erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: any) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-6 shadow border border-border hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${getTypeColor(product.type)}`}>
                  {getTypeLabel(product.type)}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  product.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-dark mb-2">{product.name}</h3>
              {product.description && (
                <p className="text-sm text-text-light mb-4 line-clamp-2">{product.description}</p>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-light">Preis:</span>
                  <span className="font-semibold text-dark">€{product.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-light">Einheit:</span>
                  <span className="font-semibold text-dark">{product.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-light">MwSt.:</span>
                  <span className="font-semibold text-dark">{product.taxRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Neues Produkt/Service</h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Beschreibung</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Typ *</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="service">Service</option>
                    <option value="product">Produkt</option>
                    <option value="subscription">Abonnement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Preis (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Einheit</label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">MwSt. (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.taxRate}
                    onChange={(e) => setProductForm({ ...productForm, taxRate: e.target.value })}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={addProductMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {addProductMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduct(false);
                    setProductForm({
                      name: '',
                      description: '',
                      type: 'service',
                      price: '',
                      unit: 'Stück',
                      taxRate: '19',
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


