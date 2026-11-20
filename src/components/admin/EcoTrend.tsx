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
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Transaction, PointPreset } from '@/types';

interface EcoTrendProps {
  initialTransactions?: Transaction[];
}

interface ActivityDataSeries {
  id: string;
  name: string;
  category: string;
  standardAmount: number;
  totalCount: number;
  totalPoints: number;
  avgPerDay: string;
  dailyPoints: {
    dateKey: string;
    label: string;
    count: number;
    points: number;
  }[];
}

const DEFAULT_PRESETS: PointPreset[] = [
  { id: 'tu_1', label: 'Menjaga kebersihan kelas', amount: 5000, type: 'topup', category: 'Kebersihan' },
  { id: 'tu_2', label: 'Membuang sampah terpilah (Organik/Anorganik)', amount: 3000, type: 'topup', category: 'Daur Ulang' },
  { id: 'tu_3', label: 'Membawa botol tumbler & kotak makan sendiri', amount: 2000, type: 'topup', category: 'Zero Waste' },
  { id: 'tu_4', label: 'Menjalankan tugas piket harian tepat waktu', amount: 5000, type: 'topup', category: 'Kedisiplinan' },
  { id: 'tu_5', label: 'Menyiram & merawat tanaman taman sekolah', amount: 4000, type: 'topup', category: 'Penghijauan' },
  { id: 'tu_6', label: 'Mematikan lampu & kipas kelas saat pulang', amount: 2000, type: 'topup', category: 'Hemat Energi' },
];

export default function EcoTrend({ initialTransactions = [] }: EcoTrendProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [presets, setPresets] = useState<PointPreset[]>(DEFAULT_PRESETS);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);
  const [metricMode, setMetricMode] = useState<'count' | 'points'>('count');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOverviewChart, setShowOverviewChart] = useState(true);

  // Active hover point for tooltip
  const [hoveredPoint, setHoveredPoint] = useState<{
    chartId: string;
    dateLabel: string;
    count: number;
    points: number;
    x: number;
    y: number;
  } | null>(null);

  // Load transactions and presets
  useEffect(() => {
    async function loadData() {
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
          const list = [
            ...(presetJson.data.topup || []),
            ...(presetJson.data.penalty || []),
          ];
          if (list.length > 0) setPresets(list);
        }
      } catch (e) {
        console.warn('Failed to load trend data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter transactions within time range
  const rangeTransactions = useMemo(() => {
    const cutoff = Date.now() - timeRange * 24 * 60 * 60 * 1000;
    return transactions.filter(
      (tx) => tx.status === 'success' && tx.createdAt >= cutoff
    );
  }, [transactions, timeRange]);

  // Generate date keys for the time range
  const dateKeys = useMemo(() => {
    const list: { key: string; label: string; fullDate: string }[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: timeRange > 14 ? 'numeric' : 'short',
      });
      const fullDate = d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      list.push({ key, label, fullDate });
    }
    return list;
  }, [timeRange]);

  // Overall combined aggregate series (All activities combined across all children)
  const masterSeries = useMemo(() => {
    const map: Record<string, { count: number; points: number }> = {};
    dateKeys.forEach((d) => {
      map[d.key] = { count: 0, points: 0 };
    });

    rangeTransactions.forEach((tx) => {
      if (tx.type === 'topup' || tx.type === 'reward' || tx.type === 'adjust') {
        const d = new Date(tx.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (map[key]) {
          map[key].count += 1;
          map[key].points += tx.amount || 0;
        }
      }
    });

    const points = dateKeys.map((d) => ({
      dateKey: d.key,
      label: d.label,
      fullDate: d.fullDate,
      count: map[d.key]?.count || 0,
      points: map[d.key]?.points || 0,
    }));

    const totalCount = points.reduce((sum, p) => sum + p.count, 0);
    const totalPoints = points.reduce((sum, p) => sum + p.points, 0);

    return { points, totalCount, totalPoints };
  }, [dateKeys, rangeTransactions]);

  // Build individual activity series for each configured activity (1 Graph per Activity)
  const activitiesSeries = useMemo(() => {
    // Collect all distinct activity names from presets and existing transactions
    const activityMap: Record<
      string,
      {
        id: string;
        name: string;
        category: string;
        standardAmount: number;
      }
    > = {};

    // 1. Add configured presets
    presets.forEach((p) => {
      const cleanName = p.label.trim();
      activityMap[cleanName.toLowerCase()] = {
        id: p.id,
        name: cleanName,
        category: p.category || (p.type === 'topup' ? 'Reward' : 'Penyesuaian'),
        standardAmount: p.amount,
      };
    });

    // 2. Add any other transaction descriptions
    rangeTransactions.forEach((tx) => {
      if (tx.description && tx.type !== 'purchase') {
        const cleanName = tx.description.trim();
        const key = cleanName.toLowerCase();
        if (!activityMap[key]) {
          activityMap[key] = {
            id: `act_${key.slice(0, 8)}`,
            name: cleanName,
            category: 'Aktivitas',
            standardAmount: tx.amount || 0,
          };
        }
      }
    });

    // Build time series for each activity across all children
    const result: ActivityDataSeries[] = Object.values(activityMap).map((act) => {
      const dailyCounts: Record<string, { count: number; points: number }> = {};
      dateKeys.forEach((d) => {
        dailyCounts[d.key] = { count: 0, points: 0 };
      });

      let totalCount = 0;
      let totalPoints = 0;

      rangeTransactions.forEach((tx) => {
        if (
          tx.description &&
          tx.description.trim().toLowerCase() === act.name.toLowerCase()
        ) {
          const d = new Date(tx.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (dailyCounts[key]) {
            dailyCounts[key].count += 1;
            dailyCounts[key].points += tx.amount || 0;
            totalCount += 1;
            totalPoints += tx.amount || 0;
          }
        }
      });

      const dailyPoints = dateKeys.map((d) => ({
        dateKey: d.key,
        label: d.label,
        count: dailyCounts[d.key]?.count || 0,
        points: dailyCounts[d.key]?.points || 0,
      }));

      const avgPerDay = (totalCount / timeRange).toFixed(1);

      return {
        id: act.id,
        name: act.name,
        category: act.category,
        standardAmount: act.standardAmount,
        totalCount,
        totalPoints,
        avgPerDay,
        dailyPoints,
      };
    });

    // Sort activities by popularity (highest total count first)
    return result.sort((a, b) => b.totalCount - a.totalCount);
  }, [presets, rangeTransactions, dateKeys, timeRange]);

  // Extract categories for filter
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    activitiesSeries.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set).sort();
  }, [activitiesSeries]);

  // Filtered activities to display in multi-graph view
  const filteredActivities = useMemo(() => {
    return activitiesSeries.filter((act) => {
      const matchesCategory =
        selectedCategory === 'ALL' || act.category === selectedCategory;
      const matchesSearch =
        act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activitiesSeries, selectedCategory, searchQuery]);

  // Helper function to render a standalone SVG line/area trend graph
  const renderTrendSvg = (
    dataPoints: { label: string; count: number; points: number }[],
    chartId: string,
    width = 460,
    height = 140
  ) => {
    const pad = { top: 15, right: 15, bottom: 25, left: 35 };
    const uWidth = width - pad.left - pad.right;
    const uHeight = height - pad.top - pad.bottom;

    const values = dataPoints.map((p) =>
      metricMode === 'count' ? p.count : p.points
    );
    const max = Math.max(...values, 1);
    const maxValWithHeadroom = Math.ceil(max * 1.2) || 4;

    const coords = dataPoints.map((p, idx) => {
      const x = pad.left + (idx / Math.max(1, dataPoints.length - 1)) * uWidth;
      const val = metricMode === 'count' ? p.count : p.points;
      const y = pad.top + uHeight - (val / maxValWithHeadroom) * uHeight;
      return { x, y, val, p };
    });

    const linePath = coords.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaPath =
      coords.length > 0
        ? `${linePath} L ${coords[coords.length - 1].x} ${pad.top + uHeight} L ${coords[0].x} ${pad.top + uHeight} Z`
        : '';

    return (
      <div className="relative w-full overflow-hidden select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={`grad_${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#35C96F" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#35C96F" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 0.5, 1].map((r) => {
            const y = pad.top + uHeight * (1 - r);
            const valLabel = Math.round(maxValWithHeadroom * r);
            return (
              <g key={r}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#E5EEE7"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#74857B"
                  fontSize="9"
                  fontWeight="500"
                >
                  {metricMode === 'count'
                    ? valLabel
                    : valLabel >= 1000
                    ? `${Math.round(valLabel / 1000)}k`
                    : valLabel}
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {areaPath && <path d={areaPath} fill={`url(#grad_${chartId})`} />}

          {/* Main Stroke line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#35C96F"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Dots and X-axis Labels */}
          {coords.map((pt, idx) => {
            const showLabel =
              timeRange <= 7
                ? true
                : timeRange <= 14
                ? idx % 2 === 0
                : idx % 4 === 0 || idx === coords.length - 1;

            const isHovered =
              hoveredPoint?.chartId === chartId &&
              hoveredPoint.dateLabel === pt.p.label;

            return (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? '#159447' : '#FFFFFF'}
                  stroke="#35C96F"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      chartId,
                      dateLabel: pt.p.label,
                      count: pt.p.count,
                      points: pt.p.points,
                      x: pt.x,
                      y: pt.y,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {showLabel && (
                  <text
                    x={pt.x}
                    y={height - 6}
                    textAnchor="middle"
                    fill="#74857B"
                    fontSize="9"
                    fontWeight="500"
                  >
                    {pt.p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint?.chartId === chartId && (
          <div
            className="absolute pointer-events-none bg-[#18352A] text-white px-2.5 py-1.5 rounded-xl shadow-lg text-[11px] z-20 space-y-0.5 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 6}%`,
            }}
          >
            <p className="font-semibold text-emerald-300">{hoveredPoint.dateLabel}</p>
            <div className="flex items-center gap-2">
              <span>{hoveredPoint.count} aksi</span>
              <span className="text-[#35C96F] font-bold">
                Rp{hoveredPoint.points.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Global Filters */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#35C96F]" />
            <span>Eco-Trend Kegiatan</span>
          </h2>
          <p className="text-xs text-[#74857B] mt-0.5">
            Grafik tren untuk setiap kegiatan ramah lingkungan seluruh siswa
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

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs">
          <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
            Total Seluruh Aksi
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#18352A] mt-1">
            {masterSeries.totalCount}{' '}
            <span className="text-xs font-normal text-[#74857B]">kali</span>
          </p>
          <p className="text-[11px] text-[#20A65A] font-semibold mt-2 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Seluruh anak ({timeRange} hari)</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs">
          <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
            Poin Aksi Beredar
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#159447] mt-1">
            Rp{masterSeries.totalPoints.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-[#74857B] mt-2">
            Apresiasi kebiasaan hijau siswa
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs">
          <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
            Total Jenis Kegiatan
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#18352A] mt-1">
            {activitiesSeries.length}{' '}
            <span className="text-xs font-normal text-[#74857B]">kegiatan</span>
          </p>
          <p className="text-[11px] text-[#74857B] mt-2">
            Konfigurasi preset aktif
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs">
          <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Kegiatan Paling Aktif</span>
          </p>
          <p className="text-sm font-bold text-[#18352A] mt-1 line-clamp-1 capitalize">
            {activitiesSeries[0]?.name || 'Belum ada data'}
          </p>
          <p className="text-xs text-[#159447] font-extrabold mt-1">
            {activitiesSeries[0] ? `${activitiesSeries[0].totalCount}x aksi dicatat` : '-'}
          </p>
        </div>
      </div>

      {/* Overview Chart (Master Aggregate) - Collapsible */}
      <div className="bg-white rounded-2xl border border-[#E5EEE7] shadow-xs overflow-hidden">
        <div
          onClick={() => setShowOverviewChart(!showOverviewChart)}
          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#F7FBF7] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#35C96F]" />
            <h3 className="font-bold text-sm sm:text-base text-[#18352A]">
              Grafik Tren Total Seluruh Kegiatan (Gabungan)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F9EE] text-[#159447] font-semibold hidden sm:inline">
              Semua Anak Menjadi 1 Grafik
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#74857B]">
            <span>{showOverviewChart ? 'Tutup' : 'Buka Grafik'}</span>
            {showOverviewChart ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>

        {showOverviewChart && (
          <div className="p-5 pt-0 border-t border-[#E5EEE7] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#74857B] pt-3">
              <span>Kurva agregat total seluruh aksi hijau ({timeRange} hari terakhir)</span>
              <span className="font-semibold text-[#18352A]">
                Mode: {metricMode === 'count' ? 'Jumlah Aksi' : 'Total EcoPoint (Rp)'}
              </span>
            </div>
            {renderTrendSvg(masterSeries.points, 'master_overview', 700, 160)}
          </div>
        )}
      </div>

      {/* FILTER & CONTROL BAR FOR MULTI-CHARTS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-[#18352A] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#35C96F]" />
              <span>Grafik Tren per Kegiatan ({filteredActivities.length} Grafik)</span>
            </h3>
            <p className="text-xs text-[#74857B] mt-0.5">
              Setiap kegiatan memiliki 1 grafik mandiri untuk memantau perkembangannya
            </p>
          </div>

          {/* Metric Toggle: Frekuensi vs Rupiah */}
          <div className="inline-flex p-1 bg-[#F7FBF7] rounded-xl border border-[#E5EEE7] text-xs font-semibold self-start md:self-auto">
            <button
              type="button"
              onClick={() => setMetricMode('count')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metricMode === 'count'
                  ? 'bg-white text-[#159447] font-bold shadow-xs'
                  : 'text-[#74857B]'
              }`}
            >
              Jumlah Aksi
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

        {/* Filter Row: Category Pills & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E5EEE7]">
          {/* Search activity */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-[#74857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kegiatan..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A] font-semibold"
            >
              <option value="ALL">Semua Kategori</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MULTI-CHART GRID: TIAP KEGIATAN 1 GRAFIK */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[#74857B] bg-white rounded-2xl border border-[#E5EEE7]">
          Memuat grafik tren kegiatan...
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="p-12 text-center text-sm text-[#74857B] bg-white rounded-2xl border border-[#E5EEE7]">
          Tidak ada kegiatan yang cocok dengan filter pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredActivities.map((act, idx) => {
            return (
              <div
                key={act.id}
                className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs hover:border-[#35C96F]/50 transition-all space-y-4 flex flex-col justify-between"
              >
                {/* Activity Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-[#E8F9EE] text-[#159447] text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#35C96F]/30">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F7FBF7] text-[#74857B] border border-[#E5EEE7] uppercase tracking-wide">
                          {act.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-[#18352A] leading-snug">
                        {act.name}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[#E8F9EE] text-[#159447] border border-[#35C96F]/30">
                        +Rp{act.standardAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Stat Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-xl bg-[#F7FBF7] border border-[#E5EEE7] text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#74857B] block">Total Aksi</span>
                      <span className="font-extrabold text-[#18352A]">
                        {act.totalCount}x
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#74857B] block">Total Poin</span>
                      <span className="font-extrabold text-[#159447]">
                        Rp{act.totalPoints.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#74857B] block">Rerata / Hari</span>
                      <span className="font-bold text-[#18352A]">
                        {act.avgPerDay} aksi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Activity SVG Trend Chart */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-[#74857B] mb-1">
                    <span className="font-semibold text-[#18352A]">
                      Tren Harian ({timeRange} Hari Terakhir)
                    </span>
                    <span>Seluruh Siswa</span>
                  </div>
                  {renderTrendSvg(act.dailyPoints, `act_chart_${act.id}`, 460, 130)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}