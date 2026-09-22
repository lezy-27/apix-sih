import React from 'react';
import { RouteSummary, HistoryPoint } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { BookOpen, Calculator, Layers, ShieldCheck } from 'lucide-react';
import { SourceLogo } from '../components/Logos';

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

  const barColors = ['#000000', '#27272A', '#3F3F46', '#52525B', '#71717A', '#A1A1AA'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Introduction */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-lg bg-black text-white">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-black">
              AeroIndex Mathematical Methodology & Index Mechanics
            </h2>
            <p className="text-xs text-zinc-500 font-sans">
              Harmonized Laspeyres-style multi-tiered geometric aggregation for real-time airfare tracking
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-700 leading-relaxed mt-3 font-sans">
          The <strong>Real-Time Airfare Price Index (AeroIndex)</strong> provides economic policy-makers, researchers, and consumers
          with high-frequency price transparency. Unlike traditional monthly consumer price surveys that lag real market movements
          by 30–45 days, AeroIndex calculates real-time price relatives across high-traffic domestic trunk routes with high precision.
        </p>
      </div>

      {/* 4 Step Mathematical Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs hover:border-black transition-all">
          <div className="flex items-center justify-between text-xs font-bold font-mono text-black mb-2">
            <span>STEP 1</span>
            <Layers className="w-4 h-4 text-black" />
          </div>
          <h4 className="text-sm font-bold font-mono text-black">Carrier Geometric Mean</h4>
          <p className="text-[11px] text-zinc-600 mt-1 leading-normal font-sans">
            For each route <code className="text-black font-mono font-bold">r</code> and booking window <code className="text-black font-mono font-bold">t</code>, compute carrier-weighted geometric mean:
          </p>
          <div className="bg-zinc-50 p-2.5 rounded text-[11px] font-mono text-black mt-2.5 border border-zinc-200">
            P_(r,t) = exp(Σ s_c · ln(P_(r,t,c)))
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs hover:border-black transition-all">
          <div className="flex items-center justify-between text-xs font-bold font-mono text-black mb-2">
            <span>STEP 2</span>
            <Calculator className="w-4 h-4 text-black" />
          </div>
          <h4 className="text-sm font-bold font-mono text-black">Weighted Route Price</h4>
          <p className="text-[11px] text-zinc-600 mt-1 leading-normal font-sans">
            Combine booking windows using lead-time weights (T+1 to T+60) reflecting purchase velocity:
          </p>
          <div className="bg-zinc-50 p-2.5 rounded text-[11px] font-mono text-black mt-2.5 border border-zinc-200">
            P_r = Σ w_t · P_(r,t)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs hover:border-black transition-all">
          <div className="flex items-center justify-between text-xs font-bold font-mono text-black mb-2">
            <span>STEP 3</span>
            <BookOpen className="w-4 h-4 text-black" />
          </div>
          <h4 className="text-sm font-bold font-mono text-black">Route Relative Index</h4>
          <p className="text-[11px] text-zinc-600 mt-1 leading-normal font-sans">
            Express current composite route price relative to fixed Q1 baseline price (Base = 100.0):
          </p>
          <div className="bg-zinc-50 p-2.5 rounded text-[11px] font-mono text-black mt-2.5 border border-zinc-200">
            I_r = (P_r / P_(r,base)) × 100
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs hover:border-black transition-all">
          <div className="flex items-center justify-between text-xs font-bold font-mono text-black mb-2">
            <span>STEP 4</span>
            <ShieldCheck className="w-4 h-4 text-black" />
          </div>
          <h4 className="text-sm font-bold font-mono text-black">National AeroIndex</h4>
          <p className="text-[11px] text-zinc-600 mt-1 leading-normal font-sans">
            Aggregate all 6 DGCA representative routes using official capacity/seat-km weights:
          </p>
          <div className="bg-zinc-50 p-2.5 rounded text-[11px] font-mono text-black mt-2.5 border border-zinc-200">
            AeroIndex = Σ W_r · I_r
          </div>
        </div>
      </div>

      {/* Route Weights & Carrier Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Weights Chart */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
          <h3 className="text-sm font-bold font-mono text-black mb-1">
            DGCA Route Weight Allocation
          </h3>
          <p className="text-xs text-zinc-500 mb-4 font-sans">
            Percentage contribution to the National AeroIndex (Total = 100%)
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeWeightData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" unit="%" fontSize={10} fontFamily="JetBrains Mono, monospace" stroke="#71717A" />
                <YAxis dataKey="name" type="category" fontSize={11} fontFamily="JetBrains Mono, monospace" stroke="#000000" tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'DGCA Weight']}
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Bar dataKey="weightPct" radius={[0, 4, 4, 0]} animationDuration={800}>
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
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
            <h3 className="text-sm font-bold font-mono text-black mb-1">
              Advance Booking Window Weights
            </h3>
            <p className="text-xs text-zinc-500 mb-3 font-sans">
              Weights reflect retail ticket booking distribution curve
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2 px-3">Window</th>
                    <th className="py-2 px-3">Days</th>
                    <th className="py-2 px-3">Weight</th>
                    <th className="py-2 px-3 font-sans">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {advanceWindows.map((w) => (
                    <tr key={w.window}>
                      <td className="py-2 px-3 font-bold text-black">{w.window}</td>
                      <td className="py-2 px-3 text-zinc-600">+{w.days} days</td>
                      <td className="py-2 px-3 font-bold text-black">{w.weight}</td>
                      <td className="py-2 px-3 text-zinc-500 font-sans">{w.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Carrier Shares Table */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
            <h3 className="text-sm font-bold font-mono text-black mb-1">
              Carrier Market Shares
            </h3>
            <p className="text-xs text-zinc-500 mb-3 font-sans">
              Preserved domestic seat-capacity weights
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              {carrierShares.map((c) => (
                <div key={c.carrier} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-black transition-colors flex flex-col items-center">
                  <SourceLogo name={c.carrier} size={24} className="mb-1" />
                  <span className="text-[10px] font-mono text-zinc-400 block">{c.code}</span>
                  <span className="text-xs font-bold text-black block mt-0.5">{c.carrier}</span>
                  <span className="text-sm font-black font-mono text-black block mt-1">{c.share}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
