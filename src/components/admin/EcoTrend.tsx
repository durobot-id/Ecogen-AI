'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  Coins,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  Flame,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Transaction, PointPreset } from '@/types';

interface EcoTrendProps {
  initialTransactions?: Transaction[];
}

export default function EcoTrend({ initialTransactions = [] }: EcoTrendProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);
  const [selectedActivity, setSelectedActivity] = useState<string>('ALL');
  const [metricMode, setMetricMode] = useState<'count' | 'points'>('count');
  const [hoveredPoint, setHoveredPoint] = useState<{
    dateStr: string;
    value: number;
    points: number;
    count: number;
    activityName: string;
    x: number;
    y: number;
  } | null>(null);

  // Presets from server
  const [presets, setPresets] = useState<PointPreset[]>([]);

  // Fetch full transactions and presets
  useEffect(() => {
    async function loadFullData() {
      setLoading(true);
      try {
        const [txRes, presetRes] = await Promise.all([
          fetch('/api/transactions?limit=0', { cache: 'no-store' }),
          fetch('/api/admin/presets', { cache: 'no-store' }),
        ]);

        const txJson = await txRes.json();
        const presetJson = await presetRes.json();

        if (txJson.success && Array.isArray(txJson.data)) {
          setTransactions(txJson.data);
        }
        if (presetJson.success && presetJson.data) {
          const combined = [
            ...(presetJson.data.topup || []),
            ...(presetJson.data.penalty || []),
          ];
          setPresets(combined);
        }
      } catch (e) {
        console.warn('Failed to fetch trend data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadFullData();
  }, []);

  // Filtered transactions within date range
  const rangeTransactions = useMemo(() => {
    const cutoff = Date.now() - timeRange * 24 * 60 * 60 * 1000;
    return transactions.filter(
      (tx) => tx.status === 'success' && tx.createdAt >= cutoff
    );
  }, [transactions, timeRange]);

  // Extract unique activity labels from presets and transactions
  const availableActivities = useMemo(() => {
    const set = new Set<string>();

    // Add configured presets
    presets.forEach((p) => {
      if (p.label) set.add(p.label.trim());
    });

    // Add activities from actual transactions
    rangeTransactions.forEach((tx) => {
      if (tx.description && tx.type !== 'purchase') {
        set.add(tx.description.trim());
      }
    });

    return Array.from(set).sort();
  }, [presets, rangeTransactions]);

  // Aggregate daily data for the selected activity (or all combined across all children)
  const dailySeries = useMemo(() => {
    const days: { [dateKey: string]: { dateStr: string; label: string; count: number; points: number } } = {};

    // Initialize all days in the range so the graph line is continuous
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: timeRange > 14 ? 'numeric' : 'short',
      });
      days[key] = { dateStr: key, label, count: 0, points: 0 };
    }

    // Populate data from transactions across all students
    rangeTransactions.forEach((tx) => {
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (days[key]) {
        // If 'ALL', count all rewards/topup/activities
        // If specific, match description
        const isMatch =
          selectedActivity === 'ALL'
            ? tx.type === 'topup' || tx.type === 'reward' || tx.type === 'adjust'
            : tx.description?.trim().toLowerCase() === selectedActivity.toLowerCase();

        if (isMatch) {
          days[key].count += 1;
          days[key].points += tx.amount || 0;
        }
      }
    });

    return Object.values(days);
  }, [rangeTransactions, timeRange, selectedActivity]);

  // Key stats for the selected view
  const summaryStats = useMemo(() => {
    const totalCount = dailySeries.reduce((sum, d) => sum + d.count, 0);
    const totalPoints = dailySeries.reduce((sum, d) => sum + d.points, 0);
    const avgPerDay = (totalCount / timeRange).toFixed(1);

    // Activity popularity rank across the range
    const activityCounts: Record<string, { count: number; points: number }> = {};
    rangeTransactions.forEach((tx) => {
      if (tx.description && (tx.type === 'topup' || tx.type === 'reward')) {
        const desc = tx.description.trim();
        if (!activityCounts[desc]) {
          activityCounts[desc] = { count: 0, points: 0 };
        }
        activityCounts[desc].count += 1;
        activityCounts[desc].points += tx.amount || 0;
      }
    });

    const ranked = Object.entries(activityCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    const topActivity = ranked[0] || null;

    return {
      totalCount,
      totalPoints,
      avgPerDay,
      topActivity,
      rankedActivities: ranked,
    };
  }, [dailySeries, timeRange, rangeTransactions]);

  // SVG Chart Dimensions & Coordinate Calculations
  const chartWidth = 700;
  const chartHeight = 220;
  const padding = { top: 20, right: 25, bottom: 35, left: 45 };

  const usableWidth = chartWidth - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = useMemo(() => {
    const vals = dailySeries.map((d) =>
      metricMode === 'count' ? d.count : d.points
    );
    const highest = Math.max(...vals, 1);
    // Add 15% headroom for clean look
    return Math.ceil(highest * 1.15) || 5;
  }, [dailySeries, metricMode]);

  // Points mapping to SVG coordinates
  const points = useMemo(() => {
    const count = dailySeries.length;
    if (count <= 1) return [];

    return dailySeries.map((d, idx) => {
      const x = padding.left + (idx / (count - 1)) * usableWidth;
      const val = metricMode === 'count' ? d.count : d.points;
      const y = padding.top + usableHeight - (val / maxVal) * usableHeight;
      return { x, y, data: d, value: val };
    });
  }, [dailySeries, metricMode, maxVal, usableWidth, usableHeight, padding]);

  // SVG Path strings (Smooth Line & Gradient Area)
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((path, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      // Draw smooth line
      return `${path} L ${pt.x} ${pt.y}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const groundY = padding.top + usableHeight;
    return `${linePath} L ${last.x} ${groundY} L ${first.x} ${groundY} Z`;
  }, [linePath, points, padding, usableHeight]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#35C96F]" />
            <span>Eco-Trend</span>
          </h2>
          <p className="text-xs text-[#74857B] mt-0.5">
            Grafik tren aktivitas ramah lingkungan seluruh siswa sesuai konfigurasi preset
          </p>
        </div>

        {/* Time Range Pills */}
        <div className="inline-flex p-1 bg-[#F7FBF7] rounded-xl border border-[#E5EEE7] text-xs font-semibold self-start sm:self-auto">
          {[
            { days: 7, label: '7 Hari' },
            { days: 14, label: '14 Hari' },
            { days: 30, label: '30 Hari' },
          ].map((t) => (
            <button
              key={t.days}
              type="button"
              onClick={() => setTimeRange(t.days as any)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === t.days
                  ? 'bg-white text-[#159447] font-bold shadow-xs'
                  : 'text-[#74857B] hover:text-[#18352A]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Aksi */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs">
          <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
            Total Aksi Dilakukan
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#18352A] mt-1">
            {summaryStats.totalCount}{' '}
            <span className="text-xs font-normal text-[#74857B]">kali</span>
          </p>
          <p className="text-[11px] text-[#20A65A] font-semibold mt-2 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Seluruh anak ({timeRange} hari)</span>
          </p>
        </div>

        {/* Total Poin Terkumpul */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs">
          <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
            Poin Aksi Terkumpul
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#159447] mt-1">
            Rp{summaryStats.totalPoints.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-[#74857B] mt-2">
            Apresiasi kebiasaan hijau
          </p>
        </div>

        {/* Rata-Rata Harian */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs">
          <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
            Rerata Aksi Harian
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#18352A] mt-1">
            {summaryStats.avgPerDay}{' '}
            <span className="text-xs font-normal text-[#74857B]">aksi / hari</span>
          </p>
          <p className="text-[11px] text-[#74857B] mt-2">
            Konsistensi kegiatan siswa
          </p>
        </div>

        {/* Kegiatan Terpopuler */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs">
          <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Kegiatan Terbanyak</span>
          </p>
          <p className="text-sm font-bold text-[#18352A] mt-1 line-clamp-1 capitalize">
            {summaryStats.topActivity?.name || 'Belum ada data'}
          </p>
          <p className="text-xs text-[#159447] font-extrabold mt-1">
            {summaryStats.topActivity
              ? `${summaryStats.topActivity.count}x aksi tercatat`
              : '-'}
          </p>
        </div>
      </div>

      {/* Main Trend Chart Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5EEE7]">
          {/* Activity Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#74857B]" />
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="text-xs font-bold text-[#18352A] bg-[#F7FBF7] border border-[#E5EEE7] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#35C96F]"
            >
              <option value="ALL">
                Semua Kegiatan (Gabungan Seluruh Anak)
              </option>
              {availableActivities.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Metric Toggle: Frekuensi vs Nominal Poin */}
          <div className="inline-flex p-1 bg-[#F7FBF7] rounded-xl border border-[#E5EEE7] text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMetricMode('count')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metricMode === 'count'
                  ? 'bg-white text-[#159447] font-bold shadow-xs'
                  : 'text-[#74857B]'
              }`}
            >
              Jumlah Aksi (Frekuensi)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('points')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metricMode === 'points'
                  ? 'bg-white text-[#159447] font-bold shadow-xs'
                  : 'text-[#74857B]'
              }`}
            >
              Total EcoPoint (Rp)
            </button>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible font-sans"
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#35C96F" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#35C96F" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + usableHeight * (1 - ratio);
              const labelVal = Math.round(maxVal * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#E5EEE7"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#74857B"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {metricMode === 'count'
                      ? labelVal
                      : labelVal >= 1000
                      ? `${(labelVal / 1000).toFixed(0)}k`
                      : labelVal}
                  </text>
                </g>
              );
            })}

            {/* Gradient Area under line */}
            {areaPath && <path d={areaPath} fill="url(#trendGradient)" />}

            {/* Main Trend Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#35C96F"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Dots & X-axis Labels */}
            {points.map((pt, idx) => {
              const showLabel =
                timeRange <= 14
                  ? true
                  : idx % 3 === 0 || idx === points.length - 1;

              return (
                <g key={idx}>
                  {/* Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.dateStr === pt.data.dateStr ? '6' : '4'}
                    fill={hoveredPoint?.dateStr === pt.data.dateStr ? '#159447' : '#FFFFFF'}
                    stroke="#35C96F"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        dateStr: pt.data.dateStr,
                        value: pt.value,
                        points: pt.data.points,
                        count: pt.data.count,
                        activityName:
                          selectedActivity === 'ALL'
                            ? 'Semua Kegiatan'
                            : selectedActivity,
                        x: pt.x,
                        y: pt.y,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Date Label on X Axis */}
                  {showLabel && (
                    <text
                      x={pt.x}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      fill="#74857B"
                      fontSize="10"
                      fontWeight="500"
                    >
                      {pt.data.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-[#18352A] text-white p-2.5 rounded-xl shadow-xl text-xs z-20 space-y-1 transform -translate-x-1/2 -translate-y-full transition-all"
              style={{
                left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                top: `${(hoveredPoint.y / chartHeight) * 100 - 8}%`,
              }}
            >
              <p className="font-bold text-[11px] text-emerald-300">
                {new Date(hoveredPoint.dateStr).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
              <p className="text-[11px] text-gray-200">
                {hoveredPoint.activityName}
              </p>
              <div className="pt-1 border-t border-emerald-900/60 flex items-center justify-between gap-3 text-xs">
                <span>
                  <strong>{hoveredPoint.count}</strong> aksi
                </span>
                <span className="text-[#35C96F] font-extrabold">
                  Rp{hoveredPoint.points.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Legend / Status Note */}
        <div className="flex items-center justify-between pt-2 text-xs text-[#74857B] border-t border-[#E5EEE7]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#35C96F]" />
            <span className="font-semibold text-[#18352A]">
              {selectedActivity === 'ALL'
                ? 'Seluruh Aktivitas Gabungan'
                : selectedActivity}
            </span>
          </div>
          <span>Arahkan kursor pada titik untuk detail harian</span>
        </div>
      </div>

      {/* Activity Breakdown Ranking (Horizontal Bar Comparison) */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#35C96F]" />
            <h3 className="font-bold text-base text-[#18352A]">
              Distribusi Pelaksanaan Kegiatan Siswa
            </h3>
          </div>
          <span className="text-xs text-[#74857B]">
            Data {timeRange} Hari Terakhir
          </span>
        </div>

        <div className="space-y-3">
          {summaryStats.rankedActivities.length === 0 ? (
            <p className="text-xs text-[#74857B] py-6 text-center">
              Belum ada aktivitas tercatat pada rentang waktu ini.
            </p>
          ) : (
            summaryStats.rankedActivities.map((act, idx) => {
              const maxCount = summaryStats.rankedActivities[0]?.count || 1;
              const barWidthPct = Math.max(8, (act.count / maxCount) * 100);
              const shareOfTotal =
                summaryStats.totalCount > 0
                  ? ((act.count / summaryStats.totalCount) * 100).toFixed(1)
                  : '0';

              return (
                <div
                  key={act.name}
                  onClick={() => setSelectedActivity(act.name)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedActivity === act.name
                      ? 'bg-[#E8F9EE] border-[#35C96F] ring-1 ring-[#35C96F]'
                      : 'bg-[#F7FBF7] border-[#E5EEE7] hover:border-[#35C96F] hover:bg-white'
                  }`}
                  title="Klik untuk melihat grafik tren kegiatan ini"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded-full bg-white border border-[#E5EEE7] text-[10px] font-bold text-[#18352A] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#18352A] truncate">
                        {act.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-[#159447] text-sm">
                        {act.count} kali
                      </span>
                      <span className="text-[11px] text-[#74857B] ml-1.5">
                        (Rp{act.points.toLocaleString('id-ID')})
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-[#E5EEE7] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#35C96F] h-full rounded-full transition-all duration-500"
                      style={{ width: `${barWidthPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#74857B] block mt-1">
                    Kontribusi {shareOfTotal}% dari total aksi ramah lingkungan
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}