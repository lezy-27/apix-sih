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
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '1 Year', value: 365 },
  ];

  // Calculate min and max for Y-axis domain
  const values = data.map((d) => d.apix_index).filter(Boolean);
  const minVal = values.length ? Math.floor(Math.min(...values) * 0.98) : 95;
  const maxVal = values.length ? Math.ceil(Math.max(...values) * 1.02) : 110;

  return (
    <div className="bg-white rounded-xl border border-apix-border p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-apix-text">
            National APIx Index Trend
          </h2>
          <p className="text-xs text-apix-secondary mt-0.5">
            Dynamic Laspeyres-weighted airfare index relative to Q1 baseline (100.0)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CPI Toggle */}
          <button
            id="toggle-cpi-btn"
            onClick={() => setShowCPI(!showCPI)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
              showCPI
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            Official CPI Comparison
          </button>

          {/* Range Buttons */}
          <div className="inline-flex rounded-md shadow-sm border border-slate-200 bg-slate-50 p-0.5">
            {ranges.map((r) => (
              <button
                key={r.value}
                id={`range-btn-${r.value}`}
                onClick={() => onRangeChange(r.value)}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  selectedRange === r.value
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center text-xs text-slate-400">
          <div className="animate-pulse">Loading index trend data...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-72 flex items-center justify-center text-xs text-slate-400">
          No historical data available.
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94A3B8"
                fontSize={11}
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
                stroke="#94A3B8"
                fontSize={11}
                domain={[minVal, maxVal]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => val.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: string) => [
                  Number(val).toFixed(2),
                  name === 'apix_index' ? 'National APIx' : 'Headline CPI Benchmark',
                ]}
                labelFormatter={(label: any) => `Date: ${label}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                formatter={(value: string) => (value === 'apix_index' ? 'APIx Dynamic Index' : 'Official CPI Benchmark')}
              />
              <Line
                type="monotone"
                dataKey="apix_index"
                name="apix_index"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#2563EB' }}
              />
              {showCPI && (
                <Line
                  type="monotone"
                  dataKey="cpi_benchmark"
                  name="cpi_benchmark"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
