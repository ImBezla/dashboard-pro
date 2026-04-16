import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  /** Optional – not shown on management dashboard */
  icon?: string | ReactNode;
  gradient?: string;
}

const accentBorder: Record<string, string> = {
  'gradient-primary': 'border-t-primary',
  'bg-gradient-to-br from-green-600 to-green-700': 'border-t-green-500',
  'bg-gradient-to-br from-amber-600 to-amber-700': 'border-t-amber-500',
  'bg-gradient-to-br from-slate-600 to-slate-700': 'border-t-slate-500',
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  gradient = 'gradient-primary',
}: MetricCardProps) {
  const borderAccent = accentBorder[gradient] || 'border-t-primary';
  return (
    <div className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border border-t-4 ${borderAccent} hover:shadow-md transition-shadow min-w-0 overflow-hidden`}>
      <div className="mb-2 sm:mb-3 min-w-0">
        <div className="text-xs sm:text-sm font-medium text-text-light truncate" title={title}>{title}</div>
      </div>
      <div className="text-center min-w-0 overflow-hidden">
        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary mb-1 truncate" title={String(value)}>{value}</div>
        {subtitle && (
          <div className="text-xs text-text-light/80 mb-2 truncate px-0.5" title={subtitle}>
            {subtitle}
          </div>
        )}
        {trend && (
          <div
            className={`flex items-center justify-center gap-1 text-sm font-semibold min-w-0 truncate ${
              trend.positive ? 'text-success' : 'text-danger'
            }`}
            title={trend.value}
          >
            <span className="shrink-0">{trend.positive ? '↑' : '↓'}</span>
            <span className="truncate">{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

