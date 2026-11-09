import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { prompt, category, timeframe, targetPoints } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Smart curated fallback when API key is not yet set
      const fallbackResult: AIResponseStructure = getSmartFallbackStrategy(prompt, category);
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        isFallback: true,
        notice: 'Menggunakan template strategi cerdas EcoGen. Untuk hasil kustom Gemini AI, isi GEMINI_API_KEY di file .env.local.',
      });
    }

    // Call Google Gemini API
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const systemPrompt = `Anda adalah asisten konsultan strategi penghargaan lingkungan "EcoGen AI" untuk sekolah.
Tugas Anda adalah merumuskan sistem penghargaan EcoPoint bagi siswa yang melakukan aksi positif ramah lingkungan dan sosial.
ATURAN KETAT:
1. Poin harus wajar dan proporsional (rentang 5 sampai 100 poin, kelipatan 5 atau 10).
2. Nilai poin harus mencerminkan tingkat kesulitan dan dampak nyata terhadap lingkungan sekolah.
3. Hindari rekomendasi yang diskriminatif atau memberatkan siswa.
4. Output HARUS dalam format JSON valid sesuai skema yang diminta, tanpa markdown triple backticks tambahan.`;

    const userPromptText = `Buat rekomendasi strategi pemberian EcoPoint dengan parameter berikut:
- Kebutuhan Admin: ${prompt || 'Strategi kebersihan dan kepedulian lingkungan sekolah mingguan'}
- Kategori Fokus: ${category || 'Kebersihan & Penghijauan'}
- Durasi/Periode: ${timeframe || 'Mingguan'}
- Estimasi Budget Poin Siswa: ${targetPoints || 'Rata-rata 50 - 200 poin per siswa'}

Format output JSON harus mengikuti struktur:
{
  "judulProgram": "string",
  "ringkasanProgram": "string",
  "rekomendasi": [
    {
      "aktivitas": "string",
      "kategori": "string",
      "poin": number,
      "tingkatKesulitan": "Mudah" | "Sedang" | "Sulit",
      "alasan": "string",
      "dampakLingkungan": "string"
    }
  ],
  "tipsImplementasi": [
    "string"
  ]
}`;

    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPromptText}` }] },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed: AIResponseStructure;

    try {
      // Clean possible backticks if any
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      console.warn('Failed to parse Gemini JSON output, using fallback structure');
      parsed = getSmartFallbackStrategy(prompt, category);
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Gemini AI Strategy error:', error);
    // Return curated fallback on API errors so user workflow doesn't break
    const fallbackResult = getSmartFallbackStrategy(
      'Strategi Aksi Lingkungan Siswa',
      'Lingkungan Hidup'
    );
    return NextResponse.json({
      success: true,
      data: fallbackResult,
      isFallback: true,
      notice: `Gagal memanggil Gemini API (${error.message}). Menampilkan rekomendasi preset teruji.`,
    });
  }
}

function getSmartFallbackStrategy(prompt?: string, category?: string): AIResponseStructure {
  const cat = category || 'Kebersihan';
  return {
    judulProgram: `Program EcoGen: ${cat} & Peduli Lingkungan Sekolah`,
    ringkasanProgram: `Strategi komprehensif untuk meningkatkan partisipasi aktif siswa dalam ${prompt || 'kebersihan dan keberlanjutan sekolah'} melalui penghargaan poin berjenjang.`,
    rekomendasi: [
      {
        aktivitas: 'Membuang sampah terpilah (Organik / Anorganik) pada tempatnya',
        kategori: 'Kebersihan & Daur Ulang',
        poin: 10,
        tingkatKesulitan: 'Mudah',
        alasan: 'Membangun kebiasaan mendasar pemilahan sampah harian.',
        dampakLingkungan: 'Mempermudah proses komposting dan daur ulang sekolah.',
      },
      {
        aktivitas: 'Membawa botol minum (Tumbler) dan wadah makan sendiri',
        kategori: 'Pengurangan Sampah',
        poin: 15,
        tingkatKesulitan: 'Mudah',
        alasan: 'Mendorong pengurangan plastik sekali pakai di kantin sekolah.',
        dampakLingkungan: 'Mengurangi hingga ratusan botol plastik per minggu.',
      },
      {
        aktivitas: 'Menjalankan piket kelas dan menjaga kerapihan ruang belajar',
        kategori: 'Kebersihan Kelas',
        poin: 25,
        tingkatKesulitan: 'Sedang',
        alasan: 'Mendorong tanggung jawab bersama dalam merawat kelas.',
        dampakLingkungan: 'Menciptakan lingkungan belajar yang higienis dan nyaman.',
      },
      {
        aktivitas: 'Menyiram dan merawat tanaman taman sekolah atau green house',
        kategori: 'Penghijauan',
        poin: 30,
        tingkatKesulitan: 'Sedang',
        alasan: 'Menumbuhkan rasa cinta dan tanggung jawab terhadap flora sekolah.',
        dampakLingkungan: 'Meningkatkan resapan air dan keteduhan udara sekolah.',
      },
      {
        aktivitas: 'Memastikan lampu dan kipas angin kelas dimatikan saat pulang',
        kategori: 'Konservasi Energi',
        poin: 20,
        tingkatKesulitan: 'Mudah',
        alasan: 'Edukasi pentingnya efisiensi daya listrik.',
        dampakLingkungan: 'Menghemat konsumsi energi listrik dan menurunkan emisi.',
      },
      {
        aktivitas: 'Inisiatif proyek daur ulang kreasi barang bekas antarkelas',
        kategori: 'Kreativitas Lingkungan',
        poin: 50,
        tingkatKesulitan: 'Sulit',
        alasan: 'Apresiasi kerja sama dan pemikiran kritis pengolahan limbah.',
        dampakLingkungan: 'Memberikan nilai guna baru pada sampah anorganik.',
      },
    ],
    tipsImplementasi: [
      'Gunakan sistem verifikasi oleh guru piket atau duta lingkungan kelas.',
      'Berikan apresiasi berkala saat upacara bendera untuk kelas dengan EcoPoint tertinggi.',
      'Sediakan opsi penukaran poin kasir di kantin sehat sekolah atau toko koperasi.',
      'Pastikan saldo poin siswa selalu transparan dan dapat dipantau di EcoGen AI.',
    ],
  };
}
