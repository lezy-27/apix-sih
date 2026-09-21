import React from 'react';
import { FareQuoteItem } from '../types';
import { ChevronLeft, ChevronRight, AlertCircle, Download } from 'lucide-react';

interface FareTableProps {
  items: FareQuoteItem[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export const FareTable: React.FC<FareTableProps> = ({
  items,
  total,
  page,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  const exportToCSV = () => {
    if (items.length === 0) return;
    const headers = [
      'Carrier',
      'Route',
      'Flight',
      'Departure Date',
      'Advance Days',
      'Base Fare',
      'Taxes / UDF',
      'Net Consumer Fare',
      'Convenience Fee',
      'Total Fare',
      'Source',
      'Timestamp',
    ];
    const rows = items.map((i) => [
      i.carrier,
      i.route,
      i.flight_number,
      i.departure_date,
      `T+${i.advance_days}`,
      i.base_fare,
      i.taxes_udf,
      i.net_consumer_fare,
      i.convenience_charge,
      i.total_fare,
      i.source,
      i.timestamp,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `apix_fares_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-apix-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-700">
            Showing {items.length} of {total.toLocaleString()} quotes
          </span>
        </div>
        <button
          onClick={exportToCSV}
          disabled={items.length === 0}
          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Departure</th>
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3 text-right">Base Fare</th>
              <th className="px-4 py-3 text-right">Taxes / UDF</th>
              <th className="px-4 py-3 text-right font-bold text-slate-800">Net Fare</th>
              <th className="px-4 py-3 text-right">Convenience</th>
              <th className="px-4 py-3 text-right font-bold text-blue-700">Total Fare</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Observed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-slate-400">
                  <div className="animate-pulse">Loading fare records...</div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-slate-400">
                  No fare records matched the selected filters.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    item.is_outlier ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{item.carrier}</div>
                    <div className="text-[10px] text-slate-400">{item.flight_number}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-700">
                    {item.route}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.departure_date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[10px]">
                      T+{item.advance_days}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-slate-600">
                    ₹{item.base_fare.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-slate-600">
                    ₹{item.taxes_udf.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-900 bg-slate-50/50">
                    ₹{item.net_consumer_fare.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-slate-500">
                    ₹{item.convenience_charge.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-extrabold text-blue-700">
                    ₹{item.total_fare.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {item.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[11px] text-slate-400">
                    {item.timestamp ? item.timestamp.slice(11, 19) : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
