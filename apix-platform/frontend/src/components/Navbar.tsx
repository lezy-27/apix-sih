import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  Plane,
  Clock,
  Database,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { AeroIndexLogo } from './Logos';

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
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'index', label: 'AeroIndex', icon: TrendingUp },
    { id: 'routes', label: 'Route Analysis', icon: Plane },
    { id: 'elasticity', label: 'Lead-Time Elasticity', icon: Clock },
    { id: 'simulator', label: 'Policy Simulator', icon: SlidersHorizontal },
    { id: 'fares', label: 'Fare Explorer', icon: Database },
    { id: 'scraping', label: 'Scraping & Quality', icon: ShieldCheck },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-50 transition-all">
      {/* Top Branding & Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Headline */}
          <div className="flex items-center space-x-3">
            <div
              className="relative group cursor-pointer flex items-center space-x-3"
              onClick={() => setActiveTab('overview')}
            >
              <AeroIndexLogo className="h-10 w-10 transition-transform duration-300 group-hover:scale-105" />
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl font-black tracking-tight text-black font-mono">
                    AeroIndex
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest hidden sm:inline">
                    Real-Time Airfare Price Index
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-100 text-black border border-zinc-300 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-black mr-1.5 animate-ping"></span>
                    LIVE FEED
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">
                  Ministry / DGCA Macroeconomic Aviation Inflation Tracker • 6 Key Trunk Routes
                </p>
              </div>
            </div>
          </div>

          {/* Right Metrics & Refresh */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center text-xs font-mono text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mr-2"></span>
              {timeStr}
            </div>

            <div className="hidden sm:flex items-center text-xs font-mono text-zinc-700 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
              <span className="text-zinc-400 mr-1.5">BASE:</span>
              <span className="font-bold text-black">100.0</span>
            </div>

            {onRefresh && (
              <button
                id="navbar-refresh-btn"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-3.5 py-1.5 border border-black shadow-sm text-xs font-semibold rounded-lg text-white bg-black hover:bg-zinc-800 disabled:opacity-50 transition-all duration-200 cursor-pointer active:scale-95"
                title="Refresh metrics from backend"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-1.5 transition-transform ${
                    isRefreshing ? 'animate-spin text-white' : 'text-zinc-300'
                  }`}
                />
                Sync Live
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-t border-zinc-100 bg-zinc-50/50">
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
                  className={`group flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-md font-bold'
                      : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 mr-2 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-zinc-500 group-hover:text-black'
                    }`}
                  />
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
