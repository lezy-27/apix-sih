import React from 'react';
import {
  Activity,
  TrendingUp,
  Plane,
  Clock,
  Database,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'index', label: 'APIx Index', icon: TrendingUp },
    { id: 'routes', label: 'Route Analysis', icon: Plane },
    { id: 'elasticity', label: 'Lead-Time Elasticity', icon: Clock },
    { id: 'fares', label: 'Fare Explorer', icon: Database },
    { id: 'scraping', label: 'Scraping & Quality', icon: ShieldCheck },
  ];

  return (
    <header className="bg-white border-b border-apix-border sticky top-0 z-50">
      {/* Top Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Plane className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xl font-bold tracking-tight text-apix-text">APIx</span>
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  Real-Time Airfare Price Index
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-apix-secondary mt-0.5">
                High-Frequency Retail Airfare Inflation Tracker • Directorate General of Civil Aviation (DGCA) Routes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
              <span className="font-medium text-slate-700 mr-1.5">Baseline:</span> 100.0 (Q1 Base)
            </div>
            {onRefresh && (
              <button
                id="navbar-refresh-btn"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-1.5 border border-slate-200 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                title="Refresh metrics from API"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center px-3.5 py-2 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 mr-2 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
