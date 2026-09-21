import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  badgeText?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  colorTheme?: 'blue' | 'lavender' | 'peach' | 'white';
  icon?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
  id,
  title,
  value,
  subtitle,
  badgeText,
  trend,
  trendValue,
  colorTheme = 'white',
  icon,
}) => {
  const themeStyles = {
    blue: 'bg-[#E8EEF7] border-[#D5E1F2] text-[#26364A]',
    lavender: 'bg-[#EDE7F6] border-[#DDD3EE] text-[#26364A]',
    peach: 'bg-[#FCE4D6] border-[#F5CBB6] text-[#26364A]',
    white: 'bg-white border-[#E2E8F0] text-[#26364A]',
  };

  return (
    <div
      id={id}
      className={`rounded-xl p-5 border shadow-sm transition-all hover:shadow-md ${themeStyles[colorTheme]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {title}
        </span>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-2 my-1">
        <span className="text-3xl font-extrabold tracking-tight text-apix-text">
          {value}
        </span>
        {badgeText && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/70 text-slate-700 border border-slate-200/60">
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 text-xs">
        <div className="flex items-center space-x-1.5">
          {trend === 'up' && (
            <span className="flex items-center font-semibold text-rose-600">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {trendValue}
            </span>
          )}
          {trend === 'down' && (
            <span className="flex items-center font-semibold text-emerald-600">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              {trendValue}
            </span>
          )}
          {trend === 'neutral' && (
            <span className="flex items-center font-medium text-slate-500">
              <Minus className="w-3.5 h-3.5 mr-0.5" />
              {trendValue || '0.00%'}
            </span>
          )}
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};
