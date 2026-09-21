import React from 'react';
import { RouteSummary, HistoryPoint } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { BookOpen, Calculator, Layers, ShieldCheck } from 'lucide-react';

interface IndexPageProps {
  routes: RouteSummary[];
  history: HistoryPoint[];
}

export const IndexPage: React.FC<IndexPageProps> = ({ routes }) => {
  const routeWeightData = routes.map((r) => ({
    name: r.route,
    weightPct: Number((r.weight * 100).toFixed(1)),
    index: r.route_index,
    fullName: r.route_name,
  }));

  const advanceWindows = [
    { window: 'T+1', days: 1, weight: '15%', description: 'Last-minute emergency / business surge' },
    { window: 'T+7', days: 7, weight: '35%', description: 'Standard short-haul business travel (Heaviest)' },
    { window: 'T+15', days: 15, weight: '25%', description: 'Planned corporate / domestic travel' },
    { window: 'T+30', days: 30, weight: '15%', description: 'Leisure advance booking window' },
    { window: 'T+60', days: 60, weight: '10%', description: 'Promotional / low fare holiday window' },
  ];

  const carrierShares = [
    { carrier: 'IndiGo', share: '60%', type: 'Low-Cost Carrier (LCC)', code: '6E' },
    { carrier: 'Air India', share: '25%', type: 'Full Service Carrier (FSC)', code: 'AI' },
    { carrier: 'Akasa Air', share: '8%', type: 'Ultra Low-Cost Carrier (ULCC)', code: 'QP' },
    { carrier: 'SpiceJet', share: '7%', type: 'Low-Cost Carrier (LCC)', code: 'SG' },
  ];

  const barColors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="bg-white rounded-xl border border-apix-border p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-apix-text">
              APIx Mathematical Methodology & Index Mechanics
            </h2>
            <p className="text-xs text-apix-secondary">
              Harmonized Laspeyres-style multi-tiered geometric aggregation for real-time airfare tracking
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mt-3">
          The <strong>Real-Time Airfare Price Index (APIx)</strong> provides economic policy-makers, researchers, and consumers
          with high-frequency price transparency. Unlike traditional monthly consumer price surveys that lag real market movements
          by 30–45 days, APIx calculates real-time price relatives across high-traffic domestic trunk routes with microsecond precision.
        </p>
      </div>

      {/* 4 Step Mathematical Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-apix-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-2">
            <span>STEP 1</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Carrier Geometric Mean</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            For each route <code className="text-blue-600 font-mono">r</code> and booking window <code className="text-blue-600 font-mono">t</code>, compute carrier-weighted geometric mean:
          </p>
          <div className="bg-slate-50 p-2.5 rounded text-[11px] font-mono text-slate-700 mt-2.5 border border-slate-100">
            P_(r,t) = exp(Σ s_c · ln(P_(r,t,c)))
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-apix-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-2">
            <span>STEP 2</span>
            <Calculator className="w-4 h-4 text-blue-500" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Weighted Route Price</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            Combine booking windows using lead-time weights (T+1 to T+60) reflecting purchase velocity:
          </p>
          <div className="bg-slate-50 p-2.5 rounded text-[11px] font-mono text-slate-700 mt-2.5 border border-slate-100">
            P_r = Σ w_t · P_(r,t)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-apix-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-2">
            <span>STEP 3</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Route Relative Index</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            Express current composite route price relative to fixed Q1 baseline price (Base = 100.0):
          </p>
          <div className="bg-slate-50 p-2.5 rounded text-[11px] font-mono text-slate-700 mt-2.5 border border-slate-100">
            I_r = (P_r / P_(r,base)) × 100
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-apix-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-2">
            <span>STEP 4</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">National APIx Index</h4>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            Aggregate all 6 DGCA representative routes using official capacity/seat-km weights:
          </p>
          <div className="bg-slate-50 p-2.5 rounded text-[11px] font-mono text-slate-700 mt-2.5 border border-slate-100">
            APIx = Σ W_r · I_r
          </div>
        </div>
      </div>

      {/* Route Weights & Carrier Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Weights Chart */}
        <div className="bg-white p-5 rounded-xl border border-apix-border shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            DGCA Route Weight Allocation
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Percentage contribution to the National APIx Index (Total = 100%)
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeWeightData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" unit="%" fontSize={11} stroke="#94A3B8" />
                <YAxis dataKey="name" type="category" fontSize={11} stroke="#64748B" tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'DGCA Weight']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="weightPct" radius={[0, 4, 4, 0]}>
                  {routeWeightData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Advance Window & Carrier Shares Breakdown */}
        <div className="space-y-6">
          {/* Advance Window Table */}
          <div className="bg-white p-5 rounded-xl border border-apix-border shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Advance Booking Window Weights
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Weights reflect retail ticket booking distribution curve
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Window</th>
                    <th className="py-2 px-3">Days</th>
                    <th className="py-2 px-3">Weight</th>
                    <th className="py-2 px-3">Economic Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advanceWindows.map((w) => (
                    <tr key={w.window}>
                      <td className="py-2 px-3 font-bold text-blue-600">{w.window}</td>
                      <td className="py-2 px-3 text-slate-600">+{w.days} days</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{w.weight}</td>
                      <td className="py-2 px-3 text-slate-500">{w.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Carrier Shares Table */}
          <div className="bg-white p-5 rounded-xl border border-apix-border shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Carrier Market Shares
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Preserved domestic seat-capacity weights
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {carrierShares.map((c) => (
                <div key={c.carrier} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block">{c.code}</span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">{c.carrier}</span>
                  <span className="text-sm font-extrabold text-blue-600 block mt-1">{c.share}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
