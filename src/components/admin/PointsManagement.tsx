'use client';

import { useState, useEffect } from 'react';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  AlertTriangle,
  Settings2,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Check,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Student, PointPreset } from '@/types';

interface PointsManagementProps {
  students: Student[];
  initialStudent?: Student | null;
  onRefresh: () => void;
}

const DEFAULT_TOPUP_PRESETS: PointPreset[] = [
  { id: 'tu_1', label: 'Menjaga kebersihan kelas', amount: 5000, type: 'topup', category: 'Kebersihan' },
  { id: 'tu_2', label: 'Membuang sampah terpilah (Organik/Anorganik)', amount: 3000, type: 'topup', category: 'Daur Ulang' },
  { id: 'tu_3', label: 'Membawa botol tumbler & kotak makan sendiri', amount: 2000, type: 'topup', category: 'Zero Waste' },
  { id: 'tu_4', label: 'Menjalankan tugas piket harian tepat waktu', amount: 5000, type: 'topup', category: 'Kedisiplinan' },
  { id: 'tu_5', label: 'Menyiram & merawat tanaman taman sekolah', amount: 4000, type: 'topup', category: 'Penghijauan' },
  { id: 'tu_6', label: 'Mematikan lampu & kipas kelas saat pulang', amount: 2000, type: 'topup', category: 'Hemat Energi' },
];

const DEFAULT_PENALTY_PRESETS: PointPreset[] = [
  { id: 'pen_1', label: 'Membuang sampah sembarangan', amount: 3000, type: 'adjust', category: 'Pelanggaran' },
  { id: 'pen_2', label: 'Meninggalkan kelas dalam keadaan kotor', amount: 5000, type: 'adjust', category: 'Pelanggaran' },
  { id: 'pen_3', label: 'Merusak fasilitas tanaman / taman sekolah', amount: 10000, type: 'adjust', category: 'Pelanggaran Berat' },
  { id: 'pen_4', label: 'Tidak menjalankan tugas piket harian kelas', amount: 5000, type: 'adjust', category: 'Kedisiplinan' },
  { id: 'pen_5', label: 'Meninggalkan kran air / lampu menyala', amount: 2000, type: 'adjust', category: 'Pemborosan Energi' },
  { id: 'pen_6', label: 'Membawa sampah plastik sekali pakai berlebih', amount: 2000, type: 'adjust', category: 'Kebersihan' },
];

export default function PointsManagement({
  students,
  initialStudent,
  onRefresh,
}: PointsManagementProps) {
  const [mode, setMode] = useState<'topup' | 'adjust'>('topup');
  const [selectedUid, setSelectedUid] = useState<string>(initialStudent?.uid || '');
  const [amount, setAmount] = useState<string>('5000');
  const [reason, setReason] = useState<string>('Menjaga kebersihan kelas');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tu_1');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Presets state
  const [topupPresets, setTopupPresets] = useState<PointPreset[]>(DEFAULT_TOPUP_PRESETS);
  const [penaltyPresets, setPenaltyPresets] = useState<PointPreset[]>(DEFAULT_PENALTY_PRESETS);
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Preset configuration modal state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [savingPresets, setSavingPresets] = useState(false);
  const [editPresetList, setEditPresetList] = useState<PointPreset[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('5000');
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  // Load presets from server or localStorage
  useEffect(() => {
    const fetchPresets = async () => {
      setLoadingPresets(true);
      try {
        const res = await fetch('/api/admin/presets', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data) {
          setTopupPresets(json.data.topup || DEFAULT_TOPUP_PRESETS);
          setPenaltyPresets(json.data.penalty || DEFAULT_PENALTY_PRESETS);
        }
      } catch (err) {
        console.warn('Failed to load presets, using defaults:', err);
      } finally {
        setLoadingPresets(false);
      }
    };

    fetchPresets();
  }, []);

  // Update selected preset default when switching mode
  useEffect(() => {
    if (mode === 'topup') {
      const first = topupPresets[0];
      if (first) {
        setSelectedPresetId(first.id);
        setReason(first.label);
        setAmount(first.amount.toString());
      } else {
        setSelectedPresetId('custom');
      }
    } else {
      const first = penaltyPresets[0];
      if (first) {
        setSelectedPresetId(first.id);
        setReason(first.label);
        setAmount(first.amount.toString());
      } else {
        setSelectedPresetId('custom');
      }
    }
    setFeedback(null);
  }, [mode, topupPresets, penaltyPresets]);

  const selectedStudent = students.find((s) => s.uid === selectedUid);
  const currentPoin = selectedStudent?.poin || 0;
  const numAmount = Number(amount) || 0;
  const nextPoin = mode === 'topup' ? currentPoin + numAmount : currentPoin - numAmount;

  // Handle preset card click
  const handleSelectPreset = (preset: PointPreset) => {
    setSelectedPresetId(preset.id);
    setReason(preset.label);
    setAmount(preset.amount.toString());
    setFeedback(null);
  };

  // Handle "Lainnya" click
  const handleSelectCustom = () => {
    setSelectedPresetId('custom');
    setReason('');
    setAmount('');
    setFeedback(null);
  };

  // Open config modal
  const handleOpenConfig = () => {
    const currentList = mode === 'topup' ? topupPresets : penaltyPresets;
    setEditPresetList(JSON.parse(JSON.stringify(currentList)));
    setNewLabel('');
    setNewAmount(mode === 'topup' ? '5000' : '3000');
    setConfigFeedback(null);
    setIsConfigOpen(true);
  };

  // Add new preset in config modal
  const handleAddPreset = () => {
    if (!newLabel.trim()) {
      setConfigFeedback('Nama alasan tidak boleh kosong.');
      return;
    }
    const val = Number(newAmount);
    if (isNaN(val) || val <= 0) {
      setConfigFeedback('Nominal harus lebih besar dari 0.');
      return;
    }

    const newPreset: PointPreset = {
      id: `${mode}_${Date.now()}`,
      label: newLabel.trim(),
      amount: val,
      type: mode,
      category: mode === 'topup' ? 'Apresiasi' : 'Pelanggaran',
    };

    setEditPresetList((prev) => [...prev, newPreset]);
    setNewLabel('');
    setNewAmount(mode === 'topup' ? '5000' : '3000');
    setConfigFeedback(null);
  };

  // Edit amount/label of preset in modal
  const handleUpdatePresetItem = (index: number, field: 'label' | 'amount', value: any) => {
    const updated = [...editPresetList];
    if (field === 'amount') {
      updated[index].amount = Math.max(0, Number(value) || 0);
    } else {
      updated[index].label = value;
    }
    setEditPresetList(updated);
  };

  // Delete preset in modal
  const handleDeletePresetItem = (index: number) => {
    setEditPresetList((prev) => prev.filter((_, i) => i !== index));
  };

  // Save presets to server
  const handleSaveConfig = async () => {
    setSavingPresets(true);
    setConfigFeedback(null);

    const newTopup = mode === 'topup' ? editPresetList : topupPresets;
    const newPenalty = mode === 'adjust' ? editPresetList : penaltyPresets;

    try {
      const res = await fetch('/api/admin/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topup: newTopup, penalty: newPenalty }),
      });
      const data = await res.json();

      if (data.success) {
        if (mode === 'topup') {
          setTopupPresets(editPresetList);
        } else {
          setPenaltyPresets(editPresetList);
        }
        setIsConfigOpen(false);
      } else {
        setConfigFeedback(data.message || 'Gagal menyimpan preset.');
      }
    } catch {
      setConfigFeedback('Terjadi kesalahan jaringan.');
    } finally {
      setSavingPresets(false);
    }
  };

  // Reset presets to default
  const handleResetToDefault = () => {
    if (confirm('Kembalikan daftar preset alasan ke standar bawaan?')) {
      const defaults = mode === 'topup' ? DEFAULT_TOPUP_PRESETS : DEFAULT_PENALTY_PRESETS;
      setEditPresetList(JSON.parse(JSON.stringify(defaults)));
    }
  };

  // Handle form submit
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
            ? `Berhasil menambahkan +Rp${numAmount.toLocaleString('id-ID')} poin untuk ${selectedStudent?.nama} (${reason}). Saldo baru: Rp${nextPoin.toLocaleString('id-ID')}`
            : `Berhasil mengurangi -Rp${numAmount.toLocaleString('id-ID')} poin untuk ${selectedStudent?.nama} (${reason}). Saldo baru: Rp${nextPoin.toLocaleString('id-ID')}`,
      });

      onRefresh();
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  };

  const activePresets = mode === 'topup' ? topupPresets : penaltyPresets;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs">
        <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
          <Coins className="w-5 h-5 text-[#35C96F]" />
          <span>Sistem Pengelolaan Poin Siswa</span>
        </h2>
        <p className="text-xs text-[#74857B] mt-1">
          Beri penghargaan aksi positif siswa atau terapkan pengurangan poin untuk kejadian pelanggaran
        </p>

        {/* Tab Toggle: Top Up vs Adjustment */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-[#F7FBF7] rounded-xl border border-[#E5EEE7]">
          <button
            type="button"
            onClick={() => {
              setMode('topup');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'topup'
                ? 'bg-white text-[#159447] shadow-xs border border-[#E5EEE7]'
                : 'text-[#74857B] hover:text-[#18352A]'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-[#20A65A]" />
            <span>Tambah Poin (Penghargaan / Reward)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('adjust');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'adjust'
                ? 'bg-white text-[#E05252] shadow-xs border border-[#E5EEE7]'
                : 'text-[#74857B] hover:text-[#18352A]'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-[#E05252]" />
            <span>Kurangi Poin (Pelanggaran / Kejadian)</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
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
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A] font-medium"
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map((st) => (
                <option key={st.uid} value={st.uid}>
                  {st.nama} ({st.kelas}) — Saldo: Rp{st.poin.toLocaleString('id-ID')} [{st.uid}]
                </option>
              ))}
            </select>
          </div>

          {/* Reason Buttons with Nominal & Configuration Button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#18352A] flex items-center gap-1.5">
                <span>
                  {mode === 'topup' ? 'Pilih Alasan Reward:' : 'Pilih Alasan Pelanggaran:'}
                </span>
              </label>

              {/* Configure Presets Button */}
              <button
                type="button"
                onClick={handleOpenConfig}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#35C96F]/40 bg-[#E8F9EE] text-[#159447] hover:bg-[#35C96F] hover:text-white transition-all flex items-center gap-1 active:scale-95"
                title="Edit nilai atau tambah alasan baru"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Atur Preset</span>
              </button>
            </div>

            {/* Grid of Reason Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activePresets.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 active:scale-98 ${
                      isSelected
                        ? mode === 'topup'
                          ? 'bg-[#E8F9EE] border-[#35C96F] shadow-xs ring-1 ring-[#35C96F]'
                          : 'bg-red-50 border-[#E05252] shadow-xs ring-1 ring-[#E05252]'
                        : 'bg-[#F7FBF7] border-[#E5EEE7] hover:border-[#35C96F] hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <p className="text-xs font-bold text-[#18352A] line-clamp-2 leading-snug">
                        {preset.label}
                      </p>
                      {preset.category && (
                        <span className="text-[10px] text-[#74857B] block mt-0.5">
                          {preset.category}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-lg shrink-0 ${
                        mode === 'topup'
                          ? 'bg-white text-[#159447] border border-[#35C96F]/30'
                          : 'bg-white text-[#E05252] border border-red-200'
                      }`}
                    >
                      {mode === 'topup' ? '+' : '-'}Rp{preset.amount.toLocaleString('id-ID')}
                    </span>
                  </button>
                );
              })}

              {/* Custom / "Lainnya" Button Card */}
              <button
                type="button"
                onClick={handleSelectCustom}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 active:scale-98 ${
                  selectedPresetId === 'custom'
                    ? mode === 'topup'
                      ? 'bg-[#E8F9EE] border-[#35C96F] shadow-xs ring-1 ring-[#35C96F]'
                      : 'bg-red-50 border-[#E05252] shadow-xs ring-1 ring-[#E05252]'
                    : 'bg-gray-50 border-dashed border-[#CBDAD0] hover:border-[#35C96F] hover:bg-white'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-[#18352A] flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-[#159447]" />
                    <span>Alasan Lainnya</span>
                  </p>
                  <span className="text-[10px] text-[#74857B]">Input nominal bebas</span>
                </div>
                <span className="text-xs font-bold text-[#74857B] bg-white px-2 py-0.5 rounded-lg border border-[#E5EEE7]">
                  Bebas
                </span>
              </button>
            </div>
          </div>

          {/* Custom Reason & Nominal Input (Only editable when 'custom' selected) */}
          {selectedPresetId === 'custom' ? (
            <div className="bg-[#F7FBF7] p-4 rounded-2xl border border-[#E5EEE7] space-y-3 animate-fadeIn">
              <span className="text-[11px] font-bold text-[#18352A] uppercase tracking-wide block">
                Alasan & Nominal Kustom
              </span>

              <div>
                <label className="text-xs font-bold text-[#18352A] block mb-1">
                  Keterangan Alasan *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    mode === 'topup'
                      ? 'Contoh: Juara 1 lomba kebersihan kelas'
                      : 'Contoh: Terlambat piket atau membuang sampah di laci'
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-white text-[#18352A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18352A] block mb-1">
                  Nominal Poin (Rp) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="Contoh: 10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-base font-bold rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-white text-[#18352A]"
                />
              </div>
            </div>
          ) : (
            /* Selected Reason (Locked Nominal - sesuai konfigurasi) */
            <div className="bg-[#F7FBF7] px-4 py-3 rounded-xl border border-[#E5EEE7] flex items-center justify-between text-xs">
              <div className="min-w-0 pr-3">
                <span className="text-[#74857B] block text-[11px]">Alasan:</span>
                <span className="font-bold text-[#18352A] truncate block">{reason}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[#74857B] block text-[11px]">Nominal:</span>
                <span
                  className={`font-extrabold text-sm px-2.5 py-1 rounded-lg inline-block ${
                    mode === 'topup'
                      ? 'bg-[#E8F9EE] text-[#159447] border border-[#35C96F]/30'
                      : 'bg-red-50 text-[#E05252] border border-red-200'
                  }`}
                >
                  {mode === 'topup' ? '+' : '-'}Rp{Number(amount).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Live Preview Card */}
          {selectedStudent && (
            <div className="bg-[#F7FBF7] rounded-2xl p-4 border border-[#E5EEE7] space-y-2.5 text-xs">
              <span className="font-bold text-[#18352A] uppercase tracking-wider text-[10px] block">
                Ringkasan Transaksi Poin
              </span>

              <div className="grid grid-cols-2 gap-2 text-[#74857B]">
                <div>
                  <p>
                    Nama Siswa:{' '}
                    <strong className="text-[#18352A] capitalize">{selectedStudent.nama}</strong>
                  </p>
                  <p>
                    Kelas: <strong className="text-[#18352A]">{selectedStudent.kelas}</strong>
                  </p>
                  <p>
                    Alasan: <strong className="text-[#18352A]">{reason || '-'}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <p>
                    Saldo Awal: <strong>Rp{currentPoin.toLocaleString('id-ID')}</strong>
                  </p>
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
                <span>Tambah Poin</span>
              </>
            ) : (
              <>
                <ArrowDownLeft className="w-5 h-5" />
                <span>Kurangi Poin</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Preset Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E5EEE7] relative animate-fadeIn max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7] shrink-0">
              <div>
                <h3 className="font-bold text-base text-[#18352A] flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-[#35C96F]" />
                  <span>
                    Atur Preset Alasan (
                    {mode === 'topup' ? 'Tambah Poin' : 'Kurangi Poin'})
                  </span>
                </h3>
                <p className="text-xs text-[#74857B]">
                  Sesuaikan daftar alasan dan nominal poin
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-lg text-[#74857B] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {configFeedback && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 text-[#E05252] text-xs font-medium border border-red-100">
                {configFeedback}
              </div>
            )}

            {/* List of Presets (Scrollable) */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <span className="text-[11px] font-bold text-[#74857B] uppercase tracking-wider block">
                Daftar Tombol Alasan Aktif:
              </span>

              {editPresetList.length === 0 ? (
                <p className="text-center py-4 text-xs text-[#74857B]">Belum ada preset alasan.</p>
              ) : (
                editPresetList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl bg-[#F7FBF7] border border-[#E5EEE7] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleUpdatePresetItem(idx, 'label', e.target.value)}
                        placeholder="Nama alasan..."
                        className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#E5EEE7] bg-white focus:outline-none focus:border-[#35C96F]"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePresetItem(idx)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 shrink-0"
                        title="Hapus Preset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#74857B]">Nilai Poin (Rp):</span>
                      <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#E5EEE7]">
                        <span className="font-bold text-[#74857B]">Rp</span>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.amount}
                          onChange={(e) => handleUpdatePresetItem(idx, 'amount', e.target.value)}
                          className="w-24 text-right font-extrabold text-[#159447] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Add New Preset Section */}
              <div className="pt-3 border-t border-[#E5EEE7] space-y-2">
                <span className="text-[11px] font-bold text-[#18352A] flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-[#159447]" />
                  <span>Tambah Alasan Baru:</span>
                </span>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Tulis alasan baru..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5EEE7] bg-white focus:outline-none focus:border-[#35C96F]"
                  />

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="Nominal poin (Rp)"
                      className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-[#E5EEE7] bg-white focus:outline-none focus:border-[#35C96F]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPreset}
                      className="px-4 py-2 rounded-xl bg-[#E8F9EE] text-[#159447] font-bold text-xs border border-[#35C96F]/30 hover:bg-[#35C96F] hover:text-white transition-all shrink-0"
                    >
                      + Tambahkan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#E5EEE7] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs text-[#74857B] hover:text-[#18352A] underline"
              >
                Reset Default
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#74857B] hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={savingPresets}
                  className="px-4 py-2 rounded-xl bg-[#35C96F] hover:bg-[#159447] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingPresets ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
