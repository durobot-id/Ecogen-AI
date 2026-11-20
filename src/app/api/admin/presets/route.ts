import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';
import { PointPreset } from '@/types';

const DEFAULT_TOPUP_PRESETS: PointPreset[] = [
  { id: 'tu_1', label: 'Menjaga kebersihan kelas', amount: 5000, type: 'topup', category: 'Kebersihan' },
  { id: 'tu_2', label: 'Membuang sampah terpilah (Organik/Anorganik)', amount: 3000, type: 'topup', category: 'Daur Ulang' },
  { id: 'tu_3', label: 'Membawa botol tumbler & kotak makan sendiri', amount: 2000, type: 'topup', category: 'Zero Waste' },
  { id: 'tu_4', label: 'Menjalankan tugas piket harian tepat waktu', amount: 5000, type: 'topup', category: 'Kedisiplinan' },
  { id: 'tu_5', label: 'Menyiram & merawat taman tanaman sekolah', amount: 4000, type: 'topup', category: 'Penghijauan' },
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

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const data = await FirebaseDB.getPointPresets();

    const result = {
      topup: data?.topup && data.topup.length > 0 ? data.topup : DEFAULT_TOPUP_PRESETS,
      penalty: data?.penalty && data.penalty.length > 0 ? data.penalty : DEFAULT_PENALTY_PRESETS,
    };

    return NextResponse.json(
      { success: true, data: result },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    console.error('Error fetching point presets:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat preset poin.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { topup, penalty } = body;

    if (!Array.isArray(topup) || !Array.isArray(penalty)) {
      return NextResponse.json(
        { success: false, message: 'Format data preset tidak valid.' },
        { status: 400 }
      );
    }

    await FirebaseDB.savePointPresets({ topup, penalty });

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi preset alasan poin berhasil disimpan.',
      data: { topup, penalty },
    });
  } catch (error: any) {
    console.error('Error saving point presets:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menyimpan preset poin.' },
      { status: 500 }
    );
  }
}
