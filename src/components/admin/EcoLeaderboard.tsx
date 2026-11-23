'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Users,
  UserCheck,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Coins,
  Crown,
  School,
  Star,
  CheckCircle,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { Student, Transaction } from '@/types';

interface EcoLeaderboardProps {
  students: Student[];
  transactions?: Transaction[];
  loading: boolean;
  onOpenTopUp: (student: Student) => void;
}

type LeaderboardViewMode = 'individual' | 'class';

export default function EcoLeaderboard({
  students,
  transactions = [],
  loading,
  onOpenTopUp,
}: EcoLeaderboardProps) {
  const [viewMode, setViewMode] = useState<LeaderboardViewMode>('individual');
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [classSortBy, setClassSortBy] = useState<'total' | 'average'>('total');
  const [internalTxList, setInternalTxList] = useState<Transaction[]>(transactions);

  // If transactions prop was empty, fetch once to ensure accurate 30-day active data
  useEffect(() => {
    if (transactions.length > 0) {
      setInternalTxList(transactions);
    } else {
      fetch('/api/transactions?limit=0', { cache: 'no-store' })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setInternalTxList(json.data);
          }
        })
        .catch(() => {});
    }
  }, [transactions]);

  // Unique class list
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.kelas) set.add(s.kelas);
    });
    return Array.from(set).sort();
  }, [students]);

  // Total school points
  const totalSchoolPoints = useMemo(() => {
    return students.reduce((sum, s) => sum + (s.poin || 0), 0);
  }, [students]);

  // Calculate 1 month (30-day) active student metrics
  const monthlyActiveStats = useMemo(() => {
    const totalStudents = students.length;
    const cutoff30d = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Collect UIDs of students with successful activity/transactions within 30 days
    const activeUids = new Set<string>();
    internalTxList.forEach((tx) => {
      if (tx.createdAt >= cutoff30d && tx.status === 'success' && tx.uid) {
        activeUids.add(tx.uid.trim().toUpperCase());
      }
    });

    // Also include students created within 30 days
    students.forEach((s) => {
      if (s.createdAt && s.createdAt >= cutoff30d) {
        activeUids.add(s.uid.trim().toUpperCase());
      }
    });

    // Count how many active UIDs belong to current registered students
    let activeCount = students.filter(
      (s) => activeUids.has(s.uid.trim().toUpperCase()) && (s.status || 'aktif') === 'aktif'
    ).length;

    // Fallback if no transactions recorded yet in prototype database but students have points and are active
    if (activeCount === 0 && totalStudents > 0) {
      activeCount = students.filter(
        (s) => (s.status || 'aktif') === 'aktif' && s.poin > 0
      ).length;
    }

    const percentage = totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0;

    return {
      totalStudents,
      activeCount,
      percentage,
    };
  }, [students, internalTxList]);

  // Filtered & sorted individual students
  const rankedIndividuals = useMemo(() => {
    return students
      .filter((s) => {
        const matchSearch =
          s.nama.toLowerCase().includes(search.toLowerCase()) ||
          s.uid.toLowerCase().includes(search.toLowerCase()) ||
          s.kelas.toLowerCase().includes(search.toLowerCase());
        const matchClass = selectedClass === 'ALL' || s.kelas === selectedClass;
        return matchSearch && matchClass;
      })
      .sort((a, b) => b.poin - a.poin);
  }, [students, search, selectedClass]);

  // Top 3 individual champions
  const topThreeIndividuals = useMemo(() => {
    return rankedIndividuals.slice(0, 3);
  }, [rankedIndividuals]);

  // Class aggregates
  interface ClassRanking {
    kelas: string;
    totalPoin: number;
    rataRataPoin: number;
    jumlahSiswa: number;
    topStudent: Student | null;
    persentase: number;
  }

  const rankedClasses = useMemo(() => {
    const classMap: Record<string, { totalPoin: number; students: Student[] }> = {};

    students.forEach((s) => {
      const cls = s.kelas || 'Lainnya';
      if (!classMap[cls]) {
        classMap[cls] = { totalPoin: 0, students: [] };
      }
      classMap[cls].totalPoin += s.poin || 0;
      classMap[cls].students.push(s);
    });

    const list: ClassRanking[] = Object.entries(classMap).map(([cls, data]) => {
      const sortedStudents = [...data.students].sort((a, b) => b.poin - a.poin);
      const topStudent = sortedStudents[0] || null;
      const count = data.students.length;
      const avg = count > 0 ? Math.round(data.totalPoin / count) : 0;
      const pct =
        totalSchoolPoints > 0 ? (data.totalPoin / totalSchoolPoints) * 100 : 0;

      return {
        kelas: cls,
        totalPoin: data.totalPoin,
        rataRataPoin: avg,
        jumlahSiswa: count,
        topStudent,
        persentase: Number(pct.toFixed(1)),
      };
    });

    return list.sort((a, b) => {
      if (classSortBy === 'average') {
        return b.rataRataPoin - a.rataRataPoin;
      }
      return b.totalPoin - a.totalPoin;
    });
  }, [students, totalSchoolPoints, classSortBy]);

  // Top 3 class champions
  const topThreeClasses = useMemo(() => {
    return rankedClasses.slice(0, 3);
  }, [rankedClasses]);

  return (
    <div className="space-y-6">
      {/* Header & Tab Selector */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#35C96F]" />
            <span>Eco-Leaderboard</span>
          </h2>
          <p className="text-xs text-[#74857B] mt-0.5">
            Peringkat kontribusi aksi ramah lingkungan individu dan kelas
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex p-1 bg-[#F7FBF7] rounded-xl border border-[#E5EEE7] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('individual')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'individual'
                ? 'bg-white text-[#159447] shadow-xs border border-[#E5EEE7]'
                : 'text-[#74857B] hover:text-[#18352A]'
            }`}
          >
            <Medal className="w-3.5 h-3.5" />
            <span>Peringkat Individu</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('class')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'class'
                ? 'bg-white text-[#159447] shadow-xs border border-[#E5EEE7]'
                : 'text-[#74857B] hover:text-[#18352A]'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>Peringkat Kelas</span>
          </button>
        </div>
      </div>

      {/* 4 Key Statistics Cards: Total Siswa Terdaftar, Siswa Aktif 1 Bulan, % Keaktifan Bulanan, Total Poin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa Terdaftar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#74857B] uppercase tracking-wider truncate">
              Total Siswa Terdaftar
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F9EE] border border-[#35C96F]/30 flex items-center justify-center text-[#159447] shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5 min-w-0">
            <p className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-black text-[#18352A] tracking-tight truncate">
              {monthlyActiveStats.totalStudents}{' '}
              <span className="text-xs font-normal text-[#74857B]">siswa</span>
            </p>
          </div>
          <p className="text-[11px] text-[#74857B] truncate flex items-center gap-1">
            <Users className="w-3 h-3 text-[#35C96F] shrink-0" />
            <span className="truncate">Database sekolah</span>
          </p>
        </div>

        {/* Siswa Aktif 1 Bulan Ini */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#74857B] uppercase tracking-wider truncate">
              Siswa Aktif (30 Hari)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#159447] shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5 min-w-0">
            <p className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-black text-[#159447] tracking-tight truncate">
              {monthlyActiveStats.activeCount}{' '}
              <span className="text-xs font-normal text-[#74857B]">siswa</span>
            </p>
          </div>
          <p className="text-[11px] text-[#20A65A] font-semibold truncate flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span className="truncate">Aktif 30 hari terakhir</span>
          </p>
        </div>

        {/* Persentase Siswa Aktif Bulanan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#74857B] uppercase tracking-wider truncate">
              Keaktifan 1 Bulan Ini
            </span>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-[#E8F9EE] text-[#159447] border border-[#35C96F]/30 shrink-0">
              {monthlyActiveStats.percentage}%
            </span>
          </div>
          <div className="my-1.5 min-w-0">
            <p className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-black text-[#18352A] tracking-tight truncate">
              {monthlyActiveStats.percentage}%
            </p>
            <div className="w-full bg-[#E5EEE7] h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-[#35C96F] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, monthlyActiveStats.percentage))}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-[#74857B] truncate">
            {monthlyActiveStats.activeCount} dari {monthlyActiveStats.totalStudents} siswa berpartisipasi
          </p>
        </div>

        {/* Total Poin Terkumpul */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#74857B] uppercase tracking-wider truncate">
              Total Poin Terkumpul
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1.5 min-w-0">
            <p
              className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-black text-[#159447] tracking-tight truncate"
              title={`Rp${totalSchoolPoints.toLocaleString('id-ID')}`}
            >
              Rp{totalSchoolPoints.toLocaleString('id-ID')}
            </p>
          </div>
          <p className="text-[11px] text-[#74857B] truncate flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">Akumulasi seluruh siswa</span>
          </p>
        </div>
      </div>

      {/* INDIVIDUAL LEADERBOARD VIEW */}
      {viewMode === 'individual' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top 3 Podium for Individuals */}
          {topThreeIndividuals.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-4">
              {/* Rank 2 (Silver) */}
              {topThreeIndividuals[1] && (
                <div className="order-2 sm:order-1 bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs text-center relative hover:border-slate-300 transition-all">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center mx-auto mb-2 border border-slate-200">
                    #2
                  </div>
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-600 mb-2 font-bold text-lg">
                    {topThreeIndividuals[1].nama.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-sm text-[#18352A] capitalize truncate">
                    {topThreeIndividuals[1].nama}
                  </h3>
                  <p className="text-xs text-[#74857B]">
                    Kelas {topThreeIndividuals[1].kelas}
                  </p>
                  <div className="mt-3 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 inline-block">
                    <span className="font-extrabold text-sm text-slate-800">
                      Rp{topThreeIndividuals[1].poin.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold Champion) */}
              {topThreeIndividuals[0] && (
                <div className="order-1 sm:order-2 bg-gradient-to-b from-[#E8F9EE] to-white rounded-2xl p-6 border-2 border-[#35C96F] shadow-md text-center relative -mt-4 transform sm:-translate-y-2">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md">
                    <Crown className="w-4 h-4 fill-amber-950" />
                  </div>
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border-3 border-[#35C96F] flex items-center justify-center text-[#159447] mb-2 font-black text-xl shadow-xs">
                    {topThreeIndividuals[0].nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#159447] bg-white px-2.5 py-0.5 rounded-full border border-[#35C96F]/30 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Juara 1 Sekolah</span>
                  </div>
                  <h3 className="font-extrabold text-base text-[#18352A] capitalize truncate">
                    {topThreeIndividuals[0].nama}
                  </h3>
                  <p className="text-xs text-[#74857B]">
                    Kelas {topThreeIndividuals[0].kelas} •{' '}
                    <span className="font-mono">{topThreeIndividuals[0].uid}</span>
                  </p>
                  <div className="mt-3 py-2 px-4 rounded-xl bg-[#E8F9EE] border border-[#35C96F]/40 inline-block shadow-xs">
                    <span className="font-black text-base text-[#159447]">
                      Rp{topThreeIndividuals[0].poin.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {topThreeIndividuals[2] && (
                <div className="order-3 bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs text-center relative hover:border-amber-200 transition-all">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 font-extrabold text-xs flex items-center justify-center mx-auto mb-2 border border-amber-200">
                    #3
                  </div>
                  <div className="w-14 h-14 mx-auto rounded-full bg-amber-50/50 border-2 border-amber-200 flex items-center justify-center text-amber-800 mb-2 font-bold text-lg">
                    {topThreeIndividuals[2].nama.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-sm text-[#18352A] capitalize truncate">
                    {topThreeIndividuals[2].nama}
                  </h3>
                  <p className="text-xs text-[#74857B]">
                    Kelas {topThreeIndividuals[2].kelas}
                  </p>
                  <div className="mt-3 py-1.5 px-3 rounded-xl bg-amber-50/60 border border-amber-200 inline-block">
                    <span className="font-extrabold text-sm text-amber-900">
                      Rp{topThreeIndividuals[2].poin.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5EEE7] shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-[#74857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari siswa atau UID di leaderboard..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7]"
                />
              </div>

              <div>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A]"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classList.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Full Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-[#E5EEE7] shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#74857B]">
                Memuat leaderboard...
              </div>
            ) : rankedIndividuals.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#74857B]">
                Tidak ada siswa yang sesuai kriteria.
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F7FBF7] text-xs font-semibold text-[#74857B] border-b border-[#E5EEE7] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5 text-center w-16">Peringkat</th>
                        <th className="px-5 py-3.5">Nama Siswa</th>
                        <th className="px-5 py-3.5">Kelas</th>
                        <th className="px-5 py-3.5 text-right">Saldo EcoPoint</th>
                        <th className="px-5 py-3.5 text-right">Kontribusi</th>
                        <th className="px-5 py-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5EEE7]">
                      {rankedIndividuals.map((st, idx) => {
                        const rank = idx + 1;
                        const pct =
                          totalSchoolPoints > 0
                            ? ((st.poin / totalSchoolPoints) * 100).toFixed(1)
                            : '0';

                        return (
                          <tr
                            key={st.uid}
                            className={`hover:bg-[#F7FBF7] transition-colors ${
                              rank <= 3 ? 'bg-[#F7FBF7]/50' : ''
                            }`}
                          >
                            <td className="px-5 py-3.5 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${
                                  rank === 1
                                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                                    : rank === 2
                                    ? 'bg-slate-200 text-slate-800'
                                    : rank === 3
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'text-[#74857B]'
                                }`}
                              >
                                {rank}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#18352A] capitalize">
                                  {st.nama}
                                </span>
                                {rank === 1 && (
                                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <span className="font-mono text-xs text-[#74857B]">
                                {st.uid}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#E8F9EE] text-[#159447]">
                                Kelas {st.kelas}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span className="font-extrabold text-sm text-[#159447]">
                                Rp{st.poin.toLocaleString('id-ID')}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right text-xs text-[#74857B] font-medium">
                              {pct}%
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => onOpenTopUp(st)}
                                className="py-1 px-2.5 rounded-lg text-xs font-semibold bg-[#E8F9EE] text-[#159447] hover:bg-[#35C96F] hover:text-white transition-all inline-flex items-center gap-1 active:scale-95"
                                title="Beri Poin Reward"
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>Beri Poin</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-[#E5EEE7]">
                  {rankedIndividuals.map((st, idx) => {
                    const rank = idx + 1;
                    return (
                      <div key={st.uid} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                              rank === 1
                                ? 'bg-amber-400 text-amber-950'
                                : rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : rank === 3
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'text-[#74857B] bg-[#F7FBF7]'
                            }`}
                          >
                            {rank}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-[#18352A] capitalize">
                              {st.nama}
                            </p>
                            <p className="text-xs text-[#74857B]">
                              Kelas {st.kelas} • <span className="font-mono">{st.uid}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-sm text-[#159447]">
                            Rp{st.poin.toLocaleString('id-ID')}
                          </p>
                          <button
                            type="button"
                            onClick={() => onOpenTopUp(st)}
                            className="text-[11px] font-bold text-[#159447] hover:underline mt-0.5 inline-flex items-center gap-0.5"
                          >
                            <Coins className="w-3 h-3" />
                            <span>Beri Poin</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CLASS LEADERBOARD VIEW */}
      {viewMode === 'class' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top 3 Class Podium */}
          {topThreeClasses.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-4">
              {/* Rank 2 Class */}
              {topThreeClasses[1] && (
                <div className="order-2 sm:order-1 bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs text-center hover:border-slate-300 transition-all">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center mx-auto mb-2 border border-slate-200">
                    #2
                  </div>
                  <h3 className="font-extrabold text-lg text-[#18352A]">
                    Kelas {topThreeClasses[1].kelas}
                  </h3>
                  <p className="text-xs text-[#74857B] mt-0.5">
                    {topThreeClasses[1].jumlahSiswa} Siswa
                  </p>
                  <div className="my-2.5 py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 inline-block">
                    <span className="font-extrabold text-sm text-slate-800">
                      Rp{topThreeClasses[1].totalPoin.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#74857B]">
                    Rata-rata: Rp{topThreeClasses[1].rataRataPoin.toLocaleString('id-ID')} / siswa
                  </p>
                </div>
              )}

              {/* Rank 1 Class (Champion Class) */}
              {topThreeClasses[0] && (
                <div className="order-1 sm:order-2 bg-gradient-to-b from-[#E8F9EE] to-white rounded-2xl p-6 border-2 border-[#35C96F] shadow-md text-center relative -mt-4 transform sm:-translate-y-2">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md">
                    <Crown className="w-4 h-4 fill-amber-950" />
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#159447] bg-white px-2.5 py-0.5 rounded-full border border-[#35C96F]/30 mb-2">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    <span>Kelas Terhijau</span>
                  </div>
                  <h3 className="font-black text-xl text-[#18352A]">
                    Kelas {topThreeClasses[0].kelas}
                  </h3>
                  <p className="text-xs text-[#74857B] mt-0.5">
                    {topThreeClasses[0].jumlahSiswa} Siswa • Kontribusi {topThreeClasses[0].persentase}%
                  </p>
                  <div className="my-3 py-2 px-4 rounded-xl bg-[#E8F9EE] border border-[#35C96F]/40 inline-block shadow-xs">
                    <span className="font-black text-lg text-[#159447]">
                      Rp{topThreeClasses[0].totalPoin.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#18352A]">
                    Rata-rata: Rp{topThreeClasses[0].rataRataPoin.toLocaleString('id-ID')} / siswa
                  </p>
                </div>
              )}

              {/* Rank 3 Class */}
              {topThreeClasses[2] && (
                <div className="order-3 bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs text-center hover:border-amber-200 transition-all">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 font-extrabold text-xs flex items-center justify-center mx-auto mb-2 border border-amber-200">
                    #3
                  </div>
                  <h3 className="font-extrabold text-lg text-[#18352A]">
                    Kelas {topThreeClasses[2].kelas}
                  </h3>
                  <p className="text-xs text-[#74857B] mt-0.5">
                    {topThreeClasses[2].jumlahSiswa} Siswa
                  </p>
                  <div className="my-2.5 py-1.5 px-3 rounded-xl bg-amber-50/60 border border-amber-200 inline-block">
                    <span className="font-extrabold text-sm text-amber-900">
                      Rp{topThreeClasses[2].totalPoin.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#74857B]">
                    Rata-rata: Rp{topThreeClasses[2].rataRataPoin.toLocaleString('id-ID')} / siswa
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sort Controller */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5EEE7] shadow-xs flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-[#74857B]">
              Total {rankedClasses.length} Kelas Berkompetisi
            </span>

            <div className="inline-flex p-1 bg-[#F7FBF7] rounded-xl border border-[#E5EEE7] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setClassSortBy('total')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  classSortBy === 'total'
                    ? 'bg-white text-[#159447] font-bold shadow-xs'
                    : 'text-[#74857B]'
                }`}
              >
                Urut Total Poin
              </button>
              <button
                type="button"
                onClick={() => setClassSortBy('average')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  classSortBy === 'average'
                    ? 'bg-white text-[#159447] font-bold shadow-xs'
                    : 'text-[#74857B]'
                }`}
              >
                Urut Rata-Rata / Siswa
              </button>
            </div>
          </div>

          {/* Class Leaderboard List */}
          <div className="bg-white rounded-2xl border border-[#E5EEE7] shadow-xs overflow-hidden">
            <div className="divide-y divide-[#E5EEE7]">
              {rankedClasses.map((cls, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={cls.kelas}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7FBF7] transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                          rank === 1
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : rank === 3
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'text-[#74857B] bg-[#F7FBF7]'
                        }`}
                      >
                        #{rank}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base text-[#18352A]">
                            Kelas {cls.kelas}
                          </h4>
                          <span className="text-[11px] text-[#74857B]">
                            ({cls.jumlahSiswa} siswa)
                          </span>
                        </div>
                        {cls.topStudent && (
                          <p className="text-xs text-[#74857B] mt-0.5 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>Bintang Kelas:</span>
                            <strong className="text-[#18352A] capitalize">
                              {cls.topStudent.nama}
                            </strong>
                            <span>({cls.topStudent.poin.toLocaleString('id-ID')} poin)</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Numerical Metrics */}
                    <div className="sm:text-right space-y-1.5 min-w-[220px]">
                      <div className="flex sm:justify-end items-baseline gap-2">
                        <span className="font-extrabold text-base text-[#159447]">
                          Rp{cls.totalPoin.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-[#74857B]">
                          (Rerata: Rp{cls.rataRataPoin.toLocaleString('id-ID')})
                        </span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-[#E5EEE7] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#35C96F] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, cls.persentase))}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#74857B] block sm:text-right">
                        Kontribusi {cls.persentase}% dari total sekolah
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}