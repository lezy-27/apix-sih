import React from 'react';
import { FareQuoteItem } from '../types';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { SourceLogo } from './Logos';

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
    <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
        <div>
          <span className="text-xs font-mono font-semibold text-zinc-700">
            SHOWING {items.length} OF {total.toLocaleString()} RECORDED QUOTES
          </span>
        </div>
        <button
          onClick={exportToCSV}
          disabled={items.length === 0}
          className="inline-flex items-center px-3 py-1.5 text-xs font-mono font-semibold text-white bg-black rounded-lg hover:bg-zinc-800 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-white" />
          EXPORT CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-800">
          <thead className="bg-zinc-50 text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-600 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Departure</th>
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3 text-right">Base Fare</th>
              <th className="px-4 py-3 text-right">Taxes / UDF</th>
              <th className="px-4 py-3 text-right font-bold text-black">Net Fare</th>
              <th className="px-4 py-3 text-right">Convenience</th>
              <th className="px-4 py-3 text-right font-bold text-black">Total Fare</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Observed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-zinc-400 font-mono text-xs">
                  <div className="animate-pulse flex items-center justify-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
                    <span>Querying database fare records...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-zinc-400 font-mono text-xs">
                  No fare records matched the selected query filters.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-zinc-50 transition-colors duration-150 ${
                    item.is_outlier ? 'bg-zinc-50/80 border-l-2 border-l-black' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2.5">
                      <SourceLogo name={item.carrier} size={22} className="shrink-0" />
                      <div>
                        <div className="font-bold text-black text-xs">{item.carrier}</div>
                        <div className="text-[10px] text-zinc-400">{item.flight_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-black tracking-wide">
                    {item.route}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-600">{item.departure_date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 font-semibold text-zinc-800 text-[10px] border border-zinc-200">
                      T+{item.advance_days}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-zinc-600">
                    ₹{item.base_fare.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-zinc-600">
                    ₹{item.taxes_udf.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-black bg-zinc-50/60">
                    ₹{item.net_consumer_fare.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-zinc-500">
                    ₹{item.convenience_charge.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-black text-black">
                    ₹{item.total_fare.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-black border border-zinc-200">
                      {item.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[10px] text-zinc-400">
                    {item.timestamp ? item.timestamp.slice(11, 19) : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-3 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between text-xs font-mono">
        <span className="text-zinc-600">
          PAGE {page} OF {totalPages || 1}
        </span>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:text-black hover:border-black disabled:opacity-30 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:text-black hover:border-black disabled:opacity-30 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
