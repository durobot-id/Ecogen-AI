'use client';

import { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle,
  Coins,
  Edit2,
  BookmarkPlus,
  RefreshCw,
  Lightbulb,
  Check,
  Award,
} from 'lucide-react';
import { Student } from '@/types';

interface StrategyItem {
  aktivitas: string;
  kategori: string;
  poin: number;
  tingkatKesulitan: 'Mudah' | 'Sedang' | 'Sulit';
  alasan: string;
  dampakLingkungan: string;
}

interface AIResponseStructure {
  judulProgram: string;
  ringkasanProgram: string;
  rekomendasi: StrategyItem[];
  tipsImplementasi: string[];
}

interface AiStrategyProps {
  students: Student[];
  onOpenTopUpWithPreset: (preset: { amount: number; reason: string }) => void;
}

export default function AiStrategy({ students, onOpenTopUpWithPreset }: AiStrategyProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Kebersihan & Lingkungan');
  const [timeframe, setTimeframe] = useState('Mingguan');
  const [targetPoints, setTargetPoints] = useState('50 - 200 poin');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponseStructure | null>(null);
  const [isFallbackNotice, setIsFallbackNotice] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const categories = [
    'Kebersihan Kelas & Sekolah',
    'Pengurangan Sampah Plastik',
    'Penghijauan & Taman Sekolah',
    'Penghematan Energi Listrik & Air',
    'Gotong Royong & Daur Ulang',
    'Kedisiplinan & Sikap Positif',
  ];

  const handleGenerate = async (customPrompt?: string) => {
    setLoading(true);
    setIsFallbackNotice(null);
    setSavedSuccess(null);

    try {
      const res = await fetch('/api/ai/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt || prompt,
          category: selectedCategory,
          timeframe,
          targetPoints,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        if (data.notice) {
          setIsFallbackNotice(data.notice);
        }
      } else {
        alert(data.message || 'Gagal memproses rekomendasi AI.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat memanggil AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItemPoin = (index: number, newPoin: number) => {
    if (!result) return;
    const updated = [...result.rekomendasi];
    updated[index].poin = Math.max(0, newPoin);
    setResult({ ...result, rekomendasi: updated });
  };

  const handleApplyToStudent = (item: StrategyItem) => {
    onOpenTopUpWithPreset({
      amount: item.poin * 1000, // Or direct value
      reason: `${item.aktivitas} (${item.kategori})`,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#35C96F]" />
            <span>AI Konsultan Strategi EcoPoint (Gemini)</span>
          </h2>
          <p className="text-xs text-[#74857B] mt-0.5">
            Rancang program penghargaan ramah lingkungan, estimasi poin berjenjang, dan tantangan positif sekolah
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#E8F9EE] text-[#159447] font-semibold border border-[#35C96F]/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 2.5 Flash</span>
        </div>
      </div>

      {/* Input Consultation Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-4">
        {/* Category Pills */}
        <div>
          <label className="text-xs font-bold text-[#18352A] block mb-2">
            Kategori Aksi Lingkungan
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-[#35C96F] text-white border-[#35C96F] shadow-xs'
                    : 'bg-[#F7FBF7] text-[#74857B] border-[#E5EEE7] hover:border-[#35C96F] hover:text-[#18352A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="text-xs font-bold text-[#18352A] block mb-1.5">
            Instruksi / Kebutuhan Khusus Admin
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: Berikan strategi poin untuk siswa yang aktif menjaga kebersihan sekolah selama satu minggu, dengan fokus pengurangan sampah botol plastik..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A]"
          />
        </div>

        {/* Period & Target Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#18352A] block mb-1">Periode Program</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5EEE7] bg-[#F7FBF7]"
            >
              <option value="Harian">Harian (Aksi Rutin)</option>
              <option value="Mingguan">Mingguan (Tantangan Kelas)</option>
              <option value="Bulanan">Bulanan (Program Jangka Panjang)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#18352A] block mb-1">Target Poin Per Siswa</label>
            <input
              type="text"
              value={targetPoints}
              onChange={(e) => setTargetPoints(e.target.value)}
              placeholder="Contoh: 50 - 200 poin"
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5EEE7] bg-[#F7FBF7]"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={loading}
            className="py-3 px-6 rounded-xl bg-[#35C96F] hover:bg-[#159447] text-white font-bold text-sm shadow-md shadow-[#35C96F]/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Merumuskan Strategi AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>GENERATE STRATEGI AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Results Display */}
      {result && (
        <div className="space-y-4 animate-fadeIn">
          {isFallbackNotice && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs flex items-center gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{isFallbackNotice}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F9EE] text-[#159447] text-xs font-bold mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>Rekomendasi AI Terverifikasi</span>
              </div>
              <h3 className="text-xl font-bold text-[#18352A]">{result.judulProgram}</h3>
              <p className="text-xs sm:text-sm text-[#74857B] mt-1">{result.ringkasanProgram}</p>
            </div>

            {/* Recommendations Table */}
            <div className="overflow-x-auto border border-[#E5EEE7] rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7FBF7] text-xs font-bold text-[#74857B] border-b border-[#E5EEE7] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Aktivitas Positif</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-center">Tingkat</th>
                    <th className="px-4 py-3 text-right">Rekomendasi Poin</th>
                    <th className="px-4 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EEE7]">
                  {result.rekomendasi.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F7FBF7]/80">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[#18352A]">{item.aktivitas}</p>
                        <p className="text-xs text-[#74857B] mt-0.5">{item.alasan}</p>
                        <span className="text-[11px] text-[#20A65A] font-medium block mt-1">
                          🌱 Dampak: {item.dampakLingkungan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[#74857B] whitespace-nowrap">
                        {item.kategori}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.tingkatKesulitan === 'Mudah'
                              ? 'bg-[#E8F9EE] text-[#159447]'
                              : item.tingkatKesulitan === 'Sedang'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-[#E05252]'
                          }`}
                        >
                          {item.tingkatKesulitan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            min="1"
                            value={item.poin}
                            onChange={(e) => handleEditItemPoin(idx, Number(e.target.value))}
                            className="w-16 px-2 py-1 text-right text-sm font-extrabold text-[#159447] border border-[#E5EEE7] rounded-lg focus:outline-none focus:border-[#35C96F] bg-white"
                          />
                          <span className="text-xs text-[#74857B]">poin</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleApplyToStudent(item)}
                          className="py-1.5 px-3 rounded-lg bg-[#E8F9EE] text-[#159447] text-xs font-semibold hover:bg-[#35C96F] hover:text-white transition-all flex items-center gap-1 ml-auto"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Beri Siswa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Implementation Tips */}
            {result.tipsImplementasi && result.tipsImplementasi.length > 0 && (
              <div className="bg-[#F7FBF7] rounded-xl p-4 border border-[#E5EEE7] space-y-2">
                <p className="text-xs font-bold text-[#18352A] flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-[#35C96F]" />
                  <span>Tips Implementasi di Sekolah</span>
                </p>
                <ul className="text-xs text-[#74857B] space-y-1 list-disc pl-5">
                  {result.tipsImplementasi.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
