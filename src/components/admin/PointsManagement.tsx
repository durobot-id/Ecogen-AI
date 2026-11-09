'use client';

import { useState } from 'react';
import { Coins, ArrowUpRight, ArrowDownLeft, CheckCircle, AlertTriangle, Search, User } from 'lucide-react';
import { Student } from '@/types';

interface PointsManagementProps {
  students: Student[];
  initialStudent?: Student | null;
  onRefresh: () => void;
}

export default function PointsManagement({
  students,
  initialStudent,
  onRefresh,
}: PointsManagementProps) {
  const [mode, setMode] = useState<'topup' | 'adjust'>('topup');
  const [selectedUid, setSelectedUid] = useState<string>(initialStudent?.uid || '');
  const [amount, setAmount] = useState<string>('5000');
  const [reason, setReason] = useState<string>('Aksi Peduli Lingkungan Sekolah');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const selectedStudent = students.find((s) => s.uid === selectedUid);
  const currentPoin = selectedStudent?.poin || 0;
  const numAmount = Number(amount) || 0;
  const nextPoin = mode === 'topup' ? currentPoin + numAmount : currentPoin - numAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUid) {
      setFeedback({ type: 'error', message: 'Silakan pilih siswa terlebih dahulu.' });
      return;
    }

    if (numAmount <= 0) {
      setFeedback({ type: 'error', message: 'Nominal poin harus lebih besar dari 0.' });
      return;
    }

    if (mode === 'adjust' && nextPoin < 0) {
      setFeedback({ type: 'error', message: 'Pengurangan poin melebihi saldo siswa!' });
      return;
    }

    if (!reason.trim()) {
      setFeedback({ type: 'error', message: 'Alasan penyesuaian/pemberian poin wajib diisi.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const endpoint =
        mode === 'topup'
          ? `/api/students/${selectedUid}/topup`
          : `/api/students/${selectedUid}/adjust`;

      const payload =
        mode === 'topup'
          ? { amount: numAmount, reason }
          : { amount: -numAmount, reason };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({ type: 'error', message: data.message || 'Gagal memproses transaksi poin.' });
        return;
      }

      setFeedback({
        type: 'success',
        message:
          mode === 'topup'
            ? `Berhasil menambahkan Rp${numAmount.toLocaleString('id-ID')} poin untuk ${selectedStudent?.nama}. Saldo baru: Rp${nextPoin.toLocaleString('id-ID')}`
            : `Berhasil mengurangi Rp${numAmount.toLocaleString('id-ID')} poin untuk ${selectedStudent?.nama}. Saldo baru: Rp${nextPoin.toLocaleString('id-ID')}`,
      });

      onRefresh();
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs">
        <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
          <Coins className="w-5 h-5 text-[#35C96F]" />
          <span>Sistem Pengelolaan Poin Siswa</span>
        </h2>
        <p className="text-xs text-[#74857B] mt-1">
          Beri penghargaan poin untuk aktivitas positif atau lakukan penyesuaian saldo terverifikasi
        </p>

        {/* Tab Toggle: Top Up vs Adjustment */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-[#F7FBF7] rounded-xl border border-[#E5EEE7]">
          <button
            type="button"
            onClick={() => {
              setMode('topup');
              setFeedback(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'topup'
                ? 'bg-white text-[#159447] shadow-xs border border-[#E5EEE7]'
                : 'text-[#74857B] hover:text-[#18352A]'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-[#20A65A]" />
            <span>Tambah Poin (Top Up / Reward)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('adjust');
              setFeedback(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'adjust'
                ? 'bg-white text-[#E05252] shadow-xs border border-[#E5EEE7]'
                : 'text-[#74857B] hover:text-[#18352A]'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-[#E05252]" />
            <span>Kurangi Poin (Penyesuaian Manual)</span>
          </button>
        </div>
      </div>

      {/* Main Form & Preview */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-[#E8F9EE] text-[#159447] border border-[#35C96F]/30'
                  : 'bg-red-50 text-[#E05252] border border-red-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Select Student */}
          <div>
            <label className="text-xs font-bold text-[#18352A] block mb-1.5">
              Pilih Siswa *
            </label>
            <select
              value={selectedUid}
              onChange={(e) => setSelectedUid(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A]"
            >
              <option value="">-- Pilih Siswa Penerima Poin --</option>
              {students.map((st) => (
                <option key={st.uid} value={st.uid}>
                  {st.nama} ({st.kelas}) — Saldo: Rp{st.poin.toLocaleString('id-ID')} [{st.uid}]
                </option>
              ))}
            </select>
          </div>

          {/* Amount input & Quick Chips */}
          <div>
            <label className="text-xs font-bold text-[#18352A] block mb-1.5">
              Nominal Poin (Rp) *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-base font-bold rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F]"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {[1000, 2000, 5000, 10000, 20000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v.toString())}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#E8F9EE] text-[#159447] font-semibold border border-[#35C96F]/30 hover:bg-[#35C96F] hover:text-white transition-all"
                >
                  +{v.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label className="text-xs font-bold text-[#18352A] block mb-1.5">
              Alasan Pemberian / Penyesuaian *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Menjaga kebersihan kelas, piket lingkungan..."
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F]"
            />
            {/* Quick Reason suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Menjaga kebersihan kelas',
                'Membuang sampah terpilah',
                'Membawa botol tumbler',
                'Piket lingkungan sekolah',
                'Koreksi saldo manual',
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[#74857B] transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          {selectedStudent && (
            <div className="bg-[#F7FBF7] rounded-2xl p-4 border border-[#E5EEE7] space-y-2.5 text-xs">
              <span className="font-bold text-[#18352A] uppercase tracking-wider text-[10px] block">
                Ringkasan Transaksi Poin
              </span>

              <div className="grid grid-cols-2 gap-2 text-[#74857B]">
                <div>
                  <p>Nama Siswa: <strong className="text-[#18352A] capitalize">{selectedStudent.nama}</strong></p>
                  <p>Kelas: <strong className="text-[#18352A]">{selectedStudent.kelas}</strong></p>
                  <p>UID: <strong className="font-mono text-[#18352A]">{selectedStudent.uid}</strong></p>
                </div>
                <div className="text-right">
                  <p>Saldo Awal: <strong>Rp{currentPoin.toLocaleString('id-ID')}</strong></p>
                  <p className={mode === 'topup' ? 'text-[#20A65A] font-bold' : 'text-[#E05252] font-bold'}>
                    {mode === 'topup' ? '+ ' : '- '}Rp{numAmount.toLocaleString('id-ID')}
                  </p>
                  <p className="pt-1 border-t border-[#E5EEE7] font-extrabold text-[#159447] text-sm">
                    Saldo Akhir: Rp{nextPoin.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedUid || numAmount <= 0}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 ${
              mode === 'topup'
                ? 'bg-[#35C96F] hover:bg-[#159447] shadow-[#35C96F]/20'
                : 'bg-[#E05252] hover:bg-red-700 shadow-red-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span>Memproses...</span>
            ) : mode === 'topup' ? (
              <>
                <ArrowUpRight className="w-5 h-5" />
                <span>KONFIRMASI TAMBAH POIN</span>
              </>
            ) : (
              <>
                <ArrowDownLeft className="w-5 h-5" />
                <span>KONFIRMASI KURANGI POIN</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
