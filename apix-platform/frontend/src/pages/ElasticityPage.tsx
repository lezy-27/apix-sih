import React from 'react';
import { ElasticityResponse } from '../types';
import { ElasticityChart } from '../components/ElasticityChart';
import { Info } from 'lucide-react';

interface ElasticityPageProps {
  elasticityData: ElasticityResponse | null;
  selectedRoute: string;
  onRouteChange: (route: string) => void;
  availableRoutes: string[];
  isLoading?: boolean;
}

export const ElasticityPage: React.FC<ElasticityPageProps> = ({
  elasticityData,
  selectedRoute,
  onRouteChange,
  availableRoutes,
  isLoading = false,
}) => {
  const windows = elasticityData?.windows || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Lead-Time Price Elasticity Chart */}
      <ElasticityChart
        windows={windows}
        selectedRoute={selectedRoute}
        onRouteChange={onRouteChange}
        availableRoutes={availableRoutes}
        isLoading={isLoading}
      />

      {/* Elasticity Insights & Carrier Spreads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs col-span-2">
          <h3 className="text-sm font-bold font-mono text-black mb-1">
            Carrier Price Dispersal Across Lead-Time Windows
          </h3>
          <p className="text-xs text-zinc-500 mb-4 font-sans">
            Comparison of average fares quoted by individual carriers per booking window
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3">Window</th>
                  <th className="py-2.5 px-3">IndiGo (60%)</th>
                  <th className="py-2.5 px-3">Air India (25%)</th>
                  <th className="py-2.5 px-3">Akasa Air (8%)</th>
                  <th className="py-2.5 px-3">SpiceJet (7%)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-black">Weighted Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {windows.map((w) => (
                  <tr key={w.advance_days} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-black">{w.window_label}</td>
                    <td className="py-2.5 px-3 text-zinc-600">
                      ₹{w.carrier_fares?.IndiGo ? Math.round(w.carrier_fares.IndiGo).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600">
                      ₹{w.carrier_fares?.['Air India'] ? Math.round(w.carrier_fares['Air India']).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600">
                      ₹{w.carrier_fares?.['Akasa Air'] ? Math.round(w.carrier_fares['Akasa Air']).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600">
                      ₹{w.carrier_fares?.SpiceJet ? Math.round(w.carrier_fares.SpiceJet).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-black bg-zinc-50/60">
                      ₹{Math.round(w.avg_fare).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Economic Policy Note */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-black font-mono">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Macro Insight</span>
          </div>
          <h4 className="text-sm font-bold text-black font-mono">
            Yield Management Surge
          </h4>
          <p className="text-xs text-zinc-700 leading-relaxed font-sans">
            In Indian domestic aviation, fares on <strong>T+1</strong> typically exhibit a <strong>60%–80% premium</strong> over <strong>T+15</strong>,
            driven by dynamic algorithmic revenue management and low demand price elasticity among last-minute corporate travelers.
          </p>
          <div className="pt-2.5 border-t border-zinc-100 text-[11px] text-zinc-500 font-sans">
            Weighting each window independently prevents distorted spikes from overwhelming the headline index.
          </div>
        </div>
      </div>
    </div>
  );
};
