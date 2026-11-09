'use client';

import { Users, Coins, History, ArrowUpRight, ArrowDownLeft, Trophy, ArrowRight } from 'lucide-react';
import { DashboardStats, Student } from '@/types';

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
  onSelectStudentTopUp?: (student: Student) => void;
}

export default function DashboardOverview({
  stats,
  loading,
  onNavigateTab,
}: DashboardOverviewProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#E5EEE7]" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-[#E5EEE7]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
              Total Siswa
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#18352A] mt-1">
              {stats.totalStudents}
            </p>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs text-[#159447] font-semibold mt-2 hover:underline inline-flex items-center gap-1"
            >
              <span>Kelola Siswa</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F9EE] border border-[#35C96F]/30 flex items-center justify-center text-[#159447]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Saldo Poin Beredar */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
              Total Saldo Poin
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#159447] mt-1">
              Rp{stats.totalPoints.toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-[#74857B] mt-2">Beredar pada siswa aktif</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#159447]">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Total Poin Diberikan (Top Up & Reward) */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
              Poin Diberikan
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#18352A] mt-1">
              Rp{stats.totalPointsGranted.toLocaleString('id-ID')}
            </p>
            <span className="text-[11px] text-[#20A65A] font-semibold mt-2 inline-flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>Apresiasi siswa</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E8F9EE] border border-[#35C96F]/30 flex items-center justify-center text-[#20A65A]">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Total Poin Digunakan (Kasir) */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#74857B] uppercase tracking-wider">
              Poin Digunakan
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#18352A] mt-1">
              Rp{stats.totalPointsSpent.toLocaleString('id-ID')}
            </p>
            <span className="text-[11px] text-[#74857B] font-semibold mt-2 inline-flex items-center gap-0.5">
              <ArrowDownLeft className="w-3 h-3 text-[#E05252]" />
              <span>{stats.totalTransactions} Transaksi</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E9A23B]">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Students Leaderboard & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Students */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8F9EE] text-[#159447] flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#18352A]">Siswa Poin Tertinggi</h3>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs text-[#159447] hover:underline font-semibold"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-[#E5EEE7] mt-2">
            {stats.topStudents.length === 0 ? (
              <p className="text-xs text-[#74857B] py-6 text-center">Belum ada data siswa.</p>
            ) : (
              stats.topStudents.map((st, idx) => (
                <div key={st.uid} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-[#35C96F] text-white'
                          : idx === 1
                          ? 'bg-[#E8F9EE] text-[#159447] border border-[#35C96F]/30'
                          : idx === 2
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-[#74857B]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#18352A] capitalize">{st.nama}</p>
                      <p className="text-xs text-[#74857B]">
                        Kelas {st.kelas} • <span className="font-mono">{st.uid}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#159447] text-sm">
                      Rp{st.poin.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8F9EE] text-[#159447] flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[#18352A]">Aktivitas Terkini</h3>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-[#159447] hover:underline font-semibold"
            >
              Semua Riwayat
            </button>
          </div>

          <div className="divide-y divide-[#E5EEE7] mt-2">
            {stats.recentTransactions.length === 0 ? (
              <p className="text-xs text-[#74857B] py-6 text-center">Belum ada transaksi tercatat.</p>
            ) : (
              stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#18352A] capitalize">
                        {tx.nama}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          tx.type === 'purchase'
                            ? 'bg-red-50 text-[#E05252] border border-red-100'
                            : tx.type === 'topup'
                            ? 'bg-emerald-50 text-[#159447] border border-emerald-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}
                      >
                        {tx.type === 'purchase'
                          ? 'Kasir'
                          : tx.type === 'topup'
                          ? 'Top Up'
                          : 'Penyesuaian'}
                      </span>
                    </div>
                    <p className="text-xs text-[#74857B] mt-0.5 line-clamp-1">
                      {tx.description} • {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold text-sm ${
                        tx.type === 'purchase' ? 'text-[#E05252]' : 'text-[#20A65A]'
                      }`}
                    >
                      {tx.type === 'purchase' ? '-' : '+'}Rp{tx.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
