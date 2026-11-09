import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['kasir', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const uid = (body.uid || 'CB69FD2F').trim().toUpperCase();

    const record = await FirebaseDB.simulateTap(uid);
    const student = await FirebaseDB.getStudentByUid(uid);

    return NextResponse.json({
      success: true,
      message: `Simulasi tap kartu RFID untuk UID ${uid} berhasil dikirim ke /Proses.`,
      record,
      student,
    });
  } catch (error: any) {
    console.error('Simulate tap error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal simulasi tap kartu.' },
      { status: 500 }
    );
  }
}
