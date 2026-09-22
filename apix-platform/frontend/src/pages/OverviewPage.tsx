import React from 'react';
import { DailyKPIs, HistoryPoint, RouteSummary, ScrapingStatus } from '../types';
import { KPICard } from '../components/KPICard';
import { LineChartCard } from '../components/LineChartCard';
import { RouteCard } from '../components/RouteCard';
import { Activity, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-6 animate-fadeIn">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: National APIx Index */}
        <KPICard
          id="kpi-national-index"
          title="National AeroIndex"
          value={kpis ? kpis.national_apix_index.toFixed(1) : '100.0'}
          subtitle="Base: 100.0"
          badgeText="Laspeyres Base"
          trend={dailyTrend}
          trendValue={`${(kpis?.daily_change_pct || 0) >= 0 ? '+' : ''}${(kpis?.daily_change_pct || 0).toFixed(2)}%`}
          icon={<TrendingUp className="w-4 h-4" />}
        />

        {/* Card 2: Daily Change */}
        <KPICard
          id="kpi-daily-change"
          title="Daily Change"
          value={`${(kpis?.daily_change_pct || 0) >= 0 ? '+' : ''}${(kpis?.daily_change_pct || 0).toFixed(2)}%`}
          subtitle="vs previous session"
          badgeText="High Frequency"
          trend={dailyTrend}
          trendValue="24h Delta"
          icon={<Activity className="w-4 h-4" />}
        />

        {/* Card 3: Monthly Inflation */}
        <KPICard
          id="kpi-monthly-inflation"
          title="Monthly Inflation"
          value={`${(kpis?.monthly_inflation_pct || 0) >= 0 ? '+' : ''}${(kpis?.monthly_inflation_pct || 0).toFixed(2)}%`}
          subtitle="Annualized 30d run rate"
          badgeText="Headline"
          trend={inflationTrend}
          trendValue="30d Rolling"
          icon={<Calendar className="w-4 h-4" />}
        />

        {/* Card 4: Quotes Collected Today */}
        <KPICard
          id="kpi-quotes-collected"
          title="Quotes Ingested Today"
          value={kpis ? kpis.quotes_collected_today.toLocaleString('en-IN') : '0'}
          subtitle="Across 6 DGCA Routes"
          badgeText="Live Feed"
          trend="neutral"
          trendValue="100% Ingested"
          icon={<CheckCircle2 className="w-4 h-4" />}
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
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              DGCA Representative Routes Breakdown
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Official weights derived from domestic seat-kilometer deployment & passenger volume
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
            SELECT ROUTE FOR IN-DEPTH METRICS
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
