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

    const adjustmentAmount = Number(amount);
    if (isNaN(adjustmentAmount) || adjustmentAmount === 0) {
      return NextResponse.json(
        { success: false, message: 'Nominal penyesuaian tidak boleh nol.' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Alasan penyesuaian wajib disertakan untuk audit log.' },
        { status: 400 }
      );
    }

    const result = await FirebaseDB.executeAdjustment({
      uid,
      amount: adjustmentAmount,
      reason: reason.trim(),
      operatorId: auth.session!.operatorId,
    });

    return NextResponse.json({
      success: true,
      message: `Penyesuaian poin berhasil disimpan.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Adjust error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memproses penyesuaian poin.' },
      { status: 400 }
    );
  }
}
