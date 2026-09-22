import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { HistoryPoint } from '../types';

interface LineChartCardProps {
  data: HistoryPoint[];
  selectedRange: number;
  onRangeChange: (days: number) => void;
  isLoading?: boolean;
}

export const LineChartCard: React.FC<LineChartCardProps> = ({
  data,
  selectedRange,
  onRangeChange,
  isLoading = false,
}) => {
  const [showCPI, setShowCPI] = useState<boolean>(true);

  const ranges = [
    { label: '7D', value: 7 },
    { label: '30D', value: 30 },
    { label: '90D', value: 90 },
    { label: '1Y', value: 365 },
  ];

  const values = data.map((d) => d.apix_index).filter(Boolean);
  const minVal = values.length ? Math.floor(Math.min(...values) * 0.98) : 95;
  const maxVal = values.length ? Math.ceil(Math.max(...values) * 1.02) : 110;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs transition-all duration-300 hover:border-zinc-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-black font-mono tracking-tight">
              National AeroIndex Trend
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold">
              Q1 BASE 100.0
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Dynamic Laspeyres-weighted airfare index with high-frequency retail feed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CPI Toggle */}
          <button
            id="toggle-cpi-btn"
            onClick={() => setShowCPI(!showCPI)}
            className={`px-3 py-1 text-xs font-mono font-medium rounded-lg border transition-all duration-200 cursor-pointer ${
              showCPI
                ? 'bg-zinc-100 text-black border-zinc-300 shadow-2xs font-semibold'
                : 'bg-white text-zinc-400 border-zinc-200 line-through'
            }`}
          >
            Official CPI
          </button>

          {/* Range Buttons */}
          <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 border border-zinc-200">
            {ranges.map((r) => (
              <button
                key={r.value}
                id={`range-btn-${r.value}`}
                onClick={() => onRangeChange(r.value)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all duration-200 cursor-pointer ${
                  selectedRange === r.value
                    ? 'bg-black text-white shadow-xs'
                    : 'text-zinc-600 hover:text-black'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center text-xs text-zinc-400 font-mono">
          <div className="animate-pulse flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
            <span>Synthesizing index trend observations...</span>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-xs text-zinc-400 font-mono">
          No historical telemetry records available.
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#71717A"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                tickLine={false}
                tickFormatter={(val: string) => {
                  try {
                    const parts = val.split('-');
                    return `${parts[1]}/${parts[2]}`;
                  } catch {
                    return val;
                  }
                }}
              />
              <YAxis
                stroke="#71717A"
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
                domain={[minVal, maxVal]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => val.toFixed(1)}
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
                formatter={(val: any, name: string) => [
                  Number(val).toFixed(2),
                  name === 'apix_index' ? 'National AeroIndex' : 'Headline CPI Benchmark',
                ]}
                labelFormatter={(label: any) => `Date: ${label}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                formatter={(value: string) => (
                  <span className="text-zinc-700 font-semibold">
                    {value === 'apix_index' ? 'AeroIndex Dynamic' : 'Official CPI Benchmark'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="apix_index"
                name="apix_index"
                stroke="#000000"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#000000', stroke: '#FFFFFF', strokeWidth: 2 }}
                animationDuration={800}
              />
              {showCPI && (
                <Line
                  type="monotone"
                  dataKey="cpi_benchmark"
                  name="cpi_benchmark"
                  stroke="#71717A"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                  animationDuration={800}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
