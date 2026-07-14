import { type ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}: MetricCardProps) {
  return (
    <div
      className={`relative group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.12] ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors duration-200">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
              trend.isPositive
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10'
            }`}
          >
            <svg
              className={`w-3 h-3 ${trend.isPositive ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}
