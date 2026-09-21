import React from 'react';
import { ElasticityResponse, AdvanceWindowFare } from '../types';
import { ElasticityChart } from '../components/ElasticityChart';
import { Clock, Info, ShieldAlert, ArrowUpRight } from 'lucide-react';

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
    <div className="space-y-6">
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
        <div className="bg-white p-5 rounded-xl border border-apix-border shadow-sm col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-2">
            Carrier Price Dispersal Across Lead-Time Windows
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Comparison of average fares quoted by individual carriers per booking window
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Window</th>
                  <th className="py-2.5 px-3">IndiGo (60%)</th>
                  <th className="py-2.5 px-3">Air India (25%)</th>
                  <th className="py-2.5 px-3">Akasa Air (8%)</th>
                  <th className="py-2.5 px-3">SpiceJet (7%)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-blue-700">Weighted Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {windows.map((w) => (
                  <tr key={w.advance_days} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{w.window_label}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      ₹{w.carrier_fares?.IndiGo ? Math.round(w.carrier_fares.IndiGo).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      ₹{w.carrier_fares?.['Air India'] ? Math.round(w.carrier_fares['Air India']).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      ₹{w.carrier_fares?.['Akasa Air'] ? Math.round(w.carrier_fares['Akasa Air']).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      ₹{w.carrier_fares?.SpiceJet ? Math.round(w.carrier_fares.SpiceJet).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-blue-600 bg-blue-50/30">
                      ₹{Math.round(w.avg_fare).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Economic Policy Note */}
        <div className="bg-[#E8EEF7] p-5 rounded-xl border border-[#D5E1F2] space-y-3">
          <div className="flex items-center space-x-2 text-blue-800">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Macro Insight</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Yield Management Surge
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            In Indian domestic aviation, fares on <strong>T+1</strong> typically exhibit a <strong>60%–80% premium</strong> over <strong>T+15</strong>,
            driven by dynamic algorithmic revenue management and low demand price elasticity among last-minute corporate travelers.
          </p>
          <div className="pt-2 border-t border-blue-200/50 text-[11px] text-slate-600">
            Weighting each window independently prevents distorted spikes from overwhelming the headline index.
          </div>
        </div>
      </div>
    </div>
  );
};
