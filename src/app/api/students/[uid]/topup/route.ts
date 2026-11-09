import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { FirebaseDB } from '@/lib/firebase-db';

interface RouteContext {
  params: Promise<{ uid: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const auth = await requireAuth(req, ['admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { uid } = await params;
    const body = await req.json();
    const { amount, reason } = body;

    const nominal = Number(amount);
    if (isNaN(nominal) || nominal <= 0) {
      return NextResponse.json(
        { success: false, message: 'Nominal top up harus berupa angka lebih besar dari 0.' },
        { status: 400 }
      );
    }

    const result = await FirebaseDB.executeTopUp({
      uid,
      amount: nominal,
      reason: reason || 'Top up EcoPoint Siswa',
      operatorId: auth.session!.operatorId,
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan Rp${nominal.toLocaleString('id-ID')} poin untuk ${result.student.nama}.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Top up error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memproses top up poin.' },
      { status: 400 }
    );
  }
}
