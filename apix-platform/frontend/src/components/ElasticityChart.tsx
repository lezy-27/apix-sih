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
    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs transition-all duration-300 hover:border-zinc-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-black font-mono tracking-tight">
            Lead-Time Price Elasticity Curve
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Average passenger outlay across advance booking windows (T+1 to T+60)
          </p>
        </div>

        {/* Route Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label htmlFor="elasticity-route-select" className="text-xs font-mono font-semibold text-zinc-600">
            ROUTE:
          </label>
          <select
            id="elasticity-route-select"
            value={selectedRoute}
            onChange={(e) => onRouteChange(e.target.value)}
            className="text-xs font-mono font-medium bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-1.5 text-black focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
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
        <div className="h-72 flex items-center justify-center text-xs text-zinc-400 font-mono">
          <div className="animate-pulse flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
            <span>Synthesizing elasticity curve...</span>
          </div>
        </div>
      ) : windows.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-xs text-zinc-400 font-mono">
          No elasticity observations available for this selection.
        </div>
      ) : (
        <div>
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#71717A"
                  fontSize={11}
                  fontFamily="JetBrains Mono, monospace"
                  tickLine={false}
                />
                <YAxis
                  stroke="#71717A"
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    color: '#000000',
                  }}
                  itemStyle={{ color: '#000000' }}
                  labelStyle={{ color: '#52525B', fontWeight: 600 }}
                  formatter={(value: any, name: string) => [
                    `₹${Number(value).toLocaleString('en-IN')}`,
                    name === 'avgFare' ? 'Weighted Net Consumer Fare' : name,
                  ]}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  formatter={(value: string) => (
                    <span className="text-zinc-700 font-semibold">
                      {value === 'avgFare' ? 'Weighted Fare Band' : value}
                    </span>
                  )}
                />
                <Bar
                  dataKey="avgFare"
                  name="avgFare"
                  fill="#F4F4F5"
                  stroke="#000000"
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="avgFare"
                  name="Elasticity Curve"
                  stroke="#000000"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#000000', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  animationDuration={800}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Window Weights Bar */}
          <div className="mt-5 pt-4 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
            {windows.map((w) => (
              <div
                key={w.advance_days}
                className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 hover:border-black transition-colors"
              >
                <span className="block text-[11px] font-mono font-bold text-zinc-700">
                  {w.window_label}
                </span>
                <span className="block text-sm font-mono font-black text-black my-0.5">
                  ₹{w.avg_fare ? Math.round(w.avg_fare).toLocaleString('en-IN') : 'N/A'}
                </span>
                <span className="block text-[10px] font-mono text-zinc-500">
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
