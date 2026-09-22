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
  icon,
}) => {
  return (
    <div
      id={id}
      className="group bg-white border border-zinc-200 rounded-xl p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:border-black hover:shadow-lg"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
          {title}
        </span>
        {icon && (
          <div className="p-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-black group-hover:bg-black group-hover:text-white group-hover:border-black transition-all duration-200">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2.5 my-1">
        <span className="text-3xl font-black tracking-tight text-black font-mono">
          {value}
        </span>
        {badgeText && (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-zinc-100 text-xs">
        <div className="flex items-center space-x-1.5">
          {trend === 'up' && (
            <span className="flex items-center font-mono font-bold text-white bg-black px-2 py-0.5 rounded shadow-xs">
              <TrendingUp className="w-3 h-3 mr-1 text-white" />
              {trendValue}
            </span>
          )}
          {trend === 'down' && (
            <span className="flex items-center font-mono font-semibold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              <TrendingDown className="w-3 h-3 mr-1 text-zinc-600" />
              {trendValue}
            </span>
          )}
          {trend === 'neutral' && (
            <span className="flex items-center font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
              <Minus className="w-3 h-3 mr-1 text-zinc-500" />
              {trendValue || '0.00%'}
            </span>
          )}
          {subtitle && <span className="text-zinc-500 text-[11px] ml-1">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};
