import React from 'react';
import { RouteSummary } from '../types';
import { RouteCard } from '../components/RouteCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface RouteAnalysisPageProps {
  routes: RouteSummary[];
  selectedRouteCode: string;
  onSelectRoute: (routeCode: string) => void;
}

export const RouteAnalysisPage: React.FC<RouteAnalysisPageProps> = ({
  routes,
  selectedRouteCode,
  onSelectRoute,
}) => {
  const currentRoute =
    routes.find((r) => r.route === selectedRouteCode) || routes[0];

  const historicalData = (currentRoute?.sparkline || [100]).map((val, i) => ({
    day: `T-${6 - i}d`,
    index: val,
    avgFare: Math.round(val * (currentRoute?.current_avg_fare || 4500) / 100),
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Route Cards Header Grid */}
      <div>
        <h2 className="text-base font-bold font-mono text-black mb-1">
          DGCA Route Comparison Grid
        </h2>
        <p className="text-xs text-zinc-500 mb-3 font-sans">
          Select any route below to inspect real-time pricing dynamics and lead-time dispersion
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {routes.map((r) => (
            <RouteCard
              key={r.route}
              route={r}
              isSelected={r.route === selectedRouteCode}
              onSelect={onSelectRoute}
            />
          ))}
        </div>
      </div>

      {/* Selected Route Deep Dive */}
      {currentRoute && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 gap-3">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xl font-black font-mono text-black">
                  {currentRoute.route}
                </span>
                <span className="text-sm font-semibold text-zinc-700 font-sans">
                  {currentRoute.route_name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-100 text-black border border-zinc-300">
                  {(currentRoute.weight * 100).toFixed(0)}% WT
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-sans">
                Monitored carriers: IndiGo, Air India, Akasa Air, SpiceJet across T+1 to T+60 windows
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block uppercase font-mono font-semibold">Route Index</span>
                <span className="text-2xl font-black font-mono text-black">
                  {currentRoute.route_index.toFixed(1)}
                </span>
              </div>
              <div className="text-right border-l border-zinc-200 pl-4">
                <span className="text-[10px] text-zinc-400 block uppercase font-mono font-semibold">Current Avg Fare</span>
                <span className="text-2xl font-black font-mono text-black">
                  ₹{currentRoute.current_avg_fare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Route Historical Trend Chart */}
          <div>
            <h3 className="text-sm font-bold font-mono text-black mb-2">
              7-Day Route Index Trajectory
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717A" fontSize={11} fontFamily="JetBrains Mono, monospace" tickLine={false} />
                  <YAxis
                    stroke="#71717A"
                    fontSize={10}
                    fontFamily="JetBrains Mono, monospace"
                    domain={['auto', 'auto']}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#000000' }}
                    formatter={(val: any) => [Number(val).toFixed(2), 'Route Index']}
                  />
                  <Line
                    type="monotone"
                    dataKey="index"
                    stroke="#000000"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#000000', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
