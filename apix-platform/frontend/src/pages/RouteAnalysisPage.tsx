import React, { useState } from 'react';
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
import { Plane, TrendingUp, DollarSign, Scale } from 'lucide-react';

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

  // Mock / sparkline data formatted for historical chart
  const historicalData = (currentRoute?.sparkline || [100]).map((val, i) => ({
    day: `T-${6 - i}d`,
    index: val,
    avgFare: Math.round(val * (currentRoute?.current_avg_fare || 4500) / 100),
  }));

  return (
    <div className="space-y-6">
      {/* Route Cards Header Grid */}
      <div>
        <h2 className="text-base font-bold text-apix-text mb-1">
          DGCA Route Comparison Grid
        </h2>
        <p className="text-xs text-apix-secondary mb-3">
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
        <div className="bg-white rounded-xl border border-apix-border p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xl font-extrabold text-apix-text">
                  {currentRoute.route}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {currentRoute.route_name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {(currentRoute.weight * 100).toFixed(0)}% National Weight
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitored carriers: IndiGo, Air India, Akasa Air, SpiceJet across T+1 to T+60 windows
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block uppercase font-semibold">Route Index</span>
                <span className="text-2xl font-black text-blue-600">
                  {currentRoute.route_index.toFixed(1)}
                </span>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <span className="text-[11px] text-slate-400 block uppercase font-semibold">Current Avg Fare</span>
                <span className="text-2xl font-black text-slate-800">
                  ₹{currentRoute.current_avg_fare.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Route Historical Trend Chart */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              7-Day Route Index Trajectory
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    domain={['auto', 'auto']}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any) => [Number(val).toFixed(2), 'Route Index']}
                  />
                  <Line
                    type="monotone"
                    dataKey="index"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2563EB' }}
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
