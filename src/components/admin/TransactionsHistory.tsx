'use client';

import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { Transaction } from '@/types';

interface TransactionsHistoryProps {
  transactions: Transaction[];
  loading: boolean;
  onRefresh: () => void;
}

export default function TransactionsHistory({
  transactions,
  loading,
  onRefresh,
}: TransactionsHistoryProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.nama.toLowerCase().includes(search.toLowerCase()) ||
        t.uid.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

      const matchType = filterType === 'ALL' || t.type === filterType;
      return matchSearch && matchType;
    });
  }, [transactions, search, filterType]);

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      'ID Transaksi',
      'Waktu',
      'Nama Siswa',
      'Kelas',
      'UID',
      'Tipe',
      'Nominal (Rp)',
      'Saldo Sebelum',
      'Saldo Sesudah',
      'Keterangan',
      'Operator',
    ];

    const rows = filtered.map((t) => [
      t.id,
      new Date(t.createdAt).toISOString(),
      `"${t.nama}"`,
      t.kelas,
      t.uid,
      t.type,
      t.amount,
      t.balanceBefore,
      t.balanceAfter,
      `"${t.description || ''}"`,
      t.operatorId,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecogen-transaksi-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
            <History className="w-5 h-5 text-[#35C96F]" />
            <span>Riwayat Transaksi EcoPoint</span>
          </h2>
          <p className="text-xs text-[#74857B] mt-0.5">
            Audit log lengkap transaksi pemotongan kasir, top-up poin, dan penyesuaian manual
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-[#E5EEE7] text-[#74857B] hover:text-[#18352A] hover:bg-gray-50 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="py-2.5 px-4 rounded-xl border border-[#35C96F]/40 bg-[#E8F9EE] text-[#159447] text-xs font-bold hover:bg-[#35C96F] hover:text-white transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5EEE7] shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-[#74857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID transaksi, nama siswa, atau UID..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7]"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A]"
            >
              <option value="ALL">Semua Jenis Transaksi</option>
              <option value="purchase">Kasir (Pemotongan Poin)</option>
              <option value="topup">Top Up (Penambahan Poin)</option>
              <option value="adjust">Penyesuaian Manual</option>
              <option value="reward">Reward Aktivitas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E5EEE7] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#74857B]">Memuat riwayat transaksi...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-8 h-8 mx-auto text-[#CBDAD0]" />
            <p className="text-sm font-semibold text-[#18352A]">Belum ada riwayat transaksi</p>
            <p className="text-xs text-[#74857B]">
              Transaksi kasir dan penyesuaian poin akan otomatis tercatat di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7FBF7] text-xs font-semibold text-[#74857B] border-b border-[#E5EEE7] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5">Siswa</th>
                  <th className="px-5 py-3.5">Jenis</th>
                  <th className="px-5 py-3.5 text-right">Nominal</th>
                  <th className="px-5 py-3.5 text-right">Saldo Sesudah</th>
                  <th className="px-5 py-3.5">Keterangan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EEE7]">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F7FBF7] transition-colors">
                    <td className="px-5 py-3.5 text-xs text-[#74857B] whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-[#18352A] capitalize">{tx.nama}</p>
                      <p className="text-xs text-[#74857B]">
                        Kelas {tx.kelas} • <span className="font-mono">{tx.uid}</span>
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          tx.type === 'purchase'
                            ? 'bg-red-50 text-[#E05252] border border-red-100'
                            : tx.type === 'topup'
                            ? 'bg-emerald-50 text-[#159447] border border-emerald-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}
                      >
                        {tx.type === 'purchase' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        <span className="capitalize">{tx.type}</span>
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-extrabold whitespace-nowrap ${
                        tx.type === 'purchase' ? 'text-[#E05252]' : 'text-[#20A65A]'
                      }`}
                    >
                      {tx.type === 'purchase' ? '-' : '+'}Rp{tx.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[#18352A] whitespace-nowrap">
                      Rp{tx.balanceAfter.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#74857B] max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 rounded-lg text-[#74857B] hover:text-[#18352A] hover:bg-gray-100 transition-colors"
                        title="Lihat Detail Transaksi"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E5EEE7] relative animate-fadeIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7]">
              <h3 className="font-bold text-base text-[#18352A]">Detail Transaksi</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-[#74857B] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#74857B]">ID Transaksi:</span>
                <span className="font-mono font-bold text-[#18352A]">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74857B]">Waktu:</span>
                <span className="font-medium text-[#18352A]">
                  {new Date(selectedTx.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74857B]">Siswa:</span>
                <span className="font-bold text-[#18352A] capitalize">
                  {selectedTx.nama} ({selectedTx.kelas})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74857B]">UID Kartu:</span>
                <span className="font-mono text-[#18352A]">{selectedTx.uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74857B]">Tipe Transaksi:</span>
                <span className="font-bold capitalize text-[#159447]">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E5EEE7]">
                <span className="text-[#74857B]">Nominal:</span>
                <span className="font-extrabold text-base text-[#18352A]">
                  Rp{selectedTx.amount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74857B]">Saldo Sebelum:</span>
                <span>Rp{selectedTx.balanceBefore.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#74857B]">Saldo Sesudah:</span>
                <span className="font-bold text-[#159447]">
                  Rp{selectedTx.balanceAfter.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E5EEE7]">
                <span className="text-[#74857B] block mb-0.5">Keterangan:</span>
                <p className="bg-[#F7FBF7] p-2.5 rounded-xl border border-[#E5EEE7] text-[#18352A]">
                  {selectedTx.description}
                </p>
              </div>
              <div className="flex justify-between text-[11px] text-[#74857B]">
                <span>Operator:</span>
                <span>{selectedTx.operatorId}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#35C96F] text-white font-bold text-xs shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
