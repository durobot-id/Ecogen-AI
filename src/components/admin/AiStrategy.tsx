'use client';

import { useState } from 'react';
import {
  Sparkles,
  Coins,
  RefreshCw,
  Lightbulb,
  Award,
  Gift,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowRight,
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

interface RedemptionItem {
  namaReward: string;
  kategoriReward: string;
  poinDibutuhkan: number;
  deskripsi: string;
  dayaTarikSiswa: string;
}

interface AIResponseStructure {
  judulProgram: string;
  ringkasanProgram: string;
  idePertukaranPoin: RedemptionItem[];
  rekomendasi: StrategyItem[];
  tipsImplementasi: string[];
}

interface AiStrategyProps {
  students: Student[];
  onOpenTopUpWithPreset: (preset: { amount: number; reason: string }) => void;
}

export default function AiStrategy({ onOpenTopUpWithPreset }: AiStrategyProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Pertukaran Poin & Reward Siswa');
  const [focusMode, setFocusMode] = useState<'redemption' | 'earning' | 'both'>('redemption');
  const [timeframe, setTimeframe] = useState('Mingguan');
  const [targetPoints, setTargetPoints] = useState('5.000 - 30.000 poin');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponseStructure | null>(null);
  const [isFallbackNotice, setIsFallbackNotice] = useState<string | null>(null);
  const [showApiGuide, setShowApiGuide] = useState(false);

  const categories = [
    'Pertukaran Poin & Reward Siswa',
    'Voucher Kantin & Jajanan Sehat',
    'Hak Istimewa (Privilege) Sekolah',
    'Merchandise Ramah Lingkungan',
    'Kebersihan Kelas & Zero Waste',
    'Tantangan Kolektif Antarkelas',
  ];

  const handleGenerate = async (customPrompt?: string) => {
    setLoading(true);
    setIsFallbackNotice(null);

    try {
      const res = await fetch('/api/ai/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt || prompt,
          category: selectedCategory,
          focusMode,
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

  const handleApplyToStudent = (item: StrategyItem) => {
    onOpenTopUpWithPreset({
      amount: item.poin,
      reason: `${item.aktivitas} (${item.kategori})`,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#35C96F]" />
            <span>AI Konsultan Strategi & Pertukaran EcoPoint</span>
          </h2>
          <p className="text-xs text-[#74857B] mt-0.5">
            Rancang ide penukaran poin yang menarik bagi siswa, program reward kreatif, dan gamifikasi lingkungan
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowApiGuide(!showApiGuide)}
          className="text-xs px-3 py-1.5 rounded-xl border border-[#35C96F]/40 bg-[#E8F9EE] text-[#159447] font-semibold hover:bg-[#35C96F] hover:text-white transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Panduan API Key</span>
          {showApiGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Guide Banner for Gemini API Key */}
      {showApiGuide && (
        <div className="bg-white rounded-2xl p-5 border border-[#35C96F]/30 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-bold text-[#18352A]">
            <Key className="w-4 h-4 text-[#35C96F]" />
            <span>Cara Mendapatkan Google Gemini API Key (Gratis & Cepat):</span>
          </div>

          <ol className="text-xs text-[#74857B] space-y-1.5 list-decimal pl-5 leading-relaxed">
            <li>
              Buka website resmi <strong>Google AI Studio</strong> di{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#159447] font-bold underline inline-flex items-center gap-0.5"
              >
                <span>aistudio.google.com/app/apikey</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Login menggunakan akun Google Anda.</li>
            <li>Klik tombol <strong>&quot;Create API Key&quot;</strong> (Pilih project default Google Cloud yang disediakan).</li>
            <li>Salin (Copy) kode API Key yang dihasilkan.</li>
            <li>
              Buka file <code>.env.local</code> di folder proyek Anda (<code>D:\proyek\Ecogen-website\.env.local</code>), lalu tempel API Key tersebut pada baris:
              <pre className="bg-[#F7FBF7] p-2 mt-1 rounded-lg border border-[#E5EEE7] text-[#18352A] font-mono text-[11px]">
                GEMINI_API_KEY=AIzaSy...your_api_key_here
              </pre>
            </li>
            <li>Restart server (<code>npm run dev</code>) jika sedang berjalan. Selesai! AI Gemini langsung aktif 100%.</li>
          </ol>
        </div>
      )}

      {/* Input Consultation Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-4">
        {/* Focus Mode Tabs */}
        <div>
          <label className="text-xs font-bold text-[#18352A] block mb-1.5">Fokus Rencana AI:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'redemption', label: 'Ide Pertukaran Poin (Reward Siswa)', icon: Gift },
              { id: 'earning', label: 'Aktivitas Memperoleh Poin', icon: Coins },
              { id: 'both', label: 'Paket Lengkap Ekosistem', icon: Award },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = focusMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFocusMode(m.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#35C96F] text-white border-[#35C96F] shadow-xs'
                      : 'bg-[#F7FBF7] text-[#74857B] border-[#E5EEE7] hover:border-[#35C96F]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Pills */}
        <div>
          <label className="text-xs font-bold text-[#18352A] block mb-2">Tema / Kategori Fokus</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-[#159447] text-white border-[#159447] shadow-xs'
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
            Instruksi / Gagasan Khusus Anda
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: Berikan ide reward pertukaran poin di kantin dan sekolah yang murah tapi sangat disukai siswa SMP/SMA agar mereka berlomba-lomba mengumpulkan poin..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A]"
          />
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
                <span>Merumuskan Ide & Strategi AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>GENERATE IDE REWARD & STRATEGI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Results Display */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {isFallbackNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs flex items-center gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{isFallbackNotice}</span>
            </div>
          )}

          {/* Program Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F9EE] text-[#159447] text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Program Inovasi EcoPoint</span>
            </div>
            <h3 className="text-xl font-bold text-[#18352A]">{result.judulProgram}</h3>
            <p className="text-xs sm:text-sm text-[#74857B] leading-relaxed">{result.ringkasanProgram}</p>
          </div>

          {/* Section 1: Ide Pertukaran Poin Siswa (Redemption Catalog) */}
          {result.idePertukaranPoin && result.idePertukaranPoin.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5EEE7]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F9EE] text-[#159447] flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#18352A]">
                      Katalog Ide Pertukaran Poin Siswa
                    </h4>
                    <p className="text-xs text-[#74857B]">
                      Hadiah & privilege yang membuat siswa tertarik mengumpulkan poin
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {result.idePertukaranPoin.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#F7FBF7] border border-[#E5EEE7] hover:border-[#35C96F] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#159447] border border-[#E5EEE7]">
                          {item.kategoriReward}
                        </span>
                        <span className="font-extrabold text-sm text-[#159447] bg-[#E8F9EE] px-2.5 py-0.5 rounded-lg border border-[#35C96F]/30">
                          {item.poinDibutuhkan.toLocaleString('id-ID')} Poin
                        </span>
                      </div>

                      <h5 className="font-bold text-sm text-[#18352A] mt-2">{item.namaReward}</h5>
                      <p className="text-xs text-[#74857B] mt-1">{item.deskripsi}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#E5EEE7]/80">
                      <p className="text-[11px] text-[#20A65A] font-medium">
                        ✨ <strong>Daya Tarik:</strong> {item.dayaTarikSiswa}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Rekomendasi Aksi Positif Siswa */}
          {result.rekomendasi && result.rekomendasi.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5EEE7]">
                <div className="w-8 h-8 rounded-lg bg-[#E8F9EE] text-[#159447] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#18352A]">
                    Aksi Positif untuk Memperoleh Poin
                  </h4>
                  <p className="text-xs text-[#74857B]">
                    Aktivitas ramah lingkungan yang dapat dinilai oleh guru / kasir
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#E5EEE7] rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7FBF7] text-xs font-bold text-[#74857B] border-b border-[#E5EEE7] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Aktivitas</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3 text-right">Nilai Poin</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EEE7]">
                    {result.rekomendasi.map((act, idx) => (
                      <tr key={idx} className="hover:bg-[#F7FBF7]/80">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#18352A]">{act.aktivitas}</p>
                          <p className="text-xs text-[#74857B] mt-0.5">{act.alasan}</p>
                          <span className="text-[11px] text-[#20A65A] font-medium block mt-1">
                            🌱 Dampak: {act.dampakLingkungan}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#74857B] whitespace-nowrap">
                          {act.kategori}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-[#159447] whitespace-nowrap">
                          +{act.poin.toLocaleString('id-ID')} Poin
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleApplyToStudent(act)}
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
            </div>
          )}

          {/* Section 3: Tips Implementasi */}
          {result.tipsImplementasi && result.tipsImplementasi.length > 0 && (
            <div className="bg-[#F7FBF7] rounded-2xl p-5 border border-[#E5EEE7] space-y-2">
              <p className="text-xs font-bold text-[#18352A] flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#35C96F]" />
                <span>Tips Gamifikasi & Sosialisasi ke Siswa</span>
              </p>
              <ul className="text-xs text-[#74857B] space-y-1.5 list-disc pl-5">
                {result.tipsImplementasi.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
