import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AdvanceWindowFare } from '../types';

interface ElasticityChartProps {
  windows: AdvanceWindowFare[];
  selectedRoute: string;
  onRouteChange: (route: string) => void;
  availableRoutes: string[];
  isLoading?: boolean;
}

export const ElasticityChart: React.FC<ElasticityChartProps> = ({
  windows,
  selectedRoute,
  onRouteChange,
  availableRoutes,
  isLoading = false,
}) => {
  const chartData = windows.map((w) => ({
    name: w.window_label,
    days: w.advance_days,
    avgFare: w.avg_fare,
    weight: `${(w.weight * 100).toFixed(0)}%`,
    IndiGo: w.carrier_fares?.IndiGo || 0,
    AirIndia: w.carrier_fares?.['Air India'] || 0,
    AkasaAir: w.carrier_fares?.['Akasa Air'] || 0,
    SpiceJet: w.carrier_fares?.SpiceJet || 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-apix-border p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-apix-text">
            Lead-Time Price Elasticity
          </h2>
          <p className="text-xs text-apix-secondary mt-0.5">
            Average passenger outlay across advance booking windows (T+1 to T+60)
          </p>
        </div>

        {/* Route Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label htmlFor="elasticity-route-select" className="text-xs font-semibold text-slate-600">
            Route:
          </label>
          <select
            id="elasticity-route-select"
            value={selectedRoute}
            onChange={(e) => onRouteChange(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Representative Routes (Composite)</option>
            {availableRoutes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center text-xs text-slate-400">
          <div className="animate-pulse">Loading elasticity curve...</div>
        </div>
      ) : windows.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-xs text-slate-400">
          No elasticity observations available.
        </div>
      ) : (
        <div>
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: string) => [
                    `₹${Number(value).toLocaleString('en-IN')}`,
                    name === 'avgFare' ? 'Weighted Net Consumer Fare' : name,
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                />
                <Bar dataKey="avgFare" name="Weighted Net Fare" fill="#E8EEF7" stroke="#2563EB" strokeWidth={1} radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="avgFare"
                  name="Elasticity Curve"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563EB' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Window Weights Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-5 gap-2 text-center">
            {windows.map((w) => (
              <div key={w.advance_days} className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                <span className="block text-[11px] font-bold text-slate-700">{w.window_label}</span>
                <span className="block text-xs font-extrabold text-blue-600 my-0.5">
                  ₹{w.avg_fare ? Math.round(w.avg_fare).toLocaleString('en-IN') : 'N/A'}
                </span>
                <span className="block text-[10px] text-slate-400">
                  Weight: {(w.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
