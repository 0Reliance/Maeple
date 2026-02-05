import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  CloudFog,
  FileText,
  Layers,
  Printer,
  Shield,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  calculateBurnoutTrajectory,
  calculateCognitiveLoad,
  calculateCyclePhase,
  generateDailyStrategy,
  generateInsights,
} from "../services/analytics";
import { getUserSettings } from "../services/storageService";
import { HealthEntry, UserSettings, WearableDataPoint } from "../types";
import { useEffect } from "react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/Card";

interface HealthMetricsDashboardProps {
  entries: HealthEntry[];
  wearableData?: WearableDataPoint[];
}

interface ChartDataPoint {
  rawDate: string;
  date: string;
  energy: number | null;
  mood: number | null;
  sensory: number | null;
  hrv: number | null;
  sleep: number | null;
}

/**
 * HealthMetricsDashboard
 *
 * Visualization component focused on Pattern Literacy:
 * Energy Capacity vs Sensory Intensity vs Biological Rhythms.
 * Designed with progressive disclosure to reduce cognitive load.
 */
const HealthMetricsDashboard: React.FC<HealthMetricsDashboardProps> = ({
  entries,
  wearableData = [],
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({ avgCycleLength: 28 });
  const [activeTab, setActiveTab] = useState<'daily' | 'clinical'>('daily');

  // Load user settings asynchronously
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getUserSettings();
      setUserSettings(settings);
    };
    loadSettings();
  }, []);

  // Generate Insights
  const insights = useMemo(() => generateInsights(entries, wearableData), [entries, wearableData]);

  // Generate Current Strategy & Cognitive Load
  const { strategies, cognitiveLoad } = useMemo(() => {
    if (entries.length === 0) return { strategies: [], cognitiveLoad: null };
    const sorted = [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latest = sorted[0];
    return {
      strategies: generateDailyStrategy(latest) || [],
      cognitiveLoad: calculateCognitiveLoad(latest),
    };
  }, [entries]);

  // Generate Depletion Forecast
  const forecast = useMemo(() => calculateBurnoutTrajectory(entries), [entries]);

  // Generate Cycle Context
  const cycleContext = useMemo(() => calculateCyclePhase(userSettings), [userSettings]);

  // Sleep Stats
  const sleepStats = useMemo(() => {
    if (!wearableData.length) return null;
    const recent = [...wearableData]
      .filter(w => w.metrics.sleep)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);

    if (!recent.length) return null;

    const avgTotal =
      recent.reduce((acc, curr) => acc + (curr.metrics.sleep?.totalDurationSeconds || 0), 0) /
      recent.length;
    const avgDeep =
      recent.reduce((acc, curr) => acc + (curr.metrics.sleep?.deepSleepSeconds || 0), 0) /
      recent.length;
    const avgRem =
      recent.reduce((acc, curr) => acc + (curr.metrics.sleep?.remSleepSeconds || 0), 0) /
      recent.length;

    return {
      totalHours: (avgTotal / 3600).toFixed(1),
      deepPercent: avgTotal > 0 ? Math.round((avgDeep / avgTotal) * 100) : 0,
      remPercent: avgTotal > 0 ? Math.round((avgRem / avgTotal) * 100) : 0,
      efficiency: Math.round(
        recent.reduce((acc, curr) => acc + (curr.metrics.sleep?.efficiencyScore || 0), 0) /
          recent.length
      ),
    };
  }, [wearableData]);

  // Empty State - Distinctive "Pattern Garden" Design
  if (!entries || entries.length === 0) {
    return (
      <div className="relative bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-card rounded-3xl p-16 overflow-hidden">
        {/* Abstract Garden Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
            {/* Organic shapes suggesting growth/patterns */}
            <circle cx="100" cy="100" r="60" fill="none" stroke="#2D7A6E" strokeWidth="1" />
            <circle cx="300" cy="250" r="40" fill="none" stroke="#2D7A6E" strokeWidth="1" />
            <circle cx="180" cy="320" r="50" fill="none" stroke="#2D7A6E" strokeWidth="1" />
            <path
              d="M50 200 Q150 100 250 200 T350 150"
              stroke="#2D7A6E"
              strokeWidth="1"
              fill="none"
            />
            <path d="M80 300 Q200 280 300 320" stroke="#2D7A6E" strokeWidth="1" fill="none" />

            {/* Subtle leaf shapes */}
            <path d="M150 180 Q160 160 170 180 Q160 200 150 180" fill="#2D7A6E" opacity="0.3" />
            <path d="M280 200 Q300 180 320 200 Q300 220 280 200" fill="#2D7A6E" opacity="0.3" />
            <path d="M200 250 Q220 230 240 250 Q220 270 200 250" fill="#2D7A6E" opacity="0.3" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-md mx-auto">
          {/* Custom Garden Illustration */}
          <div className="mb-8 animate-float">
            <svg className="w-28 h-28 mx-auto text-accent-positive" viewBox="0 0 100 100">
              {/* Stylized plant/pattern illustration */}
              <defs>
                <linearGradient id="stemGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2D7A6E" />
                  <stop offset="100%" stopColor="#1A4D5E" />
                </linearGradient>
                <linearGradient id="leafGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B8B7E" />
                  <stop offset="100%" stopColor="#2D7A6E" />
                </linearGradient>
              </defs>

              {/* Main stem */}
              <path
                d="M50 90 Q50 70 50 50"
                stroke="url(#stemGradient)"
                strokeWidth="3"
                fill="none"
              />

              {/* Left leaves */}
              <path d="M50 75 Q35 65 30 70 Q35 75 50 75" fill="url(#leafGradient)" opacity="0.8" />
              <path d="M50 60 Q30 50 25 55 Q30 62 50 60" fill="url(#leafGradient)" opacity="0.7" />

              {/* Right leaves */}
              <path d="M50 65 Q65 55 70 60 Q65 67 50 65" fill="url(#leafGradient)" opacity="0.8" />
              <path d="M50 50 Q70 40 75 45 Q70 52 50 50" fill="url(#leafGradient)" opacity="0.7" />

              {/* Top sprout */}
              <circle cx="50" cy="45" r="5" fill="#4A9CAC" opacity="0.6" />
              <circle cx="48" cy="42" r="3" fill="#4A9CAC" opacity="0.4" />
              <circle cx="53" cy="43" r="3" fill="#4A9CAC" opacity="0.4" />
            </svg>
          </div>

          <h3 className="text-h1 font-display font-bold text-text-primary mb-4 animate-stagger">
            Your pattern garden is waiting
          </h3>

          <p className="text-large text-text-secondary mb-8 leading-relaxed animate-stagger stagger-delay-1">
            Every pattern you notice is a seed. Over time, you'll grow to understand what truly
            nourishes you.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="min-w-[220px] animate-stagger stagger-delay-2"
          >
            Plant Your First Seed
          </Button>

          <p className="mt-8 text-small text-text-tertiary animate-stagger stagger-delay-3">
            One entry, one pattern, one step toward clarity.
          </p>
        </div>
      </div>
    );
  }

  // Chart Data Preparation
  const today = new Date();
  const dateMap = new Map<string, ChartDataPoint>();

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const displayDate = d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
    });
    dateMap.set(dateStr, {
      rawDate: dateStr,
      date: displayDate,
      energy: null,
      mood: null,
      sensory: null,
      hrv: null,
      sleep: null,
    });
  }

  entries.forEach(e => {
    const dateStr = new Date(e.timestamp).toISOString().split("T")[0];
    const curr = dateMap.get(dateStr);
    if (curr) {
      curr.energy = e.neuroMetrics?.spoonLevel || 5;
      curr.mood = typeof e.mood === "number" ? e.mood : null;
      curr.sensory = e.neuroMetrics?.sensoryLoad || 0;
    }
  });

  wearableData.forEach(w => {
    const curr = dateMap.get(w.date);
    if (curr) {
      curr.hrv = w.metrics.biometrics?.hrvMs ?? null;
      if (w.metrics.sleep?.totalDurationSeconds) {
        curr.sleep = parseFloat((w.metrics.sleep.totalDurationSeconds / 3600).toFixed(1));
      }
    }
  });

  const chartData = Array.from(dateMap.values());

  // Clinical Report Data
  const avgProfile = useMemo(() => {
    if (entries.length === 0) return null;
    const sums: Record<string, number> = { focus: 0, social: 0, structure: 0, emotional: 0, physical: 0, sensory: 0, executive: 0 };
    entries.forEach(e => {
        Object.keys(sums).forEach(k => {
            sums[k] += (e.neuroMetrics.capacity as Record<string, number>)[k] || 0;
        });
    });
    const result = Object.keys(sums).map(k => ({
        subject: k.charAt(0).toUpperCase() + k.slice(1),
        A: (sums[k] / entries.length).toFixed(1),
        fullMark: 10
    }));
    return result;
  }, [entries]);

  const burnoutStats = useMemo(() => calculateBurnoutTrajectory(entries), [entries]);
  const avgSensory = entries.length ? (entries.reduce((a,b) => a + b.neuroMetrics.sensoryLoad, 0) / entries.length).toFixed(1) : '0.0';

  const clinicalChartData = useMemo(() => {
     return [...entries]
        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-30)
        .map(e => ({
            date: new Date(e.timestamp).toLocaleDateString(undefined, {month:'numeric', day:'numeric'}),
            spoons: e.neuroMetrics.spoonLevel,
            mood: e.mood * 2
        }));
  }, [entries]);

  const handlePrint = () => {
    window.print();
  };

  // Stats
  const validEnergy = chartData.filter(
    (d): d is ChartDataPoint & { energy: number } => d.energy !== null
  );
  const avgEnergy = validEnergy.length
    ? (validEnergy.reduce((acc, curr) => acc + curr.energy, 0) / validEnergy.length).toFixed(1)
    : "-";

  const validMood = chartData.filter(
    (d): d is ChartDataPoint & { mood: number } => d.mood !== null
  );
  const avgMood = validMood.length
    ? (validMood.reduce((acc, curr) => acc + curr.mood, 0) / validMood.length).toFixed(1)
    : "-";

  // Top Strength
  const strengthMap: Record<string, number> = {};
  entries.forEach(e =>
    e.strengths?.forEach(s => {
      strengthMap[s] = (strengthMap[s] || 0) + 1;
    })
  );
  const topStrength = Object.entries(strengthMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet";

  // Trend calculation
  const trend = useMemo(() => {
    if (validEnergy.length < 2) return null;
    const recent = validEnergy.slice(-3);
    const earlier = validEnergy.slice(-6, -3);
    if (recent.length < 2 || earlier.length < 2) return null;
    const recentAvg = recent.reduce((a, b) => a + b.energy, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b.energy, 0) / earlier.length;
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    return {
      percent: change.toFixed(0),
      direction: change > 5 ? "up" : change < -5 ? "down" : "stable",
    };
  }, [validEnergy]);

  return (
    <div className="space-y-xl">
      {/* Dashboard Header with Tabs */}
      <div className="animate-stagger">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-h1 font-display font-bold text-text-primary">Patterns</h2>
            <p className="text-base text-text-secondary">
              Tracking {entries.length} patterns • Last updated 2 hours ago
            </p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-bg-secondary pb-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-2.5 text-sm font-medium transition-all relative ${
              activeTab === 'daily'
                ? 'text-primary dark:text-primary-light'
                : 'text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary'
            }`}
          >
            Daily Patterns
            {activeTab === 'daily' && (
              <span className="absolute bottom-[-9px] left-0 right-0 h-1 bg-primary dark:bg-primary-light rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('clinical')}
            className={`px-6 py-2.5 text-sm font-medium transition-all relative flex items-center gap-2 ${
              activeTab === 'clinical'
                ? 'text-primary dark:text-primary-light'
                : 'text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary'
            }`}
          >
            <FileText size={16} />
            Clinical Report
            {activeTab === 'clinical' && (
              <span className="absolute bottom-[-9px] left-0 right-0 h-1 bg-primary dark:bg-primary-light rounded-t-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* Top Insights Card - Added Staggered Animation and Staggered Items */}
      {strategies && strategies.length > 0 && (
        <Card className="bg-gradient-to-r from-primary to-primary-light text-white border-none animate-stagger stagger-delay-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-h2 font-display font-semibold">Today's Insight</h3>
              <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-none">
                Personalized for you
              </Badge>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-lg">
            {strategies.slice(0, 3).map((strat, i) => (
              <div
                key={strat.id}
                className="bg-white/10 border border-white/20 p-lg rounded-xl backdrop-blur-sm animate-stagger"
                style={{ animationDelay: `${0.3 + i * 0.1}s` }}
              >
                <p className="text-small font-semibold text-white mb-2">{strat.title}</p>
                <p className="text-base text-white/90 leading-relaxed">{strat.action}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Stats - Added Staggered Animations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <Card className="animate-stagger stagger-delay-1">
          <CardHeader>
            <CardTitle>Today's Energy</CardTitle>
          </CardHeader>
          <div className="flex items-end justify-between">
            <div>
              <h4 className="text-[42px] font-display font-bold text-text-primary leading-none">
                {avgEnergy}
              </h4>
              <p className="text-small text-text-secondary">out of 10</p>
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-small font-semibold">
                {trend.direction === "up" && (
                  <TrendingUp size={16} className="text-accent-positive" />
                )}
                <span
                  className={
                    trend.direction === "up"
                      ? "text-accent-positive"
                      : trend.direction === "down"
                        ? "text-accent-alert"
                        : "text-text-secondary"
                  }
                >
                  {trend.direction === "stable" ? "Stable" : `${trend.percent}%`}
                </span>
              </div>
            )}
            <div className="w-14 h-14 bg-accent-positive/10 rounded-xl flex items-center justify-center">
              <Zap className="text-accent-positive" size={28} fill="currentColor" />
            </div>
          </div>
        </Card>

        <Card className="animate-stagger stagger-delay-2">
          <CardHeader>
            <CardTitle>Average Mood</CardTitle>
            <CardDescription>Based on your recent entries</CardDescription>
          </CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[42px] font-display font-bold text-text-primary leading-none">
                {avgMood}
              </h4>
              <p className="text-small text-text-secondary">out of 5</p>
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
              <Brain className="text-primary" size={28} />
            </div>
          </div>
        </Card>

        <Card className="animate-stagger stagger-delay-3">
          <CardHeader>
            <CardTitle>Your Top Strength</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-h3 font-display font-semibold text-text-primary line-clamp-2">
                {topStrength}
              </h4>
              <p className="text-small text-text-secondary mt-1">Most recognized pattern</p>
            </div>
            <div className="w-14 h-14 bg-accent-attention/10 rounded-xl flex items-center justify-center">
              <Star className="text-accent-attention" size={28} fill="currentColor" />
            </div>
          </div>
        </Card>
      </div>

      {/* Expanded Details Section */}
      {showDetails && (
        <div className="space-y-lg animate-fadeIn">
          {/* Depletion Forecast */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      entries.length < 3
                        ? "bg-bg-secondary text-text-tertiary"
                        : forecast.riskLevel === "CRITICAL"
                          ? "bg-accent-alert text-white"
                          : forecast.riskLevel === "MODERATE"
                            ? "bg-accent-attention text-white"
                            : "bg-accent-positive text-white"
                    }`}
                  >
                    <Shield size={24} />
                  </div>
                  <div>
                    <CardTitle>Energy Depletion Forecast</CardTitle>
                    <CardDescription>
                      {entries.length < 3
                        ? "Need at least 3 days of entries"
                        : forecast.description}
                    </CardDescription>
                  </div>
                </div>
                {forecast.daysUntilCrash !== null && (
                  <div className="text-right">
                    <p className="text-small font-semibold uppercase text-text-secondary mb-1">
                      Days Until High Stress
                    </p>
                    <p className="text-3xl font-display font-bold text-accent-alert">
                      {forecast.daysUntilCrash}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            {forecast.recoveryDaysNeeded > 0 && (
              <div className="flex items-center gap-2 text-small text-text-secondary bg-bg-secondary p-3 rounded-lg">
                <Activity size={16} className="text-accent-attention" />
                <span>
                  Estimated recovery: <strong>{forecast.recoveryDaysNeeded} days</strong>
                </span>
              </div>
            )}
            {forecast.riskLevel === "CRITICAL" && (
              <div className="mt-4 pt-4 border-t border-bg-secondary">
                <div className="flex items-start gap-2 text-small text-accent-alert">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Your energy levels have been low for a while. Consider taking a rest day or
                    reaching out to someone you trust.
                  </p>
                </div>
                {userSettings.safetyContact && (
                  <Button variant="secondary" size="sm" className="mt-3">
                    Contact Support
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Cognitive Load */}
          {cognitiveLoad && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        cognitiveLoad.state === "FRAGMENTED"
                          ? "bg-accent-alert text-white"
                          : cognitiveLoad.state === "MODERATE"
                            ? "bg-accent-attention text-white"
                            : "bg-accent-positive text-white"
                      }`}
                    >
                      <Layers size={24} />
                    </div>
                    <div>
                      <CardTitle>Mental Clarity</CardTitle>
                      <CardDescription>Based on your activity changes</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={
                      cognitiveLoad.state === "FRAGMENTED"
                        ? "alert"
                        : cognitiveLoad.state === "MODERATE"
                          ? "attention"
                          : "positive"
                    }
                    size="md"
                  >
                    {cognitiveLoad.state}
                  </Badge>
                </div>
              </CardHeader>
              <div className="space-y-3">
                <div className="w-full bg-bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      cognitiveLoad.efficiencyLoss > 30 ? "bg-accent-alert" : "bg-accent-positive"
                    }`}
                    style={{ width: `${Math.min(cognitiveLoad.efficiencyLoss, 100)}%` }}
                  />
                </div>
                <p className="text-small text-text-secondary">
                  <strong>{cognitiveLoad.switches}</strong> activity changes today (
                  {cognitiveLoad.efficiencyLoss}% efficiency impact)
                </p>
              </div>
            </Card>
          )}

          {/* Cycle Context */}
          {cycleContext && (
            <Card className="bg-gradient-to-br from-accent-alert/5 to-accent-attention/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {cycleContext.phase === "LUTEAL" || cycleContext.phase === "MENSTRUAL" ? (
                      <CloudFog size={24} className="text-accent-alert" />
                    ) : (
                      <Sun size={24} className="text-accent-attention" />
                    )}
                  </div>
                  <div>
                    <CardTitle>Cycle Context</CardTitle>
                    <CardDescription>
                      Day {cycleContext.day}/{cycleContext.length}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <div className="grid md:grid-cols-2 gap-lg">
                <div className="bg-white/60 p-lg rounded-xl border border-white/40">
                  <p className="text-small font-semibold uppercase text-text-secondary mb-2">
                    Expected Energy
                  </p>
                  <p className="text-h3 font-display font-semibold text-text-primary">
                    {cycleContext.energyPrediction}
                  </p>
                </div>
                <div className="bg-white/60 p-lg rounded-xl border border-white/40">
                  <p className="text-small font-semibold uppercase text-text-secondary mb-2">
                    Suggestion
                  </p>
                  <p className="text-base text-text-primary leading-relaxed">
                    {cycleContext.advice}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Sleep Architecture */}
          {sleepStats && (
            <Card className="bg-dark-bg-primary text-white border-dark-bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-dark-bg-card rounded-xl flex items-center justify-center">
                      <Activity size={24} className="text-accent-positive" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Sleep Quality</CardTitle>
                      <CardDescription className="text-dark-text-secondary">
                        7-day average
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-display font-bold text-white">
                      {sleepStats.totalHours}
                      <span className="text-base text-dark-text-secondary">h</span>
                    </p>
                  </div>
                </div>
              </CardHeader>
              <div className="grid grid-cols-3 gap-lg">
                <div className="bg-dark-bg-secondary/50 p-lg rounded-xl border border-dark-bg-secondary">
                  <p className="text-small font-semibold uppercase text-dark-text-secondary mb-2">
                    Deep Sleep
                  </p>
                  <p className="text-h3 font-display font-bold">{sleepStats.deepPercent}%</p>
                  <div className="w-full bg-dark-bg-primary h-2 rounded-full mt-3">
                    <div
                      className="bg-accent-positive h-2 rounded-full"
                      style={{ width: `${sleepStats.deepPercent}%` }}
                    />
                  </div>
                </div>
                <div className="bg-dark-bg-secondary/50 p-lg rounded-xl border border-dark-bg-secondary">
                  <p className="text-small font-semibold uppercase text-dark-text-secondary mb-2">
                    REM Sleep
                  </p>
                  <p className="text-h3 font-display font-bold">{sleepStats.remPercent}%</p>
                  <div className="w-full bg-dark-bg-primary h-2 rounded-full mt-3">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${sleepStats.remPercent}%` }}
                    />
                  </div>
                </div>
                <div className="bg-dark-bg-secondary/50 p-lg rounded-xl border border-dark-bg-secondary">
                  <p className="text-small font-semibold uppercase text-dark-text-secondary mb-2">
                    Sleep Quality
                  </p>
                  <p className="text-h3 font-display font-bold">{sleepStats.efficiency}%</p>
                  <div className="w-full bg-dark-bg-primary h-2 rounded-full mt-3">
                    <div
                      className={`h-2 rounded-full ${sleepStats.efficiency > 85 ? "bg-accent-positive" : "bg-accent-attention"}`}
                      style={{ width: `${sleepStats.efficiency}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Pattern Insights */}
          {insights.length > 0 && (
            <Card className="bg-primary text-white border-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Sparkles size={24} className="text-accent-action" />
                  <CardTitle className="text-white">Pattern Discoveries</CardTitle>
                </div>
              </CardHeader>
              <div className="grid md:grid-cols-2 gap-lg">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className="bg-primary-light/50 border border-primary-light/30 p-lg rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {insight.type === "WARNING" ? (
                        <AlertCircle size={16} className="text-accent-attention" />
                      ) : insight.type === "BIO-LINK" ? (
                        <Activity size={16} className="text-accent-alert" />
                      ) : (
                        <Star size={16} className="text-accent-positive" />
                      )}
                      <span className="text-small font-semibold text-white">{insight.title}</span>
                    </div>
                    <p className="text-base text-primary-light/90 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Energy Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>14-Day Energy Pattern</CardTitle>
              <CardDescription>Comparing your energy with sensory intensity</CardDescription>
            </CardHeader>
            <div className="h-80">
              {entries.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary/50 rounded-xl">
                  <Activity className="text-text-tertiary mb-3" size={32} />
                  <p className="text-base text-text-secondary">Waiting for data</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B8B7E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3B8B7E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#EDEAE6"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#B2BEC3", fontSize: 13 }}
                      dy={10}
                    />
                    <YAxis yAxisId="left" domain={[0, 10]} hide />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]} hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                      }}
                    />
                    <Legend iconType="circle" />
                    {/* Energy Area */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="energy"
                      name="Energy Capacity"
                      stroke="#3B8B7E"
                      fill="url(#energyGradient)"
                      strokeWidth={3}
                    />
                    {/* Sensory Line */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sensory"
                      name="Sensory Intensity"
                      stroke="#E8A538"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#E8A538", strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-small text-text-secondary bg-bg-secondary p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-positive rounded-full"></div>
                <span>Green area = Your energy capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-attention rounded-full"></div>
                <span>Amber line = Sensory intensity</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Clinical Report Tab */}
      {activeTab === 'clinical' && (
        <div className="animate-fadeIn space-y-8 pb-12">
          {/* Header / Actions */}
          <div className="flex justify-between items-start bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm print:hidden gap-6">
            <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">MAEPLE Clinical Report</h1>
                <p className="text-slate-500 dark:text-slate-400">Longitudinal analysis for support context.</p>
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <h3 className="font-bold text-indigo-800 dark:text-indigo-200 text-sm mb-2">What This Report Shows</h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        Based on your journal entries, this report visualizes your capacity patterns, burnout trajectory, and correlational insights. The data is grounded in established metrics for neurodivergent wellness tracking.
                    </p>
                </div>
            </div>
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
            >
                <Printer size={18} />
                Print to PDF
            </button>
          </div>

          {/* The Report (Printable Area) */}
          <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl print:shadow-none print:border-none print:p-0">
            
            {/* Report Header */}
            <header className="border-b border-slate-100 dark:border-slate-700 pb-8 mb-8 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-xl">MAEPLE</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Capacity Pattern Analysis</h2>
                    <div className="mt-4 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                        <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
                        <p><strong>Entries Analyzed:</strong> {entries.length}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider">
                        CONFIDENTIAL
                    </span>
                </div>
            </header>

            {entries.length < 5 ? (
                <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Insufficient Data</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Please log at least 5 entries to generate a meaningful Capacity & Wellness Report.
                    </p>
                </div>
            ) : (
                <>
                    {/* Executive Summary */}
                    <section className="mb-12">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-l-4 border-indigo-500 pl-3">Executive Summary</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                    <Activity size={18} className="text-rose-500" /> Burnout Risk
                                </h4>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className={`text-2xl font-bold ${
                                        burnoutStats.riskLevel === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400' : 
                                        burnoutStats.riskLevel === 'MODERATE' ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>{burnoutStats.riskLevel}</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{burnoutStats.description}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                                    <Brain size={18} className="text-indigo-500 dark:text-indigo-400" /> Neuro-Cognitive Load
                                </h4>
                                <div className="space-y-2 mt-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Avg Sensory Load</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{avgSensory}/10</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                                        <div className="bg-orange-400 h-1.5 rounded-full" style={{width: `${parseFloat(avgSensory)*10}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Capacity Profile */}
                    <section className="mb-12">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-l-4 border-teal-500 pl-3">Baseline Capacity Profile</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={avgProfile || []}>
                                    <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-600" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Average Capacity"
                                        dataKey="A"
                                        stroke="#0d9488"
                                        strokeWidth={2}
                                        fill="#0d9488"
                                        fillOpacity={0.3}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* Longitudinal Trends */}
                    <section className="mb-12 break-inside-avoid">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-l-4 border-blue-500 pl-3">30-Day Stability Trend</h3>
                        <div className="h-64 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={clinicalChartData}>
                                    <defs>
                                        <linearGradient id="colorSpoons" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                                    <YAxis domain={[0, 10]} hide />
                                    <Tooltip 
                                        contentStyle={{
                                            borderRadius:'8px',
                                            backgroundColor: 'var(--tooltip-bg, #fff)',
                                            color: 'var(--tooltip-text, #1e293b)',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }} 
                                        wrapperClassName="dark:!bg-slate-800 dark:!text-slate-100"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="spoons" 
                                        name="Capacity (Spoons)" 
                                        stroke="#10b981" 
                                        strokeWidth={2} 
                                        fill="url(#colorSpoons)" 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="mood" 
                                        name="Mood (Scaled)" 
                                        stroke="#6366f1" 
                                        strokeWidth={2} 
                                        fillOpacity={0} 
                                        strokeDasharray="4 4"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">Green = Capacity (Spoons) • Dotted Purple = Mood</p>
                    </section>

                    {/* Detected Patterns */}
                    <section className="break-inside-avoid">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 border-l-4 border-purple-500 pl-3">Correlational Analysis</h3>
                        <div className="space-y-4">
                            {insights.length > 0 ? insights.map((insight, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="mt-1">
                                        {insight.type === 'WARNING' && <AlertTriangle className="text-orange-500" size={20} />}
                                        {insight.type === 'BIO-LINK' && <Activity className="text-rose-500" size={20} />}
                                        {insight.type === 'CORRELATION' && <Zap className="text-indigo-500" size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{insight.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{insight.description}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-slate-500 dark:text-slate-400 italic">Not enough data to detect patterns yet.</p>
                            )}
                        </div>
                    </section>
                </>
            )}

            <footer className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    Generated by MAEPLE (Powered by Poziverse). 
                    This report uses the <strong>MAEPLE Capacity Metrics</strong> framework (Bandwidth, Load, Interference) to track neurodivergent patterns.
                    It is not a diagnostic tool.
                </p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthMetricsDashboard;
