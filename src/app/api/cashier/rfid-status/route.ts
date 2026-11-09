import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['kasir', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { record, ageSeconds, isExpired, isUsed } = await FirebaseDB.getLatestPendingProcess(60);

    if (!record) {
      return NextResponse.json({
        success: true,
        detected: false,
        status: 'waiting',
        message: 'Menunggu tap kartu RFID...',
      });
    }

    // Lookup student if record found
    const student = await FirebaseDB.getStudentByUid(record.UID);

    let status: 'ready' | 'expired' | 'used' | 'unregistered' = 'ready';
    let message = 'Kartu siap diproses.';

    if (isUsed) {
      status = 'used';
      message = 'Kartu ini sudah diproses untuk transaksi sebelumnya. Silakan tap ulang kartu.';
    } else if (isExpired) {
      status = 'expired';
      message = `Data tap kartu sudah kedaluwarsa (${ageSeconds} detik lalu). Maksimal 60 detik.`;
    } else if (!student) {
      status = 'unregistered';
      message = `Kartu UID ${record.UID} belum terdaftar sebagai siswa.`;
    } else if (student.status === 'nonaktif') {
      status = 'unregistered';
      message = `Siswa ${student.nama} berstatus nonaktif.`;
    }

    return NextResponse.json({
      success: true,
      detected: true,
      status,
      message,
      ageSeconds,
      record,
      student,
    });
  } catch (error: any) {
    console.error('RFID status check error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memeriksa status RFID.' },
      { status: 500 }
    );
  }
}
