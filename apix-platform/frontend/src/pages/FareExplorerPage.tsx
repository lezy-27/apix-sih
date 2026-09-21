import React, { useState, useEffect } from 'react';
import { FareListResponse, FareQuoteItem } from '../types';
import { FareTable } from '../components/FareTable';
import { api, formatApiError } from '../services/api';
import { Search, Filter, RotateCcw } from 'lucide-react';

export const FareExplorerPage: React.FC = () => {
  const [data, setData] = useState<FareListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(25);
  const [airline, setAirline] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [route, setRoute] = useState<string>('');
  const [advanceDays, setAdvanceDays] = useState<string>('');
  const [date, setDate] = useState<string>('');

  const fetchFares = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getFares({
        page,
        limit,
        airline: airline || undefined,
        source: source || undefined,
        route: route || undefined,
        advance_days: advanceDays ? parseInt(advanceDays, 10) : undefined,
        date: date || undefined,
      });
      setData(res);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFares();
  }, [page, airline, source, route, advanceDays, date]);

  const resetFilters = () => {
    setAirline('');
    setSource('');
    setRoute('');
    setAdvanceDays('');
    setDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(airline || source || route || advanceDays || date);

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-xl border border-apix-border p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-apix-text">
              Real-Time Fare Explorer
            </h2>
            <p className="text-xs text-apix-secondary">
              Search and audit individual airline & OTA ticket quotes ingested by the scraping pipeline
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Airline Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Carrier</label>
            <select
              value={airline}
              onChange={(e) => { setAirline(e.target.value); setPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Carriers</option>
              {(data?.carriers || ['IndiGo', 'Air India', 'Akasa Air', 'SpiceJet']).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Source / OTA</label>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              {(data?.sources || ['IndiGo', 'Air India', 'Akasa Air', 'SpiceJet', 'MakeMyTrip', 'EaseMyTrip']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Route Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">DGCA Route</label>
            <select
              value={route}
              onChange={(e) => { setRoute(e.target.value); setPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Routes</option>
              {(data?.routes || ['DEL-BOM', 'DEL-BLR', 'BOM-BLR', 'DEL-CCU', 'BLR-HYD', 'MAA-DEL']).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Advance Window Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Booking Window</label>
            <select
              value={advanceDays}
              onChange={(e) => { setAdvanceDays(e.target.value); setPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Windows</option>
              <option value="1">T+1 (1 Day)</option>
              <option value="7">T+7 (7 Days)</option>
              <option value="15">T+15 (15 Days)</option>
              <option value="30">T+30 (30 Days)</option>
              <option value="60">T+60 (60 Days)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Departure Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Fare Quotes Data Table */}
      <FareTable
        items={data?.items || []}
        total={data?.total || 0}
        page={page}
        totalPages={data?.total_pages || 1}
        onPageChange={(p) => setPage(p)}
        isLoading={loading}
      />
    </div>
  );
};
