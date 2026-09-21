import React from 'react';
import { RouteSummary } from '../types';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface RouteCardProps {
  route: RouteSummary;
  isSelected?: boolean;
  onSelect?: (routeCode: string) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected = false,
  onSelect,
}) => {
  const sparklineData = (route.sparkline || [route.route_index]).map((val, idx) => ({
    idx,
    val,
  }));

  const isPositive = route.daily_change_pct > 0;
  const isNegative = route.daily_change_pct < 0;

  return (
    <div
      id={`route-card-${route.route}`}
      onClick={() => onSelect && onSelect(route.route)}
      className={`rounded-xl p-4 border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-300'
          : 'bg-white border-apix-border hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-apix-text tracking-tight">
              {route.route}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {(route.weight * 100).toFixed(0)}% weight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{route.route_name}</p>
        </div>

        <div className="text-right">
          <div className="text-base font-extrabold text-apix-text">
            {route.route_index.toFixed(1)}
          </div>
          <div className="flex items-center justify-end text-xs font-semibold mt-0.5">
            {isPositive && (
              <span className="flex items-center text-rose-600">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +{route.daily_change_pct.toFixed(2)}%
              </span>
            )}
            {isNegative && (
              <span className="flex items-center text-emerald-600">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                {route.daily_change_pct.toFixed(2)}%
              </span>
            )}
            {!isPositive && !isNegative && (
              <span className="flex items-center text-slate-500">
                <Minus className="w-3 h-3 mr-0.5" />
                0.00%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block">Avg Consumer Fare</span>
          <span className="text-xs font-bold text-slate-800">
            ₹{route.current_avg_fare.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Mini 7-day sparkline */}
        <div className="w-20 h-7">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="val"
                stroke={isSelected ? '#2563EB' : '#64748B'}
                strokeWidth={1.8}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-slate-400 group-hover:text-blue-600">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
