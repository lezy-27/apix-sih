import React, { useState, useEffect } from 'react';
import { ScrapingStatus, DataQuality, ScrapingTriggerResponse, SourceHealthItem } from '../types';
import { api, formatApiError } from '../services/api';
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
} from 'lucide-react';
import { SourceLogo } from '../components/Logos';

interface ScrapingQualityPageProps {
  status: ScrapingStatus | null;
  quality: DataQuality | null;
  onRefreshTelemetry: () => void;
}

export const ScrapingQualityPage: React.FC<ScrapingQualityPageProps> = ({
  status: initialStatus,
  quality: initialQuality,
  onRefreshTelemetry,
}) => {
  const [status, setStatus] = useState<ScrapingStatus | null>(initialStatus);
  const [quality, setQuality] = useState<DataQuality | null>(initialQuality);
  const [sourceHealth, setSourceHealth] = useState<SourceHealthItem[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<ScrapingTriggerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setQuality(initialQuality);
  }, [initialQuality]);

  const loadSourceHealth = async () => {
    try {
      const res = await api.getSourceHealth();
      setSourceHealth(res.sources);
    } catch (err) {
      console.error('Failed to load source health:', err);
    }
  };

  useEffect(() => {
    loadSourceHealth();
  }, []);

  const handleRunExtraction = async () => {
    setIsRunning(true);
    setError(null);
    setRunResult(null);
    try {
      const res = await api.triggerScrapingRun({ use_mock: false });
      setRunResult(res);

      const [newStatus, newQuality] = await Promise.all([
        api.getScrapingStatus(),
        api.getDataQuality(),
      ]);
      setStatus(newStatus);
      setQuality(newQuality);
      await loadSourceHealth();
      onRefreshTelemetry();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsRunning(false);
    }
  };

  const isCompleted = status?.status === 'COMPLETED' || status?.status === 'IDLE';

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Online':
        return { bg: 'bg-black text-white border-black font-bold', dot: 'bg-white' };
      case 'Blocked':
        return { bg: 'bg-zinc-100 text-zinc-700 border-zinc-300 font-medium', dot: 'bg-zinc-400' };
      case 'Timeout':
        return { bg: 'bg-zinc-100 text-zinc-800 border-zinc-300 font-medium', dot: 'bg-zinc-500' };
      default:
        return { bg: 'bg-zinc-50 text-zinc-600 border-zinc-200 font-medium', dot: 'bg-zinc-400' };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-base font-bold text-black font-mono">
              Scraping Ingestion & Data Quality Telemetry
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${isRunning
                  ? 'bg-black text-white animate-pulse'
                  : isCompleted
                    ? 'bg-zinc-100 text-black border border-zinc-300'
                    : 'bg-zinc-200 text-zinc-800'
                }`}
            >
              {isRunning ? 'Extraction Running...' : status?.status || 'Active'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 font-sans">
            Real-time monitoring of curl_cffi scrapers, deduplication rules, and MAD outlier filtering
          </p>
        </div>

        <button
          id="run-extraction-btn"
          onClick={handleRunExtraction}
          disabled={isRunning}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-mono font-bold text-white bg-black hover:bg-zinc-800 disabled:opacity-50 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" />
              Running Ingestion...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-current" />
              Run Live Extraction
            </>
          )}
        </button>
      </div>

      {/* Success Notification Alert */}
      {runResult && (
        <div className="bg-zinc-50 border border-zinc-300 rounded-xl p-4 text-xs text-black flex items-start space-x-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div className="space-y-1 font-mono">
            <span className="font-bold block text-sm">Pipeline Execution Completed!</span>
            <p className="font-sans text-xs text-zinc-700">
              Collected <strong>{runResult.quotes_collected}</strong> raw quotes across all DGCA routes and advance windows
              ({runResult.scrape_mode === 'live' ? ' Live curl_cffi Scraping' : ' Synthetic Generation'}).
              Deduplication filtered <strong>{runResult.duplicates_removed}</strong> records, and MAD flagged{' '}
              <strong>{runResult.outliers_detected}</strong> outliers. AeroIndex recalculated.
            </p>
            <span className="text-[11px] text-zinc-500 block mt-1">Run ID: {runResult.run_id}</span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-zinc-50 border border-zinc-300 rounded-xl p-4 text-xs text-black flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block font-mono">Extraction Telemetry Error</span>
            <p className="text-zinc-600">{error}</p>
          </div>
        </div>
      )}

      {/* 4 Telemetry Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Data Quality Score */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs hover:border-black transition-all">
          <span className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider block">
            Data Quality Score
          </span>
          <div className="text-3xl font-black font-mono text-black mt-2">
            {quality ? `${quality.quality_score_pct.toFixed(1)}%` : '—'}
          </div>
          <span className="text-xs text-zinc-500 mt-2 block font-sans">
            Calculated as Clean / Total Ingested
          </span>
        </div>

        {/* Card 2: Duplicates Removed */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs hover:border-black transition-all">
          <span className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider block">
            Duplicate Quotes Filtered
          </span>
          <div className="text-3xl font-black font-mono text-black mt-2">
            {quality ? quality.duplicates_removed.toLocaleString() : '0'}
          </div>
          <span className="text-xs text-zinc-500 mt-2 block font-sans">
            De-duplicated on 6-tuple unique keys
          </span>
        </div>

        {/* Card 3: Outliers Removed */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs hover:border-black transition-all">
          <span className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider block">
            Outliers Sanitized (MAD)
          </span>
          <div className="text-3xl font-black font-mono text-black mt-2">
            {quality ? quality.outliers_removed.toLocaleString() : '0'}
          </div>
          <span className="text-xs text-zinc-500 mt-2 block font-sans">
            Modified Z-Score |M_i| &gt; 3.5
          </span>
        </div>

        {/* Card 4: Last Successful Run */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs hover:border-black transition-all">
          <span className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider block">
            Last Successful Ingestion
          </span>
          <div className="text-lg font-bold font-mono text-black mt-2 truncate">
            {status?.last_successful_run
              ? new Date(status.last_successful_run).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : '—'}
          </div>
          <span className="text-xs text-zinc-500 mt-2 block font-sans">
            {status?.is_mock ? '🧪 Deterministic Seed Engine' : '🌐 Live curl_cffi Scraper'}
          </span>
        </div>
      </div>

      {/* Target Sources & Scraper Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scraper Sources Matrix — LIVE from API */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold font-mono text-black">
              Target Airline & OTA Ingestion Status
            </h3>
            <button
              onClick={loadSourceHealth}
              className="text-[11px] font-mono text-zinc-600 hover:text-black font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <p className="text-xs text-zinc-500 mb-4 font-sans">
            Live curl_cffi adapter status — TLS Chrome impersonation with anti-bot bypass
          </p>

          <div className="space-y-2.5">
            {sourceHealth.length > 0 ? (
              sourceHealth.map((s) => {
                const badge = getStatusBadge(s.status);
                return (
                  <div
                    key={s.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <SourceLogo name={s.name} size={28} className="shrink-0" />
                      <div>
                        <span className="text-xs font-bold font-mono text-black block">{s.name}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">{s.source_type}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 font-mono">
                      {s.last_response_ms !== null && (
                        <span className="text-[10px] text-zinc-500">
                          {s.last_response_ms.toFixed(0)}ms
                        </span>
                      )}
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-black block">
                          {s.quotes_last_run > 0 ? `${s.quotes_last_run} quotes` : '—'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.bg}`}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-zinc-400 font-mono">
                <Server className="w-6 h-6 mx-auto mb-2 text-zinc-300" />
                <p>No scraping telemetry yet. Run an extraction to query live sources.</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Quality & Cleaning Architecture */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold font-mono text-black">
            Automated Quality Checks & Normalization
          </h3>

          <div className="space-y-3 text-xs text-zinc-700 font-sans">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="font-bold text-black block mb-1 font-mono">
                1. Net Consumer Fare Calculation
              </span>
              <p className="text-[11px] text-zinc-600">
                <code className="font-mono text-black bg-zinc-200 px-1 py-0.5 rounded">
                  net_consumer_fare = base_fare + taxes_udf
                </code>
                . Excludes optional ancillaries (meals, seat selection, convenience fee) to preserve pure airfare inflation signal.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="font-bold text-black block mb-1 font-mono">
                2. 6-Tuple De-duplication Rule
              </span>
              <p className="text-[11px] text-zinc-600">
                Identifies duplicate observations across carriers and OTAs keyed on:
                <code className="font-mono text-black block mt-1 bg-zinc-200 px-1 py-0.5 rounded">
                  (origin, destination, departure_date, advance_days, carrier, flight_number)
                </code>
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <span className="font-bold text-black block mb-1 font-mono">
                3. Modified Z-Score / MAD Anomaly Detection
              </span>
              <p className="text-[11px] text-zinc-600">
                Computes Median Absolute Deviation for each route/window:
                <code className="font-mono text-black block mt-1 bg-zinc-200 px-1 py-0.5 rounded">
                  M_i = 0.6745 · (x_i - median) / MAD
                </code>
                Fares with |M_i| &gt; 3.5 are isolated from index calculation to avoid web-scraping pricing glitch distortion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
