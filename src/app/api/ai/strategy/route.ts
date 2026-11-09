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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { prompt, category, timeframe, targetPoints, focusMode = 'redemption' } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Smart curated fallback when API key is not yet set
      const fallbackResult: AIResponseStructure = getSmartFallbackStrategy(prompt, category, focusMode);
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        isFallback: true,
        notice: 'Menggunakan template strategi EcoGen. Untuk prompt kustom langsung dengan AI, masukkan GEMINI_API_KEY di file .env.local.',
      });
    }

    // Call Google Gemini API
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    const systemPrompt = `Anda adalah konsultan inovasi gamifikasi dan ekonomi poin ramah lingkungan "EcoGen AI" untuk lingkungan sekolah.
Tugas Anda adalah merumuskan sistem penghargaan EcoPoint dan KATALOG PERTUKARAN POIN (Reward Redemption) yang SANGAT MENARIK, KREATIF, dan REALISTIS agar siswa antusias mengumpulkan serta menukarkan poin.
PRINSIP PENTING:
1. Hadiah/pertukaran poin tidak harus selalu barang mahal; hak istimewa sosial, pengalaman sekolah, voucher kantin, dan merchandise ramah lingkungan sangat diminati siswa.
2. Nilai poin harus realistis (misal: 10.000 - 50.000 poin untuk hadiah menarik, 2.000 - 10.000 poin untuk jajanan kantin).
3. Output HARUS dalam format JSON valid sesuai skema yang diminta, tanpa markdown triple backticks tambahan.`;

    const userPromptText = `Rancang ide dan strategi EcoPoint dengan parameter berikut:
- Permintaan Admin: ${prompt || 'Rancangan pertukaran poin kreatif agar siswa tertarik dan giat mengumpulkan poin'}
- Kategori Fokus: ${category || 'Pertukaran Poin & Gamifikasi'}
- Model Fokus: ${focusMode} (Prioritaskan ide penukaran poin yang membuat siswa bersemangat)
- Estimasi Budget/Poin Siswa: ${targetPoints || 'Poin harian 5.000 - 20.000'}

Format JSON HARUS sesuai struktur:
{
  "judulProgram": "string",
  "ringkasanProgram": "string",
  "idePertukaranPoin": [
    {
      "namaReward": "string",
      "kategoriReward": "string (Kantin / Fasilitas Sekolah / Privilege / Merchandise / Akademik)",
      "poinDibutuhkan": number,
      "deskripsi": "string",
      "dayaTarikSiswa": "string (alasan mengapa siswa sangat menginginkannya)"
    }
  ],
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
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
      if (!parsed.idePertukaranPoin) {
        parsed.idePertukaranPoin = getSmartFallbackStrategy(prompt, category).idePertukaranPoin;
      }
    } catch {
      console.warn('Failed to parse Gemini JSON output, using fallback structure');
      parsed = getSmartFallbackStrategy(prompt, category, focusMode);
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Gemini AI Strategy error:', error);
    const fallbackResult = getSmartFallbackStrategy(
      'Strategi Pertukaran Poin Kreatif',
      'Pertukaran Poin',
      'redemption'
    );
    return NextResponse.json({
      success: true,
      data: fallbackResult,
      isFallback: true,
      notice: `Gagal memanggil Gemini API (${error.message}). Menampilkan rekomendasi ide pertukaran teruji.`,
    });
  }
}

function getSmartFallbackStrategy(prompt?: string, category?: string, focusMode?: string): AIResponseStructure {
  return {
    judulProgram: `Ekosistem EcoPoint: Katalog Pertukaran Reward & Aksi Lingkungan Sekolah`,
    ringkasanProgram: `Konsep terpadu pertukaran poin yang memotivasi siswa dengan hadiah langsung di kantin, privilege sekolah, dan merchandise eco-friendly.`,
    idePertukaranPoin: [
      {
        namaReward: 'Voucher Jajanan Kantin Sehat (Rp5.000 / Rp10.000)',
        kategoriReward: 'Kantin Sekolah',
        poinDibutuhkan: 5000,
        deskripsi: 'Siswa dapat menggunakan poin kartu RFID langsung di kasir kantin untuk membeli makanan/minuman sehat.',
        dayaTarikSiswa: 'Sangat diminati karena menghemat uang saku siswa setiap hari secara nyata.',
      },
      {
        namaReward: 'Pass Bebas Antrian Kantin (Golden Ticket)',
        kategoriReward: 'Privilege Sekolah',
        poinDibutuhkan: 15000,
        deskripsi: 'Tiket prioritas istirahat untuk mendahului antrian kantin yang padat selama 3 hari berturut-turut.',
        dayaTarikSiswa: 'Memberikan rasa prestise dan kenyamanan tinggi saat jam istirahat sekolah yang singkat.',
      },
      {
        namaReward: 'Hak Pilih Tempat Duduk Kelas Favorit (1 Minggu)',
        kategoriReward: 'Privilege Kelas',
        poinDibutuhkan: 20000,
        deskripsi: 'Siswa berhak memilih posisi meja dan tempat duduk terbaik di kelas untuk periode satu pekan.',
        dayaTarikSiswa: 'Daya tarik psikologis yang besar bagi siswa tanpa mengeluarkan biaya anggaran sekolah.',
      },
      {
        namaReward: 'Tumbler Stainless & Alat Makan EcoGen Keren',
        kategoriReward: 'Merchandise Eksklusif',
        poinDibutuhkan: 35000,
        deskripsi: 'Botol minum insulasi bertuliskan nama siswa dan logo EcoGen sebagai tanda duta lingkungan sekolah.',
        dayaTarikSiswa: 'Siswa bangga membawanya karena terlihat eksklusif dan keren di antara teman-temannya.',
      },
      {
        namaReward: 'Peminjaman Ekstra Buku & Bebas Denda Perpustakaan',
        kategoriReward: 'Fasilitas Akademik',
        poinDibutuhkan: 10000,
        deskripsi: 'Bisa meminjam hingga 4 buku sekaligus dengan perpanjangan waktu 2 minggu tanpa denda.',
        dayaTarikSiswa: 'Sangat disukai siswa yang suka membaca novel atau materi belajar tanpa cemas denda.',
      },
      {
        namaReward: 'Party Box Es Krim / Pizza untuk 1 Kelas (Kolektif)',
        kategoriReward: 'Tantangan Kelas',
        poinDibutuhkan: 150000,
        deskripsi: 'Poin gabungan satu kelas yang dapat ditukarkan untuk pesta es krim atau snack bersama saat jam santai.',
        dayaTarikSiswa: 'Menciptakan kekompakan dan gotong royong antar siswa dalam satu kelas untuk saling mengingatkan aksi ramah lingkungan.',
      },
    ],
    rekomendasi: [
      {
        aktivitas: 'Membawa botol minum (Tumbler) dan kotak makan sendiri ke kantin',
        kategori: 'Zero Waste',
        poin: 2000,
        tingkatKesulitan: 'Mudah',
        alasan: 'Mencegah timbunan kemasan plastik sekali pakai di kantin sekolah.',
        dampakLingkungan: 'Mengurangi hingga 200+ sampah plastik per siswa per tahun.',
      },
      {
        aktivitas: 'Menyetor 5 botol plastik PET bersih ke Bank Sampah Sekolah',
        kategori: 'Daur Ulang',
        poin: 3000,
        tingkatKesulitan: 'Mudah',
        alasan: 'Mendidik siswa untuk mengumpulkan dan memilah sampah bernilai jual.',
        dampakLingkungan: 'Memastikan sampah anorganik masuk ke rantai daur ulang.',
      },
      {
        aktivitas: 'Menjalankan tugas piket harian dan memastikan kelas bersih tanpa sampah',
        kategori: 'Kebersihan',
        poin: 5000,
        tingkatKesulitan: 'Sedang',
        alasan: 'Membangun tanggung jawab kolektif merawat ruang belajar bersama.',
        dampakLingkungan: 'Lingkungan belajar higienis, bebas kuman dan nyamuk.',
      },
      {
        aktivitas: 'Mematikan lampu, kipas angin, dan proyektor saat kelas kosong / pulang',
        kategori: 'Hemat Energi',
        poin: 2500,
        tingkatKesulitan: 'Mudah',
        alasan: 'Membiasakan efisiensi daya listrik.',
        dampakLingkungan: 'Mengurangi beban konsumsi energi dan jejak karbon sekolah.',
      },
      {
        aktivitas: 'Menyiram dan merawat tanaman taman sekolah atau hidroponik',
        kategori: 'Penghijauan',
        poin: 4000,
        tingkatKesulitan: 'Sedang',
        alasan: 'Menumbuhkan kepedulian terhadap vegetasi dan lingkungan hidup.',
        dampakLingkungan: 'Udara sekolah lebih sejuk dan ruang hijau terjaga.',
      },
    ],
    tipsImplementasi: [
      'Gunakan sistem pengumuman mingguan: Siswa dan Kelas dengan EcoPoint tertinggi diumumkan saat upacara.',
      'Sediakan kasir EcoGen di kantin sekolah sehingga siswa merasakan langsung manfaat poin untuk membeli makanan ringan.',
      'Kolaborasikan dengan OSIS atau Guru BK untuk menyediakan reward privilege yang tidak membutuhkan modal anggaran finansial.',
      'Tampilkan papan peringkat (Leaderboard) digital di layar depan sekolah atau lobby untuk memicu motivasi kompetitif sehat.',
    ],
  };
}
