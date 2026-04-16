'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FinanceCategoryRow {
  category: string;
  amount: number;
}

export default function FinancePage() {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  const { data: financeData, isLoading, error } = useQuery({
    queryKey: ['finance', timeRange],
    queryFn: async () => {
      try {
        const response = await api.get(`/finance/overview?timeRange=${timeRange}`);
        return response.data;
      } catch (err: any) {
        console.error('Finance API error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        // Return empty data structure to prevent crashes
        return {
          revenueData: [],
          categoryData: [],
          totalRevenue: 0,
          totalExpenses: 0,
          totalProfit: 0,
          margin: 0,
        };
      }
    },
    retry: 1,
    refetchInterval: 60000, // Refetch every minute
  });

  const revenueData = financeData?.revenueData || [];
  const categoryData: FinanceCategoryRow[] = financeData?.categoryData || [];
  const totalRevenue = financeData?.totalRevenue || 0;
  const totalExpenses = financeData?.totalExpenses || 0;
  const totalProfit = financeData?.totalProfit || 0;
  const margin = financeData?.margin || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse">Lädt Finanzdaten...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">Fehler beim Laden der Finanzdaten</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Finanzen</h1>
          <p className="text-lg text-text-light">
            Finanzübersicht und Budgetverwaltung
          </p>
        </div>
        <div className="flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-white text-text hover:bg-light'
              }`}
            >
              {range === 'month' && 'Monat'}
              {range === 'quarter' && 'Quartal'}
              {range === 'year' && 'Jahr'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Umsatz"
          value={`€${(totalRevenue / 1000).toFixed(0)}k`}
          subtitle="Gesamt"
          icon="💰"
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Ausgaben"
          value={`€${(totalExpenses / 1000).toFixed(0)}k`}
          subtitle="Gesamt"
          icon="📊"
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
        <MetricCard
          title="Gewinn"
          value={`€${(totalProfit / 1000).toFixed(0)}k`}
          subtitle="Netto"
          icon="📈"
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Marge"
          value={`${margin.toFixed(1)}%`}
          subtitle="Profitabilität"
          icon="💹"
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <h2 className="text-xl font-bold text-dark mb-4">Umsatz & Ausgaben</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Umsatz" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Ausgaben" />
              <Line type="monotone" dataKey="profit" stroke="#6366f1" name="Gewinn" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <h2 className="text-xl font-bold text-dark mb-4">Ausgaben nach Kategorie</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow border border-border">
        <h2 className="text-xl font-bold text-dark mb-4">Kostenübersicht</h2>
        <div className="space-y-3">
          {categoryData.map((item, index) => {
            const percentage = (item.amount / totalExpenses) * 100;
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-dark">{item.category}</span>
                  <span className="text-text-light">€{item.amount.toLocaleString('de-DE')}</span>
                </div>
                <div className="w-full h-2 bg-border rounded-full">
                  <div
                    className="h-full gradient-primary rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
