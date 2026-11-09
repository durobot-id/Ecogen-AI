import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

export async function GET(req: NextRequest) {
  // Allow cashier or admin to read students if authenticated, or cashier for lookups
  const auth = await requireAuth(req, ['admin', 'kasir']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const kelas = searchParams.get('kelas') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'nama'; // 'nama' | 'poin' | 'kelas'

    let students = await FirebaseDB.getStudents();

    // Filters
    if (q) {
      students = students.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.uid.toLowerCase().includes(q) ||
          s.kelas.toLowerCase().includes(q)
      );
    }

    if (kelas !== 'ALL') {
      students = students.filter((s) => s.kelas.toLowerCase() === kelas.toLowerCase());
    }

    if (status !== 'ALL') {
      students = students.filter((s) => (s.status || 'aktif') === status);
    }

    // Sorting
    students.sort((a, b) => {
      if (sortBy === 'poin') {
        return b.poin - a.poin;
      }
      if (sortBy === 'kelas') {
        return a.kelas.localeCompare(b.kelas);
      }
      return a.nama.localeCompare(b.nama);
    });

    return NextResponse.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error: any) {
    console.error('Fetch students error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil data siswa.' },
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
    const { uid, nama, kelas, poin, status } = body;

    if (!uid || !nama || !kelas) {
      return NextResponse.json(
        { success: false, message: 'UID, Nama, dan Kelas wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await FirebaseDB.createStudent({
      uid: uid.trim(),
      nama: nama.trim(),
      kelas: kelas.trim(),
      poin: Math.max(0, Number(poin) || 0),
      status: status || 'aktif',
    });

    return NextResponse.json({
      success: true,
      message: `Siswa ${created.nama} berhasil didaftarkan.`,
      data: created,
    });
  } catch (error: any) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menambahkan siswa.' },
      { status: 400 }
    );
  }
}
