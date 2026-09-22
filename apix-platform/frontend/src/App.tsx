import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { IndexPage } from './pages/IndexPage';
import { RouteAnalysisPage } from './pages/RouteAnalysisPage';
import { ElasticityPage } from './pages/ElasticityPage';
import { FareExplorerPage } from './pages/FareExplorerPage';
import { ScrapingQualityPage } from './pages/ScrapingQualityPage';
import { PolicySimulatorPage } from './pages/PolicySimulatorPage';
import { api, formatApiError } from './services/api';
import {
  DailyKPIs,
  HistoryPoint,
  RouteSummary,
  ElasticityResponse,
  ScrapingStatus,
  DataQuality,
} from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AeroIndexLogo } from './components/Logos';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Core Data States
  const [kpis, setKpis] = useState<DailyKPIs | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [elasticity, setElasticity] = useState<ElasticityResponse | null>(null);
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);

  // Sub-controls
  const [selectedRange, setSelectedRange] = useState<number>(30);
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>('DEL-BOM');
  const [elasticityRoute, setElasticityRoute] = useState<string>('ALL');

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = async (isBackground: boolean = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [kpisRes, histRes, routesRes, elastRes, statusRes, qualityRes] =
        await Promise.all([
          api.getDailyKPIs(),
          api.getIndexHistory(selectedRange),
          api.getRoutes(),
          api.getElasticity(elasticityRoute),
          api.getScrapingStatus(),
          api.getDataQuality(),
        ]);

      setKpis(kpisRes);
      setHistory(histRes.points);
      setRoutes(routesRes.routes);
      setElasticity(elastRes);
      setScrapingStatus(statusRes);
      setDataQuality(qualityRes);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData(false);
  }, []);

  // Update history when range changes
  useEffect(() => {
    api
      .getIndexHistory(selectedRange)
      .then((res) => setHistory(res.points))
      .catch((err) => console.error(err));
  }, [selectedRange]);

  // Update elasticity when route filter changes
  useEffect(() => {
    api
      .getElasticity(elasticityRoute)
      .then((res) => setElasticity(res))
      .catch((err) => console.error(err));
  }, [elasticityRoute]);

  const handleSelectRoute = (routeCode: string) => {
    setSelectedRouteCode(routeCode);
    setActiveTab('routes');
  };

  return (
    <div className="min-h-screen bg-apix-bg text-apix-text flex flex-col">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadAllData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadAllData(false)}
              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded font-medium text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab Content Routing */}
        {activeTab === 'overview' && (
          <OverviewPage
            kpis={kpis}
            history={history}
            routes={routes}
            scrapingStatus={scrapingStatus}
            selectedRange={selectedRange}
            onRangeChange={(days) => setSelectedRange(days)}
            onSelectRoute={handleSelectRoute}
            isLoading={loading}
          />
        )}

        {activeTab === 'index' && (
          <IndexPage routes={routes} history={history} />
        )}

        {activeTab === 'routes' && (
          <RouteAnalysisPage
            routes={routes}
            selectedRouteCode={selectedRouteCode}
            onSelectRoute={(code) => setSelectedRouteCode(code)}
          />
        )}

        {activeTab === 'elasticity' && (
          <ElasticityPage
            elasticityData={elasticity}
            selectedRoute={elasticityRoute}
            onRouteChange={(r) => setElasticityRoute(r)}
            availableRoutes={routes.map((r) => r.route)}
            isLoading={loading}
          />
        )}

        {activeTab === 'simulator' && (
          <PolicySimulatorPage
            currentIndex={kpis?.national_apix_index ?? 104.7}
          />
        )}

        {activeTab === 'fares' && <FareExplorerPage />}

        {activeTab === 'scraping' && (
          <ScrapingQualityPage
            status={scrapingStatus}
            quality={dataQuality}
            onRefreshTelemetry={() => loadAllData(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 mt-12 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="flex items-center space-x-2.5 mb-2.5">
            <AeroIndexLogo className="h-6 w-6" />
            <span className="font-mono font-black text-black text-sm">AeroIndex</span>
            <span className="text-zinc-300">•</span>
            <span className="font-semibold text-zinc-700">Real-Time Airfare Price Index Platform</span>
          </div>
          <p className="text-zinc-500 max-w-2xl text-[11px] font-sans">
            Automated high-frequency retail airfare ingestion, Median Absolute Deviation (MAD) outlier sanitization, and Laspeyres geometric price index for Ministry of Civil Aviation & DGCA analytics.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
