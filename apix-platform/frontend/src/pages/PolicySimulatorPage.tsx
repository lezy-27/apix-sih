import React, { useState, useMemo, useCallback } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Sparkles,
  Calculator,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';

// ---------------------------------------------------------------------------
// Cost component model — deterministic algebraic simulator
// ---------------------------------------------------------------------------

interface CostComponent {
  id: string;
  name: string;
  shortName: string;
  weight: number; // fraction of base fare (sums to 1.0)
  description: string;
  color: string;
}

const COST_COMPONENTS: CostComponent[] = [
  {
    id: 'atf',
    name: 'Aviation Turbine Fuel (ATF)',
    shortName: 'ATF / Fuel',
    weight: 0.40,
    description: 'Largest cost driver — directly linked to crude oil & excise duties',
    color: '#EF4444',
  },
  {
    id: 'airport',
    name: 'Airport & Navigation Charges',
    shortName: 'Airport Charges',
    weight: 0.15,
    description: 'Landing, parking, RNFC, terminal navigation charges',
    color: '#F59E0B',
  },
  {
    id: 'crew',
    name: 'Crew & Staff Costs',
    shortName: 'Crew Costs',
    weight: 0.12,
    description: 'Pilot salaries, cabin crew, ground staff compensation',
    color: '#3B82F6',
  },
  {
    id: 'mro',
    name: 'MRO (Maintenance, Repair & Overhaul)',
    shortName: 'MRO',
    weight: 0.10,
    description: 'Airframe maintenance, engine overhaul, component replacement',
    color: '#8B5CF6',
  },
  {
    id: 'gst',
    name: 'GST & Government Taxes',
    shortName: 'GST / Taxes',
    weight: 0.08,
    description: 'Goods & Services Tax on air travel (currently 5% for economy)',
    color: '#10B981',
  },
  {
    id: 'carbon',
    name: 'Carbon / Green Levy',
    shortName: 'Carbon Levy',
    weight: 0.05,
    description: 'Environmental sustainability levy, CORSIA compliance',
    color: '#06B6D4',
  },
  {
    id: 'other',
    name: 'Insurance & Other Operating Costs',
    shortName: 'Insurance & Other',
    weight: 0.10,
    description: 'Hull insurance, liability, lease rentals, distribution costs',
    color: '#6B7280',
  },
];

interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  changes: Record<string, number>;
}

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'atf_hike',
    name: '10% ATF Tax Hike',
    description: 'Simulates a 10% increase in aviation fuel excise duty',
    icon: <TrendingUp className="w-4 h-4" />,
    changes: { atf: 10, airport: 0, crew: 0, mro: 0, gst: 0, carbon: 0, other: 0 },
  },
  {
    id: 'gst_reduction',
    name: 'GST Cut to 3%',
    description: 'Government reduces GST on economy air travel from 5% to 3%',
    icon: <TrendingDown className="w-4 h-4" />,
    changes: { atf: 0, airport: 0, crew: 0, mro: 0, gst: -40, carbon: 0, other: 0 },
  },
  {
    id: 'carbon_tax',
    name: 'Carbon Tax Introduction',
    description: 'New ₹500/tonne carbon levy on domestic aviation',
    icon: <Sparkles className="w-4 h-4" />,
    changes: { atf: 0, airport: 0, crew: 0, mro: 0, gst: 0, carbon: 60, other: 0 },
  },
  {
    id: 'airport_modernization',
    name: 'Airport Modernization',
    description: 'Surcharge for new terminal infrastructure across metro airports',
    icon: <Target className="w-4 h-4" />,
    changes: { atf: 0, airport: 25, crew: 0, mro: 0, gst: 0, carbon: 0, other: 0 },
  },
  {
    id: 'crude_shock',
    name: 'Crude Oil Shock (+30%)',
    description: 'Geopolitical crude oil price surge impacting ATF & insurance',
    icon: <Zap className="w-4 h-4" />,
    changes: { atf: 30, airport: 0, crew: 0, mro: 5, gst: 0, carbon: 0, other: 8 },
  },
  {
    id: 'deflation',
    name: 'Favorable Policy Bundle',
    description: 'ATF duty cut, GST reduction, and subsidized airport charges',
    icon: <TrendingDown className="w-4 h-4" />,
    changes: { atf: -15, airport: -10, crew: 0, mro: 0, gst: -25, carbon: 0, other: 0 },
  },
];

// Current baseline AeroIndex value
const BASELINE_INDEX = 100.0;
const CURRENT_INDEX = 104.7; // Simulated current AeroIndex

// ---------------------------------------------------------------------------
// Component: Single Cost Factor Slider
// ---------------------------------------------------------------------------

interface SliderRowProps {
  component: CostComponent;
  value: number;
  onChange: (id: string, val: number) => void;
  onReset: (id: string) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({ component, value, onChange, onReset }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  return (
    <div className="group bg-white rounded-xl border border-zinc-200 p-4 hover:border-zinc-400 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: component.color }}
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold font-mono text-black truncate">
                {component.shortName}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {(component.weight * 100).toFixed(0)}% of fare
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans truncate hidden sm:block">
              {component.description}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span
            className={`text-sm font-black font-mono tabular-nums min-w-[4rem] text-right ${
              isPositive
                ? 'text-rose-600'
                : isNegative
                ? 'text-emerald-600'
                : 'text-zinc-400'
            }`}
          >
            {value >= 0 ? '+' : ''}
            {value}%
          </span>
          <button
            onClick={() => onReset(component.id)}
            className={`p-1 rounded-md transition-all duration-150 cursor-pointer ${
              isNeutral
                ? 'text-zinc-300 cursor-default'
                : 'text-zinc-400 hover:text-black hover:bg-zinc-100'
            }`}
            disabled={isNeutral}
            title="Reset to 0%"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={-50}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(component.id, parseInt(e.target.value, 10))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer slider-custom"
          style={{
            background: `linear-gradient(to right, 
              #34D399 0%, 
              #34D399 ${((value + 50) / 150) * 100 * 0.33}%, 
              #E4E4E7 ${((value + 50) / 150) * 100 * 0.33}%, 
              #E4E4E7 ${(50 / 150) * 100}%, 
              ${value > 0 ? '#FCA5A5' : '#E4E4E7'} ${(50 / 150) * 100}%, 
              ${value > 0 ? '#EF4444' : '#E4E4E7'} ${((value + 50) / 150) * 100}%, 
              #E4E4E7 ${((value + 50) / 150) * 100}%, 
              #E4E4E7 100%
            )`,
          }}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] font-mono text-zinc-400">−50%</span>
          <span className="text-[9px] font-mono text-zinc-400">0%</span>
          <span className="text-[9px] font-mono text-zinc-400">+100%</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

interface PolicySimulatorPageProps {
  currentIndex?: number;
}

export const PolicySimulatorPage: React.FC<PolicySimulatorPageProps> = ({
  currentIndex = CURRENT_INDEX,
}) => {
  // Slider state: { atf: 0, airport: 0, ... }
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(
    Object.fromEntries(COST_COMPONENTS.map((c) => [c.id, 0]))
  );
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleSliderChange = useCallback((id: string, val: number) => {
    setSliderValues((prev) => ({ ...prev, [id]: val }));
    setActivePreset(null); // clear preset highlight on manual change
  }, []);

  const handleResetOne = useCallback((id: string) => {
    setSliderValues((prev) => ({ ...prev, [id]: 0 }));
    setActivePreset(null);
  }, []);

  const handleResetAll = useCallback(() => {
    setSliderValues(Object.fromEntries(COST_COMPONENTS.map((c) => [c.id, 0])));
    setActivePreset(null);
  }, []);

  const handlePreset = useCallback((preset: ScenarioPreset) => {
    setSliderValues(preset.changes);
    setActivePreset(preset.id);
  }, []);

  // ---------------------------------------------------------------------------
  // Deterministic algebraic computation
  // ---------------------------------------------------------------------------
  const simulation = useMemo(() => {
    // ΔFare% = Σ (component_weight × slider_change%)
    let totalFareChangePct = 0;
    const componentContributions = COST_COMPONENTS.map((c) => {
      const change = sliderValues[c.id] || 0;
      const contribution = c.weight * change;
      totalFareChangePct += contribution;
      return {
        name: c.shortName,
        id: c.id,
        change,
        weight: c.weight,
        contribution: Number(contribution.toFixed(2)),
        color: c.color,
      };
    });

    // New Index = Current Index × (1 + ΔFare% / 100)
    const simulatedIndex = Number(
      (currentIndex * (1 + totalFareChangePct / 100)).toFixed(2)
    );
    const indexDelta = Number((simulatedIndex - currentIndex).toFixed(2));
    const indexDeltaPct = Number(((indexDelta / currentIndex) * 100).toFixed(2));

    return {
      totalFareChangePct: Number(totalFareChangePct.toFixed(2)),
      simulatedIndex,
      indexDelta,
      indexDeltaPct,
      componentContributions,
    };
  }, [sliderValues, currentIndex]);

  const hasChanges = Object.values(sliderValues).some((v) => v !== 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-black text-white">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black font-mono text-black">
                Policy Scenario Simulator
              </h1>
              <p className="text-xs text-zinc-500 font-sans mt-0.5 max-w-xl">
                Deterministic algebraic cost-push transmission model. Adjust cost
                factors and instantly visualize the proportional mathematical
                transmission into the AeroIndex base fare index.
              </p>
            </div>
          </div>
          {hasChanges && (
            <button
              onClick={handleResetAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>
      </div>

      {/* Scenario Presets */}
      <div>
        <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider mb-3">
          Quick Scenario Presets
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              onClick={() => handlePreset(preset)}
              className={`group p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-black text-white border-black shadow-lg'
                  : 'bg-white border-zinc-200 hover:border-black hover:shadow-md'
              }`}
            >
              <div
                className={`mb-2 ${
                  activePreset === preset.id
                    ? 'text-white'
                    : 'text-zinc-500 group-hover:text-black'
                }`}
              >
                {preset.icon}
              </div>
              <div
                className={`text-[11px] font-bold font-mono leading-tight ${
                  activePreset === preset.id ? 'text-white' : 'text-black'
                }`}
              >
                {preset.name}
              </div>
              <p
                className={`text-[9px] mt-1 leading-snug ${
                  activePreset === preset.id ? 'text-zinc-300' : 'text-zinc-400'
                }`}
              >
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Sliders + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Cost Factor Sliders */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider">
              Cost Factor Adjustments
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">
              DRAG SLIDERS · −50% TO +100%
            </span>
          </div>

          {COST_COMPONENTS.map((component) => (
            <SliderRow
              key={component.id}
              component={component}
              value={sliderValues[component.id]}
              onChange={handleSliderChange}
              onReset={handleResetOne}
            />
          ))}
        </div>

        {/* Right: Results Dashboard */}
        <div className="lg:col-span-2 space-y-4">
          {/* Simulated Index Card */}
          <div
            className={`rounded-xl border p-5 transition-all duration-300 ${
              hasChanges
                ? simulation.indexDelta > 0
                  ? 'bg-rose-50 border-rose-200'
                  : simulation.indexDelta < 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white border-zinc-200'
                : 'bg-white border-zinc-200'
            }`}
          >
            <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-2">
              Simulated AeroIndex
            </div>
            <div className="flex items-end space-x-3">
              <span
                className={`text-4xl font-black font-mono tabular-nums ${
                  hasChanges
                    ? simulation.indexDelta > 0
                      ? 'text-rose-700'
                      : simulation.indexDelta < 0
                      ? 'text-emerald-700'
                      : 'text-black'
                    : 'text-black'
                }`}
              >
                {simulation.simulatedIndex.toFixed(1)}
              </span>
              {hasChanges && (
                <div className="flex items-center space-x-1 pb-1">
                  {simulation.indexDelta > 0 ? (
                    <TrendingUp className="w-4 h-4 text-rose-500" />
                  ) : simulation.indexDelta < 0 ? (
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-zinc-400" />
                  )}
                  <span
                    className={`text-sm font-bold font-mono ${
                      simulation.indexDelta > 0
                        ? 'text-rose-600'
                        : simulation.indexDelta < 0
                        ? 'text-emerald-600'
                        : 'text-zinc-400'
                    }`}
                  >
                    {simulation.indexDelta >= 0 ? '+' : ''}
                    {simulation.indexDelta.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-3">
              <div className="text-[10px] font-sans text-zinc-500">
                <span className="text-zinc-400">Current:</span>{' '}
                <span className="font-bold font-mono text-black">
                  {currentIndex.toFixed(1)}
                </span>
              </div>
              <div className="text-[10px] font-sans text-zinc-500">
                <span className="text-zinc-400">Base:</span>{' '}
                <span className="font-bold font-mono text-black">
                  {BASELINE_INDEX.toFixed(1)}
                </span>
              </div>
              {hasChanges && (
                <div className="text-[10px] font-sans text-zinc-500">
                  <span className="text-zinc-400">Δ Index:</span>{' '}
                  <span
                    className={`font-bold font-mono ${
                      simulation.indexDeltaPct > 0
                        ? 'text-rose-600'
                        : simulation.indexDeltaPct < 0
                        ? 'text-emerald-600'
                        : 'text-black'
                    }`}
                  >
                    {simulation.indexDeltaPct >= 0 ? '+' : ''}
                    {simulation.indexDeltaPct.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fare Impact Summary */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Total Fare Impact
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-zinc-400" />
              <span
                className={`text-2xl font-black font-mono tabular-nums ${
                  simulation.totalFareChangePct > 0
                    ? 'text-rose-600'
                    : simulation.totalFareChangePct < 0
                    ? 'text-emerald-600'
                    : 'text-zinc-400'
                }`}
              >
                {simulation.totalFareChangePct >= 0 ? '+' : ''}
                {simulation.totalFareChangePct.toFixed(2)}%
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans mt-1.5">
              Net proportional cost-push transmission to average base fare
            </p>
          </div>

          {/* Waterfall Chart */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5">
            <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Component Contribution Waterfall
            </div>
            {hasChanges ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={simulation.componentContributions.filter(
                      (c) => c.contribution !== 0
                    )}
                    layout="vertical"
                    margin={{ left: 5, right: 15, top: 5, bottom: 5 }}
                  >
                    <XAxis
                      type="number"
                      fontSize={9}
                      fontFamily="JetBrains Mono, monospace"
                      stroke="#A1A1AA"
                      tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      fontSize={9}
                      fontFamily="JetBrains Mono, monospace"
                      stroke="#09090B"
                      width={90}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [
                        `${val > 0 ? '+' : ''}${val}%`,
                        'Fare Impact',
                      ]}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E4E4E7',
                        borderRadius: 8,
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    />
                    <ReferenceLine x={0} stroke="#D4D4D8" />
                    <Bar dataKey="contribution" radius={[0, 4, 4, 0]} animationDuration={300}>
                      {simulation.componentContributions
                        .filter((c) => c.contribution !== 0)
                        .map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={
                              entry.contribution > 0
                                ? '#EF4444'
                                : '#10B981'
                            }
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-zinc-400">
                <div className="text-center">
                  <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  <p className="text-xs font-sans">
                    Adjust sliders or select a preset to see the waterfall chart
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Formula Card */}
          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center space-x-2 mb-2.5">
              <Calculator className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-wider">
                Transmission Formula
              </span>
            </div>
            <div className="space-y-2 text-[11px] font-mono text-zinc-700">
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                <span className="text-zinc-400">1.</span> ΔFare% = Σ (w<sub>i</sub> × Δcost<sub>i</sub>%)
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                <span className="text-zinc-400">2.</span> AeroIndex<sub>sim</sub> = AeroIndex<sub>current</sub> × (1 + ΔFare% / 100)
              </div>
            </div>
            <div className="flex items-start space-x-1.5 mt-3">
              <Info className="w-3 h-3 text-zinc-400 mt-0.5 shrink-0" />
              <p className="text-[9px] text-zinc-500 font-sans leading-relaxed">
                This is a <strong>deterministic algebraic model</strong> — no stochastic elements.
                Each cost component's weight reflects its share of the total airline operating cost structure
                (source: DGCA annual financial filings). The transmission is proportional and instantaneous.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
