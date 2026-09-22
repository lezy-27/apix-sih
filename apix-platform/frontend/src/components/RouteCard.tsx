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
      className={`group rounded-xl p-4 border transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'bg-zinc-50 border-black shadow-sm ring-1 ring-black/10'
          : 'bg-white border-zinc-200 hover:border-black hover:-translate-y-1 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-black text-sm text-black tracking-wider">
              {route.route}
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
              {(route.weight * 100).toFixed(0)}% WT
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">{route.route_name}</p>
        </div>

        <div className="text-right">
          <div className="text-base font-black font-mono text-black">
            {route.route_index.toFixed(1)}
          </div>
          <div className="flex items-center justify-end text-xs font-mono font-semibold mt-0.5">
            {isPositive && (
              <span className="flex items-center text-black bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                <TrendingUp className="w-3 h-3 mr-0.5 text-black" />
                +{route.daily_change_pct.toFixed(2)}%
              </span>
            )}
            {isNegative && (
              <span className="flex items-center text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                <TrendingDown className="w-3 h-3 mr-0.5 text-zinc-600" />
                {route.daily_change_pct.toFixed(2)}%
              </span>
            )}
            {!isPositive && !isNegative && (
              <span className="flex items-center text-zinc-500">
                <Minus className="w-3 h-3 mr-0.5" />
                0.00%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Avg Fare</span>
          <span className="text-xs font-black font-mono text-black">
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
                stroke={isSelected ? '#000000' : '#71717A'}
                strokeWidth={1.8}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-zinc-400 group-hover:text-black transition-colors duration-200">
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};
