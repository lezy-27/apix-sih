import React, { useState } from 'react';
import { DailyKPIs, HistoryPoint, RouteSummary, ScrapingStatus } from '../types';
import { KPICard } from '../components/KPICard';
import { LineChartCard } from '../components/LineChartCard';
import { RouteCard } from '../components/RouteCard';
import { Activity, TrendingUp, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

interface OverviewPageProps {
  kpis: DailyKPIs | null;
  history: HistoryPoint[];
  routes: RouteSummary[];
  scrapingStatus: ScrapingStatus | null;
  selectedRange: number;
  onRangeChange: (days: number) => void;
  onSelectRoute: (routeCode: string) => void;
  isLoading?: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  kpis,
  history,
  routes,
  scrapingStatus,
  selectedRange,
  onRangeChange,
  onSelectRoute,
  isLoading = false,
}) => {
  const dailyTrend =
    (kpis?.daily_change_pct || 0) > 0
      ? 'up'
      : (kpis?.daily_change_pct || 0) < 0
      ? 'down'
      : 'neutral';

  const inflationTrend =
    (kpis?.monthly_inflation_pct || 0) > 0
      ? 'up'
      : (kpis?.monthly_inflation_pct || 0) < 0
      ? 'down'
      : 'neutral';

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards per Specification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: National APIx Index */}
        <KPICard
          id="kpi-national-index"
          title="National APIx Index"
          value={kpis ? kpis.national_apix_index.toFixed(1) : '100.0'}
          subtitle="Base: 100.0"
          badgeText="DGCA Laspeyres"
          trend={dailyTrend}
          trendValue={`${(kpis?.daily_change_pct || 0) >= 0 ? '+' : ''}${(kpis?.daily_change_pct || 0).toFixed(2)}%`}
          colorTheme="blue"
          icon={<TrendingUp className="w-4 h-4 text-blue-700" />}
        />

        {/* Card 2: Daily Change */}
        <KPICard
          id="kpi-daily-change"
          title="Daily Change"
          value={`${(kpis?.daily_change_pct || 0) >= 0 ? '+' : ''}${(kpis?.daily_change_pct || 0).toFixed(2)}%`}
          subtitle="vs previous trading day"
          badgeText="High Frequency"
          trend={dailyTrend}
          trendValue="24h Delta"
          colorTheme="lavender"
          icon={<Activity className="w-4 h-4 text-purple-700" />}
        />

        {/* Card 3: Monthly Inflation */}
        <KPICard
          id="kpi-monthly-inflation"
          title="Monthly Inflation"
          value={`${(kpis?.monthly_inflation_pct || 0) >= 0 ? '+' : ''}${(kpis?.monthly_inflation_pct || 0).toFixed(2)}%`}
          subtitle="Annualized 30-day run rate"
          badgeText="Headline"
          trend={inflationTrend}
          trendValue="30d Rolling"
          colorTheme="peach"
          icon={<Calendar className="w-4 h-4 text-amber-700" />}
        />

        {/* Card 4: Quotes Collected Today */}
        <KPICard
          id="kpi-quotes-collected"
          title="Quotes Collected Today"
          value={kpis ? kpis.quotes_collected_today.toLocaleString('en-IN') : '0'}
          subtitle="Across 6 DGCA Routes"
          badgeText="Live Stream"
          trend="neutral"
          trendValue="100% Ingested"
          colorTheme="white"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Main Chart: National APIx Index Trend */}
      <LineChartCard
        data={history}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        isLoading={isLoading}
      />

      {/* DGCA Representative Route Comparison */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-apix-text uppercase tracking-wider">
              DGCA Representative Routes Breakdown
            </h3>
            <p className="text-xs text-apix-secondary">
              Official weights derived from domestic seat-kilometer deployment & passenger volume
            </p>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Click any route for detailed analytics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((r) => (
            <RouteCard
              key={r.route}
              route={r}
              onSelect={() => onSelectRoute(r.route)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
